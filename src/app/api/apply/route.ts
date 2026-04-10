import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runCvAnalysis } from "@/agents/cv-analyzer";

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  const body = await req.json();
  const { funnel_id, job_id, name, email, phone, city, cv_url, answers } = body;

  if (!funnel_id || !job_id || !name || !email) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  // 1. Find or create applicant
  let applicantId: string | null = null;

  const { data: existing } = await supabase
    .from("applicants")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    applicantId = existing.id;
    // Update phone/cv if provided
    await supabase.from("applicants").update({
      phone: phone || undefined,
      cv_file_url: cv_url || undefined,
      consent_given_at: new Date().toISOString(),
    }).eq("id", applicantId);
  } else {
    const { data: newApplicant, error: insertErr } = await supabase
      .from("applicants")
      .insert({
        full_name: name,
        email,
        phone: phone || null,
        cv_file_url: cv_url || null,
        consent_given_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (insertErr || !newApplicant) {
      return NextResponse.json({ error: insertErr?.message ?? "Bewerber konnte nicht gespeichert werden" }, { status: 500 });
    }
    applicantId = newApplicant.id;
  }

  if (!applicantId) {
    return NextResponse.json({ error: "Bewerber ID fehlt" }, { status: 500 });
  }

  // 2. Insert application
  const { data: newApplication, error: appicErr } = await supabase.from("applications").insert({
    applicant_id: applicantId,
    job_id,
    funnel_id,
    funnel_responses: answers ?? {},
    source: "direct",
  }).select("id").single();

  if (appicErr || !newApplication) {
    return NextResponse.json({ error: appicErr?.message ?? "Bewerbung konnte nicht gespeichert werden" }, { status: 500 });
  }

  // 3. Trigger CV analysis in background (fire-and-forget)
  const { data: job } = await supabase
    .from("jobs")
    .select("title, requirements, must_qualifications, nice_to_have_qualifications, ko_criteria, hard_skills, soft_skills, ideal_candidate, scoring_criteria")
    .eq("id", job_id)
    .single();

  if (job) {
    runCvAnalysis({
      application_id: newApplication.id,
      applicant_name: name,
      cv_file_url: cv_url ?? null,
      job: {
        title: job.title,
        requirements: job.requirements ?? null,
        must_qualifications: job.must_qualifications ?? null,
        nice_to_have_qualifications: job.nice_to_have_qualifications ?? null,
        ko_criteria: job.ko_criteria ?? null,
        hard_skills: job.hard_skills ?? null,
        soft_skills: job.soft_skills ?? null,
        ideal_candidate: job.ideal_candidate ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        scoring_criteria: (job.scoring_criteria as any) ?? [],
      },
    }).catch((e) => console.error("[apply] CV analysis failed:", e));
  }

  return NextResponse.json({ success: true });
}
