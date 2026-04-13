"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ImageUpload } from "@/components/ui/image-upload";
import { JobAdImages } from "../job-ad-images";

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
  company: { id: string; name: string; logo_url: string | null };
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  draft:  { label: "Entwurf",  bg: "bg-surface-container-high", text: "text-outline" },
  active: { label: "Aktiv",    bg: "bg-primary-container/40",   text: "text-primary" },
  paused: { label: "Pausiert", bg: "bg-tertiary-container/40",  text: "text-tertiary" },
  closed: { label: "Geschl.",  bg: "bg-error-container/20",     text: "text-error" },
  filled: { label: "Besetzt",  bg: "bg-secondary-container",    text: "text-secondary" },
};

const employmentLabels: Record<string, string> = {
  fulltime: "Vollzeit", parttime: "Teilzeit",
  minijob: "Minijob", internship: "Praktikum", freelance: "Freelance",
};

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [jobId, setJobId] = useState<string>("");
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Benefits edit state
  const [editingBenefits, setEditingBenefits] = useState(false);
  const [benefitsText, setBenefitsText] = useState("");
  const [savingBenefits, setSavingBenefits] = useState(false);

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [savingLogo, setSavingLogo] = useState(false);

  // Selected image preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => setJobId(id));
  }, [params]);

  useEffect(() => {
    if (!jobId) return;
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
        company:companies(id, name, logo_url)
      `)
      .eq("id", jobId)
      .single()
      .then(({ data }) => {
        if (data) {
          const j = data as unknown as JobDetail;
          setJob(j);
          setBenefitsText(j.benefits ?? "");
          setLogoUrl(j.company?.logo_url ?? "");
        }
        setLoading(false);
      });
  }, [jobId]);

  const saveBenefits = async () => {
    if (!job) return;
    setSavingBenefits(true);
    const supabase = createClient();
    await supabase.from("jobs").update({ benefits: benefitsText }).eq("id", job.id);
    setJob((prev) => prev ? { ...prev, benefits: benefitsText } : prev);
    setSavingBenefits(false);
    setEditingBenefits(false);
  };

  const saveLogo = async (url: string) => {
    if (!job) return;
    setLogoUrl(url);
    setSavingLogo(true);
    const supabase = createClient();
    await supabase.from("companies").update({ logo_url: url }).eq("id", job.company.id);
    setJob((prev) => prev ? { ...prev, company: { ...prev.company, logo_url: url } } : prev);
    setSavingLogo(false);
  };

  const benefitLines = (job?.benefits ?? "")
    .split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);

  if (loading) {
    return (
      <div className="px-8 pt-10 flex flex-col gap-6">
        <div className="h-4 w-24 bg-surface-container-high rounded animate-pulse" />
        <div className="h-10 w-64 bg-surface-container-high rounded-xl animate-pulse" />
        <div className="grid grid-cols-12 gap-6 mt-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="col-span-3 h-32 bg-surface-container-high rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="px-8 pt-10 text-on-surface-variant font-body">Job nicht gefunden.</div>
    );
  }

  const st = statusConfig[job.status] ?? statusConfig.draft;

  return (
    <div className="px-8 pt-8 pb-32">
      {/* Back */}
      <button
        onClick={() => router.push("/jobs")}
        className="flex items-center gap-1.5 font-label text-xs font-bold uppercase tracking-widest text-outline hover:text-on-surface transition-colors mb-6"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Alle Jobs
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-label font-bold uppercase tracking-widest px-3 py-1 rounded-full ${st.bg} ${st.text}`}>
              {st.label}
            </span>
            {job.category && (
              <span className="text-[10px] font-label font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant">
                {job.category}
              </span>
            )}
          </div>
          <h1 className="font-headline text-4xl italic text-on-surface leading-tight mb-1">{job.title}</h1>
          <p className="font-label text-sm text-outline">{job.company.name}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {job.location && <Chip icon="location_on">{job.location}</Chip>}
            <Chip icon="schedule">{employmentLabels[job.employment_type] ?? job.employment_type}</Chip>
            {job.salary_range && <Chip icon="payments">{job.salary_range}</Chip>}
            {job.daily_budget != null && <Chip icon="campaign">{job.daily_budget} €/Tag Ads</Chip>}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-12 gap-6">

        {/* LEFT: Description + Benefits */}
        <div className="col-span-12 lg:col-span-7 space-y-5">

          {/* Benefits */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">star</span>
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Benefits</span>
              </div>
              {!editingBenefits && (
                <button
                  onClick={() => setEditingBenefits(true)}
                  className="font-label text-[10px] font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">edit</span>
                  Bearbeiten
                </button>
              )}
            </div>

            {editingBenefits ? (
              <div className="space-y-3">
                <textarea
                  value={benefitsText}
                  onChange={(e) => setBenefitsText(e.target.value)}
                  rows={5}
                  placeholder={"Firmenauto\nWeiterbildungsbudget\nFlexible Arbeitszeiten\nHomeoffice\nBonus"}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
                />
                <p className="font-label text-[10px] text-outline">Ein Benefit pro Zeile</p>
                <div className="flex gap-2">
                  <button
                    onClick={saveBenefits}
                    disabled={savingBenefits}
                    className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">{savingBenefits ? "hourglass_empty" : "save"}</span>
                    {savingBenefits ? "Speichern…" : "Speichern"}
                  </button>
                  <button
                    onClick={() => { setEditingBenefits(false); setBenefitsText(job.benefits ?? ""); }}
                    className="px-4 py-2 rounded-xl font-label text-xs font-bold uppercase tracking-widest bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : benefitLines.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {benefitLines.map((b, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container/30 text-primary rounded-full font-label text-xs font-bold">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    {b}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-body text-sm text-on-surface-variant">
                Noch keine Benefits eingetragen.{" "}
                <button onClick={() => setEditingBenefits(true)} className="text-primary underline">Jetzt hinzufügen</button>
              </p>
            )}
          </div>

          {/* Description */}
          {job.description && (
            <Section icon="info" label="Kurzbeschreibung">
              <Body>{job.description}</Body>
            </Section>
          )}
          {job.main_tasks && (
            <Section icon="task_alt" label="Hauptaufgaben">
              <BulletList text={job.main_tasks} />
            </Section>
          )}
          {(job.must_qualifications || job.nice_to_have_qualifications) && (
            <div className="grid grid-cols-2 gap-4">
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
          {job.ko_criteria && (
            <Section icon="block" label="KO-Kriterien">
              <BulletList text={job.ko_criteria} className="text-error" />
            </Section>
          )}
          {(job.hard_skills || job.soft_skills) && (
            <div className="grid grid-cols-2 gap-4">
              {job.hard_skills && <Section icon="build" label="Hard Skills"><BulletList text={job.hard_skills} /></Section>}
              {job.soft_skills && <Section icon="psychology" label="Soft Skills"><BulletList text={job.soft_skills} /></Section>}
            </div>
          )}
          {job.ideal_candidate && (
            <Section icon="person_search" label="Zielkandidatenprofil">
              <BulletList text={job.ideal_candidate} />
            </Section>
          )}
          {job.application_process && (
            <Section icon="linear_scale" label="Bewerbungsprozess">
              <ProcessSteps text={job.application_process} />
            </Section>
          )}
        </div>

        {/* RIGHT: Logo + Ad Bilder + Vorschau */}
        <div className="col-span-12 lg:col-span-5 space-y-5">

          {/* Logo */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-sm">business</span>
              <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Firmenlogo</span>
              {savingLogo && <span className="ml-auto font-label text-[10px] text-outline animate-pulse">Speichert…</span>}
            </div>
            <ImageUpload
              value={logoUrl}
              onChange={saveLogo}
              aspect="circle"
              label="Logo hochladen"
            />
          </div>

          {/* Ad Bilder */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-sm">image</span>
              <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Ad Bilder</span>
            </div>
            <JobAdImages
              jobId={job.id}
              jobTitle={job.title}
              jobLocation={job.location}
              onSelect={(url) => setPreviewUrl(url)}
            />
          </div>

          {/* Vorschau */}
          {previewUrl && (
            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">preview</span>
                  <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Vorschau</span>
                </div>
                <button onClick={() => setPreviewUrl(null)} className="material-symbols-outlined text-outline text-base hover:text-on-surface">close</button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Vorschau" className="w-full rounded-xl" />
              <div className="mt-3 space-y-1">
                <p className="font-label text-xs font-bold text-on-surface">{job.title}</p>
                {benefitLines.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {benefitLines.slice(0, 3).map((b, i) => (
                      <span key={i} className="text-[10px] font-label font-bold px-2 py-0.5 bg-primary-container/30 text-primary rounded-full">
                        ✓ {b}
                      </span>
                    ))}
                  </div>
                )}
                {logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <div className="flex items-center gap-2 mt-2">
                    <img src={logoUrl} alt="Logo" className="w-6 h-6 rounded object-contain" />
                    <span className="font-label text-[10px] text-outline">{job.company.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
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
    <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">{label}</span>
      </div>
      {children}
    </div>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return <p className="font-body text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{children}</p>;
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
          <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
          {step}
        </li>
      ))}
    </ol>
  );
}
