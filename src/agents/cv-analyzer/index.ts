import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CvAnalysisResult = {
  match_score: number;          // 0–100
  summary: string;              // 2–3 sentence overall assessment
  strengths: string[];          // What matches the job profile well
  gaps: string[];               // What's missing vs. ideal profile
  structured_data: {
    skills: string[];
    years_experience: number | null;
    education: string | null;
    languages: string[];
  };
  score_breakdown: {
    hard_skills: number;        // 0–100
    soft_skills: number;        // 0–100
    experience: number;         // 0–100
    education: number;          // 0–100
    ko_criteria_passed: boolean;
  };
};

type JobProfile = {
  title: string;
  requirements: string | null;
  must_qualifications: string | null;
  nice_to_have_qualifications: string | null;
  ko_criteria: string | null;
  hard_skills: string | null;
  soft_skills: string | null;
  ideal_candidate: string | null;
  scoring_criteria: { criterion: string; weight: number }[];
};

// ─── Main Analyzer ────────────────────────────────────────────────────────────

export async function analyzeCv(options: {
  application_id: string;
  cv_file_url: string | null;
  applicant_name: string;
  job: JobProfile;
}): Promise<CvAnalysisResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  // Build the job profile context
  const jobContext = [
    `**Stelle:** ${options.job.title}`,
    options.job.ideal_candidate && `**Idealprofil:** ${options.job.ideal_candidate}`,
    options.job.must_qualifications && `**Pflichtqualifikationen:** ${options.job.must_qualifications}`,
    options.job.ko_criteria && `**KO-Kriterien (Ausschlussgründe):** ${options.job.ko_criteria}`,
    options.job.hard_skills && `**Fachliche Fähigkeiten:** ${options.job.hard_skills}`,
    options.job.soft_skills && `**Soft Skills:** ${options.job.soft_skills}`,
    options.job.nice_to_have_qualifications && `**Wäre toll:** ${options.job.nice_to_have_qualifications}`,
    options.job.requirements && `**Weitere Anforderungen:** ${options.job.requirements}`,
  ].filter(Boolean).join("\n");

  const systemPrompt = `Du bist ein erfahrener HR-Spezialist und ATS-Experte.
Analysiere Bewerbungsunterlagen objektiv und strukturiert.
Antworte IMMER als valides JSON ohne Markdown-Codeblöcke.`;

  let cvContent: Anthropic.MessageParam["content"];

  if (options.cv_file_url) {
    // Try to fetch and analyze the actual CV file
    try {
      const response = await fetch(options.cv_file_url);
      const contentType = response.headers.get("content-type") ?? "";
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      if (contentType.includes("pdf")) {
        cvContent = [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          } as Anthropic.DocumentBlockParam,
          {
            type: "text",
            text: `Analysiere diesen Lebenslauf von ${options.applicant_name} für die folgende Stelle:\n\n${jobContext}\n\n${analysisInstructions()}`,
          },
        ];
      } else if (contentType.includes("image")) {
        const mediaType = contentType.includes("png") ? "image/png" :
                          contentType.includes("jpg") || contentType.includes("jpeg") ? "image/jpeg" : "image/png";
        cvContent = [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType as "image/png" | "image/jpeg", data: base64 },
          },
          {
            type: "text",
            text: `Analysiere diesen Lebenslauf von ${options.applicant_name} für die folgende Stelle:\n\n${jobContext}\n\n${analysisInstructions()}`,
          },
        ];
      } else {
        throw new Error("Unsupported file type");
      }
    } catch {
      // Fallback: analyze without CV file
      cvContent = [{
        type: "text",
        text: `Bewerber: ${options.applicant_name}
Hinweis: CV konnte nicht geladen werden. Führe eine Basis-Analyse durch.

Stelle:\n${jobContext}\n\n${analysisInstructions()}`,
      }];
    }
  } else {
    // No CV uploaded — analyze based on name/funnel responses only
    cvContent = [{
      type: "text",
      text: `Bewerber: ${options.applicant_name}
Hinweis: Kein Lebenslauf vorhanden. Bewerte mit niedrigem Score und weise auf fehlende Unterlagen hin.

Stelle:\n${jobContext}\n\n${analysisInstructions()}`,
    }];
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: cvContent }],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "{}";
  const result = JSON.parse(text) as CvAnalysisResult;

  return result;
}

function analysisInstructions(): string {
  return `Antworte mit folgendem JSON (keine Markdown-Blöcke, nur reines JSON):
{
  "match_score": <Zahl 0-100, wie gut passt der Bewerber zur Stelle>,
  "summary": "<2-3 Sätze Gesamtbewertung auf Deutsch>",
  "strengths": ["<Stärke 1>", "<Stärke 2>", ...],
  "gaps": ["<Lücke/Fehlendes 1>", "<Lücke 2>", ...],
  "structured_data": {
    "skills": ["<Skill 1>", ...],
    "years_experience": <Zahl oder null>,
    "education": "<höchster Abschluss oder null>",
    "languages": ["<Sprache 1>", ...]
  },
  "score_breakdown": {
    "hard_skills": <0-100>,
    "soft_skills": <0-100>,
    "experience": <0-100>,
    "education": <0-100>,
    "ko_criteria_passed": <true wenn keine KO-Kriterien verletzt wurden>
  }
}`;
}

// ─── Persist to DB ────────────────────────────────────────────────────────────

export async function runCvAnalysis(options: {
  application_id: string;
  applicant_name: string;
  cv_file_url: string | null;
  job: JobProfile;
}): Promise<void> {
  const supabase = createAdminClient();

  let result: CvAnalysisResult;
  try {
    result = await analyzeCv(options);
  } catch (e) {
    console.error("[cv-analyzer] Claude error:", e);
    return;
  }

  // Save cv_analysis record
  await supabase.from("cv_analyses").insert({
    application_id: options.application_id,
    raw_text: null,
    structured_data: result.structured_data,
    match_score: result.match_score,
    strengths: result.strengths,
    gaps: result.gaps,
    summary: result.summary,
    model_version: "claude-sonnet-4-6",
  });

  // Update application: overall_score, score_breakdown, pipeline_stage
  await supabase.from("applications").update({
    overall_score: result.match_score,
    score_breakdown: result.score_breakdown,
    pipeline_stage: "cv_analyzed",
  }).eq("id", options.application_id);
}
