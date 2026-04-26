import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, isTerminalSalesStatus } from "@/lib/phone";
import { generateTextHaiku } from "@/services/claude/client";

export const maxDuration = 60;

// ─── Generic Funnel-Context-Builder ─────────────────────────────────────────
// Liest funnel_pages.blocks und mapped die User-Antworten auf benannte
// custom_fields-Keys. Komplett funnel-agnostisch — funktioniert für PV,
// Travel, Coaching, beliebige Funnels mit beliebiger Fragenanzahl.
//
// Output:
//   - per-Frage Key (slugified question_text oder optional content.field_key)
//   - funnel_summary: markdown-Bullet-Liste aller Q+A
//   - funnel_qa: strukturiertes Array für Tools/Analyzer
//   - lead_context: Claude-Haiku-generierter natürlicher Einzeiler

type QaItem = { question: string; answer: string; key: string };

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60);
}

type FunnelPage = { page_order: number; blocks: unknown };

function buildFunnelContext(
  pages: FunnelPage[] | null,
  answers: Record<string, unknown> | null | undefined,
): { custom_fields: Record<string, string>; qa: QaItem[]; summary: string } {
  const out: Record<string, string> = {};
  const qa: QaItem[] = [];
  if (!pages || !answers) return { custom_fields: out, qa, summary: "" };

  for (const page of pages) {
    const blocks = (page.blocks as Array<Record<string, unknown>>) ?? [];
    // Wenn das Choice-Block selbst kein content.question hat, nutzen wir den
    // letzten Text-Block auf derselben Page als Fallback-Fragetext.
    let pageHeadingText: string | null = null;

    for (const block of blocks) {
      const blockType = block.type as string | undefined;
      const content = (block.content as Record<string, unknown>) ?? {};

      if (blockType === "text") {
        const t =
          (typeof content.headline === "string" && content.headline.trim()) ||
          (typeof content.content === "string" && content.content.trim()) ||
          "";
        if (t) pageHeadingText = t;
        continue;
      }

      const items = content.items as Array<{ label: string; value: string }> | undefined;
      if (!Array.isArray(items) || items.length === 0) continue;

      // Funnel-Player-Match: answers werden unter content.question oder
      // (falls leer) unter block.id abgelegt. Siehe funnel-player.tsx answerKey().
      const contentQuestion = typeof content.question === "string" ? content.question : "";
      const ansKey = contentQuestion || (block.id as string);

      // Display-Question für funnel_qa / lead_context
      const qText =
        contentQuestion.trim() ||
        pageHeadingText ||
        (typeof content.headline === "string" ? content.headline.trim() : "") ||
        `Frage ${qa.length + 1}`;

      const rawAnswer = answers[ansKey];
      const value = Array.isArray(rawAnswer) ? rawAnswer[0] : rawAnswer;
      if (typeof value !== "string") continue;

      const matched = items.find((it) => it.value === value);
      const label = (matched?.label ?? value).trim();

      const fieldKey = typeof content.field_key === "string" ? content.field_key.trim() : "";
      const key = fieldKey || slugify(qText);
      out[key] = label;
      qa.push({ question: qText, answer: label, key });

      pageHeadingText = null;
    }
  }

  const summary = qa.map((q) => `- ${q.question} → ${q.answer}`).join("\n");
  return { custom_fields: out, qa, summary };
}

async function summarizeLeadContext(args: {
  firstName: string | null;
  programPitch: string | null;
  targetPersona: string | null;
  qa: QaItem[];
}): Promise<string> {
  if (args.qa.length === 0) return "";
  const prompt = `Fasse den Lead in EINEM natürlichen deutschen Satz zusammen (max 25 Wörter).
Beispiel-Stil: "Hausbesitzer mit Einfamilienhaus und Stromkosten über 150€"
Programm: ${args.programPitch ?? ""}
Zielpersona: ${args.targetPersona ?? ""}
Funnel-Antworten:
${args.qa.map((q) => `- ${q.question}: ${q.answer}`).join("\n")}

Antworte NUR mit dem Satz, keine Anführungszeichen, keine Einleitung.`;
  try {
    const res = await generateTextHaiku(prompt, 120);
    return res.trim().replace(/^["']|["']$/g, "");
  } catch (e) {
    console.error("[apply/sales] lead_context summarization failed:", e);
    const labels = args.qa.map((q) => q.answer).join(", ");
    return args.firstName ? `${args.firstName}: ${labels}` : labels;
  }
}

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
        origin: req.nextUrl.origin,
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
  origin: string;
}): Promise<NextResponse> {
  const { supabase, funnel_id, sales_program_id, name, email, rawPhone, answers, origin } = args;

  const normalizedPhone = normalizePhone(rawPhone);
  if (!normalizedPhone) {
    return NextResponse.json({ error: "Telefonnummer ungültig oder fehlt (Sales-Funnel)" }, { status: 400 });
  }

  // Program + funnel_pages parallel laden
  const [{ data: program, error: programErr }, { data: pagesRaw }] = await Promise.all([
    supabase
      .from("sales_programs")
      .select("id, auto_dial, product_pitch, target_persona")
      .eq("id", sales_program_id)
      .single(),
    supabase
      .from("funnel_pages")
      .select("page_order, blocks")
      .eq("funnel_id", funnel_id)
      .order("page_order"),
  ]);
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

  // Generischer Funnel-Context — kein use-case-spezifischer Code.
  const ctx = buildFunnelContext(pagesRaw as FunnelPage[] | null, answers ?? {});
  const lead_context = await summarizeLeadContext({
    firstName: firstName || null,
    programPitch: program.product_pitch ?? null,
    targetPersona: program.target_persona ?? null,
    qa: ctx.qa,
  });
  const funnelCustomFields = {
    ...ctx.custom_fields,            // pro-Frage Keys
    funnel_summary: ctx.summary,      // markdown bullet list
    funnel_qa: ctx.qa,                // structured array
    lead_context,                     // 1-Satz natural-language hook
  };

  if (existing) {
    const preserveStatus = isTerminalSalesStatus(existing.status);
    const mergedResponses = {
      ...(existing.funnel_responses as Record<string, unknown>),
      ...(answers ?? {}),
    };
    const mergedCustomFields = {
      ...((existing.custom_fields as Record<string, unknown>) ?? {}),
      ...funnelCustomFields, // neueste Funnel-Antworten gewinnen
    };

    await supabase
      .from("sales_leads")
      .update({
        // Core-Felder bewusst nicht überschreiben — Re-Submission soll nicht
        // existierende Daten zerstören. Consent-Timestamp refreshen (neue Einwilligung).
        funnel_responses: mergedResponses,
        custom_fields: mergedCustomFields,
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
      void triggerSalesCall(origin, existing.id);
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
      custom_fields: funnelCustomFields,
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
        .select("id, status, funnel_responses, custom_fields")
        .eq("sales_program_id", sales_program_id)
        .eq("phone", normalizedPhone)
        .single();
      if (raceExisting) {
        const merged = {
          ...(raceExisting.funnel_responses as Record<string, unknown>),
          ...(answers ?? {}),
        };
        const mergedCf = {
          ...((raceExisting.custom_fields as Record<string, unknown>) ?? {}),
          ...funnelCustomFields,
        };
        await supabase
          .from("sales_leads")
          .update({
            funnel_responses: merged,
            custom_fields: mergedCf,
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
    void triggerSalesCall(origin, created.id);
  }

  return NextResponse.json({ success: true, sales_lead_id: created.id, action: "created" });
}

// Auto-Dial geht über /api/sales/trigger-call, NICHT direkt zu n8n. Grund:
// trigger-call baut den vollständigen vapi_payload (System-Prompt, FirstMessage,
// variableValues mit custom_fields). n8n erwartet diesen Payload — ohne ihn fällt
// der Vapi-API-Call still aus (Lead bleibt "new", kein Call).
async function triggerSalesCall(origin: string, sales_lead_id: string): Promise<void> {
  try {
    await fetch(`${origin}/api/sales/trigger-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sales_lead_id }),
    });
  } catch (err) {
    console.error("[apply/sales] trigger-call failed:", err);
  }
}
