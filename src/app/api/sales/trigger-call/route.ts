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

  // Status-Lock: kein doppeltes Dialing wenn schon aktiv.
  // `initiated`-Rows, die älter als 30s sind, sind fast sicher tot (Twilio
  // Studio Executions schlagen sofort fehl oder wechseln rasch in `ringing`).
  // Wir markieren die als `failed` und lassen den neuen Trigger durch.
  const STALE_THRESHOLD_MS = 30_000;
  const staleCutoff = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();

  const { data: activeCalls } = await supabase
    .from("sales_calls")
    .select("id, status, created_at")
    .eq("sales_lead_id", sales_lead_id)
    .in("status", ["initiated", "ringing", "in_progress"]);

  const stuck: string[] = [];
  const trulyActive: { id: string; status: string }[] = [];
  for (const c of activeCalls ?? []) {
    if (c.status === "initiated" && c.created_at < staleCutoff) {
      stuck.push(c.id);
    } else {
      trulyActive.push({ id: c.id, status: c.status });
    }
  }

  if (stuck.length > 0) {
    await supabase
      .from("sales_calls")
      .update({
        status: "failed",
        end_reason: "Auto-cleanup on retry (stuck in initiated > 30s)",
        ended_at: new Date().toISOString(),
      })
      .in("id", stuck);
  }

  if (trulyActive.length > 0) {
    return NextResponse.json(
      {
        error: `Lead hat bereits einen ${trulyActive[0].status === "in_progress" ? "laufenden" : "aktiven"} Call`,
        sales_call_id: trulyActive[0].id,
        status: trulyActive[0].status,
      },
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
