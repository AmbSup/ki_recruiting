import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * DSGVO Art. 15 (Auskunft) + Art. 20 (Datenportabilität) — sammelt ALLE
 * gespeicherten Daten einer Person in EIN maschinenlesbares JSON-Objekt.
 * Wird vom Export-Endpoint als Download ausgeliefert.
 */
export async function exportSalesLead(supabase: AdminClient, leadId: string): Promise<Record<string, unknown> | null> {
  const { data: lead } = await supabase
    .from("sales_leads")
    .select("*")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return null;

  const { data: calls } = await supabase
    .from("sales_calls")
    .select("*")
    .eq("sales_lead_id", leadId)
    .order("created_at", { ascending: true });
  const callIds = (calls ?? []).map((c) => c.id);

  let analyses: unknown[] = [];
  if (callIds.length > 0) {
    const { data } = await supabase
      .from("sales_call_analyses")
      .select("*")
      .in("sales_call_id", callIds);
    analyses = data ?? [];
  }

  const { data: uploads } = await supabase
    .from("sales_lead_uploads")
    .select("*")
    .eq("sales_lead_id", leadId);

  return {
    export_meta: {
      generated_at: new Date().toISOString(),
      subject_type: "sales_lead",
      subject_id: leadId,
      gdpr_basis: "Art. 15 (Auskunft) + Art. 20 (Portabilität) DSGVO",
    },
    lead,
    calls: calls ?? [],
    call_analyses: analyses,
    uploads: uploads ?? [],
  };
}

export async function exportApplicant(supabase: AdminClient, applicantId: string): Promise<Record<string, unknown> | null> {
  const { data: applicant } = await supabase
    .from("applicants")
    .select("*")
    .eq("id", applicantId)
    .maybeSingle();
  if (!applicant) return null;

  const { data: apps } = await supabase
    .from("applications")
    .select("*")
    .eq("applicant_id", applicantId);
  const appIds = (apps ?? []).map((a) => a.id);

  let cvAnalyses: unknown[] = [];
  let voiceCalls: unknown[] = [];
  let transcripts: unknown[] = [];
  let callAnalyses: unknown[] = [];

  if (appIds.length > 0) {
    const [{ data: cvA }, { data: vcs }] = await Promise.all([
      supabase.from("cv_analyses").select("*").in("application_id", appIds),
      supabase.from("voice_calls").select("*").in("application_id", appIds),
    ]);
    cvAnalyses = cvA ?? [];
    voiceCalls = vcs ?? [];
    const voiceCallIds = (vcs ?? []).map((v) => v.id);
    if (voiceCallIds.length > 0) {
      const [{ data: tr }, { data: ca }] = await Promise.all([
        supabase.from("transcripts").select("*").in("voice_call_id", voiceCallIds),
        supabase.from("call_analyses").select("*").in("voice_call_id", voiceCallIds),
      ]);
      transcripts = tr ?? [];
      callAnalyses = ca ?? [];
    }
  }

  return {
    export_meta: {
      generated_at: new Date().toISOString(),
      subject_type: "applicant",
      subject_id: applicantId,
      gdpr_basis: "Art. 15 (Auskunft) + Art. 20 (Portabilität) DSGVO",
    },
    applicant,
    applications: apps ?? [],
    cv_analyses: cvAnalyses,
    voice_calls: voiceCalls,
    transcripts,
    call_analyses: callAnalyses,
  };
}
