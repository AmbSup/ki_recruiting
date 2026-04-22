"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LeadModal } from "../../leads/lead-modal";

type Program = {
  id: string;
  company_id: string;
  name: string;
  product_pitch: string | null;
  value_proposition: string | null;
  target_persona: string | null;
  script_guidelines: string | null;
  vapi_assistant_id: string | null;
  caller_phone_number: string | null;
  booking_link: string | null;
  meta_form_ids: string[];
  auto_dial: boolean;
  status: string;
  created_at: string;
  company: { id: string; name: string };
};

const statusOptions = [
  { value: "draft",  label: "Entwurf" },
  { value: "active", label: "Aktiv" },
  { value: "paused", label: "Pausiert" },
  { value: "closed", label: "Geschlossen" },
];

export default function ProgramEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [program, setProgram] = useState<Program | null>(null);
  const [form, setForm] = useState<Partial<Program>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [metaFormInput, setMetaFormInput] = useState("");
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sales_programs")
      .select("*, company:companies(id, name)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          const p = data as unknown as Program;
          setProgram(p);
          setForm(p);
        }
        setLoading(false);
      });
  }, [id]);

  function update<K extends keyof Program>(field: K, value: Program[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  function addMetaFormId() {
    const trimmed = metaFormInput.trim();
    if (!trimmed) return;
    const cur = (form.meta_form_ids ?? []) as string[];
    if (cur.includes(trimmed)) return;
    update("meta_form_ids", [...cur, trimmed] as Program["meta_form_ids"]);
    setMetaFormInput("");
  }

  function removeMetaFormId(v: string) {
    const cur = (form.meta_form_ids ?? []) as string[];
    update("meta_form_ids", cur.filter((x) => x !== v) as Program["meta_form_ids"]);
  }

  async function save() {
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: form.name,
      product_pitch: form.product_pitch,
      value_proposition: form.value_proposition,
      target_persona: form.target_persona,
      script_guidelines: form.script_guidelines,
      vapi_assistant_id: form.vapi_assistant_id,
      caller_phone_number: form.caller_phone_number,
      booking_link: form.booking_link,
      meta_form_ids: form.meta_form_ids ?? [],
      auto_dial: form.auto_dial ?? false,
      status: form.status,
    };
    const res = await fetch(`/api/sales/programs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setDirty(false);
    setSaving(false);
  }

  async function del() {
    if (!confirm("Program wirklich löschen? Alle Leads und Calls bleiben erhalten, werden aber vom Program getrennt (ON DELETE CASCADE auf Leads).")) return;
    await fetch(`/api/sales/programs/${id}`, { method: "DELETE" });
    window.location.href = "/sales/programs";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-3xl text-outline animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="px-8 pt-10">
        <p className="font-body text-on-surface-variant">Program nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div className="px-8 pt-10 pb-32 max-w-[1200px]">
      <Link
        href="/sales/programs"
        className="inline-flex items-center gap-1.5 text-outline hover:text-on-surface transition-colors mb-8"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest">Alle Programs</span>
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
            {program.company.name}
          </p>
          <h1 className="font-headline text-4xl italic text-on-surface leading-none mb-1">
            {form.name || program.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-sm">{saving ? "progress_activity" : "save"}</span>
              {saving ? "Speichert…" : "Speichern"}
            </button>
          )}
          <button
            onClick={() => setLeadModalOpen(true)}
            className="flex items-center gap-1.5 border border-primary/30 text-primary px-4 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-container/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Test-Lead anlegen
          </button>
          <button
            onClick={del}
            className="flex items-center gap-1.5 border border-error/30 text-error px-4 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-error-container/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Löschen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 space-y-5">
          <Card label="Grunddaten" icon="trending_up">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" value={form.name ?? ""} onChange={(v) => update("name", v)} className="col-span-2" />
              <Select label="Status" value={form.status ?? "draft"} options={statusOptions} onChange={(v) => update("status", v)} />
              <ToggleField
                label="Auto-Dial"
                value={!!form.auto_dial}
                onChange={(v) => update("auto_dial", v)}
                hint="Neue Leads sofort anrufen"
              />
            </div>
          </Card>

          <Card label="Pitch & Targeting" icon="record_voice_over">
            <TextArea label="Produkt-Pitch" value={form.product_pitch ?? ""} onChange={(v) => update("product_pitch", v)} rows={3} />
            <TextArea label="Value Proposition" value={form.value_proposition ?? ""} onChange={(v) => update("value_proposition", v)} rows={3} />
            <TextArea label="Zielpersona" value={form.target_persona ?? ""} onChange={(v) => update("target_persona", v)} rows={3} />
            <TextArea label="Script-Guidelines (intern)" value={form.script_guidelines ?? ""} onChange={(v) => update("script_guidelines", v)} rows={3} placeholder="Zusätzliche Hinweise für den KI-Agent — werden nicht im System-Prompt ersetzt, sondern als Kontext mitgegeben." />
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-5">
          <Card label="Vapi & Telefonie" icon="support_agent">
            <Field label="Vapi Assistant ID" value={form.vapi_assistant_id ?? ""} onChange={(v) => update("vapi_assistant_id", v)} placeholder="asst_abc123…" />
            <Field label="Caller-Nummer (E.164)" value={form.caller_phone_number ?? ""} onChange={(v) => update("caller_phone_number", v)} placeholder="+4315551234" />
            <Field label="Booking-Link" type="url" value={form.booking_link ?? ""} onChange={(v) => update("booking_link", v)} placeholder="https://cal.com/…" />
          </Card>

          <Card label="Meta-Leadgen-Formulare" icon="ads_click">
            <p className="font-body text-xs text-outline mb-3">
              Form-IDs von Meta-Lead-Ads, die in dieses Program einlaufen. Der Matcher-Workflow ordnet Leads darüber zu.
            </p>
            <div className="flex gap-2">
              <input
                value={metaFormInput}
                onChange={(e) => setMetaFormInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMetaFormId(); } }}
                placeholder="Form-ID eingeben + Enter"
                className={inputClass + " flex-1"}
              />
              <button
                type="button"
                onClick={addMetaFormId}
                className="bg-primary text-on-primary px-4 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
              >
                Hinzufügen
              </button>
            </div>
            {(form.meta_form_ids ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {(form.meta_form_ids as string[]).map((fid) => (
                  <span key={fid} className="flex items-center gap-1.5 bg-surface-container-low rounded-lg px-3 py-1.5 font-label text-xs">
                    <span className="font-mono text-on-surface">{fid}</span>
                    <button
                      onClick={() => removeMetaFormId(fid)}
                      className="material-symbols-outlined text-outline hover:text-error text-sm"
                    >
                      close
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-4">Details</h3>
            <div className="space-y-3">
              {[
                { label: "Program-ID", value: id.slice(0, 8) + "…" },
                { label: "Erstellt", value: new Date(program.created_at).toLocaleDateString("de-AT", { day: "2-digit", month: "long", year: "numeric" }) },
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

      <LeadModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        defaultProgramId={id}
      />
    </div>
  );
}

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
        className={inputClass}
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
        className={inputClass + " resize-none"}
      />
    </div>
  );
}

function Select({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="font-label text-xs text-outline block mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, value, onChange, hint }: {
  label: string; value: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <div>
      <label className="font-label text-xs text-outline block mb-1.5">{label}</label>
      <label className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-2.5 cursor-pointer">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <span className="font-body text-xs text-on-surface-variant">{hint ?? (value ? "Aktiv" : "Inaktiv")}</span>
      </label>
    </div>
  );
}

const inputClass = "w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
