"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (leadId: string) => void;
  defaultProgramId?: string;
};

type Program = { id: string; name: string; company: { name: string } };
type CustomFieldRow = { key: string; value: string };

const initialForm = {
  sales_program_id: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company_name: "",
  role: "",
  notes: "",
};

export function LeadModal({ open, onClose, onSuccess, defaultProgramId }: Props) {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [form, setForm] = useState(initialForm);
  const [customFields, setCustomFields] = useState<CustomFieldRow[]>([]);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setConsent(false);
    setCustomFields([]);
    setForm({ ...initialForm, sales_program_id: defaultProgramId ?? "" });
    const supabase = createClient();
    supabase
      .from("sales_programs")
      .select("id, name, status, company:companies(name)")
      .in("status", ["active", "draft", "paused"])
      .order("name")
      .then(({ data }) => {
        if (data) setPrograms(data as unknown as Program[]);
      });
  }, [open, defaultProgramId]);

  function setCustomField(idx: number, patch: Partial<CustomFieldRow>) {
    setCustomFields((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.sales_program_id) { setError("Bitte Program auswählen"); return; }
    if (!form.phone.trim()) { setError("Telefonnummer ist Pflicht"); return; }
    if (!consent) { setError("Opt-In-Bestätigung ist Pflicht"); return; }
    setLoading(true);
    setError(null);

    const customFieldsObj: Record<string, string> = {};
    for (const row of customFields) {
      const k = row.key.trim();
      const v = row.value.trim();
      if (k && v) customFieldsObj[k] = v;
    }
    const fullName = [form.first_name, form.last_name].map((s) => s.trim()).filter(Boolean).join(" ") || null;

    const res = await fetch("/api/sales/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sales_program_id: form.sales_program_id,
        phone: form.phone,
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        full_name: fullName,
        email: form.email || null,
        company_name: form.company_name || null,
        role: form.role || null,
        notes: form.notes || null,
        custom_fields: customFieldsObj,
        consent_given: true,
        consent_source: "manual_import",
        source: "manual",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 409) {
        setError("Lead mit dieser Rufnummer existiert bereits im Program");
      } else {
        setError(data.error ?? "Unbekannter Fehler");
      }
      setLoading(false);
      return;
    }
    setLoading(false);
    onSuccess?.(data.id);
    onClose();
    if (data.id) router.push(`/sales/leads/${data.id}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline text-2xl italic text-on-surface">Neuer Sales Lead</h2>
            <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mt-0.5">
              Manuell anlegen — direkt zum „Call starten"
            </p>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface transition-colors">
            close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <Field label="Program *">
            <select
              required
              value={form.sales_program_id}
              disabled={!!defaultProgramId}
              onChange={(e) => setForm({ ...form, sales_program_id: e.target.value })}
              className={inputClass + (defaultProgramId ? " opacity-70" : "")}
            >
              <option value="">Program auswählen…</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.company?.name ? ` · ${p.company.name}` : ""}
                </option>
              ))}
            </select>
            {defaultProgramId && (
              <p className="font-label text-xs text-outline mt-1">Program aus der Detail-Seite vorausgewählt.</p>
            )}
          </Field>

          <SectionHeader>Kontaktperson</SectionHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vorname">
              <input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="Max"
                className={inputClass}
              />
            </Field>
            <Field label="Nachname">
              <input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="Musterkunde"
                className={inputClass}
              />
            </Field>
            <Field label="Firma">
              <input
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="ACME GmbH"
                className={inputClass}
              />
            </Field>
            <Field label="Rolle">
              <input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="CTO"
                className={inputClass}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="max@acme.at"
                className={inputClass}
              />
            </Field>
            <Field label="Telefon *">
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+4367712345678"
                className={inputClass}
              />
              <p className="font-label text-xs text-outline mt-1">+43… / 0043… / 0… wird server-seitig normalisiert</p>
            </Field>
          </div>

          <Field label="Notizen">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Kontext zum Lead — z.B. Quelle, Vorgeschichte, Pain-Points…"
              className={inputClass + " resize-none"}
            />
          </Field>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-label text-xs font-bold uppercase tracking-widest text-outline">
                Custom Fields
              </label>
              <button
                type="button"
                onClick={() => setCustomFields((prev) => [...prev, { key: "", value: "" }])}
                className="flex items-center gap-1 font-label text-xs text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Feld hinzufügen
              </button>
            </div>
            {customFields.length === 0 ? (
              <p className="font-body text-xs text-outline">
                Optional: zusätzliche Daten wie <code>branche</code>, <code>mitarbeiter</code>, <code>tool_stack</code>.
                Werden als <code>custom_fields_json</code> an den Vapi-Agent durchgereicht.
              </p>
            ) : (
              <div className="space-y-2">
                {customFields.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      value={row.key}
                      onChange={(e) => setCustomField(idx, { key: e.target.value })}
                      placeholder="key"
                      className={inputClass + " flex-1"}
                    />
                    <input
                      value={row.value}
                      onChange={(e) => setCustomField(idx, { value: e.target.value })}
                      placeholder="value"
                      className={inputClass + " flex-[2]"}
                    />
                    <button
                      type="button"
                      onClick={() => setCustomFields((prev) => prev.filter((_, i) => i !== idx))}
                      className="material-symbols-outlined text-outline hover:text-error text-base flex-shrink-0"
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-tertiary-container/20 border border-tertiary-container/40 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="font-label text-xs font-bold text-on-surface mb-1">
                  Ich bestätige dokumentierten Opt-In *
                </div>
                <div className="font-body text-xs text-on-surface-variant">
                  Für diesen Lead liegt ein dokumentiertes Einverständnis zum telefonischen Kontakt vor (DSGVO). Ohne diese Bestätigung wird kein Lead angelegt.
                </div>
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
              disabled={loading || !consent}
              className="flex-1 bg-primary text-on-primary rounded-xl py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-sm">person_add</span>}
              Anlegen & öffnen
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

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-1">
      <span className="material-symbols-outlined text-primary text-sm">person</span>
      <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">{children}</span>
    </div>
  );
}

const inputClass = "w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
