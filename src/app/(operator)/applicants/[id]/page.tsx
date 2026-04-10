"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type ApplicationDetail = {
  id: string;
  pipeline_stage: string;
  overall_score: number | null;
  score_breakdown: Record<string, number>;
  customer_decision: string;
  operator_notes: string | null;
  funnel_responses: Record<string, string[]>;
  source: string;
  utm_params: Record<string, string>;
  applied_at: string;
  job: { id: string; title: string; requirements: string | null; company: { name: string; primary_color: string | null } };
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
    structured_data: { skills?: string[]; years_experience?: number; education?: string; languages?: string[] };
    analyzed_at: string;
  }[];
  voice_calls: {
    id: string;
    status: string;
    scheduled_at: string | null;
    duration_seconds: number | null;
    call_analyses: { interview_score: number | null; recommendation: string | null; summary: string | null }[];
  }[];
};

const stages = [
  "new", "cv_analyzed", "call_scheduled", "call_completed", "evaluated", "presented", "accepted", "rejected"
];

const stageLabels: Record<string, string> = {
  new: "Neu", cv_analyzed: "CV analysiert", call_scheduled: "Call geplant",
  call_completed: "Call fertig", evaluated: "Bewertet", presented: "Freigegeben",
  accepted: "Akzeptiert", rejected: "Abgelehnt",
};

const sourceLabels: Record<string, string> = {
  facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", direct: "Direkt", referral: "Empfehlung",
};

const recommendationConfig: Record<string, { label: string; color: string }> = {
  strong_yes: { label: "Starkes Ja", color: "text-primary" },
  yes:        { label: "Ja",         color: "text-primary" },
  maybe:      { label: "Vielleicht", color: "text-tertiary" },
  no:         { label: "Nein",       color: "text-error" },
  strong_no:  { label: "Starkes Nein", color: "text-error" },
};

function formatDuration(s: number | null) {
  if (!s) return "—";
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")} min`;
}

export default function ApplicantDetailPage({ params }: { params: { id: string } }) {
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("applications")
      .select(`
        *,
        job:jobs(id, title, requirements, company:companies(name, primary_color)),
        funnel:funnels(name, slug),
        applicant:applicants(id, full_name, email, phone, cv_file_url, consent_given_at),
        cv_analyses(*),
        voice_calls(*, call_analyses(*))
      `)
      .eq("id", params.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setApp(data as unknown as ApplicationDetail);
          setNotes(data.operator_notes ?? "");
        }
        setLoading(false);
      });
  }, [params.id]);

  async function updateStage(stage: string) {
    await supabase.from("applications").update({ pipeline_stage: stage }).eq("id", params.id);
    setApp((prev) => prev ? { ...prev, pipeline_stage: stage } : prev);
  }

  async function saveNotes() {
    setSavingNotes(true);
    await supabase.from("applications").update({ operator_notes: notes }).eq("id", params.id);
    setSavingNotes(false);
  }

  async function releaseToPortal() {
    await supabase.from("applications").update({ customer_decision: "pending", pipeline_stage: "presented" }).eq("id", params.id);
    setApp((prev) => prev ? { ...prev, customer_decision: "pending", pipeline_stage: "presented" } : prev);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="material-symbols-outlined text-3xl text-outline animate-spin">progress_activity</span>
    </div>
  );
  if (!app) return <div className="px-8 pt-10"><p className="font-body text-on-surface-variant">Bewerbung nicht gefunden.</p></div>;

  const cvAnalysis = app.cv_analyses[0] ?? null;
  const stageIndex = stages.indexOf(app.pipeline_stage);

  return (
    <div className="px-8 pt-10 pb-32">
      {/* Back */}
      <Link href="/applicants" className="flex items-center gap-1.5 text-outline hover:text-on-surface transition-colors mb-8 w-fit">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span className="font-label text-[10px] font-bold uppercase tracking-widest">Zurück zur Pipeline</span>
      </Link>

      {/* Hero Header */}
      <div className="grid grid-cols-12 gap-5 mb-8">
        {/* Person Card */}
        <div className="col-span-12 md:col-span-8 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-xl font-bold text-on-primary-container flex-shrink-0">
              {app.applicant.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="font-headline text-4xl italic text-on-surface leading-none mb-2">{app.applicant.full_name}</h1>
              <p className="font-label text-xs text-outline mb-4">{app.job.title} · {app.job.company.name}</p>
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: "mail",        value: app.applicant.email },
                  { icon: "phone",       value: app.applicant.phone ?? "—" },
                  { icon: "ads_click",   value: sourceLabels[app.source] ?? app.source },
                  { icon: "event",       value: new Date(app.applied_at).toLocaleDateString("de-AT", { day: "2-digit", month: "long", year: "numeric" }) },
                ].map((m) => (
                  <div key={m.icon} className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-outline-variant text-sm">{m.icon}</span>
                    {m.value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Score + Actions */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center text-center mb-4">
            <div className="font-headline text-6xl text-on-surface mb-1">
              {app.overall_score ?? "—"}
            </div>
            <div className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Gesamt-Score</div>
          </div>
          <div className="space-y-2">
            {app.pipeline_stage !== "presented" && app.pipeline_stage !== "accepted" && (
              <button onClick={releaseToPortal}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
                <span className="material-symbols-outlined text-sm">visibility</span>
                An Kundenportal freigeben
              </button>
            )}
            {app.applicant.cv_file_url && (
              <a href={app.applicant.cv_file_url} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 border border-outline-variant/30 text-on-surface-variant py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-sm">download</span>
                CV herunterladen
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Progress */}
      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Pipeline-Status</span>
        </div>
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {stages.map((stage, i) => {
            const isActive = stage === app.pipeline_stage;
            const isPast = i < stageIndex;
            const isRejected = stage === "rejected";
            return (
              <button
                key={stage}
                onClick={() => updateStage(stage)}
                className={`flex-1 min-w-[80px] flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg transition-all ${
                  isActive
                    ? isRejected ? "bg-error-container/20 text-error" : "bg-primary-container text-on-primary-container"
                    : isPast
                    ? "text-primary"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isActive
                    ? isRejected ? "border-error bg-error" : "border-primary bg-primary"
                    : isPast
                    ? "border-primary bg-primary"
                    : "border-outline-variant/40 bg-transparent"
                }`}>
                  {(isActive || isPast) && (
                    <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isPast && !isActive ? "check" : "radio_button_checked"}
                    </span>
                  )}
                </div>
                <span className="font-label text-[9px] font-bold uppercase tracking-widest text-center leading-tight">
                  {stageLabels[stage]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-5">
        {/* CV Analysis */}
        <div className="col-span-12 md:col-span-7 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
          <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-4">KI CV-Analyse</h3>
          {cvAnalysis ? (
            <div className="space-y-5">
              {/* Match Score */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="font-label text-xs font-semibold text-on-surface">CV Match-Score</span>
                  <span className="font-headline text-lg text-on-surface">{cvAnalysis.match_score ?? "—"}%</span>
                </div>
                <div className="w-full bg-outline-variant/20 h-2 rounded-full">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${cvAnalysis.match_score ?? 0}%` }} />
                </div>
              </div>

              {/* Summary */}
              {cvAnalysis.summary && (
                <div>
                  <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">Zusammenfassung</span>
                  <p className="font-body text-sm text-on-surface leading-relaxed">{cvAnalysis.summary}</p>
                </div>
              )}

              {/* Structured Data */}
              {cvAnalysis.structured_data && (
                <div className="grid grid-cols-2 gap-3">
                  {cvAnalysis.structured_data.skills?.length && (
                    <div>
                      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">Skills</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cvAnalysis.structured_data.skills.slice(0, 8).map((s) => (
                          <span key={s} className="bg-surface-container px-2.5 py-1 rounded-full font-label text-[10px] font-bold text-on-surface-variant">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {cvAnalysis.structured_data.languages?.length && (
                    <div>
                      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">Sprachen</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cvAnalysis.structured_data.languages.map((l) => (
                          <span key={l} className="bg-tertiary-container/30 px-2.5 py-1 rounded-full font-label text-[10px] font-bold text-on-tertiary-container">{l}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-2 gap-4">
                {cvAnalysis.strengths?.length > 0 && (
                  <div>
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">Stärken</span>
                    <ul className="space-y-1.5">
                      {cvAnalysis.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="material-symbols-outlined text-primary text-xs mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          <span className="font-body text-xs text-on-surface">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {cvAnalysis.gaps?.length > 0 && (
                  <div>
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-2">Lücken</span>
                    <ul className="space-y-1.5">
                      {cvAnalysis.gaps.map((g, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="material-symbols-outlined text-tertiary text-xs mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                          <span className="font-body text-xs text-on-surface">{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">description</span>
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Keine CV-Analyse</p>
              <p className="font-body text-sm text-on-surface-variant mt-1">Wird automatisch nach CV-Upload erstellt.</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="col-span-12 md:col-span-5 space-y-5">
          {/* Voice Calls */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-4">Voice Calls</h3>
            {app.voice_calls.length > 0 ? (
              <div className="space-y-3">
                {app.voice_calls.map((vc) => {
                  const ca = vc.call_analyses[0] ?? null;
                  const rec = ca?.recommendation ? recommendationConfig[ca.recommendation] : null;
                  return (
                    <Link key={vc.id} href={`/calls/${vc.id}`}
                      className="flex items-center justify-between p-3 bg-surface-container rounded-xl hover:bg-surface-container-high transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-outline text-xl">call</span>
                        <div>
                          <p className="font-label text-xs font-bold text-on-surface">{vc.scheduled_at ? new Date(vc.scheduled_at).toLocaleDateString("de-AT") : "Ungeplant"}</p>
                          <p className="font-label text-[10px] text-outline">{formatDuration(vc.duration_seconds)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ca?.interview_score !== null && ca?.interview_score !== undefined && (
                          <span className="font-headline text-lg text-on-surface">{ca.interview_score}%</span>
                        )}
                        {rec && <span className={`font-label text-[10px] font-bold ${rec.color}`}>{rec.label}</span>}
                        <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-sm">arrow_forward</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <span className="material-symbols-outlined text-3xl text-outline-variant mb-2">call_end</span>
                <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Noch kein Call</p>
                <button className="mt-3 flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
                  <span className="material-symbols-outlined text-xs">add_call</span>
                  Call planen
                </button>
              </div>
            )}
          </div>

          {/* Funnel Responses */}
          {Object.keys(app.funnel_responses ?? {}).length > 0 && (
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
              <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-4">Funnel-Antworten</h3>
              <div className="space-y-3">
                {Object.entries(app.funnel_responses).map(([question, answers]) => (
                  <div key={question}>
                    <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-1">{question}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(answers) ? answers : [answers]).map((a) => (
                        <span key={a} className="bg-primary-container/30 text-on-primary-container px-2.5 py-1 rounded-full font-label text-[10px] font-bold">{a}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Operator Notes */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Interne Notizen</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notizen zu diesem Bewerber…"
              rows={4}
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none mb-3"
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="flex items-center gap-1.5 font-label text-[10px] font-bold uppercase tracking-widest text-primary hover:underline disabled:opacity-60"
            >
              {savingNotes
                ? <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-xs">save</span>}
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
