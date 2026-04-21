import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, isTerminalSalesStatus } from "@/lib/phone";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    const body = await req.json();
    const {
      funnel_id,
      job_id,
      sales_program_id,
      name,
      email,
      cv_url,
      cv_file_name,
      answers,
    } = body;
    // Normalize phone: replace leading 00 with + (e.g. 004367... → +4367...)
    const phone = body.phone ? String(body.phone).replace(/^00/, "+") : body.phone;

    if (!funnel_id || !name || !email) {
      return NextResponse.json({ error: "Pflichtfelder fehlen (funnel_id, name, email)" }, { status: 400 });
    }
    if (!job_id && !sales_program_id) {
      return NextResponse.json({ error: "Weder job_id noch sales_program_id gesetzt" }, { status: 400 });
    }

    // ─── Sales-Branch ────────────────────────────────────────────────────────
    if (sales_program_id) {
      return await handleSalesSubmission({
        supabase,
        funnel_id,
        sales_program_id,
        name,
        email,
        rawPhone: phone,
        answers,
      });
    }

    // ─── Recruiting-Branch (unverändert) ─────────────────────────────────────
    // 1. Always create a new applicant — same email can apply multiple times with different names
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
    const applicantId = newApplicant.id;

    // 2. Create new application (fresh applicant → no unique constraint conflict)
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
    const applicationId = newApplication.id;

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

// ─── Sales-Branch: Lookup-or-Update auf (sales_program_id, phone) ────────────
// Terminalstatus wird nie auf 'new' zurückgesetzt → verhindert Re-Engage.

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function handleSalesSubmission(args: {
  supabase: SupabaseAdmin;
  funnel_id: string;
  sales_program_id: string;
  name: string;
  email: string;
  rawPhone: string | null;
  answers: Record<string, unknown> | undefined;
}): Promise<NextResponse> {
  const { supabase, funnel_id, sales_program_id, name, email, rawPhone, answers } = args;

  const normalizedPhone = normalizePhone(rawPhone);
  if (!normalizedPhone) {
    return NextResponse.json({ error: "Telefonnummer ungültig oder fehlt (Sales-Funnel)" }, { status: 400 });
  }

  // Program laden (für auto_dial)
  const { data: program, error: programErr } = await supabase
    .from("sales_programs")
    .select("id, auto_dial")
    .eq("id", sales_program_id)
    .single();
  if (programErr || !program) {
    return NextResponse.json({ error: "Sales-Program nicht gefunden" }, { status: 404 });
  }

  // Existing Lead?
  const { data: existing } = await supabase
    .from("sales_leads")
    .select("id, status, funnel_responses, custom_fields")
    .eq("sales_program_id", sales_program_id)
    .eq("phone", normalizedPhone)
    .maybeSingle();

  const nowIso = new Date().toISOString();
  const [firstName, ...lastParts] = name.trim().split(/\s+/);
  const lastName = lastParts.join(" ") || null;

  if (existing) {
    const preserveStatus = isTerminalSalesStatus(existing.status);
    const mergedResponses = {
      ...(existing.funnel_responses as Record<string, unknown>),
      ...(answers ?? {}),
    };

    await supabase
      .from("sales_leads")
      .update({
        // Core-Felder bewusst nicht überschreiben — Re-Submission soll nicht
        // existierende Daten zerstören. Consent-Timestamp refreshen (neue Einwilligung).
        funnel_responses: mergedResponses,
        consent_given: true,
        consent_source: "funnel_checkbox",
        consent_timestamp: nowIso,
        updated_at: nowIso,
        ...(preserveStatus ? {} : { status: "new" }),
      })
      .eq("id", existing.id);

    // Auto-Dial NUR wenn Status nicht terminal (sonst würden wir einen "not_interested"-
    // Lead erneut anrufen, nur weil er das Formular nochmal ausgefüllt hat).
    if (!preserveStatus && program.auto_dial) {
      void triggerSalesCall(existing.id);
    }

    return NextResponse.json({
      success: true,
      sales_lead_id: existing.id,
      action: preserveStatus ? "updated_terminal" : "updated",
    });
  }

  // Neu
  const { data: created, error: insertErr } = await supabase
    .from("sales_leads")
    .insert({
      sales_program_id,
      phone: normalizedPhone,
      first_name: firstName || null,
      last_name: lastName,
      full_name: name,
      email: email || null,
      source: "funnel",
      source_ref: funnel_id,
      funnel_responses: answers ?? {},
      consent_given: true,
      consent_source: "funnel_checkbox",
      consent_timestamp: nowIso,
    })
    .select("id")
    .single();

  if (insertErr) {
    // Race: zwischen Select und Insert kam ein Parallel-Submit — retry als Update
    if ((insertErr as { code?: string }).code === "23505") {
      const { data: raceExisting } = await supabase
        .from("sales_leads")
        .select("id, status, funnel_responses")
        .eq("sales_program_id", sales_program_id)
        .eq("phone", normalizedPhone)
        .single();
      if (raceExisting) {
        const merged = {
          ...(raceExisting.funnel_responses as Record<string, unknown>),
          ...(answers ?? {}),
        };
        await supabase
          .from("sales_leads")
          .update({
            funnel_responses: merged,
            consent_timestamp: nowIso,
            updated_at: nowIso,
          })
          .eq("id", raceExisting.id);
        return NextResponse.json({
          success: true,
          sales_lead_id: raceExisting.id,
          action: "updated_race",
        });
      }
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }
  if (!created) {
    return NextResponse.json({ error: "Sales-Lead konnte nicht gespeichert werden" }, { status: 500 });
  }

  if (program.auto_dial) {
    void triggerSalesCall(created.id);
  }

  return NextResponse.json({ success: true, sales_lead_id: created.id, action: "created" });
}

async function triggerSalesCall(sales_lead_id: string): Promise<void> {
  const n8nBase = process.env.N8N_BASE_URL;
  if (!n8nBase) return;
  try {
    await fetch(`${n8nBase}/webhook/start-sales-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sales_lead_id }),
    });
  } catch (err) {
    console.error("[apply/sales] n8n trigger failed:", err);
  }
}
