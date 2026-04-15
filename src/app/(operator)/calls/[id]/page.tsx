"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Segment = { start: number; end: number; speaker: string; text: string };

type CallDetail = {
  id: string;
  status: string;
  started_at: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  application: {
    id: string;
    overall_score: number | null;
    job: { id: string; title: string; company: { name: string } };
    applicant: { id: string; full_name: string; email: string; phone: string | null };
  };
  transcripts: {
    id: string;
    full_text: string;
    segments: Segment[];
    language: string;
    transcribed_at: string;
  }[];
  call_analyses: {
    id: string;
    interview_score: number | null;
    criteria_scores: { criterion: string; score: number; reasoning: string }[];
    key_insights: string[];
    red_flags: string[];
    summary: string;
    recommendation: string | null;
    analyzed_at: string;
  }[];
};

const recommendationConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  strong_yes: { label: "Starkes Ja",   icon: "thumb_up",    color: "text-primary",  bg: "bg-primary-container/40" },
  yes:        { label: "Ja",           icon: "check",       color: "text-primary",  bg: "bg-primary-container/30" },
  maybe:      { label: "Vielleicht",   icon: "help",        color: "text-tertiary", bg: "bg-tertiary-container/30" },
  no:         { label: "Nein",         icon: "close",       color: "text-error",    bg: "bg-error-container/20" },
  strong_no:  { label: "Starkes Nein", icon: "thumb_down",  color: "text-error",    bg: "bg-error-container/30" },
};

function formatDuration(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")} min`;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function CallDetailPage({ params }: { params: { id: string } }) {
  const [call, setCall] = useState<CallDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"transcript" | "analysis">("analysis");
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("voice_calls")
      .select(`
        *,
        application:applications(
          id, overall_score,
          job:jobs(id, title, company:companies(name)),
          applicant:applicants(id, full_name, email, phone)
        ),
        transcripts(*),
        call_analyses(*)
      `)
      .eq("id", params.id)
      .single()
      .then(({ data }) => {
        if (data) setCall(data as unknown as CallDetail);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-symbols-outlined text-3xl text-outline animate-spin">progress_activity</span>
    </div>
  );

  if (!call) return (
    <div className="px-8 pt-10">
      <p className="font-body text-on-surface-variant">Call nicht gefunden.</p>
    </div>
  );

  const transcript = call.transcripts[0] ?? null;
  const analysis = call.call_analyses[0] ?? null;
  const rec = analysis?.recommendation ? recommendationConfig[analysis.recommendation] : null;

  return (
    <div className="px-8 pt-10 pb-32">
      {/* Back */}
      <Link href="/calls" className="flex items-center gap-1.5 text-outline hover:text-on-surface transition-colors mb-8 w-fit">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest">Zurück zu Calls</span>
      </Link>

      {/* Header */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Left: Person + Meta */}
        <div className="col-span-12 md:col-span-8 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center text-lg font-bold text-on-primary-container flex-shrink-0">
              {call.application.applicant.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <Link href={`/applicants/${call.application.id}`}
                className="font-headline text-3xl italic text-on-surface hover:text-primary transition-colors mb-1 block">
                {call.application.applicant.full_name}
              </Link>
              <p className="font-label text-xs text-outline mb-3">
                <Link href={`/jobs/${call.application.job.id}`} className="hover:text-primary transition-colors">
                  {call.application.job.title}
                </Link>
                {" · "}{call.application.job.company.name}
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: "mail",  value: call.application.applicant.email },
                  { icon: "phone", value: call.application.applicant.phone ?? "—" },
                  { icon: "timer", value: formatDuration(call.duration_seconds) },
                  { icon: "event", value: call.started_at ? new Date(call.started_at).toLocaleString("de-AT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—" },
                ].map((m) => (
                  <div key={m.icon} className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-outline-variant text-sm">{m.icon}</span>
                    {m.value}
                  </div>
                ))}
              </div>
            </div>
            <Link href={`/applicants/${call.application.id}`}
              className="flex items-center gap-1.5 font-label text-xs font-bold uppercase tracking-widest text-primary hover:underline flex-shrink-0">
              Bewerber
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Right: Recommendation */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] flex flex-col items-center justify-center text-center">
          {analysis ? (
            <>
              <div className="font-headline text-5xl text-on-surface mb-2">
                {analysis.interview_score ?? "—"}%
              </div>
              <div className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-4">Interview-Score</div>
              {rec && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${rec.bg}`}>
                  <span className={`material-symbols-outlined text-sm ${rec.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{rec.icon}</span>
                  <span className={`font-label text-xs font-bold ${rec.color}`}>{rec.label}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-outline-variant">analytics</span>
              <p className="font-label text-xs font-bold uppercase tracking-widest text-outline">Keine Analyse</p>
            </div>
          )}
        </div>
      </div>

      {/* Recording */}
      {call.recording_url && (
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] mb-6 flex items-center gap-4">
          <button className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 hover:bg-primary-dim transition-colors">
            <span className="material-symbols-outlined text-on-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          </button>
          <div className="flex-1">
            <div className="font-label text-xs font-bold text-on-surface mb-1">Call-Aufnahme</div>
            <div className="w-full bg-outline-variant/20 h-1.5 rounded-full">
              <div className="bg-primary h-full rounded-full w-0" />
            </div>
          </div>
          <span className="font-label text-xs text-outline">{formatDuration(call.duration_seconds)}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-lowest rounded-xl p-1 mb-6 w-fit border border-outline-variant/20">
        {(["analysis", "transcript"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-lg font-label text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
              activeTab === tab
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}>
            <span className="material-symbols-outlined text-sm">
              {tab === "analysis" ? "analytics" : "description"}
            </span>
            {tab === "analysis" ? "KI-Analyse" : "Transkript"}
          </button>
        ))}
      </div>

      {/* Analysis Tab */}
      {activeTab === "analysis" && (
        <div className="grid grid-cols-12 gap-5">
          {analysis ? (
            <>
              {/* Summary */}
              <div className="col-span-12 md:col-span-8 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
                <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-3">Zusammenfassung</h3>
                <p className="font-body text-sm text-on-surface leading-relaxed">{analysis.summary}</p>
              </div>

              {/* Criteria Scores */}
              <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
                <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-4">Kriterien-Scores</h3>
                <div className="space-y-4">
                  {analysis.criteria_scores.map((c, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="font-label text-xs font-semibold text-on-surface">{c.criterion}</span>
                        <span className="font-headline text-sm text-on-surface">{c.score}%</span>
                      </div>
                      <div className="w-full bg-outline-variant/20 h-1 rounded-full">
                        <div className={`h-full rounded-full ${c.score >= 70 ? "bg-primary" : c.score >= 40 ? "bg-tertiary" : "bg-error"}`} style={{ width: `${c.score}%` }} />
                      </div>
                      {c.reasoning && (
                        <p className="font-label text-xs text-outline mt-1 line-clamp-2">{c.reasoning}</p>
                      )}
                    </div>
                  ))}
                  {analysis.criteria_scores.length === 0 && (
                    <p className="font-label text-xs text-outline">Keine Kriterien bewertet.</p>
                  )}
                </div>
              </div>

              {/* Key Insights */}
              {analysis.key_insights?.length > 0 && (
                <div className="col-span-12 md:col-span-6 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
                  <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-3">Key Insights</h3>
                  <ul className="space-y-2">
                    {analysis.key_insights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-primary text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="font-body text-sm text-on-surface">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Red Flags */}
              {analysis.red_flags?.length > 0 && (
                <div className="col-span-12 md:col-span-6 bg-error-container/10 border border-error-container/30 rounded-xl p-6">
                  <h3 className="font-label text-xs font-bold uppercase tracking-widest text-error mb-3">Red Flags</h3>
                  <ul className="space-y-2">
                    {analysis.red_flags.map((flag, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-error text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                        <span className="font-body text-sm text-on-surface">{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="col-span-12 flex flex-col items-center py-20 text-center">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">analytics</span>
              <h3 className="font-headline text-2xl italic text-on-surface mb-2">Keine Analyse verfügbar</h3>
              <p className="font-body text-on-surface-variant">Die KI-Analyse wird automatisch nach dem Transkript erstellt.</p>
            </div>
          )}
        </div>
      )}

      {/* Transcript Tab */}
      {activeTab === "transcript" && (
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] overflow-hidden">
          {transcript ? (
            <>
              <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-outline text-sm">description</span>
                  <span className="font-label text-xs font-bold text-on-surface">
                    Transkript · {transcript.language?.toUpperCase()} · {transcript.segments?.length ?? 0} Segmente
                  </span>
                </div>
                <span className="font-label text-xs text-outline">
                  Transkribiert {new Date(transcript.transcribed_at).toLocaleDateString("de-AT")}
                </span>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {transcript.segments?.length > 0 ? (
                  transcript.segments.map((seg, i) => (
                    <div key={i} className={`flex gap-4 ${seg.speaker === "agent" ? "" : "flex-row-reverse"}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                        seg.speaker === "agent" ? "bg-secondary-container text-on-secondary-container" : "bg-primary-container text-on-primary-container"
                      }`}>
                        {seg.speaker === "agent" ? "KI" : "BW"}
                      </div>
                      <div className={`max-w-[75%] ${seg.speaker !== "agent" ? "items-end" : ""} flex flex-col gap-1`}>
                        <div className={`rounded-2xl px-4 py-2.5 ${
                          seg.speaker === "agent"
                            ? "bg-surface-container rounded-tl-sm"
                            : "bg-primary-container/30 rounded-tr-sm"
                        }`}>
                          <p className="font-body text-sm text-on-surface leading-relaxed">{seg.text}</p>
                        </div>
                        <span className="font-label text-xs text-outline px-1">{formatTime(seg.start)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                    {transcript.full_text}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-20 text-center">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">description</span>
              <h3 className="font-headline text-2xl italic text-on-surface mb-2">Kein Transkript</h3>
              <p className="font-body text-on-surface-variant">Das Transkript wird automatisch nach dem Call erstellt.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
