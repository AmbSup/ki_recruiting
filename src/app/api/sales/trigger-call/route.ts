import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  let body: { sales_lead_id?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { sales_lead_id } = body;
  if (!sales_lead_id) {
    return NextResponse.json({ error: "sales_lead_id fehlt" }, { status: 422 });
  }

  // Load lead + program
  const { data: lead, error: leadErr } = await supabase
    .from("sales_leads")
    .select("id, sales_program_id, phone, consent_given, status, first_name, last_name, full_name, email, company_name, role, program:sales_programs(id, name, vapi_assistant_id, caller_phone_number, booking_link, auto_dial)")
    .eq("id", sales_lead_id)
    .single();

  if (leadErr || !lead) {
    return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 });
  }

  // Consent-Gate
  if (!lead.consent_given) {
    return NextResponse.json({ error: "Kein dokumentiertes Opt-In — Call blockiert" }, { status: 403 });
  }

  // Status-Lock: kein doppeltes Dialing wenn schon aktiv
  const { data: activeCall } = await supabase
    .from("sales_calls")
    .select("id")
    .eq("sales_lead_id", sales_lead_id)
    .in("status", ["initiated", "ringing", "in_progress"])
    .maybeSingle();

  if (activeCall) {
    return NextResponse.json(
      { error: "Lead hat bereits einen aktiven Call", sales_call_id: activeCall.id },
      { status: 409 },
    );
  }

  // Trigger n8n
  const n8nBase = process.env.N8N_BASE_URL;
  if (!n8nBase) {
    return NextResponse.json({ error: "N8N_BASE_URL nicht konfiguriert" }, { status: 500 });
  }

  const triggerRes = await fetch(`${n8nBase}/webhook/start-sales-call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sales_lead_id }),
  }).catch((err) => {
    console.error("[sales/trigger-call] n8n fetch failed:", err);
    return null;
  });

  if (!triggerRes || !triggerRes.ok) {
    const msg = triggerRes ? await triggerRes.text().catch(() => "") : "n8n unreachable";
    return NextResponse.json({ error: `n8n trigger failed: ${msg}` }, { status: 502 });
  }

  // Optimistic: Lead-Status auf "calling" setzen (n8n aktualisiert später auf contacted/…)
  await supabase
    .from("sales_leads")
    .update({ status: "calling" })
    .eq("id", sales_lead_id);

  return NextResponse.json({ success: true });
}
