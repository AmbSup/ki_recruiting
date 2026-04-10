import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
  const { error: appicErr } = await supabase.from("applications").insert({
    applicant_id: applicantId,
    job_id,
    funnel_id,
    funnel_responses: answers ?? {},
    source: "funnel",
  });

  if (appicErr) {
    return NextResponse.json({ error: appicErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
