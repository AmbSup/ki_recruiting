"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = { open: boolean; onClose: () => void; onSuccess?: () => void };
type Company = { id: string; name: string };

export function ProgramModal({ open, onClose, onSuccess }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState({
    company_id: "",
    name: "",
    product_pitch: "",
    value_proposition: "",
    target_persona: "",
    booking_link: "",
    auto_dial: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm({
      company_id: "", name: "", product_pitch: "", value_proposition: "",
      target_persona: "", booking_link: "", auto_dial: false,
    });
    const supabase = createClient();
    supabase.from("companies").select("id, name").order("name").then(({ data }) => {
      if (data) setCompanies(data as Company[]);
    });
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company_id || !form.name) { setError("Firma und Name sind Pflicht"); return; }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/sales/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Unbekannter Fehler");
      setLoading(false);
      return;
    }
    setLoading(false);
    onClose();
    onSuccess?.();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline text-2xl italic text-on-surface">Neues Sales Program</h2>
            <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mt-0.5">
              Pitch & Targeting anlegen
            </p>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface transition-colors">
            close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Field label="Firma *">
            <select
              required
              value={form.company_id}
              onChange={(e) => setForm({ ...form, company_id: e.target.value })}
              className={inputClass}
            >
              <option value="">Firma auswählen…</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Name *">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="z.B. B2B Closer Outbound"
              className={inputClass}
            />
          </Field>

          <Field label="Pitch">
            <textarea
              value={form.product_pitch}
              onChange={(e) => setForm({ ...form, product_pitch: e.target.value })}
              placeholder="Kurze Beschreibung dessen, was verkauft wird — der KI-Agent liest das am Gesprächsbeginn vor."
              rows={3}
              className={inputClass + " resize-none"}
            />
          </Field>

          <Field label="Value Proposition">
            <textarea
              value={form.value_proposition}
              onChange={(e) => setForm({ ...form, value_proposition: e.target.value })}
              placeholder="Welches Problem wird gelöst? 2–3 konkrete Pain-Points."
              rows={2}
              className={inputClass + " resize-none"}
            />
          </Field>

          <Field label="Zielpersona">
            <textarea
              value={form.target_persona}
              onChange={(e) => setForm({ ...form, target_persona: e.target.value })}
              placeholder="Rolle, Firmengröße, typische Einwände…"
              rows={2}
              className={inputClass + " resize-none"}
            />
          </Field>

          <Field label="Booking-Link">
            <input
              type="url"
              value={form.booking_link}
              onChange={(e) => setForm({ ...form, booking_link: e.target.value })}
              placeholder="https://cal.com/… (wird dem Lead nach dem Call zugeschickt)"
              className={inputClass}
            />
          </Field>

          <div className="flex items-start gap-3 bg-surface-container-low rounded-xl p-4">
            <input
              id="auto_dial"
              type="checkbox"
              checked={form.auto_dial}
              onChange={(e) => setForm({ ...form, auto_dial: e.target.checked })}
              className="mt-0.5"
            />
            <label htmlFor="auto_dial" className="flex-1 cursor-pointer">
              <div className="font-label text-xs font-bold text-on-surface mb-0.5">Auto-Dial aktivieren</div>
              <div className="font-body text-xs text-outline">
                Frisch reinkommende Leads (Funnel, Meta, CSV) sofort anrufen lassen. Kann später im Detail geändert werden.
              </div>
            </label>
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
                : <span className="material-symbols-outlined text-sm">save</span>}
              Erstellen
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

const inputClass = "w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
