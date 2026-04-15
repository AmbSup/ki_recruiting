"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImageUpload } from "@/components/ui/image-upload";
import { JobAdImages } from "../job-ad-images";
import Link from "next/link";

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
  selected_ad_image_url: string | null;
  main_tasks: string | null;
  must_qualifications: string | null;
  nice_to_have_qualifications: string | null;
  ko_criteria: string | null;
  hard_skills: string | null;
  soft_skills: string | null;
  requirements: string | null;
  ideal_candidate: string | null;
  application_process: string | null;
  interview_questions: string | null;
  status: string;
  created_at: string;
  company: { id: string; name: string; logo_url: string | null };
};

type CompanyOption = { id: string; name: string };
type FunnelInfo = { id: string; name: string; slug: string; status: string };

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

const statusColors: Record<string, string> = {
  active: "bg-primary-container/40 text-primary",
  draft: "bg-surface-container-high text-outline",
  paused: "bg-tertiary-container/40 text-tertiary",
};

export default function JobEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const supabase = createClient();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [form, setForm] = useState<Partial<JobDetail>>({});
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [funnels, setFunnels] = useState<FunnelInfo[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "images">("edit");

  useEffect(() => {
    Promise.all([
      supabase
        .from("jobs")
        .select(`
          id, title, category, description, location, employment_type,
          salary_range, daily_budget, benefits, selected_ad_image_url,
          main_tasks, must_qualifications, nice_to_have_qualifications,
          ko_criteria, hard_skills, soft_skills,
          requirements, ideal_candidate, application_process, interview_questions,
          status, created_at,
          company:companies(id, name, logo_url)
        `)
        .eq("id", id)
        .single(),
      supabase.from("companies").select("id, name").order("name"),
      supabase.from("funnels").select("id, name, slug, status").eq("job_id", id).order("created_at", { ascending: false }),
    ]).then(([{ data }, { data: companyData }, { data: funnelData }]) => {
      const j = data as unknown as JobDetail;
      setJob(j);
      setForm(j);
      setSelectedCompanyId(j?.company?.id ?? "");
      setLogoUrl(j?.company?.logo_url ?? "");
      setCompanies((companyData ?? []) as CompanyOption[]);
      setFunnels((funnelData ?? []) as FunnelInfo[]);
      setLoading(false);
    });
  }, [id]);

  function update(field: string, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  async function save() {
    if (!dirty) return;
    setSaving(true);
    const { title, category, description, location, employment_type,
      salary_range, daily_budget, benefits, main_tasks,
      must_qualifications, nice_to_have_qualifications, ko_criteria,
      hard_skills, soft_skills, requirements, ideal_candidate,
      application_process, interview_questions, status } = form;
    await supabase.from("jobs").update({
      title, category, description, location, employment_type,
      salary_range, daily_budget: daily_budget ? Number(daily_budget) : null,
      benefits, main_tasks, must_qualifications, nice_to_have_qualifications,
      ko_criteria, hard_skills, soft_skills, requirements,
      ideal_candidate, application_process, interview_questions, status,
      company_id: selectedCompanyId || undefined,
    }).eq("id", id);
    setDirty(false);
    setSaving(false);
  }

  async function saveLogo(url: string) {
    if (!job?.company?.id) return;
    await supabase.from("companies").update({ logo_url: url || null }).eq("id", job.company.id);
    setLogoUrl(url);
  }

  async function deleteJob() {
    if (!confirm("Job wirklich löschen?")) return;
    await supabase.from("jobs").delete().eq("id", id);
    window.location.href = "/jobs";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-3xl text-outline animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="px-8 pt-10">
        <p className="font-body text-on-surface-variant">Job nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div className="px-8 pt-10 pb-32 max-w-[1400px]">

      {/* Back */}
      <Link href="/jobs"
        className="inline-flex items-center gap-1.5 text-outline hover:text-on-surface transition-colors mb-8">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest">Alle Jobs</span>
      </Link>

      {/* Hero Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-5">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-xl text-outline-variant">
                {(companies.find(c => c.id === selectedCompanyId)?.name ?? job.company.name ?? "?").slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="font-headline text-4xl italic text-on-surface leading-none mb-1">
              {form.title || job.title}
            </h1>
            <p className="font-label text-sm text-outline">
              {companies.find(c => c.id === selectedCompanyId)?.name ?? job.company.name}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {dirty && (
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-60">
              <span className="material-symbols-outlined text-sm">{saving ? "progress_activity" : "save"}</span>
              {saving ? "Speichert…" : "Speichern"}
            </button>
          )}
          <button onClick={deleteJob}
            className="flex items-center gap-1.5 border border-error/30 text-error px-4 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-error-container/20 transition-colors">
            <span className="material-symbols-outlined text-sm">delete</span>
            Löschen
          </button>
        </div>
      </div>

      {/* Funnels bar */}
      {funnels.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="font-label text-xs font-bold uppercase tracking-widest text-outline mr-1">Funnels:</span>
          {funnels.map((f) => (
            <Link key={f.id} href={`/funnels/${f.id}/editor`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label text-xs font-bold transition-colors hover:bg-primary-container/40 ${statusColors[f.status] ?? "bg-surface-container text-on-surface-variant"}`}>
              <span className="material-symbols-outlined text-xs">dynamic_feed</span>
              {f.name}
            </Link>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-outline-variant/20 mb-8">
        {([
          { key: "edit" as const, label: "Bearbeiten", icon: "edit" },
          { key: "images" as const, label: "Ad Bilder & Logo", icon: "image" },
        ]).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-5 py-3 font-label text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}>
            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Images & Logo */}
      {activeTab === "images" && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4 space-y-5">
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
              <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-4">Firmenlogo</h3>
              <ImageUpload value={logoUrl} onChange={saveLogo} aspect="circle" label="Logo hochladen" />
            </div>
            {job.selected_ad_image_url && (
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
                <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-4">Ausgewähltes Ad-Bild</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={job.selected_ad_image_url} alt="" className="w-full rounded-xl" />
              </div>
            )}
          </div>
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
              <JobAdImages jobId={job.id} jobTitle={job.title} jobLocation={job.location} />
            </div>
          </div>
        </div>
      )}

      {/* TAB: Edit */}
      {activeTab === "edit" && (
        <div className="grid grid-cols-12 gap-6">

          {/* Left column */}
          <div className="col-span-12 lg:col-span-7 space-y-5">

            {/* Grunddaten */}
            <Card label="Grunddaten" icon="work">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Jobtitel" value={form.title ?? ""} onChange={(v) => update("title", v)} className="col-span-2" />
                <SelectField label="Firma" value={selectedCompanyId}
                  options={companies.map(c => ({ value: c.id, label: c.name }))}
                  onChange={(v) => { setSelectedCompanyId(v); setDirty(true); }} />
                <SelectField label="Status" value={form.status ?? "draft"} options={statusOptions} onChange={(v) => update("status", v)} />
                <Field label="Kategorie" value={form.category ?? ""} onChange={(v) => update("category", v)} />
                <Field label="Standort" value={form.location ?? ""} onChange={(v) => update("location", v)} />
                <SelectField label="Anstellungsart" value={form.employment_type ?? "fulltime"} options={employmentOptions} onChange={(v) => update("employment_type", v)} />
                <Field label="Gehalt" value={form.salary_range ?? ""} onChange={(v) => update("salary_range", v)} />
                <Field label="Ads-Budget/Tag (€)" value={form.daily_budget != null ? String(form.daily_budget) : ""} onChange={(v) => update("daily_budget", v ? Number(v) : null)} type="number" />
              </div>
              <TextArea label="Kurzbeschreibung" value={form.description ?? ""} onChange={(v) => update("description", v)} rows={4} />
            </Card>

            {/* Aufgaben & Qualifikationen */}
            <Card label="Aufgaben & Qualifikationen" icon="task_alt">
              <TextArea label="Hauptaufgaben" value={form.main_tasks ?? ""} onChange={(v) => update("main_tasks", v)} rows={4} placeholder="Eine Aufgabe pro Zeile" />
              <div className="grid grid-cols-2 gap-4">
                <TextArea label="Muss-Qualifikationen" value={form.must_qualifications ?? ""} onChange={(v) => update("must_qualifications", v)} rows={4} />
                <TextArea label="Nice-to-Have" value={form.nice_to_have_qualifications ?? ""} onChange={(v) => update("nice_to_have_qualifications", v)} rows={4} />
              </div>
              <TextArea label="KO-Kriterien" value={form.ko_criteria ?? ""} onChange={(v) => update("ko_criteria", v)} rows={3} placeholder="Ausschlussgründe, eine pro Zeile" />
            </Card>

            {/* KI & Prozess */}
            <Card label="KI-Scoring & Bewerbungsprozess" icon="psychology">
              <TextArea label="KI-Scoring Anforderungen" value={form.requirements ?? ""} onChange={(v) => update("requirements", v)} rows={4} placeholder="Spezifische Anweisungen für die KI-Bewertung" />
              <TextArea label="Interview-Fragen" value={form.interview_questions ?? ""} onChange={(v) => update("interview_questions", v)} rows={4} placeholder="Fragen für das KI-Telefoninterview" />
              <TextArea label="Bewerbungsprozess" value={form.application_process ?? ""} onChange={(v) => update("application_process", v)} rows={3} placeholder="Schritte, einer pro Zeile" />
            </Card>
          </div>

          {/* Right column */}
          <div className="col-span-12 lg:col-span-5 space-y-5">

            {/* Skills */}
            <Card label="Skills" icon="build">
              <TextArea label="Hard Skills" value={form.hard_skills ?? ""} onChange={(v) => update("hard_skills", v)} rows={4} />
              <TextArea label="Soft Skills" value={form.soft_skills ?? ""} onChange={(v) => update("soft_skills", v)} rows={4} />
            </Card>

            {/* Benefits & Profil */}
            <Card label="Benefits & Kandidatenprofil" icon="person_search">
              <TextArea label="Benefits" value={form.benefits ?? ""} onChange={(v) => update("benefits", v)} rows={4} />
              <TextArea label="Ideales Kandidatenprofil" value={form.ideal_candidate ?? ""} onChange={(v) => update("ideal_candidate", v)} rows={4} />
            </Card>

            {/* Meta */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
              <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-4">Details</h3>
              <div className="space-y-3">
                {[
                  { label: "Job-ID", value: id.slice(0, 8) + "…" },
                  { label: "Erstellt", value: new Date(job.created_at).toLocaleDateString("de-AT", { day: "2-digit", month: "long", year: "numeric" }) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">{label}</span>
                    <span className="font-body text-xs text-on-surface-variant">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Form Sub-components ── */

function Card({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] space-y-4">
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
      {label && <label className="font-label text-xs text-outline block mb-1.5">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
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
      {label && <label className="font-label text-xs text-outline block mb-1.5">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
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
      <label className="font-label text-xs text-outline block mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
