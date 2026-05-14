import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runCvAnalysis } from "@/agents/cv-analyzer";

export const maxDuration = 60;

// SECURITY-TODO: Diese Route wird vom public funnel-player nach CV-Upload gerufen
// (siehe src/app/[slug]/funnel-player.tsx:587). Eine Auth-Protection würde
// einen Refactor verlangen (apply triggert cv-analyse intern statt funnel-player).
// Aktuelle Risiko-Bewertung: niedrig — Endpoint validiert application_id, gibt
// keine Daten zurück, einziges Risiko ist Anthropic-Spend-DoS bei bekannter UUID.
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const { application_id } = await req.json();

  if (!application_id) {
    return NextResponse.json({ error: "application_id fehlt" }, { status: 400 });
  }

  // Load application + applicant + job
  const { data, error } = await supabase
    .from("applications")
    .select(`
      id, job_id,
      applicant:applicants(id, full_name, email, phone, cv_file_url),
      job:jobs(
        id, title, requirements, must_qualifications, nice_to_have_qualifications,
        ko_criteria, hard_skills, soft_skills, ideal_candidate, scoring_criteria
      )
    `)
    .eq("id", application_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Bewerbung nicht gefunden" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  const applicant = Array.isArray(d.applicant) ? d.applicant[0] : d.applicant;
  const job = Array.isArray(d.job) ? d.job[0] : d.job;

  if (!applicant || !job) {
    return NextResponse.json({ error: "Bewerber oder Job nicht gefunden" }, { status: 404 });
  }

  // Delete existing analysis to allow re-run
  await supabase.from("cv_analyses").delete().eq("application_id", application_id);

  // Run analysis (async, may take a few seconds)
  await runCvAnalysis({
    application_id,
    applicant_name: applicant.full_name,
    cv_file_url: applicant.cv_file_url ?? null,
    job: {
      title: job.title,
      requirements: job.requirements ?? null,
      must_qualifications: job.must_qualifications ?? null,
      nice_to_have_qualifications: job.nice_to_have_qualifications ?? null,
      ko_criteria: job.ko_criteria ?? null,
      hard_skills: job.hard_skills ?? null,
      soft_skills: job.soft_skills ?? null,
      ideal_candidate: job.ideal_candidate ?? null,
      scoring_criteria: job.scoring_criteria ?? [],
    },
  });

  // Auto-trigger Vapi call via n8n (fire-and-forget)
  const n8nBase = process.env.N8N_BASE_URL;
  if (n8nBase && applicant.phone) {
    const nameParts = applicant.full_name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '-';
    void fetch(`${n8nBase}/webhook/start-booking-call-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        result: 'accepted',
        application_id,
        candidate_id: applicant.id,
        candidate_first_name: firstName,
        candidate_last_name: lastName,
        candidate_email: applicant.email ?? '',
        candidate_phone_number: applicant.phone,
        job_id: job.id,
        job_title: job.title,
      }),
    })
      .then((res) => {
        if (res.ok) {
          return supabase.from('applications').update({ pipeline_stage: 'call_scheduled' }).eq('id', application_id);
        }
      })
      .catch((err) => console.error('[cv-analyse] n8n trigger failed:', err));
  }

  return NextResponse.json({ success: true });
}
