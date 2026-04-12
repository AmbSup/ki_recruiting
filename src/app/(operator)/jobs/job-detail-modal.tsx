"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { JobAdImages } from "./job-ad-images";

type JobDetail = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  location: string | null;
  employment_type: string;
  salary_range: string | null;
  daily_budget: number | null;
  benefits: string | null;
  main_tasks: string | null;
  must_qualifications: string | null;
  nice_to_have_qualifications: string | null;
  ko_criteria: string | null;
  hard_skills: string | null;
  soft_skills: string | null;
  requirements: string | null;
  ideal_candidate: string | null;
  application_process: string | null;
  status: string;
  created_at: string;
  company: { id: string; name: string };
};

const employmentLabels: Record<string, string> = {
  fulltime: "Vollzeit",
  parttime: "Teilzeit",
  minijob: "Minijob",
  internship: "Praktikum",
  freelance: "Freelance",
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  draft:  { label: "Entwurf",  bg: "bg-surface-container-high", text: "text-outline" },
  active: { label: "Aktiv",    bg: "bg-primary-container/40",   text: "text-primary" },
  paused: { label: "Pausiert", bg: "bg-tertiary-container/40",  text: "text-tertiary" },
  closed: { label: "Geschl.",  bg: "bg-error-container/20",     text: "text-error" },
  filled: { label: "Besetzt",  bg: "bg-secondary-container",    text: "text-secondary" },
};

type Props = { jobId: string | null; onClose: () => void };

export function JobDetailModal({ jobId, onClose }: Props) {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "images">("details");

  useEffect(() => {
    if (!jobId) return;
    setJob(null);
    setLoading(true);
    const supabase = createClient();
    supabase
      .from("jobs")
      .select(`
        id, title, category, description, location, employment_type,
        salary_range, daily_budget, benefits,
        main_tasks, must_qualifications, nice_to_have_qualifications,
        ko_criteria, hard_skills, soft_skills,
        requirements, ideal_candidate, application_process,
        status, created_at,
        company:companies(id, name)
      `)
      .eq("id", jobId)
      .single()
      .then(({ data }) => {
        setJob(data as unknown as JobDetail);
        setLoading(false);
      });
  }, [jobId]);

  if (!jobId) return null;

  const st = job ? (statusConfig[job.status] ?? statusConfig.draft) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 w-16 bg-surface-container-high rounded-full animate-pulse" />
                <div className="h-7 w-56 bg-surface-container-high rounded-lg animate-pulse" />
                <div className="h-3 w-32 bg-surface-container-high rounded animate-pulse" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  {st && (
                    <span className={`text-[10px] font-label font-bold uppercase tracking-widest px-3 py-1 rounded-full ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                  )}
                  {job?.category && (
                    <span className="text-[10px] font-label font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant">
                      {job.category}
                    </span>
                  )}
                </div>
                <h2 className="font-headline text-2xl italic text-on-surface leading-tight">{job?.title}</h2>
                <p className="font-label text-xs text-outline mt-1">{job?.company?.name}</p>
              </>
            )}
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface transition-colors flex-shrink-0">
            close
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-6 pb-0 pt-1 border-b border-outline-variant/20 flex-shrink-0">
          {(["details", "images"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 font-label text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-outline hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-sm">
                {tab === "details" ? "description" : "image"}
              </span>
              {tab === "details" ? "Details" : "Ad Bilder"}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {activeTab === "images" && job ? (
            <JobAdImages jobId={job.id} jobTitle={job.title} jobLocation={job.location} />
          ) : loading ? (
            <div className="space-y-3">
              {[100, 80, 60, 100, 90, 70].map((w, i) => (
                <div key={i} className="h-4 bg-surface-container-high rounded animate-pulse" style={{ width: `${Math.min(w, 100)}%` }} />
              ))}
            </div>
          ) : job ? (
            <>
              {/* Meta chips */}
              <div className="flex flex-wrap gap-2">
                {job.location && (
                  <Chip icon="location_on">{job.location}</Chip>
                )}
                <Chip icon="schedule">
                  {employmentLabels[job.employment_type] ?? job.employment_type}
                </Chip>
                {job.salary_range && (
                  <Chip icon="payments">{job.salary_range}</Chip>
                )}
                {job.daily_budget != null && (
                  <Chip icon="campaign">{job.daily_budget} €/Tag Ads</Chip>
                )}
              </div>

              {/* 3 – Kurzbeschreibung */}
              {job.description && (
                <Section icon="info" label="Kurzbeschreibung">
                  <Body>{job.description}</Body>
                </Section>
              )}

              {/* 4 – Hauptaufgaben */}
              {job.main_tasks && (
                <Section icon="task_alt" label="Hauptaufgaben">
                  <BulletList text={job.main_tasks} />
                </Section>
              )}

              {/* 5 + 6 – Qualifikationen */}
              {(job.must_qualifications || job.nice_to_have_qualifications) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {job.must_qualifications && (
                    <Section icon="verified" label="Muss-Qualifikationen">
                      <BulletList text={job.must_qualifications} />
                    </Section>
                  )}
                  {job.nice_to_have_qualifications && (
                    <Section icon="thumb_up" label="Nice-to-Have">
                      <BulletList text={job.nice_to_have_qualifications} />
                    </Section>
                  )}
                </div>
              )}

              {/* 7 – KO-Kriterien */}
              {job.ko_criteria && (
                <Section icon="block" label="KO-Kriterien">
                  <BulletList text={job.ko_criteria} className="text-error" />
                </Section>
              )}

              {/* 8 + 9 – Skills */}
              {(job.hard_skills || job.soft_skills) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {job.hard_skills && (
                    <Section icon="build" label="Hard Skills">
                      <BulletList text={job.hard_skills} />
                    </Section>
                  )}
                  {job.soft_skills && (
                    <Section icon="psychology" label="Soft Skills">
                      <BulletList text={job.soft_skills} />
                    </Section>
                  )}
                </div>
              )}

              {/* 13 – Benefits */}
              {job.benefits && (
                <Section icon="card_giftcard" label="Benefits">
                  <BulletList text={job.benefits} />
                </Section>
              )}

              {/* 14 – Zielkandidatenprofil */}
              {job.ideal_candidate && (
                <Section icon="person_search" label="Zielkandidatenprofil">
                  <BulletList text={job.ideal_candidate} />
                </Section>
              )}

              {/* KI-Anforderungen */}
              {job.requirements && (
                <Section icon="psychology_alt" label="KI-Scoring Anforderungen">
                  <Body>{job.requirements}</Body>
                </Section>
              )}

              {/* 15 – Bewerbungsprozess */}
              {job.application_process && (
                <Section icon="linear_scale" label="Bewerbungsprozess">
                  <ProcessSteps text={job.application_process} />
                </Section>
              )}

              {/* Empty state */}
              {!job.description && !job.main_tasks && !job.must_qualifications &&
               !job.hard_skills && !job.ideal_candidate && !job.application_process && (
                <div className="flex flex-col items-center py-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl text-outline-variant mb-2">description</span>
                  <p className="font-body text-sm">Noch keine Beschreibungen hinterlegt.</p>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-outline-variant/10">
                <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
                  Erstellt am {new Date(job.created_at).toLocaleDateString("de-AT", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Chip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg">
      <span className="material-symbols-outlined text-outline-variant text-sm">{icon}</span>
      {children}
    </div>
  );
}

function Section({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">{label}</span>
      </div>
      {children}
    </div>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-body text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{children}</p>
  );
}

function BulletList({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <ul className="space-y-1">
      {lines.map((line, i) => (
        <li key={i} className={`flex items-start gap-2 font-body text-sm leading-relaxed ${className || "text-on-surface"}`}>
          <span className="mt-1.5 w-1 h-1 rounded-full bg-current flex-shrink-0 opacity-50" />
          {line}
        </li>
      ))}
    </ul>
  );
}

function ProcessSteps({ text }: { text: string }) {
  const steps = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex items-center gap-3 font-body text-sm text-on-surface">
          <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
            {i + 1}
          </span>
          {step}
        </li>
      ))}
    </ol>
  );
}
