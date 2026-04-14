import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    const body = await req.json();
    const { funnel_id, job_id, name, email, cv_url, cv_file_name, answers } = body;
    // Normalize phone: replace leading 00 with + (e.g. 004367... → +4367...)
    const phone = body.phone ? body.phone.replace(/^00/, '+') : body.phone;

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
      await supabase.from("applicants").update({
        phone: phone || undefined,
        cv_file_url: cv_url || undefined,
        ...(cv_file_name ? { cv_file_name } : {}),
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
          cv_file_name: cv_file_name || null,
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

    // 2. Find or create application (unique per applicant+job)
    let applicationId: string | null = null;

    const { data: existingApp } = await supabase
      .from("applications")
      .select("id")
      .eq("applicant_id", applicantId)
      .eq("job_id", job_id)
      .maybeSingle();

    if (existingApp) {
      applicationId = existingApp.id;
      await supabase.from("applications").update({
        funnel_responses: answers ?? {},
        funnel_id,
      }).eq("id", applicationId);
    } else {
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
      applicationId = newApplication.id;
    }

    if (!applicationId) {
      return NextResponse.json({ error: "Bewerbungs-ID fehlt" }, { status: 500 });
    }

    // Return application_id so client can trigger CV analysis in a separate request
    return NextResponse.json({ success: true, application_id: applicationId });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[apply] uncaught error:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
