import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  ApplicantReportPDF,
  ApplicantReportData,
} from "@/components/operator/applicant-report-pdf";

export const maxDuration = 60;
// React-PDF nutzt Buffer/Stream APIs — kein Edge.
export const runtime = "nodejs";

// Walk pages.blocks (recursiv durch box children) und baut value→label-Maps
// pro Frage UND pro block.id. Gleiche Logik wie src/app/api/apply/route.ts
// resolveAnswerLabels und applicants/[id]/page.tsx walk() — bewusst dupliziert
// damit die PDF-Route nicht von Apply/Page abhängt.
function buildLabelMaps(pages: Array<{ blocks?: unknown }>) {
  const questionByBlockId: Record<string, string> = {};
  const labelsByQuestion: Record<string, Record<string, string>> = {};
  const labelsByBlockId: Record<string, Record<string, string>> = {};

  const walk = (blocks: Array<{ id?: string; content?: Record<string, unknown> }>) => {
    for (const b of blocks ?? []) {
      const id = b.id;
      const content = (b.content ?? {}) as Record<string, unknown>;
      const question = typeof content.question === "string" ? content.question : "";
      const items = Array.isArray(content.items)
        ? (content.items as Array<{ value?: string; label?: string }>)
        : [];
      if (id && question) questionByBlockId[id] = question;
      for (const it of items) {
        if (typeof it.value !== "string" || typeof it.label !== "string") continue;
        if (question) {
          if (!labelsByQuestion[question]) labelsByQuestion[question] = {};
          labelsByQuestion[question][it.value] = it.label;
        }
        if (id) {
          if (!labelsByBlockId[id]) labelsByBlockId[id] = {};
          labelsByBlockId[id][it.value] = it.label;
        }
      }
      const children = Array.isArray(content.children)
        ? (content.children as Array<{ id?: string; content?: Record<string, unknown> }>)
        : [];
      if (children.length) walk(children);
    }
  };
  for (const p of pages) {
    walk(((p.blocks ?? []) as Array<{ id?: string; content?: Record<string, unknown> }>));
  }
  return { questionByBlockId, labelsByQuestion, labelsByBlockId };
}

function sanitizeFilename(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

// Top-3-Quotes pro Call: bevorzuge Bewerber-Aussagen (speaker = "user" /
// "candidate") über AI-Aussagen, weil der Kunde wissen will wie der Bewerber
// SELBST geantwortet hat. Cap auf je 200 Zeichen.
type Segment = { index: number; speaker: string; text: string };

function pickTopQuotes(segments: Segment[] | null | undefined): { speaker: string; text: string }[] {
  if (!Array.isArray(segments) || segments.length === 0) return [];
  const isCandidate = (sp: string) => {
    const s = sp.toLowerCase();
    return s.includes("user") || s.includes("candidate") || s.includes("bewerber") || s.includes("kandidat");
  };
  const candidate = segments.filter((s) => typeof s.text === "string" && s.text.trim().length > 30 && isCandidate(s.speaker ?? ""));
  const pool = candidate.length >= 3 ? candidate : segments.filter((s) => typeof s.text === "string" && s.text.trim().length > 30);
  // Längste Segments → meistens substanzielle Aussagen
  const top = [...pool]
    .sort((a, b) => (b.text?.length ?? 0) - (a.text?.length ?? 0))
    .slice(0, 3)
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return top.map((s) => ({
    speaker: isCandidate(s.speaker ?? "") ? "Bewerber" : "Interviewer",
    text: s.text.trim().slice(0, 200) + (s.text.trim().length > 200 ? "…" : ""),
  }));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("applications")
    .select(`
      id, funnel_id, source, applied_at, overall_score, score_breakdown, funnel_responses,
      job:jobs(
        id, title,
        company:companies(name, primary_color)
      ),
      funnel:funnels(name),
      applicant:applicants(full_name, email, phone, cv_file_url),
      cv_analyses(match_score, summary, strengths, gaps, structured_data, analyzed_at),
      voice_calls(
        started_at, duration_seconds,
        transcripts(segments),
        call_analyses(interview_score, recommendation, summary, key_insights, analyzed_at)
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Bewerbung nicht gefunden" },
      { status: 404 },
    );
  }

  // Funnel-Pages für Label-Resolution (gleiche Quelle wie Page)
  let labelMaps = { questionByBlockId: {} as Record<string, string>, labelsByQuestion: {} as Record<string, Record<string, string>>, labelsByBlockId: {} as Record<string, Record<string, string>> };
  if (data.funnel_id) {
    const { data: pagesData } = await supabase
      .from("funnel_pages")
      .select("blocks")
      .eq("funnel_id", data.funnel_id)
      .order("page_order");
    labelMaps = buildLabelMaps((pagesData ?? []) as Array<{ blocks?: unknown }>);
  }

  // Joins kommen je nach PostgREST-Auflösung als Array oder Objekt zurück.
  // `applications.job` ist eine to-one-Relation, aber der Generator typt sie
  // als Array. Wir normalisieren defensiv.
  const job = Array.isArray(data.job) ? data.job[0] : (data.job as Record<string, unknown> | null);
  const company = job ? (Array.isArray((job as { company?: unknown }).company) ? (job as { company: unknown[] }).company[0] : (job as { company?: unknown }).company) : null;
  const funnel = Array.isArray(data.funnel) ? data.funnel[0] : (data.funnel as Record<string, unknown> | null);
  const applicant = Array.isArray(data.applicant) ? data.applicant[0] : (data.applicant as Record<string, unknown> | null);

  if (!job || !applicant) {
    return NextResponse.json({ error: "Job oder Bewerber-Stammdaten fehlen" }, { status: 500 });
  }

  // Latest CV-Analyse (Sortierung clientseitig, Schema hat keinen ORDER hier)
  const cvAnalyses = (Array.isArray(data.cv_analyses) ? data.cv_analyses : []) as Array<{
    match_score: number | null;
    summary: string | null;
    strengths: string[] | null;
    gaps: string[] | null;
    structured_data: { skills?: string[]; years_experience?: number | null; education?: string | null; languages?: string[] } | null;
    analyzed_at: string | null;
  }>;
  const cv = cvAnalyses
    .slice()
    .sort((a, b) => new Date(b.analyzed_at ?? 0).getTime() - new Date(a.analyzed_at ?? 0).getTime())[0] ?? null;

  // Voice-Calls + neueste Analyse pro Call extrahieren.
  const voiceCalls = (Array.isArray(data.voice_calls) ? data.voice_calls : []) as Array<{
    started_at: string | null;
    duration_seconds: number | null;
    transcripts: Array<{ segments: Segment[] | null }> | null;
    call_analyses: Array<{
      interview_score: number | null;
      recommendation: string | null;
      summary: string | null;
      key_insights: string[] | null;
      analyzed_at: string | null;
    }> | null;
  }>;

  const reportCalls = voiceCalls
    .map((vc) => {
      const analyses = (vc.call_analyses ?? []).slice().sort(
        (a, b) => new Date(b.analyzed_at ?? 0).getTime() - new Date(a.analyzed_at ?? 0).getTime(),
      );
      const a = analyses[0];
      // Quotes: alle transcript-Segmente flach + Top-3 picken
      const allSegments = (vc.transcripts ?? [])
        .flatMap((t) => (Array.isArray(t.segments) ? t.segments : []));
      return {
        started_at: vc.started_at,
        duration_seconds: vc.duration_seconds,
        interview_score: a?.interview_score ?? null,
        recommendation: a?.recommendation ?? null,
        summary: a?.summary ?? null,
        key_insights: a?.key_insights ?? [],
        quotes: pickTopQuotes(allSegments),
        // Calls ohne Analyse oder ohne Inhalt überspringen wir gleich.
        _hasContent: Boolean(a?.summary || (a?.key_insights ?? []).length || allSegments.length),
      };
    })
    .filter((c) => c._hasContent)
    .sort((a, b) => new Date(a.started_at ?? 0).getTime() - new Date(b.started_at ?? 0).getTime())
    .map((c) => {
      const { _hasContent, ...rest } = c;
      void _hasContent;
      return rest;
    });

  // Funnel-QA mit aufgelösten Labels + lesbarer Frage
  const funnelResponses = (data.funnel_responses ?? {}) as Record<string, unknown>;
  const funnelQa = Object.entries(funnelResponses).map(([key, raw]) => {
    const question = labelMaps.questionByBlockId[key] || key;
    const labelMap = labelMaps.labelsByQuestion[key] ?? labelMaps.labelsByBlockId[key] ?? {};
    const arr = Array.isArray(raw) ? (raw as unknown[]) : [raw];
    const answers = arr
      .filter((v) => typeof v === "string")
      .map((v) => labelMap[v as string] ?? (v as string));
    return { question, answers };
  });

  const reportData: ApplicantReportData = {
    job_title: (job as { title?: string }).title ?? "Stelle",
    company_name: (company as { name?: string } | null)?.name ?? "—",
    primary_color: (company as { primary_color?: string | null } | null)?.primary_color ?? null,
    applicant: {
      full_name: (applicant as { full_name?: string }).full_name ?? "—",
      email: (applicant as { email?: string }).email ?? "—",
      phone: (applicant as { phone?: string | null }).phone ?? null,
      cv_file_url: (applicant as { cv_file_url?: string | null }).cv_file_url ?? null,
    },
    funnel_name: (funnel as { name?: string } | null)?.name ?? null,
    source: data.source ?? "direct",
    applied_at: data.applied_at ?? new Date().toISOString(),
    overall_score: data.overall_score ?? null,
    score_breakdown: data.score_breakdown ?? null,
    cv_analysis: cv
      ? {
          summary: cv.summary,
          strengths: cv.strengths ?? [],
          gaps: cv.gaps ?? [],
          structured: {
            skills: cv.structured_data?.skills ?? [],
            years_experience: cv.structured_data?.years_experience ?? null,
            education: cv.structured_data?.education ?? null,
            languages: cv.structured_data?.languages ?? [],
          },
        }
      : null,
    funnel_qa: funnelQa,
    voice_calls: reportCalls,
    generated_at: new Date().toISOString(),
  };

  const buffer = await renderToBuffer(<ApplicantReportPDF data={reportData} />);

  const filename = `${sanitizeFilename(reportData.applicant.full_name)}_${sanitizeFilename(reportData.job_title)}_Report.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
