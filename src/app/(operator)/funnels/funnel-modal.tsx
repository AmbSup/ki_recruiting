"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = { open: boolean; onClose: () => void; onSuccess?: () => void };
type Job = { id: string; title: string; company: { name: string } };

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[äöü]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue" }[c] ?? c))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function FunnelModal({ open, onClose, onSuccess }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState({
    job_id: "",
    name: "",
    slug: "",
    intro_headline: "",
    intro_subtext: "",
    consent_text:
      "Mit dem Absenden deiner Bewerbung stimmst du der Verarbeitung deiner Daten gemäß unserer Datenschutzerklärung zu.",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      supabase
        .from("jobs")
        .select("id, title, status, company:companies(name)")
        .in("status", ["active", "draft", "paused"])
        .then(({ data }) => {
          if (data) setJobs(data as unknown as Job[]);
        });
    }
  }, [open]);

  function handleNameChange(name: string) {
    setForm({ ...form, name, slug: slugify(name) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("funnels").insert([{ ...form, funnel_type: "internal" }]);

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
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline text-2xl italic text-on-surface">Neuer Funnel</h2>
            <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mt-0.5">
              Bewerbungs-Funnel erstellen
            </p>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface transition-colors">
            close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Field label="Job *">
            <select
              required
              value={form.job_id}
              onChange={(e) => setForm({ ...form, job_id: e.target.value })}
              className={inputClass}
            >
              <option value="">Job auswählen…</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} · {j.company.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Funnel-Name *">
            <input
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Lagerarbeiter Variante A"
              className={inputClass}
            />
          </Field>

          <Field label="URL-Slug">
            <div className="flex items-center gap-0 bg-surface-container-low border border-outline-variant/20 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors">
              <span className="px-3 py-2.5 font-label text-xs text-outline border-r border-outline-variant/20 whitespace-nowrap">
                apply.domain.com/
              </span>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="lagerarbeiter-a"
                className="flex-1 bg-transparent px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none"
              />
            </div>
          </Field>

          <Field label="Startseite Headline">
            <input
              value={form.intro_headline}
              onChange={(e) => setForm({ ...form, intro_headline: e.target.value })}
              placeholder="Wir suchen dich als Lagerarbeiter!"
              className={inputClass}
            />
          </Field>

          <Field label="Startseite Beschreibung">
            <textarea
              value={form.intro_subtext}
              onChange={(e) => setForm({ ...form, intro_subtext: e.target.value })}
              placeholder="Bewirb dich jetzt in nur 2 Minuten…"
              rows={2}
              className={inputClass + " resize-none"}
            />
          </Field>

          <Field label="Datenschutz-Text">
            <textarea
              value={form.consent_text}
              onChange={(e) => setForm({ ...form, consent_text: e.target.value })}
              rows={2}
              className={inputClass + " resize-none text-xs"}
            />
          </Field>

          {error && (
            <div className="flex items-center gap-2 bg-error-container/20 border border-error-container/40 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-error text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <span className="font-body text-sm text-error">{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-outline-variant/30 text-on-surface-variant rounded-xl py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors">
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-on-primary rounded-xl py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading
                ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-sm">save</span>}
              Erstellen & Editor öffnen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
