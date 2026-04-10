"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = { open: boolean; onClose: () => void; onSuccess?: () => void };

const INDUSTRIES = [
  "Handwerk & Bau", "IT & Software", "Gesundheit & Pflege", "Logistik & Transport",
  "Handel & Retail", "Gastronomie & Hotellerie", "Produktion & Industrie",
  "Finanz & Versicherung", "Marketing & Medien", "Bildung", "Sonstige",
];

const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];

const STEPS = ["Stammdaten", "Recruiting", "Abrechnung"];

export function CompanyModal({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    // Step 0 – Stammdaten
    name: "",
    industry: "",
    company_size: "",
    website: "",
    address: "",
    description: "",
    primary_color: "#9a442d",
    // Step 1 – Recruiting
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    recruiting_goals: "",
    meta_ad_account_id: "",
    linkedin_ad_account_id: "",
    // Step 2 – Abrechnung
    billing_plan: "per_job",
    monthly_budget: "",
    contract_start: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const payload = {
      ...form,
      monthly_budget: form.monthly_budget ? Number(form.monthly_budget) : null,
      contract_start: form.contract_start || null,
    };

    const { error } = await supabase.from("companies").insert([payload]);

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
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20 flex-shrink-0">
          <div>
            <h2 className="font-headline text-2xl italic text-on-surface">Neue Firma</h2>
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mt-0.5">
              Kunden-Account anlegen
            </p>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface transition-colors">
            close
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center px-6 pt-4 pb-2 flex-shrink-0">
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── STEP 0: Stammdaten ── */}
          {step === 0 && (
            <>
              <Field label="Firmenname *">
                <input
                  required
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Musterfirma GmbH"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Branche">
                  <select value={form.industry} onChange={(e) => set("industry", e.target.value)} className={inputClass}>
                    <option value="">Branche wählen…</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </Field>
                <Field label="Unternehmensgröße">
                  <select value={form.company_size} onChange={(e) => set("company_size", e.target.value)} className={inputClass}>
                    <option value="">Größe wählen…</option>
                    {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} Mitarbeitende</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Website">
                  <input
                    value={form.website}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="https://musterfirma.at"
                    className={inputClass}
                  />
                </Field>
                <Field label="Adresse">
                  <input
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Musterstraße 1, 1010 Wien"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Unternehmensbeschreibung">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Kurze Beschreibung des Unternehmens, Produkte, Kultur…"
                  rows={3}
                  className={inputClass + " resize-none"}
                />
              </Field>

              <Field label="Brandfarbe">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => set("primary_color", e.target.value)}
                    className="w-10 h-10 rounded-lg border border-outline-variant/20 cursor-pointer bg-transparent p-1"
                  />
                  <input
                    value={form.primary_color}
                    onChange={(e) => set("primary_color", e.target.value)}
                    placeholder="#9a442d"
                    className={inputClass}
                  />
                </div>
              </Field>
            </>
          )}

          {/* ── STEP 1: Recruiting ── */}
          {step === 1 && (
            <>
              <SectionLabel>Ansprechpartner</SectionLabel>

              <Field label="Name">
                <input
                  value={form.contact_name}
                  onChange={(e) => set("contact_name", e.target.value)}
                  placeholder="Klaus Mayr"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="E-Mail">
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => set("contact_email", e.target.value)}
                    placeholder="k.mayr@firma.at"
                    className={inputClass}
                  />
                </Field>
                <Field label="Telefon">
                  <input
                    value={form.contact_phone}
                    onChange={(e) => set("contact_phone", e.target.value)}
                    placeholder="+43 1 234 5678"
                    className={inputClass}
                  />
                </Field>
              </div>

              <SectionLabel>Recruiting-Ziele</SectionLabel>

              <Field label="Offene Stellen & Ziele">
                <textarea
                  value={form.recruiting_goals}
                  onChange={(e) => set("recruiting_goals", e.target.value)}
                  placeholder={"3x Lagermitarbeiter bis Q3\n1x Teamleiter Logistik\nFokus auf Direktansprache via Meta Ads"}
                  rows={4}
                  className={inputClass + " resize-none"}
                />
              </Field>

              <SectionLabel>Ad Accounts</SectionLabel>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Meta Ad Account ID">
                  <input
                    value={form.meta_ad_account_id}
                    onChange={(e) => set("meta_ad_account_id", e.target.value)}
                    placeholder="act_123456789"
                    className={inputClass}
                  />
                </Field>
                <Field label="LinkedIn Ad Account ID">
                  <input
                    value={form.linkedin_ad_account_id}
                    onChange={(e) => set("linkedin_ad_account_id", e.target.value)}
                    placeholder="urn:li:…"
                    className={inputClass}
                  />
                </Field>
              </div>
            </>
          )}

          {/* ── STEP 2: Abrechnung ── */}
          {step === 2 && (
            <>
              <SectionLabel>Vertrag</SectionLabel>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Abrechnungsmodell">
                  <select value={form.billing_plan} onChange={(e) => set("billing_plan", e.target.value)} className={inputClass}>
                    <option value="per_job">Pro Job</option>
                    <option value="monthly">Monatlich</option>
                    <option value="custom">Custom</option>
                  </select>
                </Field>
                <Field label="Monatliches Budget (€)">
                  <input
                    type="number"
                    value={form.monthly_budget}
                    onChange={(e) => set("monthly_budget", e.target.value)}
                    placeholder="1500"
                    min="0"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Vertragsstart">
                <input
                  type="date"
                  value={form.contract_start}
                  onChange={(e) => set("contract_start", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <SectionLabel>Interne Notizen</SectionLabel>

              <Field label="Notizen">
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Interne Infos, besondere Anforderungen, Hinweise…"
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
        </div>

        {/* Footer */}
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
              onClick={() => {
                if (step === 0 && !form.name.trim()) {
                  setError("Firmenname ist erforderlich.");
                  return;
                }
                setError(null);
                setStep(step + 1);
              }}
              className="flex-1 bg-primary text-on-primary rounded-xl py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors flex items-center justify-center gap-2"
            >
              Weiter
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="flex-1 bg-primary text-on-primary rounded-xl py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-sm">save</span>}
              Speichern
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
