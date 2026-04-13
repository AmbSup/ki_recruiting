import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TranscriptMessage = {
  role: "user" | "assistant" | string;
  text: string;
};

export type CallAnalysisResult = {
  interview_score: number; // 0–100
  summary: string; // 2–3 sentence overall assessment
  key_insights: string[]; // Positive observations from the call
  red_flags: string[]; // Concerns or negative signals
  recommendation: "strong_yes" | "yes" | "maybe" | "no" | "strong_no";
  criteria_scores: {
    criterion: string;
    score: number; // 0–10
    reasoning: string;
  }[];
};

type JobProfile = {
  title: string;
  requirements: string | null;
  must_qualifications: string | null;
  ko_criteria: string | null;
  hard_skills: string | null;
  soft_skills: string | null;
  ideal_candidate: string | null;
  interview_questions: string[] | null;
};

// ─── Main Analyzer ────────────────────────────────────────────────────────────

export async function analyzeCall(options: {
  transcript_messages: TranscriptMessage[];
  transcript_text: string;
  applicant_name: string;
  summary: string | null;
  job: JobProfile;
}): Promise<CallAnalysisResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const jobContext = [
    `**Stelle:** ${options.job.title}`,
    options.job.ideal_candidate && `**Idealprofil:** ${options.job.ideal_candidate}`,
    options.job.must_qualifications && `**Pflichtqualifikationen:** ${options.job.must_qualifications}`,
    options.job.ko_criteria && `**KO-Kriterien:** ${options.job.ko_criteria}`,
    options.job.hard_skills && `**Fachliche Fähigkeiten:** ${options.job.hard_skills}`,
    options.job.soft_skills && `**Soft Skills:** ${options.job.soft_skills}`,
    options.job.requirements && `**Weitere Anforderungen:** ${options.job.requirements}`,
    options.job.interview_questions?.length &&
      `**Interviewfragen:** ${options.job.interview_questions.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const transcriptFormatted =
    options.transcript_messages.length > 0
      ? options.transcript_messages
          .map((m) => `${m.role === "assistant" ? "KI" : "Bewerber"}: ${m.text}`)
          .join("\n")
      : options.transcript_text || "(kein Transkript verfügbar)";

  const systemPrompt = `Du bist ein erfahrener Recruiting-Experte und analysierst Telefoninterviews.
Antworte IMMER als valides JSON ohne Markdown-Codeblöcke.`;

  const userPrompt = `Analysiere dieses Telefoninterview mit ${options.applicant_name} für folgende Stelle:

${jobContext}

${options.summary ? `**KI-Zusammenfassung des Gesprächs:** ${options.summary}\n` : ""}
**Transkript:**
${transcriptFormatted}

Antworte mit folgendem JSON (kein Markdown, nur reines JSON):
{
  "interview_score": <Zahl 0-100, Gesamteindruck>,
  "summary": "<2-3 Sätze Bewertung auf Deutsch>",
  "key_insights": ["<Positiver Punkt 1>", "<Positiver Punkt 2>", ...],
  "red_flags": ["<Warnsignal 1>", ...],
  "recommendation": "<strong_yes|yes|maybe|no|strong_no>",
  "criteria_scores": [
    { "criterion": "<Kriterium>", "score": <0-10>, "reasoning": "<Begründung>" },
    ...
  ]
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "{}";
  return JSON.parse(text) as CallAnalysisResult;
}

// ─── Persist to DB ────────────────────────────────────────────────────────────

export async function runCallAnalysis(options: {
  application_id: string;
  vapi_call_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  recording_url: string | null;
  transcript_messages: TranscriptMessage[];
  transcript_text: string;
  summary: string | null;
}): Promise<{ voice_call_id: string } | null> {
  const supabase = createAdminClient();

  // 1. Fetch application + job data
  const { data: application } = await supabase
    .from("applications")
    .select(
      "id, applicant_id, job_id, applicants(full_name), jobs(title, requirements, must_qualifications, ko_criteria, hard_skills, soft_skills, ideal_candidate, interview_questions)"
    )
    .eq("id", options.application_id)
    .single();

  if (!application) {
    console.error("[call-analyzer] application not found:", options.application_id);
    return null;
  }

  const jobRaw = application.jobs;
  const job = (Array.isArray(jobRaw) ? jobRaw[0] : jobRaw) as JobProfile | null;
  const applicantRaw = application.applicants;
  const applicantObj = (Array.isArray(applicantRaw) ? applicantRaw[0] : applicantRaw) as { full_name: string | null } | null;
  const applicantName = applicantObj?.full_name ?? "Bewerber";

  // 2. Insert voice_calls record
  const durationSeconds =
    options.started_at && options.ended_at
      ? Math.round(
          (new Date(options.ended_at).getTime() - new Date(options.started_at).getTime()) / 1000
        )
      : null;

  const { data: voiceCall, error: callErr } = await supabase
    .from("voice_calls")
    .insert({
      application_id: options.application_id,
      vapi_call_id: options.vapi_call_id,
      started_at: options.started_at,
      ended_at: options.ended_at,
      duration_seconds: durationSeconds,
      recording_url: options.recording_url,
      status: "completed",
    })
    .select("id")
    .single();

  if (callErr || !voiceCall) {
    console.error("[call-analyzer] voice_calls insert error:", callErr);
    return null;
  }

  // 3. Insert transcript
  const { data: transcript, error: transcriptErr } = await supabase
    .from("transcripts")
    .insert({
      voice_call_id: voiceCall.id,
      full_text: options.transcript_text,
      segments: options.transcript_messages.map((m, i) => ({
        index: i,
        speaker: m.role,
        text: m.text,
      })),
      language: "de",
      model_version: "vapi",
    })
    .select("id")
    .single();

  if (transcriptErr) {
    console.error("[call-analyzer] transcripts insert error:", transcriptErr);
  }

  // 4. Analyze with Claude (only if job data is available)
  if (job) {
    let result: CallAnalysisResult;
    try {
      result = await analyzeCall({
        transcript_messages: options.transcript_messages,
        transcript_text: options.transcript_text,
        applicant_name: applicantName,
        summary: options.summary,
        job,
      });
    } catch (e) {
      console.error("[call-analyzer] Claude error:", e);
      // Update pipeline stage even without analysis
      await supabase
        .from("applications")
        .update({ pipeline_stage: "call_completed" })
        .eq("id", options.application_id);
      return { voice_call_id: voiceCall.id };
    }

    // 5. Insert call_analyses
    const { error: analysisErr } = await supabase.from("call_analyses").insert({
      voice_call_id: voiceCall.id,
      transcript_id: transcript?.id ?? null,
      interview_score: result.interview_score,
      criteria_scores: result.criteria_scores,
      key_insights: result.key_insights,
      red_flags: result.red_flags,
      summary: result.summary,
      recommendation: result.recommendation,
      model_version: "claude-sonnet-4-6",
    });
    if (analysisErr) console.error("[call-analyzer] call_analyses insert error:", analysisErr);

    // 6. Update application pipeline stage
    const { error: updateErr } = await supabase
      .from("applications")
      .update({ pipeline_stage: "evaluated" })
      .eq("id", options.application_id);
    if (updateErr) console.error("[call-analyzer] application update error:", updateErr);
  } else {
    // No job data — still update stage
    await supabase
      .from("applications")
      .update({ pipeline_stage: "call_completed" })
      .eq("id", options.application_id);
  }

  return { voice_call_id: voiceCall.id };
}
