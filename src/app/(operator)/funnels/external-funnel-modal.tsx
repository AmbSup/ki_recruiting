"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = { open: boolean; onClose: () => void; onSuccess?: () => void };
type Job = { id: string; title: string; company: { name: string } };

export function ExternalFunnelModal({ open, onClose, onSuccess }: Props) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [form, setForm] = useState({ name: "", external_url: "", job_id: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      setForm({ name: "", external_url: "", job_id: "" });
      setError(null);
      supabase
        .from("jobs")
        .select("id, title, company:companies(name)")
        .eq("status", "active")
        .then(({ data }) => {
          if (data) setJobs(data as unknown as Job[]);
        });
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.external_url.startsWith("http")) {
      setError("Bitte eine gültige URL eingeben (beginnt mit http)");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("funnels").insert([
      {
        name: form.name,
        slug: `ext-${Date.now()}`,
        funnel_type: "external",
        external_url: form.external_url,
        job_id: form.job_id,
        status: "active",
      },
    ]);

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
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline text-2xl italic text-on-surface">Externer Funnel</h2>
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mt-0.5">
              Externen Bewerbungs-Link hinzufügen
            </p>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface transition-colors">
            close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className={labelClass}>Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="z.B. Involve.me Bewerbungsformular"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Externe URL *</label>
            <input
              required
              type="url"
              value={form.external_url}
              onChange={(e) => setForm({ ...form, external_url: e.target.value })}
              placeholder="https://martin-amon.involve.me/resume-collection"
              className={inputClass}
            />
            <p className="font-label text-[10px] text-outline-variant mt-1">
              Vollständige URL zum externen Funnel (involve.me, Typeform, etc.)
            </p>
          </div>

          <div>
            <label className={labelClass}>Job *</label>
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
          </div>

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
                : <span className="material-symbols-outlined text-sm">add_link</span>}
              Hinzufügen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelClass = "font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-1.5";
const inputClass = "w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
