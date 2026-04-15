"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Call = {
  id: string;
  status: "scheduled" | "ringing" | "in_progress" | "completed" | "failed" | "no_answer";
  scheduled_at: string | null;
  started_at: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  application: {
    id: string;
    overall_score: number | null;
    job: { id: string; title: string; company: { name: string } };
    applicant: { id: string; full_name: string; email: string };
  };
  transcript: { id: string } | null;
  call_analysis: { interview_score: number | null; recommendation: string | null } | null;
};

const statusConfig = {
  scheduled:   { label: "Geplant",      icon: "schedule",        bg: "bg-primary-container/30",    text: "text-primary" },
  ringing:     { label: "Klingelt",     icon: "phone_in_talk",   bg: "bg-tertiary-container/30",   text: "text-tertiary" },
  in_progress: { label: "Läuft",        icon: "phone_in_talk",   bg: "bg-primary-container/50",    text: "text-primary" },
  completed:   { label: "Abgeschlossen",icon: "check_circle",    bg: "bg-surface-container-high",  text: "text-outline" },
  failed:      { label: "Fehlgeschlag.",icon: "error",           bg: "bg-error-container/20",      text: "text-error" },
  no_answer:   { label: "Nicht abgeh.", icon: "phone_missed",    bg: "bg-tertiary-container/20",   text: "text-tertiary" },
};

const recommendationConfig: Record<string, { label: string; color: string }> = {
  strong_yes: { label: "Starkes Ja",  color: "text-primary" },
  yes:        { label: "Ja",          color: "text-primary" },
  maybe:      { label: "Vielleicht",  color: "text-tertiary" },
  no:         { label: "Nein",        color: "text-error" },
  strong_no:  { label: "Starkes Nein",color: "text-error" },
};

function formatDuration(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")} min`;
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("voice_calls")
      .select(`
        id, status, scheduled_at, started_at, duration_seconds, recording_url,
        application:applications(
          id, overall_score,
          job:jobs(id, title, company:companies(name)),
          applicant:applicants(id, full_name, email)
        ),
        transcript:transcripts(id),
        call_analysis:call_analyses(interview_score, recommendation)
      `)
      .order("scheduled_at", { ascending: false });
    setCalls((data ?? []) as unknown as Call[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = calls.filter((c) =>
    statusFilter === "all" || c.status === statusFilter
  );

  const completedToday = calls.filter(
    (c) => c.status === "completed" &&
    c.started_at &&
    new Date(c.started_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="px-8 pt-10 pb-32">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">Operator Panel</p>
          <h1 className="font-headline text-5xl italic text-on-surface leading-none">Voice Calls</h1>
          <p className="font-body text-on-surface-variant mt-2">
            {loading ? "Lädt…" : `${completedToday} abgeschlossen heute · ${calls.filter((c) => c.status === "scheduled").length} geplant`}
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          { label: "Gesamt",         value: calls.length,                                            icon: "call" },
          { label: "Abgeschlossen",  value: calls.filter((c) => c.status === "completed").length,   icon: "check_circle" },
          { label: "Nicht erreicht", value: calls.filter((c) => c.status === "no_answer").length,   icon: "phone_missed" },
          { label: "Ø Dauer",        value: formatDuration(
            calls.filter((c) => c.duration_seconds).reduce((s, c) => s + (c.duration_seconds ?? 0), 0) /
            Math.max(calls.filter((c) => c.duration_seconds).length, 1)
          ), icon: "timer" },
        ].map((k) => (
          <div key={k.label} className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">{k.label}</span>
              <span className="material-symbols-outlined text-outline-variant text-xl">{k.icon}</span>
            </div>
            <div className="font-headline text-3xl text-on-surface">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {["all", "scheduled", "completed", "no_answer", "failed"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-5 py-2 rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors ${
              statusFilter === s
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
            }`}>
            {s === "all" ? "Alle" : statusConfig[s as keyof typeof statusConfig]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Calls List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">call</span>
          <h3 className="font-headline text-2xl italic text-on-surface mb-2">Noch keine Calls</h3>
          <p className="font-body text-on-surface-variant">Calls erscheinen hier sobald Bewerber für ein Interview kontaktiert werden.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((call) => {
            const st = statusConfig[call.status];
            const rec = call.call_analysis?.recommendation
              ? recommendationConfig[call.call_analysis.recommendation]
              : null;

            return (
              <div key={call.id} className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] hover:bg-surface-bright transition-all">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container flex-shrink-0">
                    {call.application.applicant.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link href={`/applicants/${call.application.id}`}
                        className="font-label text-sm font-bold text-on-surface hover:text-primary transition-colors">
                        {call.application.applicant.full_name}
                      </Link>
                      <span className={`text-xs font-label font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-label text-outline">
                      <Link href={`/jobs/${call.application.job.id}`}
                        className="hover:text-primary transition-colors">
                        {call.application.job.title}
                      </Link>
                      <span>·</span>
                      <span>{call.application.job.company.name}</span>
                      {(call.started_at || call.scheduled_at) && (
                        <>
                          <span>·</span>
                          <span>{new Date(call.started_at ?? call.scheduled_at!).toLocaleString("de-AT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    {call.duration_seconds && (
                      <div className="text-center">
                        <div className="font-headline text-lg text-on-surface">{formatDuration(call.duration_seconds)}</div>
                        <div className="font-label text-xs text-outline uppercase tracking-widest">Dauer</div>
                      </div>
                    )}
                    {call.call_analysis?.interview_score !== null && call.call_analysis?.interview_score !== undefined && (
                      <div className="text-center">
                        <div className="font-headline text-lg text-on-surface">{call.call_analysis.interview_score}%</div>
                        <div className="font-label text-xs text-outline uppercase tracking-widest">Score</div>
                      </div>
                    )}
                    {rec && (
                      <div className={`font-label text-xs font-bold ${rec.color}`}>{rec.label}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {call.recording_url && (
                      <button className="material-symbols-outlined text-outline hover:text-primary transition-colors text-xl p-1" title="Aufnahme">
                        play_circle
                      </button>
                    )}
                    {call.transcript && (
                      <Link
                        href={`/calls/${call.id}`}
                        className="material-symbols-outlined text-outline hover:text-primary transition-colors text-xl p-1"
                        title="Transkript ansehen"
                      >
                        description
                      </Link>
                    )}
                    <Link
                      href={`/applicants/${call.application.id}`}
                      className="material-symbols-outlined text-outline hover:text-primary transition-colors text-xl p-1"
                      title="Bewerber öffnen"
                    >
                      arrow_forward
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
