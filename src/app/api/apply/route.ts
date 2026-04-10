import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  const body = await req.json();
  const { funnel_id, job_id, name, email, phone, city, cv_url, answers } = body;

  if (!funnel_id || !job_id || !name || !email) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  // 1. Upsert applicant
  const { data: applicant, error: appErr } = await supabase
    .from("applicants")
    .upsert(
      {
        full_name: name,
        email,
        phone: phone || null,
        cv_file_url: cv_url || null,
        consent_given_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (appErr || !applicant) {
    return NextResponse.json({ error: appErr?.message ?? "Bewerber konnte nicht gespeichert werden" }, { status: 500 });
  }

  // 2. Insert application
  const { error: appicErr } = await supabase.from("applications").insert({
    applicant_id: applicant.id,
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
