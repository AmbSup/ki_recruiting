import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

export type TranscriptMessage = {
  role: "user" | "assistant" | string;
  text: string;
};

export type SalesCallAnalysis = {
  meeting_booked: boolean;
  meeting_datetime: string | null; // ISO
  interest_level: "high" | "medium" | "low" | "none";
  call_rating: number; // 1..10
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
  objections: string[];
  pain_points: string[];
  next_action: "send_email" | "call_back" | "send_proposal" | "dead_lead" | "nurture";
  next_action_at: string | null;
  key_quotes: { speaker: "lead" | "agent"; quote: string }[];
};

type LeadContext = {
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  company_name: string | null;
  role: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
};

type ProgramContext = {
  name: string;
  product_pitch: string | null;
  value_proposition: string | null;
  target_persona: string | null;
};

type VapiEndReport = {
  meeting_booked?: boolean;
  meeting_datetime?: string | null;
  interest_level?: string;
  objections?: string[];
  next_action?: string;
} | null;

export async function analyzeSalesCall(options: {
  transcript_messages: TranscriptMessage[];
  transcript_text: string;
  lead: LeadContext;
  program: ProgramContext;
  vapi_end_report: VapiEndReport;
}): Promise<SalesCallAnalysis> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const leadName = options.lead.full_name
    || [options.lead.first_name, options.lead.last_name].filter(Boolean).join(" ")
    || "Lead";

  const programContext = [
    `**Programm:** ${options.program.name}`,
    options.program.product_pitch && `**Pitch:** ${options.program.product_pitch}`,
    options.program.value_proposition && `**Value Proposition:** ${options.program.value_proposition}`,
    options.program.target_persona && `**Zielpersona:** ${options.program.target_persona}`,
  ].filter(Boolean).join("\n");

  const leadContext = [
    `**Lead:** ${leadName}`,
    options.lead.company_name && `**Firma:** ${options.lead.company_name}`,
    options.lead.role && `**Rolle:** ${options.lead.role}`,
    options.lead.notes && `**Notizen:** ${options.lead.notes}`,
  ].filter(Boolean).join("\n");

  const transcriptFormatted = options.transcript_messages.length > 0
    ? options.transcript_messages
        .map((m) => `${m.role === "assistant" ? "Agent" : "Lead"}: ${m.text}`)
        .join("\n")
    : options.transcript_text || "(kein Transkript verfügbar)";

  const vapiHint = options.vapi_end_report
    ? `\n**Vapi-Auswertung (Vorab-Hinweis, nicht final):** ${JSON.stringify(options.vapi_end_report)}\n`
    : "";

  const systemPrompt = `Du bist ein erfahrener Sales-Analyst und bewertest Outbound-Sales-Calls.
Antworte IMMER als valides JSON ohne Markdown-Codeblöcke.`;

  const userPrompt = `Analysiere diesen Sales-Call zwischen KI-Agent und ${leadName}.

${programContext}

${leadContext}
${vapiHint}
**Transkript:**
${transcriptFormatted}

Antworte mit folgendem JSON (kein Markdown, nur reines JSON):
{
  "meeting_booked": <boolean — wurde ein konkreter Termin vereinbart?>,
  "meeting_datetime": "<ISO-Timestamp oder null>",
  "interest_level": "<high|medium|low|none>",
  "call_rating": <Zahl 1-10, Gesamtqualität des Calls>,
  "sentiment": "<positive|neutral|negative>",
  "summary": "<2-4 Sätze Zusammenfassung auf Deutsch>",
  "objections": ["<Einwand 1>", ...],
  "pain_points": ["<Pain Point 1>", ...],
  "next_action": "<send_email|call_back|send_proposal|dead_lead|nurture>",
  "next_action_at": "<ISO-Timestamp oder null — wann die next_action fällig ist>",
  "key_quotes": [
    { "speaker": "lead", "quote": "<wörtliches Zitat>" },
    { "speaker": "agent", "quote": "<wörtliches Zitat>" }
  ]
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "{}";
  return JSON.parse(text) as SalesCallAnalysis;
}

// Pipeline status, basierend auf Analyse-Ergebnis
function deriveLeadStatus(analysis: SalesCallAnalysis): string | null {
  if (analysis.meeting_booked) return "meeting_booked";
  if (analysis.interest_level === "none" || analysis.next_action === "dead_lead") return "not_interested";
  return "contacted";
}

export async function runSalesCallAnalysis(options: {
  sales_call_id: string;
  transcript_messages?: TranscriptMessage[];
  transcript_text?: string;
  recording_url?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  end_reason?: string | null;
  vapi_end_report?: VapiEndReport;
}): Promise<{ sales_call_analysis_id: string } | null> {
  const supabase = createAdminClient();

  // 1. Load sales_call + lead + program
  const { data: call, error: callErr } = await supabase
    .from("sales_calls")
    .select(`
      id, sales_lead_id, sales_program_id,
      sales_lead:sales_leads(first_name, last_name, full_name, company_name, role, notes, custom_fields),
      sales_program:sales_programs(name, product_pitch, value_proposition, target_persona)
    `)
    .eq("id", options.sales_call_id)
    .single();

  if (callErr || !call) {
    console.error("[sales-call-analyzer] sales_call not found:", options.sales_call_id, callErr);
    return null;
  }

  const leadRaw = call.sales_lead;
  const lead = (Array.isArray(leadRaw) ? leadRaw[0] : leadRaw) as LeadContext | null;
  const programRaw = call.sales_program;
  const program = (Array.isArray(programRaw) ? programRaw[0] : programRaw) as ProgramContext | null;

  if (!lead || !program) {
    console.error("[sales-call-analyzer] missing lead or program for call:", options.sales_call_id);
    return null;
  }

  // 2. Update sales_calls with post-call data (transcript, recording, duration, end_reason)
  const durationSeconds = options.started_at && options.ended_at
    ? Math.round((new Date(options.ended_at).getTime() - new Date(options.started_at).getTime()) / 1000)
    : null;

  const transcriptJson = (options.transcript_messages ?? []).length > 0
    ? {
        full_text: options.transcript_text ?? "",
        segments: (options.transcript_messages ?? []).map((m, i) => ({
          index: i, speaker: m.role, text: m.text,
        })),
      }
    : null;

  await supabase
    .from("sales_calls")
    .update({
      status: "completed",
      started_at: options.started_at ?? undefined,
      ended_at: options.ended_at ?? undefined,
      duration_seconds: durationSeconds ?? undefined,
      recording_url: options.recording_url ?? undefined,
      end_reason: options.end_reason ?? undefined,
      ...(transcriptJson ? { transcript: transcriptJson } : {}),
    })
    .eq("id", options.sales_call_id);

  // 3. Analyze with Claude
  let result: SalesCallAnalysis;
  try {
    result = await analyzeSalesCall({
      transcript_messages: options.transcript_messages ?? [],
      transcript_text: options.transcript_text ?? "",
      lead,
      program,
      vapi_end_report: options.vapi_end_report ?? null,
    });
  } catch (e) {
    console.error("[sales-call-analyzer] Claude error:", e);
    return null;
  }

  // 4. Upsert sales_call_analyses (unique on sales_call_id)
  const { data: analysis, error: analysisErr } = await supabase
    .from("sales_call_analyses")
    .upsert({
      sales_call_id: options.sales_call_id,
      meeting_booked: result.meeting_booked,
      meeting_datetime: result.meeting_datetime,
      interest_level: result.interest_level,
      call_rating: result.call_rating,
      sentiment: result.sentiment,
      summary: result.summary,
      objections: result.objections,
      pain_points: result.pain_points,
      next_action: result.next_action,
      next_action_at: result.next_action_at,
      key_quotes: result.key_quotes,
      model_version: "claude-sonnet-4-6",
      analyzed_at: new Date().toISOString(),
    }, { onConflict: "sales_call_id" })
    .select("id")
    .single();

  if (analysisErr || !analysis) {
    console.error("[sales-call-analyzer] analysis upsert error:", analysisErr);
    return null;
  }

  // 5. Propagate status to sales_leads (respecting terminal states upstream is caller's job;
  //    the analyzer only writes based on this call's outcome)
  const newStatus = deriveLeadStatus(result);
  if (newStatus) {
    await supabase
      .from("sales_leads")
      .update({
        status: newStatus,
        ...(result.next_action === "call_back" && result.next_action_at
          ? { next_call_scheduled_at: result.next_action_at }
          : {}),
      })
      .eq("id", call.sales_lead_id);
  }

  return { sales_call_analysis_id: analysis.id };
}
