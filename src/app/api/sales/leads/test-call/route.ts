import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { requireWriter } from "@/lib/auth/guards";

export const maxDuration = 60;

/**
 * POST /api/sales/leads/test-call
 *
 * Body: {
 *   sales_program_id: string,
 *   phone: string,           // wird normalisiert
 *   first_name?: string,
 *   last_name?: string,
 *   company_name?: string,
 *   notes?: string,
 * }
 *
 * Verhalten:
 *  1. Lead upserten auf (sales_program_id, phone). Bei Existing:
 *     - Terminal-Status wird NICHT zurückgesetzt (Schutz gegen versehentliches
 *       Re-Calling von not_interested/do_not_call Leads).
 *     - Nicht-Terminal wird auf status='new' zurückgeholt + consent_given=true
 *       gesetzt, damit trigger-call durchgeht.
 *  2. Trigger-Call intern aufrufen — wiederverwendet die volle Prompt-
 *     Rendering + n8n-Handoff-Chain aus /api/sales/trigger-call.
 *  3. Returnt { lead_id, sales_call_id, is_new_lead }.
 *
 * Fehlerfälle:
 *  - 403 wenn Lead in Terminal-Status (do_not_call, not_interested, ...)
 *  - 409 wenn schon ein aktiver Call läuft (vom trigger-call-Endpoint)
 *  - 500 auf DB-Fehler
 */
export async function POST(req: NextRequest) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sales_program_id = body.sales_program_id as string | undefined;
  const rawPhone = body.phone as string | undefined;
  if (!sales_program_id || !rawPhone) {
    return NextResponse.json(
      { error: "sales_program_id und phone sind Pflicht" },
      { status: 422 },
    );
  }
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return NextResponse.json({ error: "Telefonnummer ungültig" }, { status: 422 });
  }

  const supabase = createAdminClient();

  // Lead-Lookup — falls existiert, Terminal-Status prüfen + reset
  const { data: existing } = await supabase
    .from("sales_leads")
    .select("id, status")
    .eq("sales_program_id", sales_program_id)
    .eq("phone", phone)
    .maybeSingle();

  const TERMINAL = new Set(["contacted", "meeting_booked", "not_interested", "do_not_call"]);

  let leadId: string;
  let isNewLead = false;

  if (existing) {
    if (TERMINAL.has(existing.status)) {
      return NextResponse.json(
        {
          error: "terminal_status",
          message: `Lead existiert mit Status "${existing.status}" — Test-Anruf blockiert um Kunden nicht mehrfach zu belästigen. Lead-Status in /sales/leads manuell zurücksetzen.`,
          lead_id: existing.id,
          status: existing.status,
        },
        { status: 403 },
      );
    }
    // Nicht-Terminal → reset auf 'new' für frischen Test-Call
    await supabase
      .from("sales_leads")
      .update({
        status: "new",
        first_name: (body.first_name as string | undefined) ?? null,
        last_name: (body.last_name as string | undefined) ?? null,
        company_name: (body.company_name as string | undefined) ?? null,
        notes: (body.notes as string | undefined) ?? null,
        consent_given: true,
        consent_source: "manual_import",
        consent_timestamp: new Date().toISOString(),
      })
      .eq("id", existing.id);
    leadId = existing.id;
  } else {
    // Neuen Lead anlegen
    const { data: inserted, error } = await supabase
      .from("sales_leads")
      .insert({
        sales_program_id,
        phone,
        first_name: (body.first_name as string | undefined) ?? null,
        last_name: (body.last_name as string | undefined) ?? null,
        company_name: (body.company_name as string | undefined) ?? null,
        notes:
          ((body.notes as string | undefined) ?? "") + " [Test-Anruf vom Operator]",
        source: "manual",
        consent_given: true,
        consent_source: "manual_import",
        consent_timestamp: new Date().toISOString(),
        status: "new",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      // 23505 race safety: falls parallel angelegt, fetche + reset
      if ((error as { code?: string })?.code === "23505") {
        const { data: raceRow } = await supabase
          .from("sales_leads")
          .select("id, status")
          .eq("sales_program_id", sales_program_id)
          .eq("phone", phone)
          .maybeSingle();
        if (raceRow) {
          if (TERMINAL.has(raceRow.status)) {
            return NextResponse.json(
              {
                error: "terminal_status",
                message: `Lead in Terminal-Status "${raceRow.status}".`,
                lead_id: raceRow.id,
                status: raceRow.status,
              },
              { status: 403 },
            );
          }
          leadId = raceRow.id;
        } else {
          return NextResponse.json(
            { error: "insert_race_unresolvable" },
            { status: 500 },
          );
        }
      } else {
        return NextResponse.json(
          { error: error?.message ?? "Insert failed" },
          { status: 500 },
        );
      }
    } else {
      leadId = inserted.id;
      isNewLead = true;
    }
  }

  // Trigger-Call intern via HTTP (gleiche Chain wie Bulk-Calls). Nutzt
  // die Session-Cookies des Operators durch die inbound-Request-Headers.
  const cookieHeader = req.headers.get("cookie") ?? "";
  const origin = req.nextUrl.origin;
  const triggerRes = await fetch(`${origin}/api/sales/trigger-call`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ sales_lead_id: leadId }),
  });

  const triggerData = await triggerRes.json().catch(() => ({}));
  if (!triggerRes.ok) {
    return NextResponse.json(
      {
        error: "trigger_failed",
        message: triggerData.error ?? `HTTP ${triggerRes.status}`,
        lead_id: leadId,
        is_new_lead: isNewLead,
      },
      { status: triggerRes.status },
    );
  }

  return NextResponse.json({
    success: true,
    lead_id: leadId,
    sales_call_id: triggerData.sales_call_id ?? null,
    is_new_lead: isNewLead,
  });
}
