import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeCv } from "@/agents/cv-analyzer";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const application_id = searchParams.get("id");

  if (!application_id) {
    return NextResponse.json({ error: "?id= required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error: fetchErr } = await supabase
    .from("applications")
    .select(`
      id,
      applicant:applicants(id, full_name, cv_file_url),
      job:jobs(title, requirements, must_qualifications, nice_to_have_qualifications, ko_criteria, hard_skills, soft_skills, ideal_candidate, scoring_criteria)
    `)
    .eq("id", application_id)
    .single();

  if (fetchErr || !data) {
    return NextResponse.json({ step: "fetch", error: fetchErr?.message ?? "not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  const applicant = Array.isArray(d.applicant) ? d.applicant[0] : d.applicant;
  const job = Array.isArray(d.job) ? d.job[0] : d.job;

  if (!applicant || !job) {
    return NextResponse.json({ step: "join", error: "applicant or job missing", applicant, job }, { status: 400 });
  }

  try {
    const result = await analyzeCv({
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

    // Try inserting
    const { error: insertErr } = await supabase.from("cv_analyses").insert({
      application_id,
      raw_text: null,
      structured_data: result.structured_data,
      match_score: result.match_score,
      strengths: result.strengths,
      gaps: result.gaps,
      summary: result.summary,
      model_version: "claude-sonnet-4-6",
    });

    return NextResponse.json({
      step: "done",
      claude_result: result,
      insert_error: insertErr?.message ?? null,
    });
  } catch (e: unknown) {
    return NextResponse.json({
      step: "claude",
      error: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }
}
