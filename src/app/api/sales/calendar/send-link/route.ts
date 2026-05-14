import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingLinkSms } from "@/lib/cal-com/sms";
import { requireWriterOrN8n } from "@/lib/auth/guards";

export const maxDuration = 30;
export const runtime = "nodejs";

// POST /api/sales/calendar/send-link
// Body: { sales_call_id?: string, sales_lead_id?: string }
// Auflösung: explicit ID > sales_call_id → resolve lead.
// Sendet SMS mit `sales_programs.booking_link` an `sales_lead.phone`.
// Wird aufgerufen von:
//  - book-Endpoint als Fallback bei Booking-Fehler
//  - direkt vom Vapi-Tool `send_booking_link`
//  - vom UI als Operator-Action (zukünftig)

export async function POST(req: NextRequest) {
  const auth = await requireWriterOrN8n(req);
  if (!auth.ok) return auth.response;
  let body: { sales_call_id?: string; sales_lead_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Resolve lead via explicit ID oder via call → lead.
  let leadId = body.sales_lead_id ?? null;
  if (!leadId && body.sales_call_id) {
    const { data: call } = await supabase
      .from("sales_calls")
      .select("sales_lead_id")
      .eq("id", body.sales_call_id)
      .single();
    leadId = call?.sales_lead_id ?? null;
  }
  if (!leadId) {
    return NextResponse.json(
      { error: "sales_lead_id oder sales_call_id erforderlich" },
      { status: 422 },
    );
  }

  const { data: lead, error: lErr } = await supabase
    .from("sales_leads")
    .select("id, first_name, full_name, phone, sales_program_id, program:sales_programs(name, booking_link)")
    .eq("id", leadId)
    .single();
  if (lErr || !lead) {
    return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 });
  }
  const program = Array.isArray(lead.program) ? lead.program[0] : (lead.program as { booking_link?: string | null } | null);
  const link = program?.booking_link?.trim();
  if (!link) {
    return NextResponse.json(
      { error: "sales_programs.booking_link fehlt für dieses Program" },
      { status: 422 },
    );
  }
  if (!lead.phone) {
    return NextResponse.json({ error: "Lead hat keine Telefonnummer" }, { status: 422 });
  }

  try {
    const { sid } = await sendBookingLinkSms({
      to: lead.phone,
      bookingLink: link,
      greeting: lead.first_name ?? lead.full_name ?? undefined,
    });
    return NextResponse.json({ success: true, sms_sid: sid });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[calendar/send-link] sms error:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
