import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runCvAnalysis } from "@/agents/cv-analyzer";

export const maxDuration = 60;

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
      id,
      applicant:applicants(id, full_name, cv_file_url),
      job:jobs(
        title, requirements, must_qualifications, nice_to_have_qualifications,
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

  return NextResponse.json({ success: true });
}
