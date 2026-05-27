import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export type ErasureSummary = {
  subject_type: "sales_lead" | "applicant";
  subject_ref: string;
  deleted: Record<string, number>;
  storage_removed: Record<string, number>;
  errors: string[];
};

/**
 * DSGVO Art. 17 — Vollständige Löschung eines Sales-Leads inkl. aller
 * abhängigen Daten + Storage-Objekte. Es gibt KEINE DB-Cascades für diese
 * Ketten, daher löschen wir Kinder explizit in FK-sicherer Reihenfolge.
 *
 * Reihenfolge (children → parent):
 *   sales_call_analyses → sales_meetings → sales_call_sessions →
 *   sales_lead_uploads → sales_calls → ad_leads → sales_leads
 * Storage: sales-recordings (recording_storage_path) + lead-uploads (storage_path).
 */
export async function eraseSalesLead(supabase: AdminClient, leadId: string): Promise<ErasureSummary> {
  const summary: ErasureSummary = {
    subject_type: "sales_lead",
    subject_ref: "",
    deleted: {},
    storage_removed: {},
    errors: [],
  };

  // Minimal-Snapshot für den Audit-Log (vor der Löschung).
  const { data: lead } = await supabase
    .from("sales_leads")
    .select("first_name, last_name, full_name, phone")
    .eq("id", leadId)
    .maybeSingle();
  if (lead) {
    const name = lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "(unbenannt)";
    summary.subject_ref = `${name} / ${maskPhone(lead.phone)}`;
  } else {
    summary.subject_ref = `(Lead ${leadId} nicht gefunden)`;
  }

  // 1. Alle sales_calls des Leads → IDs + Storage-Pfade sammeln
  const { data: calls } = await supabase
    .from("sales_calls")
    .select("id, recording_storage_path")
    .eq("sales_lead_id", leadId);
  const callIds = (calls ?? []).map((c) => c.id);
  const recordingPaths = (calls ?? [])
    .map((c) => c.recording_storage_path)
    .filter((p): p is string => typeof p === "string" && p.length > 0);

  // 2. sales_lead_uploads → Storage-Pfade sammeln
  const { data: uploads } = await supabase
    .from("sales_lead_uploads")
    .select("storage_path")
    .eq("sales_lead_id", leadId);
  const uploadPaths = (uploads ?? [])
    .map((u) => u.storage_path)
    .filter((p): p is string => typeof p === "string" && p.length > 0);

  // 3. Storage-Objekte entfernen
  summary.storage_removed["sales-recordings"] = await removeStorage(supabase, "sales-recordings", recordingPaths, summary);
  summary.storage_removed["lead-uploads"] = await removeStorage(supabase, "lead-uploads", uploadPaths, summary);

  // 4. DB-Kinder löschen (FK-sichere Reihenfolge)
  if (callIds.length > 0) {
    summary.deleted.sales_call_analyses = await del(supabase, "sales_call_analyses", "sales_call_id", callIds, summary);
  }
  summary.deleted.sales_meetings = await delEq(supabase, "sales_meetings", "sales_lead_id", leadId, summary);
  summary.deleted.sales_call_sessions = await delEq(supabase, "sales_call_sessions", "sales_lead_id", leadId, summary);
  summary.deleted.sales_lead_uploads = await delEq(supabase, "sales_lead_uploads", "sales_lead_id", leadId, summary);
  summary.deleted.sales_calls = await delEq(supabase, "sales_calls", "sales_lead_id", leadId, summary);
  summary.deleted.ad_leads = await delEq(supabase, "ad_leads", "sales_lead_id", leadId, summary);
  summary.deleted.sales_leads = await delEq(supabase, "sales_leads", "id", leadId, summary);

  await writeAuditLog(supabase, summary);
  return summary;
}

/**
 * DSGVO Art. 17 — Vollständige Löschung eines Bewerbers inkl. aller
 * Bewerbungen, Calls, Transkripte, Analysen + CV-Datei.
 *
 * Reihenfolge:
 *   transcripts + call_analyses → voice_calls → cv_analyses →
 *   candidate_events → call_sessions → ad_leads → applications → applicants
 * Storage: cvs (applicants.cv_file_url → bucket-path).
 */
export async function eraseApplicant(supabase: AdminClient, applicantId: string): Promise<ErasureSummary> {
  const summary: ErasureSummary = {
    subject_type: "applicant",
    subject_ref: "",
    deleted: {},
    storage_removed: {},
    errors: [],
  };

  const { data: applicant } = await supabase
    .from("applicants")
    .select("full_name, email, phone, cv_file_url")
    .eq("id", applicantId)
    .maybeSingle();
  if (applicant) {
    summary.subject_ref = `${applicant.full_name || "(unbenannt)"} / ${maskPhone(applicant.phone)}`;
  } else {
    summary.subject_ref = `(Bewerber ${applicantId} nicht gefunden)`;
  }

  // 1. Applications → application_ids
  const { data: apps } = await supabase
    .from("applications")
    .select("id")
    .eq("applicant_id", applicantId);
  const appIds = (apps ?? []).map((a) => a.id);

  // 2. voice_calls für die Applications → voice_call_ids
  let voiceCallIds: string[] = [];
  if (appIds.length > 0) {
    const { data: vcs } = await supabase
      .from("voice_calls")
      .select("id")
      .in("application_id", appIds);
    voiceCallIds = (vcs ?? []).map((v) => v.id);
  }

  // 3. CV-Datei aus cvs-Bucket. cv_file_url ist "/api/cvs/<funnelId>/<file>".
  const cvPath = extractCvPath(applicant?.cv_file_url ?? null);
  summary.storage_removed["cvs"] = cvPath
    ? await removeStorage(supabase, "cvs", [cvPath], summary)
    : 0;

  // 4. DB-Kinder löschen
  if (voiceCallIds.length > 0) {
    summary.deleted.transcripts = await del(supabase, "transcripts", "voice_call_id", voiceCallIds, summary);
    summary.deleted.call_analyses = await del(supabase, "call_analyses", "voice_call_id", voiceCallIds, summary);
  }
  if (appIds.length > 0) {
    summary.deleted.voice_calls = await del(supabase, "voice_calls", "application_id", appIds, summary);
    summary.deleted.cv_analyses = await del(supabase, "cv_analyses", "application_id", appIds, summary);
    summary.deleted.candidate_events = await del(supabase, "candidate_events", "application_id", appIds, summary);
    // call_sessions (Recruiting-Wait-Resume) — keyed by application_id, evtl. ohne FK.
    summary.deleted.call_sessions = await del(supabase, "call_sessions", "application_id", appIds, summary);
  }
  summary.deleted.ad_leads = await delEq(supabase, "ad_leads", "applicant_id", applicantId, summary);
  summary.deleted.applications = await delEq(supabase, "applications", "applicant_id", applicantId, summary);
  summary.deleted.applicants = await delEq(supabase, "applicants", "id", applicantId, summary);

  await writeAuditLog(supabase, summary);
  return summary;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function del(supabase: any, table: string, col: string, ids: string[], summary: ErasureSummary): Promise<number> {
  if (ids.length === 0) return 0;
  const { error, count } = await supabase.from(table).delete({ count: "exact" }).in(col, ids);
  if (error) { summary.errors.push(`${table}: ${error.message}`); return 0; }
  return count ?? 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function delEq(supabase: any, table: string, col: string, id: string, summary: ErasureSummary): Promise<number> {
  const { error, count } = await supabase.from(table).delete({ count: "exact" }).eq(col, id);
  if (error) { summary.errors.push(`${table}: ${error.message}`); return 0; }
  return count ?? 0;
}

async function removeStorage(supabase: AdminClient, bucket: string, paths: string[], summary: ErasureSummary): Promise<number> {
  if (paths.length === 0) return 0;
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) { summary.errors.push(`storage/${bucket}: ${error.message}`); return 0; }
  return paths.length;
}

async function writeAuditLog(supabase: AdminClient, summary: ErasureSummary): Promise<void> {
  // Audit-Log darf die Löschung nie blockieren — fail-soft.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("gdpr_erasure_log").insert({
    subject_type: summary.subject_type,
    subject_ref: summary.subject_ref,
    summary: { deleted: summary.deleted, storage_removed: summary.storage_removed, errors: summary.errors },
  });
  if (error) summary.errors.push(`gdpr_erasure_log: ${error.message}`);
}

// Telefonnummer für Audit-Snapshot maskieren — Mitte ausixen (Datenminimierung).
function maskPhone(phone: string | null): string {
  if (!phone) return "?";
  if (phone.length <= 6) return phone;
  return `${phone.slice(0, 4)}…${phone.slice(-2)}`;
}

// "/api/cvs/<funnelId>/<file>" → "<funnelId>/<file>" (Bucket-Pfad).
function extractCvPath(cvFileUrl: string | null): string | null {
  if (!cvFileUrl) return null;
  const m = cvFileUrl.match(/^\/api\/cvs\/(.+)$/);
  if (m) return m[1];
  // Falls schon ein nackter Pfad gespeichert ist:
  if (!cvFileUrl.startsWith("http") && !cvFileUrl.startsWith("/")) return cvFileUrl;
  return null;
}
