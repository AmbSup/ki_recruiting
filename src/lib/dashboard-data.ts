import { createClient } from "@/lib/supabase/server";

export type DashboardData = {
  state: "ready" | "partial" | "error";
  unavailable: string[];
  refreshedAt: string;
  health: {
    withinThirtySecondsPercent: number | null;
    contacted: number;
    eligible: number;
    failedCalls: number;
    queuedCalls: number;
    activeCalls: number;
  };
  metrics: {
    activeCompanies: number | null;
    activeJobs: number | null;
    newContactsToday: number | null;
    completedCallsToday: number | null;
  };
  pipeline: Array<{ key: string; label: string; count: number }>;
  activities: Array<{ id: string; title: string; detail: string; occurredAt: string; href: string; icon: string }>;
  alerts: Array<{
    id: string;
    type: "error" | "warning" | "info";
    title: string;
    description: string;
    action: string;
    href: string;
  }>;
};

const pipelineLabels: Record<string, string> = {
  new: "Neu",
  cv_analyzed: "CV analysiert",
  call_scheduled: "Anruf geplant",
  call_completed: "Anruf abgeschlossen",
  evaluated: "Bewertet",
  presented: "Freigegeben",
  accepted: "Akzeptiert",
  rejected: "Abgelehnt",
};

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const now = new Date();
  const todayDate = new Date(now);
  todayDate.setHours(0, 0, 0, 0);
  const today = todayDate.toISOString();
  const since = new Date(now.getTime() - 86_400_000).toISOString();

  const [companies, jobs, applicationsToday, applications, pipelineRows, voiceCalls, salesLeads, salesCalls] =
    await Promise.all([
      supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("applications").select("id", { count: "exact", head: true }).gte("applied_at", today),
      supabase
        .from("applications")
        .select("id, applied_at, pipeline_stage, applicant:applicants(full_name), job:jobs(title)")
        .gte("applied_at", since)
        .order("applied_at", { ascending: false })
        .limit(1000),
      supabase.from("applications").select("pipeline_stage").limit(5000),
      supabase
        .from("voice_calls")
        .select("id, application_id, status, created_at, started_at, ended_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(2000),
      supabase
        .from("sales_leads")
        .select("id, created_at, full_name, company_name, status")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("sales_calls")
        .select("id, sales_lead_id, status, created_at, started_at, ended_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(2000),
    ]);

  const results = [
    ["Firmen", companies],
    ["Jobs", jobs],
    ["heutige Kontakte", applicationsToday],
    ["Bewerbungen", applications],
    ["Pipeline", pipelineRows],
    ["Recruiting-Anrufe", voiceCalls],
    ["Sales-Leads", salesLeads],
    ["Sales-Anrufe", salesCalls],
  ] as const;
  const unavailable = results.filter(([, result]) => result.error).map(([name]) => name);
  const recentApplications = applications.data ?? [];
  const recentVoiceCalls = voiceCalls.data ?? [];
  const recentSalesLeads = salesLeads.data ?? [];
  const recentSalesCalls = salesCalls.data ?? [];

  const firstVoiceContact = new Map<string, string>();
  for (const call of recentVoiceCalls) {
    const time = call.started_at ?? call.created_at;
    const current = firstVoiceContact.get(call.application_id);
    if (!current || new Date(time) < new Date(current)) firstVoiceContact.set(call.application_id, time);
  }
  const firstSalesContact = new Map<string, string>();
  for (const call of recentSalesCalls) {
    const time = call.started_at ?? call.created_at;
    const current = firstSalesContact.get(call.sales_lead_id);
    if (!current || new Date(time) < new Date(current)) firstSalesContact.set(call.sales_lead_id, time);
  }

  const responseSeconds = [
    ...recentApplications.flatMap((application) => {
      const time = firstVoiceContact.get(application.id);
      return time ? [(new Date(time).getTime() - new Date(application.applied_at).getTime()) / 1000] : [];
    }),
    ...recentSalesLeads.flatMap((lead) => {
      const time = firstSalesContact.get(lead.id);
      return time ? [(new Date(time).getTime() - new Date(lead.created_at).getTime()) / 1000] : [];
    }),
  ].filter((seconds) => seconds >= 0);

  const allCalls = [...recentVoiceCalls, ...recentSalesCalls];
  const eligible = recentApplications.length + recentSalesLeads.length;
  const failedCalls = allCalls.filter((call) => call.status === "failed" || call.status === "no_answer").length;
  const queuedCalls = allCalls.filter((call) => call.status === "scheduled" || call.status === "initiated").length;
  const activeCalls = allCalls.filter((call) => call.status === "ringing" || call.status === "in_progress").length;
  const completedCallsToday = allCalls.filter(
    (call) => call.status === "completed" && new Date(call.ended_at ?? call.created_at) >= todayDate,
  ).length;

  const pipelineCounts = new Map<string, number>();
  for (const application of pipelineRows.data ?? []) {
    pipelineCounts.set(application.pipeline_stage, (pipelineCounts.get(application.pipeline_stage) ?? 0) + 1);
  }
  const pipeline = Object.entries(pipelineLabels).map(([key, label]) => ({
    key,
    label,
    count: pipelineCounts.get(key) ?? 0,
  }));

  const activities = recentApplications.slice(0, 5).map((application) => {
    const applicant = Array.isArray(application.applicant) ? application.applicant[0] : application.applicant;
    const job = Array.isArray(application.job) ? application.job[0] : application.job;
    return {
      id: application.id,
      title: applicant?.full_name ? `Neue Bewerbung von ${applicant.full_name}` : "Neue Bewerbung eingegangen",
      detail: job?.title ?? pipelineLabels[application.pipeline_stage] ?? "Bewerber-Pipeline",
      occurredAt: application.applied_at,
      href: `/applicants/${application.id}`,
      icon: "person_add",
    };
  });

  const alerts: DashboardData["alerts"] = [];
  if (failedCalls > 0) alerts.push({
    id: "failed-calls",
    type: "error",
    title: `${failedCalls} ${failedCalls === 1 ? "Anruf braucht" : "Anrufe brauchen"} Aufmerksamkeit`,
    description: "Fehlgeschlagene oder nicht angenommene Anrufe der letzten 24 Stunden prüfen und neu einplanen.",
    action: "Anrufe prüfen",
    href: "/calls?status=failed",
  });
  const waitingForReview = pipelineCounts.get("evaluated") ?? 0;
  if (waitingForReview > 0) alerts.push({
    id: "awaiting-review",
    type: "warning",
    title: `${waitingForReview} ${waitingForReview === 1 ? "Bewerber wartet" : "Bewerber warten"} auf Freigabe`,
    description: "Die Auswertung ist abgeschlossen. Prüfen Sie die Ergebnisse und entscheiden Sie über die Freigabe.",
    action: "Bewerber prüfen",
    href: "/applicants?stage=evaluated",
  });
  if (queuedCalls > 0) alerts.push({
    id: "queued-calls",
    type: "info",
    title: `${queuedCalls} ${queuedCalls === 1 ? "Anruf ist" : "Anrufe sind"} eingeplant`,
    description: "Die Automatisierung arbeitet die Warteschlange ab. Öffnen Sie die Anrufliste für Details.",
    action: "Warteschlange öffnen",
    href: "/calls?status=scheduled",
  });

  return {
    state: unavailable.length === results.length ? "error" : unavailable.length ? "partial" : "ready",
    unavailable,
    refreshedAt: now.toISOString(),
    health: {
      withinThirtySecondsPercent: eligible > 0
        ? Math.round((responseSeconds.filter((seconds) => seconds <= 30).length / eligible) * 100)
        : null,
      contacted: responseSeconds.length,
      eligible,
      failedCalls,
      queuedCalls,
      activeCalls,
    },
    metrics: {
      activeCompanies: companies.error ? null : companies.count,
      activeJobs: jobs.error ? null : jobs.count,
      newContactsToday: applicationsToday.error ? null : applicationsToday.count,
      completedCallsToday: voiceCalls.error && salesCalls.error ? null : completedCallsToday,
    },
    pipeline,
    activities,
    alerts,
  };
}
