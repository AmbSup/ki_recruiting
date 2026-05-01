import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import crypto from "crypto";

export const maxDuration = 30;
export const runtime = "nodejs";

// Cal.com Webhook — verifiziert HMAC-SHA256-Signatur aus Header
// `x-cal-signature-256` (Hex, NICHT mit 'sha256='-Prefix wie Meta) gegen
// CAL_COM_WEBHOOK_SECRET. Behandelt:
//  - BOOKING_CREATED: upsert sales_meetings, match Lead per email/phone, update lead.status
//  - BOOKING_CANCELLED: status='cancelled' am sales_meetings, lead-status zurück auf 'contacted'
//  - BOOKING_RESCHEDULED: status='rescheduled', start_at/end_at updaten
//  - andere Events: ignoriert (200 OK)
//
// Idempotency: cal_booking_uid ist UNIQUE → upsert schluckt Dupes (z.B. wenn
// der API-Booking aus /api/sales/calendar/book den Webhook im selben Request
// triggert).

type CalAttendee = {
  name?: string;
  email?: string;
  phoneNumber?: string;
  timeZone?: string;
};

type CalWebhookPayload = {
  triggerEvent?: string;
  payload?: {
    uid?: string;
    bookingId?: number;
    title?: string;
    eventType?: { slug?: string };
    startTime?: string;
    endTime?: string;
    status?: string;
    attendees?: CalAttendee[];
    organizer?: CalAttendee;
    metadata?: Record<string, string>;
    additionalNotes?: string;
    rescheduleUid?: string;
    cancellationReason?: string;
  };
};

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // 1. HMAC-Verify (Cal.com sendet hex-encoded SHA256, kein Prefix)
  const signature = (req.headers.get("x-cal-signature-256") ?? "").trim().toLowerCase();
  const secret = process.env.CAL_COM_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[cal-com webhook] CAL_COM_WEBHOOK_SECRET nicht gesetzt");
    return NextResponse.json({ error: "Server misconfig" }, { status: 500 });
  }
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!signature || !safeEqual(signature, expected)) {
    console.warn("[cal-com webhook] Signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: CalWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as CalWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.triggerEvent;
  const data = payload.payload ?? {};
  const uid = data.uid;
  if (!uid) {
    return NextResponse.json({ error: "Missing booking uid" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (event === "BOOKING_CANCELLED") {
    await supabase
      .from("sales_meetings")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("cal_booking_uid", uid);
    // Optional: Lead-Status nicht automatisch zurücksetzen — Operator-Decision
    return NextResponse.json({ ok: true, action: "cancelled" });
  }

  if (event === "BOOKING_RESCHEDULED" || event === "BOOKING_CREATED") {
    // Match Lead per attendee.email > attendee.phone > metadata.sales_lead_id
    const attendee = (data.attendees ?? [])[0] ?? {};
    const email = attendee.email?.toLowerCase().trim() || null;
    const phoneRaw = attendee.phoneNumber || null;
    const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
    const metaLeadId = data.metadata?.sales_lead_id || null;
    const metaCallId = data.metadata?.sales_call_id || null;
    const metaProgramId = data.metadata?.sales_program_id || null;

    let leadId: string | null = metaLeadId;
    let programId: string | null = metaProgramId;

    if (!leadId && (email || phone)) {
      // Suche Lead anhand email oder phone — kann mehrere Programs treffen,
      // wir nehmen den jüngsten Match.
      let query = supabase
        .from("sales_leads")
        .select("id, sales_program_id")
        .order("created_at", { ascending: false })
        .limit(1);
      if (email && phone) {
        query = query.or(`email.eq.${email},phone.eq.${phone}`);
      } else if (email) {
        query = query.eq("email", email);
      } else if (phone) {
        query = query.eq("phone", phone);
      }
      const { data: matches } = await query;
      if (matches && matches.length > 0) {
        leadId = matches[0].id;
        programId = matches[0].sales_program_id;
      }
    }

    // Ohne programId können wir nicht in sales_meetings schreiben (NOT NULL FK).
    // Fallback: erste sales_program (single-tenant). Wenn auch das fehlt → log + 200.
    if (!programId) {
      const { data: fallback } = await supabase
        .from("sales_programs")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      programId = fallback?.id ?? null;
    }
    if (!programId) {
      console.warn("[cal-com webhook] Kein sales_program zum Zuordnen — booking ignoriert", uid);
      return NextResponse.json({ ok: true, action: "ignored_no_program" });
    }

    const status = event === "BOOKING_RESCHEDULED" ? "rescheduled" : "confirmed";

    const { error: upErr } = await supabase
      .from("sales_meetings")
      .upsert(
        {
          sales_program_id: programId,
          sales_lead_id: leadId,
          sales_call_id: metaCallId,
          cal_booking_uid: uid,
          cal_event_type_slug: data.eventType?.slug ?? null,
          start_at: data.startTime ?? new Date().toISOString(),
          end_at: data.endTime ?? new Date().toISOString(),
          status,
          source: metaCallId ? "ai_call" : "public_page",
          attendee_name: attendee.name ?? null,
          attendee_email: email,
          attendee_phone: phone,
          notes: data.additionalNotes ?? null,
        },
        { onConflict: "cal_booking_uid" },
      );
    if (upErr) {
      console.error("[cal-com webhook] sales_meetings upsert error:", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    if (leadId && event === "BOOKING_CREATED") {
      await supabase
        .from("sales_leads")
        .update({ status: "meeting_booked", updated_at: new Date().toISOString() })
        .eq("id", leadId);
    }

    return NextResponse.json({ ok: true, action: status, lead_matched: Boolean(leadId) });
  }

  // Andere Events ignorieren (Cal.com hat 22 Trigger, wir brauchen 3).
  return NextResponse.json({ ok: true, action: "ignored", event });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
