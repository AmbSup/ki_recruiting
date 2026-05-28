import type { createAdminClient } from "@/lib/supabase/admin";
import { eraseSalesLead, eraseApplicant, type ErasureSummary } from "./erase";

type AdminClient = ReturnType<typeof createAdminClient>;

// Pro Lauf max. so viele Personen löschen — schützt vor Vercel-Timeout
// (maxDuration 60s; jede Cascade-Löschung macht mehrere Queries + Storage-Ops).
// Der tägliche Cron arbeitet einen Rückstand über mehrere Tage ab.
const MAX_PER_RUN = 25;

export type RetentionResult = {
  retention_months: number;
  cutoff_iso: string;
  sales_leads_erased: number;
  applicants_erased: number;
  details: ErasureSummary[];
  errors: string[];
};

/**
 * DSGVO Art. 5 (1)(e) Speicherbegrenzung — löscht Personendaten, deren letzte
 * Aktivität länger als `months` zurückliegt, vollständig (inkl. Calls,
 * Aufzeichnungen, Transkripte, Analysen) über die bestehenden Cascade-Helper.
 *
 * Aktivitäts-Timestamp:
 *   - sales_leads.updated_at (wird bei jedem Call/Status-Change aktualisiert)
 *   - applicants.created_at (kein updated_at vorhanden → Erstellzeitpunkt)
 *
 * Jede Löschung schreibt automatisch einen gdpr_erasure_log-Eintrag (im
 * erase-Helper). Begrenzt auf MAX_PER_RUN pro Lauf.
 */
export async function runRetentionPurge(supabase: AdminClient, months: number): Promise<RetentionResult> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffIso = cutoff.toISOString();

  const result: RetentionResult = {
    retention_months: months,
    cutoff_iso: cutoffIso,
    sales_leads_erased: 0,
    applicants_erased: 0,
    details: [],
    errors: [],
  };

  // ─── Sales-Leads: updated_at älter als cutoff ────────────────────────────
  const { data: oldLeads, error: leadErr } = await supabase
    .from("sales_leads")
    .select("id")
    .lt("updated_at", cutoffIso)
    .limit(MAX_PER_RUN);
  if (leadErr) result.errors.push(`sales_leads query: ${leadErr.message}`);

  for (const l of oldLeads ?? []) {
    try {
      const summary = await eraseSalesLead(supabase, l.id);
      result.details.push(summary);
      result.sales_leads_erased++;
    } catch (e) {
      result.errors.push(`eraseSalesLead(${l.id}): ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // ─── Applicants: created_at älter als cutoff. Rest-Budget bis MAX_PER_RUN. ─
  const remaining = MAX_PER_RUN - result.sales_leads_erased;
  if (remaining > 0) {
    const { data: oldApplicants, error: appErr } = await supabase
      .from("applicants")
      .select("id")
      .lt("created_at", cutoffIso)
      .limit(remaining);
    if (appErr) result.errors.push(`applicants query: ${appErr.message}`);

    for (const a of oldApplicants ?? []) {
      try {
        const summary = await eraseApplicant(supabase, a.id);
        result.details.push(summary);
        result.applicants_erased++;
      } catch (e) {
        result.errors.push(`eraseApplicant(${a.id}): ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return result;
}
