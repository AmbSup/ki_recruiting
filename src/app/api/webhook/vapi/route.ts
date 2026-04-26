import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSystemPrompt, buildFirstMessage } from "@/lib/vapi-prompts/builder";
import { salesTools } from "@/lib/vapi-prompts/tool-definitions";
import type { SalesProgramType } from "@/lib/vapi-prompts/schemas";

// ---------------------------------------------------------------------------
// POST /api/webhook/vapi
//
// Two purposes:
//   1. "assistant-request" — Vapi asks which assistant to use for an incoming
//      SIP call. For Sales we return a transient-override assistant with
//      model.messages = rendered system prompt + firstMessage + tools. For
//      Recruiting we keep the legacy {id, variableValues} shape.
//
//   2. "end-of-call-report" — forwarded here if n8n is not used. Currently
//      we return 200 and let n8n handle it via its own webhook.
// ---------------------------------------------------------------------------

const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID!;
const VAPI_SALES_ASSISTANT_ID = process.env.VAPI_SALES_ASSISTANT_ID;

type CachedProgram = {
  id?: string;
  name?: string;
  product_pitch?: string;
  value_proposition?: string;
  target_persona?: string;
  booking_link?: string;
  vapi_assistant_id?: string;
  program_type?: SalesProgramType;
  call_strategy?: {
    hook_promise?: string;
    caller_name?: string;
    fallback_resource_url?: string;
    hard_qualifier_questions?: string[];
    show_rate_confirmation_phrase?: string;
  };
};

type CachedLead = {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  role?: string;
  notes?: string;
  custom_fields?: Record<string, unknown>;
};

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message as Record<string, unknown> | undefined;
  const messageType = message?.type as string | undefined;

  // ── 1. Assistant Request ──────────────────────────────────────────────────
  if (messageType === "assistant-request") {
    const call = message?.call as Record<string, unknown> | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const phoneNumber = (call?.customer as any)?.number as string | undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawSipHeaders = ((call as any)?.sipHeaders
      ?? (call?.customer as any)?.sipHeaders
      ?? {}) as Record<string, unknown>;
    const sipHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawSipHeaders)) {
      if (typeof v === "string") sipHeaders[k.toLowerCase()] = v;
    }
    const sipSalesLeadId = sipHeaders["x-sales-lead-id"] ?? null;
    const sipSalesCallId = sipHeaders["x-sales-call-id"] ?? null;

    console.log(
      "[vapi-webhook] assistant-request | phone:", phoneNumber,
      "| sip x-sales-lead-id:", sipSalesLeadId,
      "| sip x-sales-call-id:", sipSalesCallId,
    );

    const supabase = createAdminClient();

    // ── Sales first: lookup by SIP header (authoritative), then by phone ────
    if (sipSalesLeadId || phoneNumber) {
      const query = supabase
        .from("sales_call_sessions")
        .select("sales_lead_id, sales_call_id, cached_data")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      const { data: salesSession } = sipSalesLeadId
        ? await query.eq("sales_lead_id", sipSalesLeadId).maybeSingle()
        : await query.eq("phone_number", phoneNumber!).maybeSingle();

      if (salesSession) {
        const cached = salesSession.cached_data as { lead?: CachedLead; program?: CachedProgram } | null;
        const lead: CachedLead = cached?.lead ?? {};
        const program: CachedProgram = cached?.program ?? {};
        const programType = (program.program_type ?? "generic") as SalesProgramType;
        const assistantId = program.vapi_assistant_id ?? VAPI_SALES_ASSISTANT_ID;

        const callStrategy = (program.call_strategy ?? {}) as Record<string, unknown>;
        const now = new Date();
        const weekdayDe = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"][now.getDay()];

        // Strategie-Felder + Backward-Compat (siehe trigger-call/route.ts für die kanonische Logik)
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
          custom_fields_json: JSON.stringify(lead.custom_fields ?? {}),
          program_name: program.name ?? "",
          product_pitch: program.product_pitch ?? "",
          value_proposition: program.value_proposition ?? "",
          target_persona: program.target_persona ?? "",
          booking_link: program.booking_link ?? "",

          hook_promise: hookOneLiner,
          caller_name: (callStrategy.caller_name as string | undefined) ?? "Jonas",
          fallback_resource_url: (callStrategy.fallback_resource_url as string | undefined) ?? "",
          hard_qualifier_questions_list: discoveryRaw.join(" / "),
          show_rate_confirmation_phrase: (callStrategy.show_rate_confirmation_phrase as string | undefined) ?? "",
          require_consent: callStrategy.require_consent !== false,

          hook_one_liner: hookOneLiner,
          pain_points_block: painPointsBlock,
          discovery_questions_block: discoveryBlock,
          disqualification_criteria: (callStrategy.disqualification_criteria as string | undefined) ?? "",
          top_objections_block: objectionsBlock,
          success_definition: (callStrategy.success_definition as string | undefined) ?? "",
          on_disqualify: (callStrategy.on_disqualify as string | undefined) ?? "",
          verbal_commitment_required: callStrategy.verbal_commitment_required === true,
          tone_formality: (callStrategy.tone_formality as string | undefined) ?? "",
          tone_warmth: (callStrategy.tone_warmth as string | undefined) ?? "",
          urgency_trigger: (callStrategy.urgency_trigger as string | undefined) ?? "",

          sales_lead_id: salesSession.sales_lead_id ?? "",
          sales_call_id: salesSession.sales_call_id ?? "",
          sales_program_id: program.id ?? "",
          today_iso: now.toISOString().slice(0, 10),
          today_weekday_de: weekdayDe,
        };

        const systemPrompt = buildSystemPrompt(programType, vars);
        const firstMessage = buildFirstMessage(programType, vars);

        console.log(
          "[vapi-webhook] assistant-request (sales) | phone:", phoneNumber,
          "| sales_lead_id:", salesSession.sales_lead_id,
          "| program_type:", programType,
          "| assistant_id:", assistantId,
          "| prompt_chars:", systemPrompt.length,
        );

        // DIAGNOSE-MODE: Gibt beide Vapi-Shapes ab, damit Vapi mind. eine
        // akzeptiert. Bei "Could not get Assistant"-Errors isolieren wir
        // damit ob Shape oder Assistant-Referenz das Problem ist.
        // Wichtig: Die canonical-Vapi-Shape ist {assistantId, assistantOverrides}.
        // Falls die weiterhin scheitert, ist der Assistant-ID selbst das Problem
        // (gelöscht, falsche Org, etc.).
        console.log(
          "[vapi-webhook] returning canonical assistantId =",
          assistantId,
          "| programType =",
          programType,
        );
        return NextResponse.json({
          assistantId,
          assistantOverrides: {
            model: {
              messages: [{ role: "system", content: systemPrompt }],
              tools: salesTools,
            },
            firstMessage,
            variableValues: vars,
          },
        });
      }
    }

    // ── Recruiting fallback (unchanged) ────────────────────────────────────
    let session: Record<string, unknown> | null = null;
    if (phoneNumber) {
      const { data } = await supabase
        .from("call_sessions")
        .select("application_id, job_id, candidate_id, cached_data")
        .eq("phone_number", phoneNumber)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      session = data as Record<string, unknown> | null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cached = session?.cached_data as any;
    const candidate = cached?.candidate ?? {};

    console.log(
      "[vapi-webhook] assistant-request (recruiting) | phone:", phoneNumber,
      "| application_id:", session?.application_id ?? null,
    );

    return NextResponse.json({
      assistant: {
        ...(VAPI_ASSISTANT_ID ? { id: VAPI_ASSISTANT_ID } : {}),
        variableValues: {
          application_id: session?.application_id ?? null,
          candidate_id: session?.candidate_id ?? null,
          job_id: session?.job_id ?? null,
          candidate_first_name: candidate.first_name ?? null,
          candidate_last_name: candidate.last_name ?? null,
          candidate_email: candidate.email ?? null,
          candidate_phone_number: phoneNumber ?? null,
          job_title: cached?.job?.title ?? null,
        },
      },
    });
  }

  // ── 2. All other Vapi events — acknowledge and ignore (n8n handles them) ──
  return NextResponse.json({ received: true });
}
