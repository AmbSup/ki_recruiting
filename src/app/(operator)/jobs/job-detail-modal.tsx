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

const statusOptions = [
  { value: "draft", label: "Entwurf" },
  { value: "active", label: "Aktiv" },
  { value: "paused", label: "Pausiert" },
  { value: "closed", label: "Geschlossen" },
  { value: "filled", label: "Besetzt" },
];

const employmentOptions = [
  { value: "fulltime", label: "Vollzeit" },
  { value: "parttime", label: "Teilzeit" },
  { value: "minijob", label: "Minijob" },
  { value: "internship", label: "Praktikum" },
  { value: "freelance", label: "Freelance" },
];

type Props = { jobId: string | null; onClose: () => void };

export function JobDetailModal({ jobId, onClose }: Props) {
  const [job, setJob] = useState<JobDetail | null>(null);
  const [form, setForm] = useState<Partial<JobDetail>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "images">("details");

  useEffect(() => {
    if (!jobId) return;
    setJob(null);
    setForm({});
    setDirty(false);
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
        const j = data as unknown as JobDetail;
        setJob(j);
        setForm(j);
        setLoading(false);
      });
  }, [jobId]);

  function update(field: string, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  async function save() {
    if (!jobId || !dirty) return;
    setSaving(true);
    const supabase = createClient();
    const { title, category, description, location, employment_type,
      salary_range, daily_budget, benefits, main_tasks,
      must_qualifications, nice_to_have_qualifications, ko_criteria,
      hard_skills, soft_skills, requirements, ideal_candidate,
      application_process, status } = form;
    await supabase.from("jobs").update({
      title, category, description, location, employment_type,
      salary_range, daily_budget: daily_budget ? Number(daily_budget) : null,
      benefits, main_tasks, must_qualifications, nice_to_have_qualifications,
      ko_criteria, hard_skills, soft_skills, requirements,
      ideal_candidate, application_process, status,
    }).eq("id", jobId);
    setDirty(false);
    setSaving(false);
  }

  if (!jobId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline-variant/20 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="font-headline text-2xl italic text-on-surface leading-tight">
              {loading ? "Lädt…" : form.title || "Job"}
            </h2>
            {job?.company?.name && (
              <p className="font-label text-xs text-outline mt-0.5">{job.company.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-60">
                <span className="material-symbols-outlined text-xs">{saving ? "progress_activity" : "save"}</span>
                {saving ? "Speichert…" : "Speichern"}
              </button>
            )}
            <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface transition-colors">
              close
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-6 pb-0 pt-1 border-b border-outline-variant/20 flex-shrink-0">
          {(["details", "images"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 font-label text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-outline hover:text-on-surface"
              }`}>
              <span className="material-symbols-outlined text-sm">
                {tab === "details" ? "edit" : "image"}
              </span>
              {tab === "details" ? "Bearbeiten" : "Ad Bilder"}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {activeTab === "images" && job ? (
            <JobAdImages jobId={job.id} jobTitle={job.title} jobLocation={job.location} />
          ) : loading ? (
            <div className="space-y-3">
              {[100, 80, 60, 100, 90].map((w, i) => (
                <div key={i} className="h-10 bg-surface-container-high rounded-xl animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : (
            <>
              {/* Grunddaten */}
              <FieldGroup label="Grunddaten" icon="work">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Jobtitel" value={form.title ?? ""} onChange={(v) => update("title", v)} className="col-span-2" />
                  <SelectField label="Status" value={form.status ?? "draft"} options={statusOptions} onChange={(v) => update("status", v)} />
                  <Field label="Kategorie" value={form.category ?? ""} onChange={(v) => update("category", v)} />
                  <Field label="Standort" value={form.location ?? ""} onChange={(v) => update("location", v)} />
                  <SelectField label="Anstellungsart" value={form.employment_type ?? "fulltime"} options={employmentOptions} onChange={(v) => update("employment_type", v)} />
                  <Field label="Gehalt" value={form.salary_range ?? ""} onChange={(v) => update("salary_range", v)} />
                  <Field label="Ads-Budget/Tag (€)" value={form.daily_budget != null ? String(form.daily_budget) : ""} onChange={(v) => update("daily_budget", v ? Number(v) : null)} type="number" />
                </div>
                <TextArea label="Kurzbeschreibung" value={form.description ?? ""} onChange={(v) => update("description", v)} rows={3} />
              </FieldGroup>

              {/* Aufgaben & Qualifikationen */}
              <FieldGroup label="Aufgaben & Qualifikationen" icon="task_alt">
                <TextArea label="Hauptaufgaben" value={form.main_tasks ?? ""} onChange={(v) => update("main_tasks", v)} rows={3} placeholder="Eine Aufgabe pro Zeile" />
                <div className="grid grid-cols-2 gap-3">
                  <TextArea label="Muss-Qualifikationen" value={form.must_qualifications ?? ""} onChange={(v) => update("must_qualifications", v)} rows={3} />
                  <TextArea label="Nice-to-Have" value={form.nice_to_have_qualifications ?? ""} onChange={(v) => update("nice_to_have_qualifications", v)} rows={3} />
                </div>
                <TextArea label="KO-Kriterien" value={form.ko_criteria ?? ""} onChange={(v) => update("ko_criteria", v)} rows={2} placeholder="Ausschlussgründe, eine pro Zeile" />
              </FieldGroup>

              {/* Skills */}
              <FieldGroup label="Skills" icon="build">
                <div className="grid grid-cols-2 gap-3">
                  <TextArea label="Hard Skills" value={form.hard_skills ?? ""} onChange={(v) => update("hard_skills", v)} rows={3} />
                  <TextArea label="Soft Skills" value={form.soft_skills ?? ""} onChange={(v) => update("soft_skills", v)} rows={3} />
                </div>
              </FieldGroup>

              {/* Benefits & Profil */}
              <FieldGroup label="Benefits & Kandidatenprofil" icon="person_search">
                <TextArea label="Benefits" value={form.benefits ?? ""} onChange={(v) => update("benefits", v)} rows={3} />
                <TextArea label="Ideales Kandidatenprofil" value={form.ideal_candidate ?? ""} onChange={(v) => update("ideal_candidate", v)} rows={3} />
              </FieldGroup>

              {/* KI & Prozess */}
              <FieldGroup label="KI-Scoring & Prozess" icon="psychology">
                <TextArea label="KI-Scoring Anforderungen" value={form.requirements ?? ""} onChange={(v) => update("requirements", v)} rows={3} placeholder="Spezifische Anweisungen für die KI-Bewertung" />
                <TextArea label="Bewerbungsprozess" value={form.application_process ?? ""} onChange={(v) => update("application_process", v)} rows={3} placeholder="Schritte des Bewerbungsprozesses, einer pro Zeile" />
              </FieldGroup>

              {/* Footer */}
              <div className="pt-4 border-t border-outline-variant/10">
                <p className="font-label text-xs text-outline">
                  Erstellt am {job?.created_at ? new Date(job.created_at).toLocaleDateString("de-AT", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Form Sub-components ── */

function FieldGroup({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">{label}</span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, className = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="font-label text-xs text-outline block mb-1">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 3, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  rows?: number; placeholder?: string;
}) {
  return (
    <div>
      {label && <label className="font-label text-xs text-outline block mb-1">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="font-label text-xs text-outline block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 font-body text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
