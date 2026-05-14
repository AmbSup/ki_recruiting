import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createBooking, resolveCalIdentity } from "@/lib/cal-com/client";
import { sendBookingLinkSms } from "@/lib/cal-com/sms";
import { requireWriterOrN8n } from "@/lib/auth/guards";

export const maxDuration = 30;
export const runtime = "nodejs";

// POST /api/sales/calendar/book
// Body: { sales_call_id: string, start: string (ISO), notes?: string }
//
// Flow:
//  1. Resolve sales_call → sales_lead → sales_program
//  2. Versuche Cal.com /v2/bookings POST
//  3a. Erfolg → upsert sales_meetings + update sales_leads.status='meeting_booked'
//      + sales_call_analyses.meeting_booked=true (backward-compat)
//  3b. Fehler → automatischer SMS-Fallback (booking_link an Lead-Phone) +
//      returnt in Vapi-readable Form welche Aktion stattgefunden hat
//
// Idempotency: cal_booking_uid ist UNIQUE. Wenn der Webhook denselben Booking
// sieht, schluckt der upsert die Dupe.

type BookResult =
  | { ok: true; cal_booking_uid: string; start: string; end: string; status: string }
  | { ok: false; reason: string; fallback?: { sms_sid: string } | { error: string } };

export async function POST(req: NextRequest) {
  const auth = await requireWriterOrN8n(req);
  if (!auth.ok) return auth.response;
  let body: { sales_call_id?: string; start?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { sales_call_id, start, notes } = body;
  if (!sales_call_id || !start) {
    return NextResponse.json({ error: "sales_call_id + start erforderlich" }, { status: 422 });
  }

  const supabase = createAdminClient();

  // 1. Resolve call → lead → program
  const { data: call, error: cErr } = await supabase
    .from("sales_calls")
    .select(
      "id, sales_lead_id, sales_program_id, lead:sales_leads(id, first_name, last_name, full_name, email, phone), program:sales_programs(id, cal_username, cal_event_type_slug, cal_timezone, booking_link)",
    )
    .eq("id", sales_call_id)
    .single();
  if (cErr || !call) {
    return NextResponse.json({ error: "Sales-Call nicht gefunden" }, { status: 404 });
  }
  const lead = Array.isArray(call.lead) ? call.lead[0] : (call.lead as Record<string, unknown> | null);
  const program = Array.isArray(call.program) ? call.program[0] : (call.program as Record<string, unknown> | null);
  if (!lead || !program) {
    return NextResponse.json({ error: "Lead oder Program-Join fehlt" }, { status: 500 });
  }

  const cal = resolveCalIdentity(program as {
    cal_username?: string | null;
    cal_event_type_slug?: string | null;
    cal_timezone?: string | null;
  });

  const leadName =
    (lead as { full_name?: string }).full_name ||
    [(lead as { first_name?: string }).first_name, (lead as { last_name?: string }).last_name]
      .filter(Boolean)
      .join(" ") ||
    "Lead";
  const leadEmail = (lead as { email?: string | null }).email ?? null;
  const leadPhone = (lead as { phone?: string | null }).phone ?? null;
  const leadFirstName = (lead as { first_name?: string | null }).first_name ?? null;

  // 2. Pre-check: ohne cal-Identity oder ohne Email → direkt SMS-Fallback.
  if (!cal || !leadEmail) {
    const fb = await trySmsFallback({
      phone: leadPhone,
      bookingLink: (program as { booking_link?: string | null }).booking_link ?? null,
      greeting: leadFirstName,
    });
    const reason = !cal
      ? "Cal.com-Konfiguration fehlt am Sales-Program"
      : "Lead hat keine Email — Cal.com erfordert eine Email für die Buchung";
    return NextResponse.json<BookResult>(
      { ok: false, reason, fallback: fb },
      { status: 200 },
    );
  }

  // 3. Cal.com /bookings POST
  let booked;
  try {
    booked = await createBooking({
      eventTypeSlug: cal.eventTypeSlug,
      username: cal.username,
      start,
      attendee: {
        name: leadName,
        email: leadEmail,
        timeZone: cal.timezone,
        ...(leadPhone ? { phoneNumber: leadPhone } : {}),
      },
      ...(notes ? { notes } : {}),
      metadata: {
        sales_call_id,
        sales_lead_id: String((lead as { id?: string }).id ?? ""),
        sales_program_id: String((program as { id?: string }).id ?? ""),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[calendar/book] cal.com error:", msg);
    const fb = await trySmsFallback({
      phone: leadPhone,
      bookingLink: (program as { booking_link?: string | null }).booking_link ?? null,
      greeting: leadFirstName,
    });
    return NextResponse.json<BookResult>(
      { ok: false, reason: msg, fallback: fb },
      { status: 200 },
    );
  }

  // 4. Persist: sales_meetings UPSERT (idempotent via cal_booking_uid UNIQUE) +
  //    sales_leads.status='meeting_booked' (nur wenn nicht schon terminal-not-OK) +
  //    sales_call_analyses.meeting_booked=true (backward-compat)
  const { error: upsertErr } = await supabase
    .from("sales_meetings")
    .upsert(
      {
        sales_program_id: (program as { id: string }).id,
        sales_lead_id: (lead as { id: string }).id,
        sales_call_id,
        cal_booking_uid: booked.uid,
        cal_event_type_slug: cal.eventTypeSlug,
        start_at: booked.start,
        end_at: booked.end,
        status: booked.status === "rejected" ? "cancelled" : "confirmed",
        source: "ai_call",
        attendee_name: leadName,
        attendee_email: leadEmail,
        attendee_phone: leadPhone,
        notes: notes ?? null,
      },
      { onConflict: "cal_booking_uid" },
    );
  if (upsertErr) console.error("[calendar/book] sales_meetings upsert err:", upsertErr);

  await supabase
    .from("sales_leads")
    .update({ status: "meeting_booked", updated_at: new Date().toISOString() })
    .eq("id", (lead as { id: string }).id);

  await supabase
    .from("sales_call_analyses")
    .upsert(
      {
        sales_call_id,
        meeting_booked: true,
        meeting_datetime: booked.start,
      },
      { onConflict: "sales_call_id" },
    );

  return NextResponse.json<BookResult>({
    ok: true,
    cal_booking_uid: booked.uid,
    start: booked.start,
    end: booked.end,
    status: booked.status,
  });
}

async function trySmsFallback(args: {
  phone: string | null;
  bookingLink: string | null;
  greeting: string | null;
}): Promise<{ sms_sid: string } | { error: string }> {
  if (!args.phone || !args.bookingLink) {
    return { error: "SMS-Fallback unmöglich (Telefon oder booking_link fehlt)" };
  }
  try {
    const { sid } = await sendBookingLinkSms({
      to: args.phone,
      bookingLink: args.bookingLink,
      greeting: args.greeting ?? undefined,
    });
    return { sms_sid: sid };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg };
  }
}
