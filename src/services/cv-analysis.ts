import { runCvAnalysis } from "@/agents/cv-analyzer";
import { createAdminClient } from "@/lib/supabase/admin";

export type CvAnalysisRunResult = { ok: true } | { ok: false; status: number; error: string };

export async function analyzeApplicationCv(applicationId: string): Promise<CvAnalysisRunResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("applications")
    .select(`id, job_id,
      applicant:applicants(id, full_name, email, phone, cv_file_url),
      job:jobs(id, title, requirements, must_qualifications, nice_to_have_qualifications,
        ko_criteria, hard_skills, soft_skills, ideal_candidate, scoring_criteria)`)
    .eq("id", applicationId).single();
  if (error || !data) return { ok: false, status: 404, error: "Bewerbung nicht gefunden" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const applicant = Array.isArray(row.applicant) ? row.applicant[0] : row.applicant;
  const job = Array.isArray(row.job) ? row.job[0] : row.job;
  if (!applicant || !job) return { ok: false, status: 404, error: "Bewerber oder Job nicht gefunden" };

  await supabase.from("cv_analyses").delete().eq("application_id", applicationId);
  await runCvAnalysis({
    application_id: applicationId, applicant_name: applicant.full_name,
    cv_file_url: applicant.cv_file_url ?? null,
    job: {
      title: job.title, requirements: job.requirements ?? null,
      must_qualifications: job.must_qualifications ?? null,
      nice_to_have_qualifications: job.nice_to_have_qualifications ?? null,
      ko_criteria: job.ko_criteria ?? null, hard_skills: job.hard_skills ?? null,
      soft_skills: job.soft_skills ?? null, ideal_candidate: job.ideal_candidate ?? null,
      scoring_criteria: job.scoring_criteria ?? [],
    },
  });

  const n8nBase = process.env.N8N_BASE_URL?.trim();
  if (n8nBase && applicant.phone) {
    const [firstName, ...lastParts] = applicant.full_name.trim().split(" ");
    await fetch(`${n8nBase}/webhook/start-booking-call-v2`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        result: "accepted", application_id: applicationId, candidate_id: applicant.id,
        candidate_first_name: firstName, candidate_last_name: lastParts.join(" ") || "-",
        candidate_email: applicant.email ?? "", candidate_phone_number: applicant.phone,
        job_id: job.id, job_title: job.title,
      }),
    }).then(async (response) => {
      if (response.ok) await supabase.from("applications").update({ pipeline_stage: "call_scheduled" }).eq("id", applicationId);
    }).catch((fetchError) => console.error("[cv-analysis] n8n trigger failed:", fetchError));
  }
  return { ok: true };
}
