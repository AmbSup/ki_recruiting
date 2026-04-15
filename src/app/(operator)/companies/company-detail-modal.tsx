"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ImageUpload } from "@/components/ui/image-upload";

type CompanyDetail = {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  company_size: string | null;
  website: string | null;
  address: string | null;
  description: string | null;
  primary_color: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  recruiting_goals: string | null;
  meta_ad_account_id: string | null;
  linkedin_ad_account_id: string | null;
  billing_plan: string;
  monthly_budget: number | null;
  contract_start: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  _count?: { jobs: number };
};

const statusOptions = [
  { value: "active", label: "Aktiv" },
  { value: "paused", label: "Pausiert" },
  { value: "churned", label: "Inaktiv" },
];

const planOptions = [
  { value: "per_job", label: "Pro Job" },
  { value: "monthly", label: "Monatlich" },
  { value: "custom", label: "Custom" },
];

type Props = {
  companyId: string | null;
  onClose: () => void;
  onDeleted?: () => void;
};

export function CompanyDetailModal({ companyId, onClose, onDeleted }: Props) {
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [form, setForm] = useState<Partial<CompanyDetail>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    setCompany(null);
    setForm({});
    setDirty(false);
    setLoading(true);
    const supabase = createClient();
    Promise.all([
      supabase
        .from("companies")
        .select(`
          id, name, logo_url, industry, company_size, website, address, description,
          primary_color, contact_name, contact_email, contact_phone,
          recruiting_goals, meta_ad_account_id, linkedin_ad_account_id,
          billing_plan, monthly_budget, contract_start, notes, status, created_at
        `)
        .eq("id", companyId)
        .single(),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId),
    ]).then(([{ data }, { count }]) => {
      if (data) {
        const c = { ...(data as unknown as CompanyDetail), _count: { jobs: count ?? 0 } };
        setCompany(c);
        setForm(c);
      }
      setLoading(false);
    });
  }, [companyId]);

  function update(field: string, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  async function save() {
    if (!companyId || !dirty) return;
    setSaving(true);
    const supabase = createClient();
    const { name, industry, company_size, website, address, description,
      primary_color, contact_name, contact_email, contact_phone,
      recruiting_goals, meta_ad_account_id, linkedin_ad_account_id,
      billing_plan, monthly_budget, contract_start, notes, status } = form;
    await supabase.from("companies").update({
      name, logo_url: form.logo_url || null,
      industry, company_size, website, address, description,
      primary_color, contact_name, contact_email, contact_phone,
      recruiting_goals, meta_ad_account_id, linkedin_ad_account_id,
      billing_plan, monthly_budget: monthly_budget ? Number(monthly_budget) : null,
      contract_start: contract_start || null, notes, status,
    }).eq("id", companyId);
    setDirty(false);
    setSaving(false);
  }

  async function deleteCompany() {
    if (!companyId || !confirm("Firma wirklich löschen? Alle zugehörigen Jobs bleiben erhalten.")) return;
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("companies").delete().eq("id", companyId);
    setDeleting(false);
    onDeleted?.();
    onClose();
  }

  if (!companyId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline-variant/20 flex-shrink-0">
          <h2 className="font-headline text-2xl italic text-on-surface">
            {loading ? "Lädt…" : form.name || "Firma"}
          </h2>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="space-y-3">
              {[100, 80, 60, 100, 70].map((w, i) => (
                <div key={i} className="h-10 bg-surface-container-high rounded-xl animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : (
            <>
              {/* Logo */}
              <FieldGroup label="Firmenlogo" icon="image">
                <div className="flex items-center gap-4">
                  <ImageUpload
                    value={form.logo_url ?? ""}
                    onChange={(url) => update("logo_url", url || null)}
                    aspect="circle"
                    label="Logo hochladen"
                  />
                  {form.logo_url && (
                    <button
                      type="button"
                      onClick={() => update("logo_url", null)}
                      className="flex items-center gap-1 font-label text-xs text-error/70 hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                      Logo entfernen
                    </button>
                  )}
                </div>
              </FieldGroup>

              {/* Status + Grunddaten */}
              <FieldGroup label="Grunddaten" icon="domain">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Firmenname" value={form.name ?? ""} onChange={(v) => update("name", v)} />
                  <SelectField label="Status" value={form.status ?? "active"} options={statusOptions} onChange={(v) => update("status", v)} />
                  <Field label="Branche" value={form.industry ?? ""} onChange={(v) => update("industry", v)} />
                  <Field label="Größe" value={form.company_size ?? ""} onChange={(v) => update("company_size", v)} placeholder="z.B. 51–200" />
                  <Field label="Website" value={form.website ?? ""} onChange={(v) => update("website", v)} />
                  <Field label="Adresse" value={form.address ?? ""} onChange={(v) => update("address", v)} />
                  <Field label="Markenfarbe" value={form.primary_color ?? ""} onChange={(v) => update("primary_color", v)} placeholder="#9a442d" className="col-span-1" />
                </div>
                <TextArea label="Beschreibung" value={form.description ?? ""} onChange={(v) => update("description", v)} rows={3} />
              </FieldGroup>

              {/* Kontakt */}
              <FieldGroup label="Ansprechpartner" icon="contacts">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name" value={form.contact_name ?? ""} onChange={(v) => update("contact_name", v)} />
                  <Field label="E-Mail" value={form.contact_email ?? ""} onChange={(v) => update("contact_email", v)} type="email" />
                  <Field label="Telefon" value={form.contact_phone ?? ""} onChange={(v) => update("contact_phone", v)} type="tel" />
                </div>
              </FieldGroup>

              {/* Recruiting */}
              <FieldGroup label="Recruiting" icon="flag">
                <TextArea label="Recruiting-Ziele" value={form.recruiting_goals ?? ""} onChange={(v) => update("recruiting_goals", v)} rows={3} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Meta Ad Account ID" value={form.meta_ad_account_id ?? ""} onChange={(v) => update("meta_ad_account_id", v)} />
                  <Field label="LinkedIn Ad Account ID" value={form.linkedin_ad_account_id ?? ""} onChange={(v) => update("linkedin_ad_account_id", v)} />
                </div>
              </FieldGroup>

              {/* Vertrag */}
              <FieldGroup label="Vertrag & Abrechnung" icon="handshake">
                <div className="grid grid-cols-3 gap-3">
                  <SelectField label="Abrechnungsmodell" value={form.billing_plan ?? "per_job"} options={planOptions} onChange={(v) => update("billing_plan", v)} />
                  <Field label="Budget/Monat (€)" value={form.monthly_budget != null ? String(form.monthly_budget) : ""} onChange={(v) => update("monthly_budget", v ? Number(v) : null)} type="number" />
                  <Field label="Vertragsstart" value={form.contract_start ?? ""} onChange={(v) => update("contract_start", v)} type="date" />
                </div>
              </FieldGroup>

              {/* Notizen */}
              <FieldGroup label="Interne Notizen" icon="sticky_note_2">
                <TextArea label="" value={form.notes ?? ""} onChange={(v) => update("notes", v)} rows={4} placeholder="Notizen zu dieser Firma…" />
              </FieldGroup>

              {/* Footer: Meta + Delete */}
              <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                <p className="font-label text-xs text-outline">
                  {company?._count?.jobs ?? 0} Jobs · Kunde seit {company?.created_at ? new Date(company.created_at).toLocaleDateString("de-AT", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                </p>
                <button onClick={deleteCompany} disabled={deleting}
                  className="flex items-center gap-1.5 text-error/70 hover:text-error font-label text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50">
                  <span className="material-symbols-outlined text-xs">delete</span>
                  {deleting ? "Löscht…" : "Firma löschen"}
                </button>
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
