"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type ScoreBreakdown = {
  hard_skills: number;
  soft_skills: number;
  experience: number;
  education: number;
  ko_criteria_passed: boolean;
};

type ApplicationDetail = {
  id: string;
  pipeline_stage: string;
  overall_score: number | null;
  score_breakdown: ScoreBreakdown | null;
  customer_decision: string;
  operator_notes: string | null;
  funnel_responses: Record<string, string[]>;
  source: string;
  utm_params: Record<string, string> | null;
  applied_at: string;
  job: {
    id: string;
    title: string;
    requirements: string | null;
    must_qualifications: string | null;
    nice_to_have_qualifications: string | null;
    ko_criteria: string | null;
    hard_skills: string | null;
    soft_skills: string | null;
    ideal_candidate: string | null;
    company: { name: string; primary_color: string | null };
  };
  funnel: { name: string; slug: string } | null;
  applicant: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    cv_file_url: string | null;
    consent_given_at: string | null;
  };
  cv_analyses: {
    id: string;
    match_score: number | null;
    strengths: string[];
    gaps: string[];
    summary: string | null;
    structured_data: {
      skills?: string[];
      years_experience?: number | null;
      education?: string | null;
      languages?: string[];
    };
    analyzed_at: string;
    model_version: string | null;
  }[];
  voice_calls: {
    id: string;
    status: string;
    started_at: string | null;
    scheduled_at: string | null;
    duration_seconds: number | null;
    recording_url: string | null;
    transcripts: {
      id: string;
      full_text: string | null;
      segments: { index: number; speaker: string; text: string }[];
      transcribed_at: string;
    }[];
    call_analyses: {
      id: string;
      interview_score: number | null;
      recommendation: string | null;
      summary: string | null;
      key_insights: string[];
      red_flags: string[];
      criteria_scores: { criterion: string; score: number; reasoning: string }[];
      analyzed_at: string;
      model_version: string | null;
    }[];
  }[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const stages = [
  "new", "cv_analyzed", "call_scheduled", "call_completed",
  "evaluated", "presented", "accepted", "rejected",
] as const;

const stageConfig: Record<string, { label: string; icon: string; color: string }> = {
  new:            { label: "Neu",            icon: "inbox",         color: "text-on-surface-variant" },
  cv_analyzed:    { label: "CV analysiert",  icon: "description",   color: "text-tertiary" },
  call_scheduled: { label: "Call geplant",   icon: "schedule",      color: "text-primary" },
  call_completed: { label: "Call fertig",    icon: "call",          color: "text-primary" },
  evaluated:      { label: "Bewertet",       icon: "star",          color: "text-primary" },
  presented:      { label: "Freigegeben",    icon: "visibility",    color: "text-primary" },
  accepted:       { label: "Akzeptiert",     icon: "check_circle",  color: "text-primary" },
  rejected:       { label: "Abgelehnt",      icon: "cancel",        color: "text-error" },
};

const sourceLabels: Record<string, string> = {
  facebook: "Facebook Ads", instagram: "Instagram Ads",
  linkedin: "LinkedIn", direct: "Direkt", referral: "Empfehlung",
};

const recommendationConfig: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  strong_yes: { label: "Starkes Ja",   bg: "bg-primary-container",      text: "text-on-primary-container", icon: "thumb_up" },
  yes:        { label: "Ja",           bg: "bg-primary-container/60",    text: "text-on-primary-container", icon: "check_circle" },
  maybe:      { label: "Vielleicht",   bg: "bg-tertiary-container/50",   text: "text-on-tertiary-container", icon: "help" },
  no:         { label: "Nein",         bg: "bg-error-container/40",      text: "text-error",                icon: "cancel" },
  strong_no:  { label: "Starkes Nein", bg: "bg-error-container/70",      text: "text-error",                icon: "thumb_down" },
};

function formatDuration(s: number | null) {
  if (!s) return "—";
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")} min`;
}

function ScoreRing({ score }: { score: number | null }) {
  const val = score ?? 0;
  const color = val >= 75 ? "#4CAF50" : val >= 50 ? "#FF9800" : "#F44336";
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (val / 100) * circ;
  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-outline-variant/20" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <div className="font-headline text-2xl leading-none text-on-surface">{score ?? "—"}</div>
        {score !== null && <div className="font-label text-[9px] text-outline mt-0.5">/ 100</div>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [analysingCv, setAnalysingCv] = useState(false);
  const [stageSaving, setStageSaving] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState<Record<string, boolean>>({});
  const supabase = createClient();

  async function loadApp() {
    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        job:jobs(
          id, title, requirements,
          must_qualifications, nice_to_have_qualifications,
          ko_criteria, hard_skills, soft_skills, ideal_candidate,
          company:companies(name, primary_color)
        ),
        funnel:funnels(name, slug),
        applicant:applicants(id, full_name, email, phone, cv_file_url, consent_given_at),
        cv_analyses(*),
        voice_calls(*, transcripts(*), call_analyses(*))
      `)
      .eq("id", id)
      .single();
    if (error) {
      console.error("[applicant detail] query error:", error);
      setQueryError(error.message);
    }
    if (data) {
      setApp(data as unknown as ApplicationDetail);
      setNotes(data.operator_notes ?? "");
    }
    setLoading(false);
  }

  useEffect(() => { loadApp(); }, [id]);

  async function updateStage(stage: string) {
    setStageSaving(true);
    await supabase.from("applications").update({ pipeline_stage: stage }).eq("id", id);
    setApp((prev) => prev ? { ...prev, pipeline_stage: stage } : prev);
    setStageSaving(false);
  }

  async function saveNotes() {
    setSavingNotes(true);
    await supabase.from("applications").update({ operator_notes: notes }).eq("id", id);
    setSavingNotes(false);
  }

  async function releaseToPortal() {
    await supabase.from("applications").update({
      customer_decision: "pending", pipeline_stage: "presented",
    }).eq("id", id);
    setApp((prev) => prev ? { ...prev, customer_decision: "pending", pipeline_stage: "presented" } : prev);
  }

  async function quickDecision(decision: "accepted" | "rejected") {
    await supabase.from("applications").update({ pipeline_stage: decision }).eq("id", id);
    setApp((prev) => prev ? { ...prev, pipeline_stage: decision } : prev);
  }

  async function startCvAnalysis() {
    setAnalysingCv(true);
    try {
      await fetch("/api/cv-analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: id }),
      });
      await loadApp();
    } finally {
      setAnalysingCv(false);
    }
  }

  // ─── Loading / Not Found ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-3xl text-outline animate-spin">progress_activity</span>
      </div>
    );
  }
  if (!app) {
    return (
      <div className="px-8 pt-10 space-y-2">
        <p className="font-body text-on-surface-variant">Bewerbung nicht gefunden.</p>
        {queryError && (
          <p className="font-body text-xs text-error bg-error-container/20 px-3 py-2 rounded-lg">
            Fehler: {queryError}
          </p>
        )}
        <p className="font-label text-[10px] text-outline">ID: {id}</p>
      </div>
    );
  }

  const cvAnalysis = app.cv_analyses[0] ?? null;
  const stageIndex = stages.indexOf(app.pipeline_stage as typeof stages[number]);
  const initials = app.applicant.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const isRejected = app.pipeline_stage === "rejected";
  const isAccepted = app.pipeline_stage === "accepted";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="px-8 pt-10 pb-32 max-w-[1400px]">

      {/* Back */}
      <Link href="/applicants"
        className="inline-flex items-center gap-1.5 text-outline hover:text-on-surface transition-colors mb-8">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span className="font-label text-[10px] font-bold uppercase tracking-widest">Bewerber-Pipeline</span>
      </Link>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-5 mb-6">

        {/* Person card */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${
              isRejected ? "bg-error-container text-error" :
              isAccepted ? "bg-primary-container text-on-primary-container" :
              "bg-primary-container text-on-primary-container"
            }`}>
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <h1 className="font-headline text-4xl italic text-on-surface leading-none">
                  {app.applicant.full_name}
                </h1>
                {/* Status badge */}
                <span className={`flex-shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full font-label text-[10px] font-bold uppercase tracking-widest ${
                  isAccepted ? "bg-primary-container text-on-primary-container" :
                  isRejected ? "bg-error-container/30 text-error" :
                  "bg-surface-container text-on-surface-variant"
                }`}>
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {stageConfig[app.pipeline_stage]?.icon ?? "radio_button_checked"}
                  </span>
                  {stageConfig[app.pipeline_stage]?.label ?? app.pipeline_stage}
                </span>
              </div>

              <p className="font-label text-xs text-outline mb-4">
                {app.job.title} · {app.job.company.name}
              </p>

              {/* Contact + Meta */}
              <div className="flex flex-wrap gap-3">
                <a href={`mailto:${app.applicant.email}`}
                  className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-outline-variant text-sm">mail</span>
                  {app.applicant.email}
                </a>
                {app.applicant.phone && (
                  <a href={`tel:${app.applicant.phone}`}
                    className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-outline-variant text-sm">phone</span>
                    {app.applicant.phone}
                  </a>
                )}
                <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-outline-variant text-sm">ads_click</span>
                  {sourceLabels[app.source] ?? app.source}
                </div>
                <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-outline-variant text-sm">event</span>
                  {new Date(app.applied_at).toLocaleDateString("de-AT", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </div>
                {app.funnel && (
                  <Link href={`/funnels/${app.funnel.slug}`}
                    className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-outline-variant text-sm">dynamic_feed</span>
                    {app.funnel.name}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Consent */}
          {app.applicant.consent_given_at && (
            <div className="mt-4 pt-4 border-t border-outline-variant/10 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <span className="font-label text-[10px] text-outline">
                DSGVO-Einwilligung erteilt am {new Date(app.applicant.consent_given_at).toLocaleDateString("de-AT")}
              </span>
            </div>
          )}
        </div>

        {/* Score + Actions */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] flex flex-col gap-4">
          {/* Score ring */}
          <div className="flex items-center gap-4">
            <ScoreRing score={app.overall_score} />
            <div>
              <div className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-1">
                Gesamt-Score
              </div>
              {app.overall_score !== null && (
                <div className={`font-label text-xs font-bold ${
                  app.overall_score >= 75 ? "text-primary" :
                  app.overall_score >= 50 ? "text-tertiary" : "text-error"
                }`}>
                  {app.overall_score >= 75 ? "Sehr gut" :
                   app.overall_score >= 50 ? "Geeignet" : "Schwach"}
                </div>
              )}
              {app.applicant.cv_file_url && (
                <a href={app.applicant.cv_file_url} target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 font-label text-[10px] text-outline hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-xs">download</span>
                  CV herunterladen
                </a>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 mt-auto">
            {!isAccepted && !isRejected && (
              <button onClick={releaseToPortal}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
                <span className="material-symbols-outlined text-sm">visibility</span>
                An Kundenportal freigeben
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => quickDecision("accepted")}
                disabled={isAccepted}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  isAccepted
                    ? "bg-primary-container text-on-primary-container cursor-default"
                    : "border border-outline-variant/30 text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container hover:border-transparent"
                }`}>
                <span className="material-symbols-outlined text-xs">check_circle</span>
                Annehmen
              </button>
              <button onClick={() => quickDecision("rejected")}
                disabled={isRejected}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  isRejected
                    ? "bg-error-container/30 text-error cursor-default"
                    : "border border-outline-variant/30 text-on-surface-variant hover:bg-error-container/30 hover:text-error hover:border-transparent"
                }`}>
                <span className="material-symbols-outlined text-xs">cancel</span>
                Ablehnen
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pipeline Stepper ──────────────────────────────────────────────── */}
      <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Pipeline-Status</span>
          {stageSaving && (
            <span className="flex items-center gap-1 font-label text-[10px] text-outline">
              <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
              Speichert…
            </span>
          )}
        </div>
        <div className="flex items-center overflow-x-auto pb-1">
          {stages.map((stage, i) => {
            const isActive = stage === app.pipeline_stage;
            const isPast = i < stageIndex;
            const cfg = stageConfig[stage];
            return (
              <div key={stage} className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => updateStage(stage)}
                  title={cfg.label}
                  className={`flex flex-col items-center gap-1.5 px-2 py-2 rounded-xl transition-all flex-1 min-w-[70px] ${
                    isActive
                      ? stage === "rejected"
                        ? "bg-error-container/20 text-error"
                        : "bg-primary-container text-on-primary-container"
                      : isPast
                      ? "text-primary hover:bg-primary-container/20"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                    isActive
                      ? stage === "rejected" ? "border-error bg-error" : "border-primary bg-primary"
                      : isPast ? "border-primary bg-primary"
                      : "border-outline-variant/40"
                  }`}>
                    {(isActive || isPast) ? (
                      <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isPast && !isActive ? "check" : cfg.icon}
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-outline-variant text-xs">{cfg.icon}</span>
                    )}
                  </div>
                  <span className="font-label text-[9px] font-bold uppercase tracking-widest text-center leading-tight">
                    {cfg.label}
                  </span>
                </button>
                {i < stages.length - 1 && (
                  <div className={`h-0.5 w-3 flex-shrink-0 rounded-full mx-0.5 transition-colors ${
                    i < stageIndex ? "bg-primary" : "bg-outline-variant/20"
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-5">

        {/* ── Left: CV Analysis ────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-7 space-y-5">

          {/* CV Analysis Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">KI CV-Analyse</h3>
                {cvAnalysis?.analyzed_at && (
                  <p className="font-label text-[10px] text-outline mt-0.5">
                    Analysiert am {new Date(cvAnalysis.analyzed_at).toLocaleDateString("de-AT")}
                    {cvAnalysis.model_version ? ` · ${cvAnalysis.model_version}` : ""}
                  </p>
                )}
              </div>
              <button
                onClick={startCvAnalysis}
                disabled={analysingCv}
                className="flex items-center gap-1.5 bg-primary text-on-primary px-3 py-1.5 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-60"
              >
                {analysingCv
                  ? <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                  : <span className="material-symbols-outlined text-xs">psychology</span>}
                {analysingCv ? "Analysiere…" : cvAnalysis ? "Neu analysieren" : "Analyse starten"}
              </button>
            </div>

            {cvAnalysis ? (
              <div className="space-y-6">

                {/* Match Score + KO */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-label text-xs font-semibold text-on-surface">Match-Score</span>
                    <span className="font-headline text-2xl text-on-surface">{cvAnalysis.match_score ?? "—"}%</span>
                  </div>
                  <div className="w-full bg-outline-variant/20 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        (cvAnalysis.match_score ?? 0) >= 75 ? "bg-primary" :
                        (cvAnalysis.match_score ?? 0) >= 50 ? "bg-tertiary" : "bg-error"
                      }`}
                      style={{ width: `${cvAnalysis.match_score ?? 0}%` }}
                    />
                  </div>
                  {app.score_breakdown && (
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label text-[10px] font-bold ${
                      app.score_breakdown.ko_criteria_passed
                        ? "bg-primary-container/40 text-on-primary-container"
                        : "bg-error-container/40 text-error"
                    }`}>
                      <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {app.score_breakdown.ko_criteria_passed ? "check_circle" : "cancel"}
                      </span>
                      KO-Kriterien: {app.score_breakdown.ko_criteria_passed ? "Bestanden" : "Nicht bestanden"}
                    </div>
                  )}
                </div>

                {/* Score Breakdown */}
                {app.score_breakdown && (
                  <div>
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-3">
                      Score-Aufschlüsselung
                    </span>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                      {(["hard_skills", "soft_skills", "experience", "education"] as const).map((key) => {
                        const labels = {
                          hard_skills: "Fachkenntnisse",
                          soft_skills: "Soft Skills",
                          experience: "Berufserfahrung",
                          education: "Ausbildung",
                        };
                        const val = app.score_breakdown?.[key] ?? 0;
                        return (
                          <div key={key}>
                            <div className="flex justify-between mb-1">
                              <span className="font-label text-[10px] text-on-surface-variant">{labels[key]}</span>
                              <span className="font-label text-[10px] font-bold text-on-surface">{val}%</span>
                            </div>
                            <div className="w-full bg-outline-variant/20 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  val >= 75 ? "bg-primary" : val >= 50 ? "bg-tertiary" : "bg-error/60"
                                }`}
                                style={{ width: `${val}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {cvAnalysis.summary && (
                  <div className="bg-surface-container-low rounded-xl p-4">
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
                      KI-Zusammenfassung
                    </span>
                    <p className="font-body text-sm text-on-surface leading-relaxed">{cvAnalysis.summary}</p>
                  </div>
                )}

                {/* Strengths & Gaps */}
                <div className="grid grid-cols-2 gap-4">
                  {cvAnalysis.strengths?.length > 0 && (
                    <div>
                      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
                        Stärken
                      </span>
                      <ul className="space-y-2">
                        {cvAnalysis.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary text-sm mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                              check_circle
                            </span>
                            <span className="font-body text-xs text-on-surface leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cvAnalysis.gaps?.length > 0 && (
                    <div>
                      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
                        Lücken
                      </span>
                      <ul className="space-y-2">
                        {cvAnalysis.gaps.map((g, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-error text-sm mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                              warning
                            </span>
                            <span className="font-body text-xs text-on-surface leading-relaxed">{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Structured Data */}
                {cvAnalysis.structured_data && (
                  <div className="border-t border-outline-variant/10 pt-4 grid grid-cols-3 gap-4">
                    <div>
                      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-1.5">
                        Erfahrung
                      </span>
                      <span className="font-headline text-xl text-on-surface">
                        {cvAnalysis.structured_data.years_experience != null
                          ? `${cvAnalysis.structured_data.years_experience} J.`
                          : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-1.5">
                        Ausbildung
                      </span>
                      <span className="font-body text-xs text-on-surface">
                        {cvAnalysis.structured_data.education ?? "—"}
                      </span>
                    </div>
                    {cvAnalysis.structured_data.languages?.length ? (
                      <div>
                        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-1.5">
                          Sprachen
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {cvAnalysis.structured_data.languages.map((l) => (
                            <span key={l} className="bg-tertiary-container/30 text-on-tertiary-container px-2 py-0.5 rounded-full font-label text-[10px] font-bold">
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Skills */}
                {cvAnalysis.structured_data?.skills?.length ? (
                  <div>
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
                      Erkannte Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cvAnalysis.structured_data.skills.map((s) => (
                        <span key={s} className="bg-surface-container px-2.5 py-1 rounded-full font-label text-[10px] font-bold text-on-surface-variant">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-outline-variant">psychology</span>
                </div>
                <div>
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-1">
                    Noch keine Analyse
                  </p>
                  <p className="font-body text-sm text-on-surface-variant">
                    {app.applicant.cv_file_url
                      ? "Lebenslauf liegt vor — Analyse starten."
                      : "Kein Lebenslauf vorhanden — Analyse trotzdem möglich."}
                  </p>
                </div>
                {app.applicant.cv_file_url && (
                  <a
                    href={app.applicant.cv_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors font-label text-xs font-bold"
                  >
                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                    Lebenslauf öffnen
                  </a>
                )}
                <button
                  onClick={startCvAnalysis}
                  disabled={analysingCv}
                  className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-60"
                >
                  {analysingCv
                    ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    : <span className="material-symbols-outlined text-sm">psychology</span>}
                  {analysingCv ? "Analysiere…" : "Analyse starten"}
                </button>
              </div>
            )}
          </div>

          {/* Gap Analysis: Idealprofil vs. Bewerber */}
          {(app.job.ideal_candidate || app.job.must_qualifications || app.job.ko_criteria || app.job.hard_skills) && (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
              <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-5">
                Profil-Anforderungen
              </h3>
              <div className="space-y-4">
                {app.job.ideal_candidate && (
                  <div className="bg-primary-container/10 rounded-xl p-4">
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
                      Idealprofil
                    </span>
                    <p className="font-body text-sm text-on-surface leading-relaxed">{app.job.ideal_candidate}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {app.job.must_qualifications && (
                    <div>
                      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
                        Pflichtqualifikationen
                      </span>
                      <p className="font-body text-xs text-on-surface-variant leading-relaxed whitespace-pre-line">
                        {app.job.must_qualifications}
                      </p>
                    </div>
                  )}
                  {app.job.nice_to_have_qualifications && (
                    <div>
                      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
                        Wäre toll
                      </span>
                      <p className="font-body text-xs text-on-surface-variant leading-relaxed whitespace-pre-line">
                        {app.job.nice_to_have_qualifications}
                      </p>
                    </div>
                  )}
                  {app.job.hard_skills && (
                    <div>
                      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
                        Fachliche Skills
                      </span>
                      <p className="font-body text-xs text-on-surface-variant leading-relaxed whitespace-pre-line">
                        {app.job.hard_skills}
                      </p>
                    </div>
                  )}
                  {app.job.soft_skills && (
                    <div>
                      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
                        Soft Skills
                      </span>
                      <p className="font-body text-xs text-on-surface-variant leading-relaxed whitespace-pre-line">
                        {app.job.soft_skills}
                      </p>
                    </div>
                  )}
                </div>
                {app.job.ko_criteria && (
                  <div className="bg-error-container/10 rounded-xl p-4">
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-error block mb-2">
                      KO-Kriterien (Ausschlussgründe)
                    </span>
                    <p className="font-body text-sm text-on-surface leading-relaxed whitespace-pre-line">
                      {app.job.ko_criteria}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column ─────────────────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-5 space-y-5">

          {/* Voice Calls + Analyse */}
          {app.voice_calls.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
              <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-4">
                KI Gesprächs-Analyse
              </h3>
              <div className="flex flex-col items-center py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-xl text-outline-variant">mic_off</span>
                </div>
                <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
                  Noch kein Call durchgeführt
                </p>
              </div>
            </div>
          ) : (
            app.voice_calls.map((vc) => {
              const ca = vc.call_analyses[0] ?? null;
              const transcript = vc.transcripts[0] ?? null;
              const rec = ca?.recommendation ? recommendationConfig[ca.recommendation] : null;
              const isTranscriptOpen = transcriptOpen[vc.id] ?? false;
              const segments: { index: number; speaker: string; text: string }[] =
                Array.isArray(transcript?.segments) && transcript.segments.length > 0
                  ? transcript.segments
                  : transcript?.full_text
                  ? transcript.full_text.split("\n").filter(Boolean).map((line, i) => ({
                      index: i,
                      speaker: line.startsWith("assistant:") ? "assistant" : "user",
                      text: line.replace(/^(assistant|user|KI|Bewerber):\s*/i, ""),
                    }))
                  : [];

              return (
                <div key={vc.id} className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] space-y-5">

                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
                        KI Gesprächs-Analyse
                      </h3>
                      {vc.started_at && (
                        <p className="font-label text-[10px] text-outline mt-0.5">
                          {new Date(vc.started_at).toLocaleString("de-AT", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                          })} · {formatDuration(vc.duration_seconds)}
                        </p>
                      )}
                    </div>
                    <Link href={`/calls/${vc.id}`}
                      className="flex items-center gap-1 font-label text-[10px] text-outline hover:text-primary transition-colors">
                      Details
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </Link>
                  </div>

                  {ca ? (
                    <>
                      {/* Score + Recommendation */}
                      <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                          <svg className="-rotate-90" width="64" height="64">
                            <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5"
                              className="text-outline-variant/20" />
                            <circle cx="32" cy="32" r="26" fill="none"
                              stroke={(ca.interview_score ?? 0) >= 75 ? "#4CAF50" : (ca.interview_score ?? 0) >= 50 ? "#FF9800" : "#F44336"}
                              strokeWidth="5"
                              strokeDasharray={`${((ca.interview_score ?? 0) / 100) * 2 * Math.PI * 26} ${2 * Math.PI * 26}`}
                              strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-headline text-lg text-on-surface leading-none">
                              {ca.interview_score ?? "—"}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          {rec && (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label text-[10px] font-bold mb-2 ${rec.bg} ${rec.text}`}>
                              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {rec.icon}
                              </span>
                              {rec.label}
                            </span>
                          )}
                          {ca.summary && (
                            <p className="font-body text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                              {ca.summary}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Key Insights + Red Flags */}
                      {(ca.key_insights?.length > 0 || ca.red_flags?.length > 0) && (
                        <div className="grid grid-cols-2 gap-3">
                          {ca.key_insights?.length > 0 && (
                            <div>
                              <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
                                Stärken
                              </span>
                              <ul className="space-y-1.5">
                                {ca.key_insights.slice(0, 3).map((insight, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="material-symbols-outlined text-primary text-xs mt-0.5 flex-shrink-0"
                                      style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <span className="font-body text-[11px] text-on-surface leading-relaxed">{insight}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {ca.red_flags?.length > 0 && (
                            <div>
                              <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
                                Warnsignale
                              </span>
                              <ul className="space-y-1.5">
                                {ca.red_flags.slice(0, 3).map((flag, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="material-symbols-outlined text-error text-xs mt-0.5 flex-shrink-0"
                                      style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                                    <span className="font-body text-[11px] text-on-surface leading-relaxed">{flag}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Criteria Scores */}
                      {ca.criteria_scores?.length > 0 && (
                        <div>
                          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
                            Kriterien-Bewertung
                          </span>
                          <div className="space-y-2">
                            {ca.criteria_scores.map((c, i) => (
                              <div key={i}>
                                <div className="flex justify-between mb-0.5">
                                  <span className="font-label text-[10px] text-on-surface-variant truncate pr-2">{c.criterion}</span>
                                  <span className="font-label text-[10px] font-bold text-on-surface flex-shrink-0">{c.score}/10</span>
                                </div>
                                <div className="w-full bg-outline-variant/20 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${
                                    c.score >= 7 ? "bg-primary" : c.score >= 5 ? "bg-tertiary" : "bg-error/60"
                                  }`} style={{ width: `${c.score * 10}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-3 py-4 text-center justify-center">
                      <span className="material-symbols-outlined text-outline-variant text-xl">pending</span>
                      <p className="font-body text-sm text-on-surface-variant">
                        Analyse wird verarbeitet…
                      </p>
                    </div>
                  )}

                  {/* Recording */}
                  {vc.recording_url && (
                    <div className="border-t border-outline-variant/10 pt-4">
                      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">
                        Aufnahme
                      </span>
                      <audio controls src={vc.recording_url} className="w-full h-8" />
                    </div>
                  )}

                  {/* Transcript Toggle */}
                  {(segments.length > 0 || transcript?.full_text) && (
                    <div className="border-t border-outline-variant/10 pt-4">
                      <button
                        onClick={() => setTranscriptOpen((prev) => ({ ...prev, [vc.id]: !prev[vc.id] }))}
                        className="w-full flex items-center justify-between text-left group"
                      >
                        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
                          Transkript
                        </span>
                        <span className={`material-symbols-outlined text-outline group-hover:text-primary transition-all ${isTranscriptOpen ? "rotate-180" : ""}`}>
                          expand_more
                        </span>
                      </button>

                      {isTranscriptOpen && (
                        <div className="mt-3 max-h-80 overflow-y-auto space-y-2 pr-1">
                          {segments.length > 0 ? (
                            segments.map((seg, i) => {
                              const isAI = seg.speaker === "assistant" || seg.speaker === "KI";
                              return (
                                <div key={i} className={`flex gap-2 ${isAI ? "" : "flex-row-reverse"}`}>
                                  <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5 ${
                                    isAI ? "bg-primary-container text-on-primary-container" : "bg-surface-container-high text-on-surface-variant"
                                  }`}>
                                    {isAI ? "KI" : "B"}
                                  </div>
                                  <div className={`max-w-[85%] px-3 py-2 rounded-xl font-body text-[11px] leading-relaxed ${
                                    isAI
                                      ? "bg-surface-container text-on-surface"
                                      : "bg-primary-container/20 text-on-surface"
                                  }`}>
                                    {seg.text}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="font-body text-xs text-on-surface-variant whitespace-pre-wrap leading-relaxed">
                              {transcript?.full_text}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Funnel Responses */}
          {Object.keys(app.funnel_responses ?? {}).length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
              <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-4">
                Funnel-Antworten
              </h3>
              <div className="space-y-4">
                {Object.entries(app.funnel_responses).map(([question, answers]) => (
                  <div key={question}>
                    <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-1.5">
                      {question}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(answers) ? answers : [answers]).map((a) => (
                        <span key={a}
                          className="bg-primary-container/30 text-on-primary-container px-2.5 py-1 rounded-full font-label text-[10px] font-bold">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UTM / Campaign Tracking */}
          {app.utm_params && Object.keys(app.utm_params).length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
              <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-4">
                Kampagnen-Tracking
              </h3>
              <div className="space-y-2">
                {Object.entries(app.utm_params).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-start gap-3">
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline flex-shrink-0">
                      {k.replace("utm_", "")}
                    </span>
                    <span className="font-body text-xs text-on-surface-variant text-right break-all">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal Notes */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-3">
              Interne Notizen
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notizen zu diesem Bewerber…"
              rows={5}
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none mb-3"
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="flex items-center gap-1.5 font-label text-[10px] font-bold uppercase tracking-widest text-primary hover:underline disabled:opacity-60 transition-opacity"
            >
              {savingNotes
                ? <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-xs">save</span>}
              {savingNotes ? "Speichert…" : "Speichern"}
            </button>
          </div>

          {/* Application Meta */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-4">
              Bewerbungsdetails
            </h3>
            <div className="space-y-3">
              {[
                { label: "Bewerbungs-ID", value: app.id.slice(0, 8) + "…" },
                { label: "Job-ID", value: app.job.id.slice(0, 8) + "…" },
                { label: "Quelle", value: sourceLabels[app.source] ?? app.source },
                { label: "Funnel", value: app.funnel?.name ?? "—" },
                {
                  label: "Eingegangen",
                  value: new Date(app.applied_at).toLocaleString("de-AT", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  }),
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-3">
                  <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline flex-shrink-0">
                    {label}
                  </span>
                  <span className="font-body text-xs text-on-surface-variant text-right">{value}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-outline-variant/10">
                <Link href={`/jobs/${app.job.id}`}
                  className="flex items-center justify-between group">
                  <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
                    Job öffnen
                  </span>
                  <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-sm">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
