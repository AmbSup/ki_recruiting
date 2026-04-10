"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = { open: boolean; onClose: () => void; onSuccess?: () => void };
type Company = { id: string; name: string };

const CATEGORIES = [
  "Handwerk", "IT", "Engineering", "Vertrieb", "Verwaltung",
  "Logistik", "Gesundheit", "Gastronomie", "Bau", "Sonstige",
];

const STEPS = ["Basis", "Aufgaben & Skills", "Profil & Prozess"];

export function JobModal({ open, onClose, onSuccess }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    // Step 0 – Basis
    company_id: "",
    title: "",
    category: "",
    description: "",
    location: "",
    employment_type: "fulltime",
    salary_range: "",
    daily_budget: "",
    benefits: "",
    // Step 1 – Aufgaben & Skills
    main_tasks: "",
    must_qualifications: "",
    nice_to_have_qualifications: "",
    ko_criteria: "",
    hard_skills: "",
    soft_skills: "",
    // Step 2 – Profil & Prozess
    requirements: "",
    ideal_candidate: "",
    application_process: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      supabase.from("companies").select("id, name").eq("status", "active").then(({ data }) => {
        if (data) setCompanies(data);
      });
      setStep(0);
      setError(null);
    }
  }, [open]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      ...form,
      daily_budget: form.daily_budget ? Number(form.daily_budget) : null,
    };

    const { error } = await supabase.from("jobs").insert([payload]);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onClose();
      onSuccess?.();
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20 flex-shrink-0">
          <div>
            <h2 className="font-headline text-2xl italic text-on-surface">Neuer Job</h2>
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mt-0.5">
              Stelle anlegen
            </p>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface transition-colors">
            close
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 px-6 pt-4 pb-2 flex-shrink-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => setStep(i)}
                className={`flex items-center gap-2 text-[10px] font-label font-bold uppercase tracking-widest transition-colors ${
                  i === step ? "text-primary" : i < step ? "text-secondary" : "text-outline"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-colors ${
                  i === step ? "bg-primary text-on-primary" :
                  i < step  ? "bg-secondary text-on-secondary" :
                  "bg-surface-container-high text-outline"
                }`}>
                  {i < step ? "✓" : i + 1}
                </span>
                <span className="hidden sm:block">{s}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 ${i < step ? "bg-secondary" : "bg-outline-variant/20"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── STEP 0: Basis ── */}
          {step === 0 && (
            <>
              <SectionLabel>Grundinformationen</SectionLabel>

              <Field label="Firma *">
                <select
                  required
                  value={form.company_id}
                  onChange={(e) => set("company_id", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Firma auswählen…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Jobtitel *">
                  <input
                    required
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Metallbauer (m/w/d)"
                    className={inputClass}
                  />
                </Field>
                <Field label="Jobkategorie">
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Kategorie wählen…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Kurzbeschreibung der Rolle">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="2–3 Sätze über den Zweck der Stelle…"
                  rows={3}
                  className={inputClass + " resize-none"}
                />
              </Field>

              <SectionLabel>Konditionen</SectionLabel>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Standort">
                  <input
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="Wien, Österreich"
                    className={inputClass}
                  />
                </Field>
                <Field label="Arbeitsmodell">
                  <select
                    value={form.employment_type}
                    onChange={(e) => set("employment_type", e.target.value)}
                    className={inputClass}
                  >
                    <option value="fulltime">Vollzeit</option>
                    <option value="parttime">Teilzeit</option>
                    <option value="minijob">Minijob</option>
                    <option value="internship">Praktikum</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Gehaltsrahmen">
                  <input
                    value={form.salary_range}
                    onChange={(e) => set("salary_range", e.target.value)}
                    placeholder="€2.800 – €3.400 brutto"
                    className={inputClass}
                  />
                </Field>
                <Field label="Tagesbudget Ads (€)">
                  <input
                    type="number"
                    value={form.daily_budget}
                    onChange={(e) => set("daily_budget", e.target.value)}
                    placeholder="30"
                    min="0"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Benefits">
                <textarea
                  value={form.benefits}
                  onChange={(e) => set("benefits", e.target.value)}
                  placeholder="Firmenauto, Weiterbildung, Homeoffice, Bonus…"
                  rows={2}
                  className={inputClass + " resize-none"}
                />
              </Field>
            </>
          )}

          {/* ── STEP 1: Aufgaben & Skills ── */}
          {step === 1 && (
            <>
              <SectionLabel>Aufgaben</SectionLabel>

              <Field label="Hauptaufgaben">
                <textarea
                  value={form.main_tasks}
                  onChange={(e) => set("main_tasks", e.target.value)}
                  placeholder={"Montage von Metallkonstruktionen\nArbeiten nach technischen Zeichnungen\nQualitätskontrolle"}
                  rows={4}
                  className={inputClass + " resize-none"}
                />
              </Field>

              <SectionLabel>Qualifikationen</SectionLabel>

              <Field label="Muss-Qualifikationen">
                <textarea
                  value={form.must_qualifications}
                  onChange={(e) => set("must_qualifications", e.target.value)}
                  placeholder={"Ausbildung als Metallbauer\n2 Jahre Berufserfahrung"}
                  rows={3}
                  className={inputClass + " resize-none"}
                />
              </Field>

              <Field label="Nice-to-Have-Qualifikationen">
                <textarea
                  value={form.nice_to_have_qualifications}
                  onChange={(e) => set("nice_to_have_qualifications", e.target.value)}
                  placeholder={"Schweißzertifikat\nErfahrung mit CNC"}
                  rows={3}
                  className={inputClass + " resize-none"}
                />
              </Field>

              <Field label="KO-Kriterien (Ausschlussregeln)">
                <textarea
                  value={form.ko_criteria}
                  onChange={(e) => set("ko_criteria", e.target.value)}
                  placeholder={"Kein Führerschein B\nDeutsch unter B1\nKeine Arbeitserlaubnis"}
                  rows={3}
                  className={inputClass + " resize-none"}
                />
              </Field>

              <SectionLabel>Skills</SectionLabel>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Hard Skills">
                  <textarea
                    value={form.hard_skills}
                    onChange={(e) => set("hard_skills", e.target.value)}
                    placeholder={"MIG/MAG Schweißen\nAutoCAD\nSAP"}
                    rows={4}
                    className={inputClass + " resize-none"}
                  />
                </Field>
                <Field label="Soft Skills">
                  <textarea
                    value={form.soft_skills}
                    onChange={(e) => set("soft_skills", e.target.value)}
                    placeholder={"Teamfähigkeit\nZuverlässigkeit\nEigenständiges Arbeiten"}
                    rows={4}
                    className={inputClass + " resize-none"}
                  />
                </Field>
              </div>
            </>
          )}

          {/* ── STEP 2: Profil & Prozess ── */}
          {step === 2 && (
            <>
              <SectionLabel>KI-Matching</SectionLabel>

              <Field label="Anforderungen (für KI-Scoring)">
                <textarea
                  value={form.requirements}
                  onChange={(e) => set("requirements", e.target.value)}
                  placeholder="Mindestens 2 Jahre Erfahrung in…"
                  rows={3}
                  className={inputClass + " resize-none"}
                />
              </Field>

              <Field label="Zielkandidatenprofil">
                <textarea
                  value={form.ideal_candidate}
                  onChange={(e) => set("ideal_candidate", e.target.value)}
                  placeholder={"Metallbauer aus Österreich\n25–45 Jahre\nErfahrung im Stahlbau"}
                  rows={3}
                  className={inputClass + " resize-none"}
                />
              </Field>

              <SectionLabel>Recruiting-Ablauf</SectionLabel>

              <Field label="Bewerbungsprozess">
                <textarea
                  value={form.application_process}
                  onChange={(e) => set("application_process", e.target.value)}
                  placeholder={"Funnel Bewerbung\nKI-Telefoninterview\nFachgespräch\nEinstellung"}
                  rows={4}
                  className={inputClass + " resize-none"}
                />
              </Field>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-error-container/20 border border-error-container/40 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-error text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <span className="font-body text-sm text-error">{error}</span>
            </div>
          )}
        </form>

        {/* Footer Navigation */}
        <div className="flex gap-3 px-6 py-4 border-t border-outline-variant/10 flex-shrink-0">
          <button
            type="button"
            onClick={step === 0 ? onClose : () => setStep(step - 1)}
            className="flex-1 border border-outline-variant/30 text-on-surface-variant rounded-xl py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors"
          >
            {step === 0 ? "Abbrechen" : "Zurück"}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex-1 bg-primary text-on-primary rounded-xl py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors flex items-center justify-center gap-2"
            >
              Weiter
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit as unknown as React.MouseEventHandler}
              className="flex-1 bg-primary text-on-primary rounded-xl py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-sm">save</span>}
              Als Entwurf speichern
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline pt-2 border-t border-outline-variant/10 first:border-0 first:pt-0">
      {children}
    </p>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
