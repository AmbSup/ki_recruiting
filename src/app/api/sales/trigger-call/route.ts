import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSystemPrompt, buildFirstMessage } from "@/lib/vapi-prompts/builder";
import { salesTools } from "@/lib/vapi-prompts/tool-definitions";
import type { SalesProgramType } from "@/lib/vapi-prompts/schemas";
import { requireWriterOrN8n } from "@/lib/auth/guards";
import { matchOfferForLead, type MatchedOffer } from "@/lib/sales/match";
import type { Json } from "@/types/database";

export const maxDuration = 60;

const VAPI_SALES_PHONE_NUMBER_ID = process.env.VAPI_SALES_PHONE_NUMBER_ID;
const VAPI_SALES_ASSISTANT_ID = process.env.VAPI_SALES_ASSISTANT_ID;

type Program = {
  id: string;
  name: string;
  product_pitch: string | null;
  value_proposition: string | null;
  target_persona: string | null;
  booking_link: string | null;
  vapi_assistant_id: string | null;
  vapi_phone_number_id: string | null;
  caller_phone_number: string | null;
  program_type: SalesProgramType | null;
  call_strategy: Record<string, unknown> | null;
  auto_dial: boolean;
  system_prompt_override: string | null;
  first_message_override: string | null;
  cal_username: string | null;
  cal_event_type_slug: string | null;
  cal_timezone: string | null;
  company: { name: string | null } | null;
};

type Lead = {
  id: string;
  sales_program_id: string;
  phone: string;
  consent_given: boolean;
  status: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  role: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown> | null;
  source: string | null;
  source_ref: string | null;
  program: Program | null;
};

export async function POST(req: NextRequest) {
  const auth = await requireWriterOrN8n(req);
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  let body: { sales_lead_id?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { sales_lead_id } = body;
  if (!sales_lead_id) {
    return NextResponse.json({ error: "sales_lead_id fehlt" }, { status: 422 });
  }

  // Load lead + program (alle Felder, die der Prompt-Renderer braucht)
  const { data: leadRaw, error: leadErr } = await supabase
    .from("sales_leads")
    .select(`
      id, sales_program_id, phone, consent_given, status,
      first_name, last_name, full_name, email, company_name, role, notes, custom_fields,
      source, source_ref,
      program:sales_programs(
        id, name, product_pitch, value_proposition, target_persona, booking_link,
        vapi_assistant_id, vapi_phone_number_id, caller_phone_number,
        program_type, call_strategy, auto_dial,
        system_prompt_override, first_message_override,
        cal_username, cal_event_type_slug, cal_timezone,
        company:companies(name)
      )
    `)
    .eq("id", sales_lead_id)
    .single();

  if (leadErr || !leadRaw) {
    return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 });
  }

  // program kann vom Supabase-Client als array-of-1 kommen — defensiv flatten
  const leadObj = leadRaw as unknown as Record<string, unknown>;
  const programRaw = leadObj.program;
  const program: Program | null = Array.isArray(programRaw)
    ? (programRaw[0] as Program | undefined) ?? null
    : (programRaw as Program | null);
  const lead: Lead = { ...(leadObj as unknown as Lead), program };

  if (!program) {
    return NextResponse.json({ error: "Sales Program nicht gefunden" }, { status: 404 });
  }

  // Consent-Gate
  if (!lead.consent_given) {
    return NextResponse.json({ error: "Kein dokumentiertes Opt-In — Call blockiert" }, { status: 403 });
  }

  // Status-Lock + Stale-Cleanup (unverändert)
  const STALE_THRESHOLD_MS = 30_000;
  const staleCutoff = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();

  const { data: activeCalls } = await supabase
    .from("sales_calls")
    .select("id, status, created_at")
    .eq("sales_lead_id", sales_lead_id)
    .in("status", ["initiated", "ringing", "in_progress"]);

  const stuck: string[] = [];
  const trulyActive: { id: string; status: string }[] = [];
  for (const c of activeCalls ?? []) {
    if (c.status === "initiated" && c.created_at < staleCutoff) {
      stuck.push(c.id);
    } else {
      trulyActive.push({ id: c.id, status: c.status });
    }
  }

  if (stuck.length > 0) {
    await supabase
      .from("sales_calls")
      .update({
        status: "failed",
        end_reason: "Auto-cleanup on retry (stuck in initiated > 30s)",
        ended_at: new Date().toISOString(),
      })
      .in("id", stuck);
  }

  if (trulyActive.length > 0) {
    return NextResponse.json(
      {
        error: `Lead hat bereits einen ${trulyActive[0].status === "in_progress" ? "laufenden" : "aktiven"} Call`,
        sales_call_id: trulyActive[0].id,
        status: trulyActive[0].status,
      },
      { status: 409 },
    );
  }

  // Vapi-Assistant + Phone-Number aus Program (mit Env-Fallback)
  const assistantId = program.vapi_assistant_id ?? VAPI_SALES_ASSISTANT_ID;
  const phoneNumberId = program.vapi_phone_number_id ?? VAPI_SALES_PHONE_NUMBER_ID;
  if (!assistantId) {
    return NextResponse.json(
      { error: "Vapi Assistant ID fehlt — setz sales_programs.vapi_assistant_id oder VAPI_SALES_ASSISTANT_ID" },
      { status: 500 },
    );
  }
  if (!phoneNumberId) {
    return NextResponse.json(
      { error: "Vapi Phone Number ID fehlt — setz sales_programs.vapi_phone_number_id oder VAPI_SALES_PHONE_NUMBER_ID" },
      { status: 500 },
    );
  }

  // Stale-Funnel-Cleanup: Wenn lead.source_ref auf einen Funnel zeigt, der zu
  // einem ANDEREN sales_program gehört, dann sind funnel_qa/funnel_summary/
  // lead_context + die per-Frage-Slug-Keys in custom_fields stale (z.B. der
  // Lead war früher PV-Funnel, jetzt KI Sales Call). Würden wir diese Daten
  // ungefiltert in den Prompt geben, sagt die KI im Call Sätze wie "Sie sind
  // Hausbesitzer mit Süddach" — was zum aktuellen Sales-Program nicht passt.
  // → Strip die funnel-bezogenen Keys aus custom_fields.
  let cleanedCustomFields: Record<string, unknown> = (lead.custom_fields ?? {}) as Record<string, unknown>;
  if (lead.source === "funnel" && lead.source_ref) {
    const { data: srcFunnel } = await supabase
      .from("funnels")
      .select("sales_program_id")
      .eq("id", lead.source_ref)
      .maybeSingle();
    const funnelProgramId = (srcFunnel as { sales_program_id?: string | null } | null)?.sales_program_id ?? null;
    const funnelMatches = funnelProgramId === lead.sales_program_id;
    if (!funnelMatches) {
      cleanedCustomFields = stripStaleFunnelFields(cleanedCustomFields);
    }
  }

  // Prompt rendern — use-case-spezifisch via builder
  const programType = (program.program_type ?? "generic") as SalesProgramType;
  const callStrategy = (program.call_strategy ?? {}) as Record<string, unknown>;
  const now = new Date();
  const weekdayDe = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"][now.getDay()];

  // Product-Finder Pre-Match: lade Top-Offer basierend auf preference_tags aus
  // custom_fields. Wenn Match → in variableValues injizieren + custom_fields
  // persistieren, damit send_offer_link das gleiche Offer findet.
  let matchedOffer: MatchedOffer | null = null;
  if (programType === "product_finder") {
    const tags = Array.isArray(cleanedCustomFields.preference_tags)
      ? (cleanedCustomFields.preference_tags as unknown[]).filter((t): t is string => typeof t === "string")
      : [];
    if (tags.length > 0) {
      const matchingCfg = (callStrategy.matching ?? {}) as {
        min_match_score?: number;
        fallback_message?: string;
      };
      const result = await matchOfferForLead({
        supabase,
        sales_program_id: program.id,
        preference_tags: tags,
        min_score: matchingCfg.min_match_score,
        fallback_message: matchingCfg.fallback_message,
      });
      matchedOffer = result.offer;
      if (matchedOffer) {
        // Persistiere matched_offer_id, damit /api/sales/offers/send-link es findet
        cleanedCustomFields = { ...cleanedCustomFields, matched_offer_id: matchedOffer.id };
        await supabase
          .from("sales_leads")
          .update({ custom_fields: cleanedCustomFields as Json })
          .eq("id", lead.id);
      }
    }
  }

  // Backward-Compat: alte Programs hatten hook_promise/hard_qualifier_questions als Strategy-Keys.
  // Neue Strategie-Keys (hook_one_liner, discovery_questions) gewinnen, falls beide gesetzt.
  const hookOneLiner = (callStrategy.hook_one_liner as string | undefined)
    ?? (callStrategy.hook_promise as string | undefined)
    ?? "";
  const painPoints = Array.isArray(callStrategy.pain_points) ? callStrategy.pain_points as string[] : [];
  const discoveryRaw = Array.isArray(callStrategy.discovery_questions)
    ? callStrategy.discovery_questions as string[]
    : Array.isArray(callStrategy.hard_qualifier_questions)
      ? callStrategy.hard_qualifier_questions as string[]
      : [];
  const objections = Array.isArray(callStrategy.top_objections)
    ? (callStrategy.top_objections as Array<{ objection?: string; response?: string }>)
    : [];
  const onDisqualify = (callStrategy.on_disqualify as string | undefined) ?? "";
  const verbalCommitment = callStrategy.verbal_commitment_required === true;
  const toneFormality = (callStrategy.tone_formality as string | undefined) ?? "";
  const toneWarmth = (callStrategy.tone_warmth as string | undefined) ?? "";

  const painPointsBlock = painPoints.filter(Boolean).map((p) => `- ${p}`).join("\n");
  const discoveryBlock = discoveryRaw.filter(Boolean).map((q, i) => `${i + 1}. ${q}`).join("\n");
  const objectionsBlock = objections
    .filter((o) => (o.objection ?? "").trim() && (o.response ?? "").trim())
    .map((o) => `- "${o.objection}" → ${o.response}`)
    .join("\n");

  const vars = {
    first_name: lead.first_name ?? "",
    last_name: lead.last_name ?? "",
    full_name: lead.full_name ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    company_name: lead.company_name ?? "",
    role: lead.role ?? "",
    notes: lead.notes ?? "",
    custom_fields_json: JSON.stringify(cleanedCustomFields),
    program_name: program.name ?? "",
    product_pitch: program.product_pitch ?? "",
    value_proposition: program.value_proposition ?? "",
    target_persona: program.target_persona ?? "",
    booking_link: program.booking_link ?? "",
    // Operator-Firma — Joined aus sales_programs.company. Fällt auf program.name zurück
    // falls die Join-Beziehung leer ist (defensiv, sollte nicht passieren).
    caller_company: (Array.isArray(program.company) ? program.company[0]?.name : program.company?.name) ?? program.name ?? "",

    // Legacy-Keys (für alte Use-Case-Templates, die noch {{hook_promise}} etc. interpolieren)
    hook_promise: hookOneLiner,
    hard_qualifier_questions_list: discoveryRaw.join(" / "),
    show_rate_confirmation_phrase: (callStrategy.show_rate_confirmation_phrase as string | undefined) ?? "",

    caller_name: (callStrategy.caller_name as string | undefined) ?? "Andrea",
    fallback_resource_url: (callStrategy.fallback_resource_url as string | undefined) ?? "",
    require_consent: callStrategy.require_consent !== false,

    // Neue strukturierte Strategie-Felder — vom buildStrategyBlock konsumiert.
    hook_one_liner: hookOneLiner,
    pain_points_block: painPointsBlock,
    discovery_questions_block: discoveryBlock,
    disqualification_criteria: (callStrategy.disqualification_criteria as string | undefined) ?? "",
    top_objections_block: objectionsBlock,
    success_definition: (callStrategy.success_definition as string | undefined) ?? "",
    on_disqualify: onDisqualify,
    verbal_commitment_required: verbalCommitment,
    tone_formality: toneFormality,
    tone_warmth: toneWarmth,
    urgency_trigger: (callStrategy.urgency_trigger as string | undefined) ?? "",

    sales_lead_id: lead.id,
    sales_call_id: "",
    sales_program_id: program.id,
    today_iso: now.toISOString().slice(0, 10),
    today_weekday_de: weekdayDe,
    system_prompt_override: program.system_prompt_override ?? "",
    first_message_override: program.first_message_override ?? "",
    cal_username: program.cal_username ?? "",
    cal_event_type_slug: program.cal_event_type_slug ?? "",
    cal_timezone: program.cal_timezone ?? "Europe/Vienna",

    // Product-Finder: matched_offer_* + has_match — vom Pre-Match oben gesetzt.
    // In allen anderen Use-Cases einfach leer / "false" (Prompt ignoriert sie).
    matched_offer_name: matchedOffer?.name ?? "",
    matched_offer_summary: matchedOffer?.summary ?? "",
    matched_offer_url: matchedOffer?.detail_url ?? "",
    has_match: matchedOffer ? "true" : "false",

    // Notify-Channels — bewusst auf WhatsApp-only beschränkt, weil die
    // Twilio-SMS-Nummer (+43 26224 5816) voice-only ist. Falls später eine
    // SMS-capable Nummer hinzukommt, kann das wieder zu "SMS und WhatsApp"
    // erweitert werden + send-link channels parallel aktivieren.
    notify_channels: process.env.TWILIO_WHATSAPP_NUMBER ? "WhatsApp" : "SMS",
    notify_channels_short: process.env.TWILIO_WHATSAPP_NUMBER ? "WhatsApp" : "SMS",
    has_whatsapp: process.env.TWILIO_WHATSAPP_NUMBER ? "true" : "false",
  };

  // custom_fields top-level flatten — damit Vapi-side {{house_type}} ohne Dot-Notation
  // gegen variableValues matcht. Überschreibt nichts, weil custom_fields-Keys keine
  // Reserved-Names der vars sind. Werte werden zu strings normalisiert.
  const cfFlatten = cleanedCustomFields;
  for (const [k, v] of Object.entries(cfFlatten)) {
    if (k in vars) continue;
    (vars as Record<string, unknown>)[k] = typeof v === "string" ? v : JSON.stringify(v);
  }

  // sales_calls-Row jetzt anlegen, damit wir die ID in variableValues einbauen können
  const { data: callRow, error: callErr } = await supabase
    .from("sales_calls")
    .insert({
      sales_lead_id: lead.id,
      sales_program_id: program.id,
      status: "initiated",
    })
    .select("id")
    .single();

  if (callErr || !callRow) {
    return NextResponse.json(
      { error: `sales_calls insert failed: ${callErr?.message ?? "unknown"}` },
      { status: 500 },
    );
  }

  const salesCallId = callRow.id as string;
  vars.sales_call_id = salesCallId;

  const systemPrompt = buildSystemPrompt(programType, vars);
  const firstMessage = buildFirstMessage(programType, vars);

  // Vapi requires full model object in assistantOverrides (provider + model,
  // nicht nur messages). Defaults entsprechen der typischen Dashboard-Config;
  // pro Program override-bar via call_strategy.llm_provider / call_strategy.llm_model.
  const llmProvider = (callStrategy.llm_provider as string | undefined) ?? "openai";
  const llmModel = (callStrategy.llm_model as string | undefined) ?? "gpt-4o";

  const vapiPayload = {
    phoneNumberId,
    customer: { number: lead.phone },
    assistantId,
    assistantOverrides: {
      model: {
        provider: llmProvider,
        model: llmModel,
        messages: [{ role: "system", content: systemPrompt }],
        tools: salesTools,
      },
      firstMessage,
      variableValues: vars,
    },
  };

  // Hand off an n8n — der macht den Vapi-API-Call und updatet sales_calls.vapi_call_id
  // bzw. markiert failed bei Fehler. Wir behalten die n8n-Visibility/Retry bewusst.
  const n8nBase = process.env.N8N_BASE_URL;
  if (!n8nBase) {
    return NextResponse.json({ error: "N8N_BASE_URL nicht konfiguriert" }, { status: 500 });
  }

  const triggerRes = await fetch(`${n8nBase}/webhook/start-sales-call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sales_lead_id: lead.id,
      sales_call_id: salesCallId,
      vapi_payload: vapiPayload,
    }),
  }).catch((err) => {
    console.error("[sales/trigger-call] n8n fetch failed:", err);
    return null;
  });

  if (!triggerRes || !triggerRes.ok) {
    const msg = triggerRes ? await triggerRes.text().catch(() => "") : "n8n unreachable";
    // sales_calls auf failed setzen, damit die UI den Retry freigibt
    await supabase
      .from("sales_calls")
      .update({
        status: "failed",
        end_reason: `n8n trigger failed: ${msg.slice(0, 200)}`,
        ended_at: new Date().toISOString(),
      })
      .eq("id", salesCallId);
    return NextResponse.json({ error: `n8n trigger failed: ${msg}` }, { status: 502 });
  }

  // Optimistic: Lead-Status auf "calling" (Vapi updatet später via end-of-call-report)
  await supabase
    .from("sales_leads")
    .update({ status: "calling" })
    .eq("id", sales_lead_id);

  return NextResponse.json({
    success: true,
    sales_call_id: salesCallId,
    vapi_assistant_id: assistantId,
    vapi_phone_number_id: phoneNumberId,
  });
}

// Entfernt funnel-spezifische Felder aus custom_fields. Genutzt wenn der Lead
// aus einem Funnel eines anderen Sales-Programs stammt — die alten Antworten
// wären für den aktuellen Call irreführend (z.B. PV-Hook im KI-Sales-Call).
function stripStaleFunnelFields(cf: Record<string, unknown>): Record<string, unknown> {
  const FUNNEL_RENDERED_KEYS = new Set(["funnel_qa", "funnel_summary", "lead_context"]);
  const qaArr = Array.isArray(cf.funnel_qa) ? (cf.funnel_qa as Array<{ key?: string }>) : [];
  const slugKeys = new Set(qaArr.map((q) => q.key).filter((k): k is string => typeof k === "string" && k.length > 0));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cf)) {
    if (FUNNEL_RENDERED_KEYS.has(k)) continue;
    if (slugKeys.has(k)) continue;
    out[k] = v;
  }
  return out;
}
