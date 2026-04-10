"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Application = {
  id: string;
  pipeline_stage: Stage;
  overall_score: number | null;
  customer_decision: string;
  applied_at: string;
  applicant: {
    full_name: string;
    email: string;
    phone: string | null;
  };
  job: {
    title: string;
    company: { name: string };
  };
};

type Stage =
  | "new"
  | "cv_analyzed"
  | "call_scheduled"
  | "call_completed"
  | "evaluated"
  | "presented"
  | "accepted"
  | "rejected";

const stages: { key: Stage; label: string; icon: string; color: string; headerBg: string }[] = [
  { key: "new",            label: "Neu",           icon: "inbox",         color: "border-outline-variant/30",      headerBg: "bg-surface-container" },
  { key: "cv_analyzed",   label: "CV analysiert",  icon: "description",   color: "border-tertiary-container",      headerBg: "bg-tertiary-container/30" },
  { key: "call_scheduled",label: "Call geplant",   icon: "schedule",      color: "border-primary-container",       headerBg: "bg-primary-container/30" },
  { key: "call_completed", label: "Call fertig",   icon: "call",          color: "border-primary/30",              headerBg: "bg-primary-container/50" },
  { key: "evaluated",      label: "Bewertet",      icon: "star",          color: "border-primary/50",              headerBg: "bg-primary-container/70" },
  { key: "presented",      label: "Freigegeben",   icon: "visibility",    color: "border-primary",                 headerBg: "bg-primary-container" },
  { key: "accepted",       label: "Akzeptiert",    icon: "check_circle",  color: "border-primary-dim",             headerBg: "bg-primary/10" },
  { key: "rejected",       label: "Abgelehnt",     icon: "cancel",        color: "border-error-container/50",      headerBg: "bg-error-container/10" },
];

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const color =
    score >= 75 ? "bg-primary-container text-on-primary-container" :
    score >= 50 ? "bg-tertiary-container text-on-tertiary-container" :
    "bg-error-container/30 text-error";
  return (
    <span className={`text-[10px] font-label font-bold px-2 py-0.5 rounded-full ${color}`}>
      {score}%
    </span>
  );
}

function KanbanCard({ app }: { app: Application }) {
  return (
    <Link href={`/applicants/${app.id}`} className="block bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_16px_-2px_rgba(45,52,51,0.06)] hover:shadow-[0_8px_24px_-4px_rgba(45,52,51,0.1)] hover:-translate-y-0.5 transition-all border border-outline-variant/10 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary-container flex-shrink-0">
            {app.applicant.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-label text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
              {app.applicant.full_name}
            </p>
            <p className="font-label text-[10px] text-outline truncate">{app.job.company.name}</p>
          </div>
        </div>
        <ScoreBadge score={app.overall_score} />
      </div>

      <p className="font-body text-xs text-on-surface-variant mb-3 line-clamp-1">
        {app.job.title}
      </p>

      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
        <span className="font-label text-[10px] text-outline">
          {new Date(app.applied_at).toLocaleDateString("de-AT", { day: "2-digit", month: "short" })}
        </span>
        <div className="flex items-center gap-1">
          {app.applicant.phone && (
            <span className="material-symbols-outlined text-outline-variant text-xs">phone</span>
          )}
          <span className="material-symbols-outlined text-outline-variant text-xs">arrow_forward</span>
        </div>
      </div>
    </Link>
  );
}

export function PipelineClient() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("applications")
      .select(`
        id, pipeline_stage, overall_score, customer_decision, applied_at,
        applicant:applicants(full_name, email, phone),
        job:jobs(title, company:companies(name))
      `)
      .order("applied_at", { ascending: false });
    setApplications((data ?? []) as unknown as Application[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const byStage = (stage: Stage) => applications.filter((a) => a.pipeline_stage === stage);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-8 pt-10 pb-6 flex-shrink-0">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-2">
              Operator Panel
            </p>
            <h1 className="font-headline text-5xl italic text-on-surface leading-none">
              Bewerber-Pipeline
            </h1>
            <p className="font-body text-on-surface-variant mt-2">
              {loading ? "Lädt…" : `${applications.length} Bewerbungen · Drag & Drop coming soon`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="p-2.5 rounded-xl border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container transition-colors"
              title="Aktualisieren"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
            {/* View Toggle */}
            <div className="flex bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden">
              <button
                onClick={() => setView("kanban")}
                className={`px-4 py-2.5 flex items-center gap-1.5 font-label text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  view === "kanban"
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-sm">view_kanban</span>
                Kanban
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2.5 flex items-center gap-1.5 font-label text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  view === "list"
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-sm">list</span>
                Liste
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-3 flex-wrap">
          {stages.slice(0, 6).map((stage) => {
            const count = byStage(stage.key).length;
            return (
              <div key={stage.key} className="flex items-center gap-1.5 bg-surface-container-lowest px-3 py-1.5 rounded-full border border-outline-variant/20">
                <span className="material-symbols-outlined text-outline-variant text-xs">{stage.icon}</span>
                <span className="font-label text-[10px] font-bold text-outline uppercase tracking-widest">{stage.label}</span>
                <span className="font-headline text-sm text-on-surface">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban Board */}
      {view === "kanban" && (
        <div className="flex-1 overflow-x-auto px-8 pb-8">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">people</span>
              <h3 className="font-headline text-2xl italic text-on-surface mb-2">Noch keine Bewerbungen</h3>
              <p className="font-body text-on-surface-variant">
                Bewerbungen erscheinen hier sobald Bewerber einen Funnel abgeschlossen haben.
              </p>
            </div>
          ) : (
            <div className="flex gap-4 min-w-max">
              {stages.map((stage) => {
                const cards = byStage(stage.key);
                return (
                  <div key={stage.key} className={`w-64 flex-shrink-0 rounded-xl border ${stage.color} overflow-hidden`}>
                    {/* Column Header */}
                    <div className={`${stage.headerBg} px-4 py-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-outline text-sm">{stage.icon}</span>
                        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                          {stage.label}
                        </span>
                      </div>
                      <span className="font-headline text-lg text-on-surface">{cards.length}</span>
                    </div>

                    {/* Cards */}
                    <div className="p-3 space-y-3 min-h-[200px] bg-surface-container/30">
                      {cards.map((app) => (
                        <KanbanCard key={app.id} app={app} />
                      ))}
                      {cards.length === 0 && (
                        <div className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed border-outline-variant/20">
                          <span className="font-label text-[10px] text-outline uppercase tracking-widest">Leer</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-outline-variant/20 bg-surface-container-low">
              {["Bewerber", "Job / Firma", "Status", "Score", "Datum", ""].map((h, i) => (
                <div key={i} className={`font-label text-[10px] font-bold uppercase tracking-widest text-outline ${i === 0 ? "col-span-3" : i === 1 ? "col-span-3" : i === 2 ? "col-span-2" : i === 3 ? "col-span-1" : i === 4 ? "col-span-2" : "col-span-1"}`}>
                  {h}
                </div>
              ))}
            </div>

            {applications.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">people</span>
                <p className="font-label text-xs font-bold uppercase tracking-widest text-outline">Noch keine Bewerbungen</p>
              </div>
            ) : (
              applications.map((app) => {
                const stage = stages.find((s) => s.key === app.pipeline_stage)!;
                return (
                  <div key={app.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-outline-variant/10 hover:bg-surface-container/50 transition-colors items-center">
                    <div className="col-span-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary-container flex-shrink-0">
                        {app.applicant.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-label text-xs font-bold text-on-surface">{app.applicant.full_name}</p>
                        <p className="font-label text-[10px] text-outline">{app.applicant.email}</p>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <p className="font-body text-xs text-on-surface">{app.job.title}</p>
                      <p className="font-label text-[10px] text-outline">{app.job.company.name}</p>
                    </div>
                    <div className="col-span-2">
                      <span className={`text-[10px] font-label font-bold uppercase tracking-widest px-2 py-1 rounded-full ${stage.headerBg} text-on-surface-variant`}>
                        {stage.label}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <ScoreBadge score={app.overall_score} />
                    </div>
                    <div className="col-span-2 font-label text-[10px] text-outline">
                      {new Date(app.applied_at).toLocaleDateString("de-AT")}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <a href={`/applicants/${app.id}`} className="material-symbols-outlined text-outline hover:text-primary transition-colors text-lg">
                        arrow_forward
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
