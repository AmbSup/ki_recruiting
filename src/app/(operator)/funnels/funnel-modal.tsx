"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = { open: boolean; onClose: () => void; onSuccess?: () => void };
type Job = { id: string; title: string; company: { name: string } };
type SalesProgram = { id: string; name: string; company: { name: string } };
type FunnelPurpose = "recruiting" | "sales";
type CreationMode = "blank" | "template";
type FunnelTemplate = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: "recruiting" | "sales";
  niche: string;
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[äöü]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue" }[c] ?? c))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const RECRUITING_CONSENT =
  "Mit dem Absenden deiner Bewerbung stimmst du der Verarbeitung deiner Daten gemäß unserer Datenschutzerklärung zu.";

const SALES_CONSENT =
  "Mit dem Absenden willige ich ein, dass mich [Firma] telefonisch kontaktiert, um mein Anliegen zu besprechen. Die Einwilligung kann jederzeit widerrufen werden. Details in der Datenschutzerklärung.";

export function FunnelModal({ open, onClose, onSuccess }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<CreationMode>("blank");
  const [purpose, setPurpose] = useState<FunnelPurpose>("recruiting");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [programs, setPrograms] = useState<SalesProgram[]>([]);
  const [templates, setTemplates] = useState<FunnelTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [form, setForm] = useState({
    job_id: "",
    sales_program_id: "",
    name: "",
    slug: "",
    intro_headline: "",
    intro_subtext: "",
    consent_text: RECRUITING_CONSENT,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    supabase
      .from("jobs")
      .select("id, title, status, company:companies(name)")
      .in("status", ["active", "draft", "paused"])
      .then(({ data }) => { if (data) setJobs(data as unknown as Job[]); });
    supabase
      .from("sales_programs")
      .select("id, name, status, company:companies(name)")
      .in("status", ["active", "draft", "paused"])
      .then(({ data }) => { if (data) setPrograms(data as unknown as SalesProgram[]); });
    supabase
      .from("funnel_templates")
      .select("id, slug, name, description, category, niche")
      .order("name")
      .then(({ data }) => { if (data) setTemplates(data as FunnelTemplate[]); });
  }, [open]);

  // Purpose-Switch: Consent-Default + Target-IDs säubern
  function switchPurpose(p: FunnelPurpose) {
    setPurpose(p);
    setForm((prev) => ({
      ...prev,
      job_id: p === "recruiting" ? prev.job_id : "",
      sales_program_id: p === "sales" ? prev.sales_program_id : "",
      consent_text: consentLooksDefault(prev.consent_text)
        ? (p === "sales" ? SALES_CONSENT : RECRUITING_CONSENT)
        : prev.consent_text,
    }));
  }

  function consentLooksDefault(text: string): boolean {
    return text === RECRUITING_CONSENT || text === SALES_CONSENT || text.trim() === "";
  }

  function handleNameChange(name: string) {
    setForm({ ...form, name, slug: slugify(name) });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Target-Validation (XOR sitzt auf DB-Ebene, hier freundlicher Fehler)
    if (purpose === "recruiting" && !form.job_id) {
      setError("Bitte Job auswählen"); return;
    }
    if (purpose === "sales" && !form.sales_program_id) {
      setError("Bitte Sales-Program auswählen"); return;
    }

    // Template-Modus: ruft /api/funnels/duplicate, kein direkter DB-Insert
    if (mode === "template") {
      if (!selectedTemplateId) {
        setError("Bitte ein Template auswählen"); return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/funnels/duplicate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: { type: "template", template_id: selectedTemplateId },
            target_anchor:
              purpose === "recruiting"
                ? { job_id: form.job_id }
                : { sales_program_id: form.sales_program_id },
            new_name: form.name || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? `HTTP ${res.status}`);
          setLoading(false);
          return;
        }
        onClose();
        onSuccess?.();
        if (data.edit_url) router.push(data.edit_url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Netzwerkfehler");
        setLoading(false);
      }
      return;
    }

    // Sales-Consent-Validator: consent_text darf nicht leer sein
    if (purpose === "sales" && form.consent_text.trim().length < 30) {
      setError(
        "Sales-Funnels brauchen einen dokumentierten Consent-Text (mind. 30 Zeichen). "
        + "Der Text muss klarstellen, dass die Person telefonisch kontaktiert wird."
      );
      return;
    }

    setLoading(true);

    const payload = {
      job_id: purpose === "recruiting" ? form.job_id : null,
      sales_program_id: purpose === "sales" ? form.sales_program_id : null,
      name: form.name,
      slug: form.slug,
      intro_headline: form.intro_headline,
      intro_subtext: form.intro_subtext,
      consent_text: form.consent_text,
      funnel_type: "internal",
    };

    const { error: insertErr } = await supabase.from("funnels").insert([payload]);
    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }
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
            <h2 className="font-headline text-2xl italic text-on-surface">Neuer Funnel</h2>
            <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mt-0.5">
              {purpose === "sales" ? "Sales-Lead-Funnel erstellen" : "Bewerbungs-Funnel erstellen"}
            </p>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface transition-colors">
            close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Mode-Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-surface-container-low rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setMode("blank"); setSelectedTemplateId(null); }}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 font-label text-xs font-bold uppercase tracking-widest transition-colors ${
                mode === "blank"
                  ? "bg-surface-container-lowest text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-sm">add_box</span>
              Von Null
            </button>
            <button
              type="button"
              onClick={() => setMode("template")}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 font-label text-xs font-bold uppercase tracking-widest transition-colors ${
                mode === "template"
                  ? "bg-surface-container-lowest text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Aus Template
            </button>
          </div>

          <Field label="Funnel-Zweck *">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => switchPurpose("recruiting")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 font-label text-xs font-bold uppercase tracking-widest transition-colors ${
                  purpose === "recruiting"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-sm">work</span>
                Recruiting (Job)
              </button>
              <button
                type="button"
                onClick={() => switchPurpose("sales")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 font-label text-xs font-bold uppercase tracking-widest transition-colors ${
                  purpose === "sales"
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-sm">trending_up</span>
                Sales (Program)
              </button>
            </div>
          </Field>

          {/* Template-Picker — nur im Template-Mode */}
          {mode === "template" && (
            <Field label="Template wählen *">
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {templates.filter((t) => t.category === purpose).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(t.id)}
                    className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-colors ${
                      selectedTemplateId === t.id
                        ? "border-primary bg-primary-container/30"
                        : "border-outline-variant/20 bg-surface-container-low hover:border-outline-variant/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-body text-sm font-semibold text-on-surface">{t.name}</div>
                        {t.description && (
                          <div className="font-label text-xs text-outline mt-0.5 line-clamp-2">{t.description}</div>
                        )}
                      </div>
                      {selectedTemplateId === t.id && (
                        <span className="material-symbols-outlined text-primary text-base flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                {templates.filter((t) => t.category === purpose).length === 0 && (
                  <p className="font-label text-xs text-outline italic px-2 py-3">
                    Keine Templates für diesen Zweck verfügbar. Wähle eine andere Kategorie oder benutze &quot;Von Null&quot;.
                  </p>
                )}
              </div>
            </Field>
          )}

          {purpose === "recruiting" ? (
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
          ) : (
            <Field label="Sales-Program *">
              <select
                required
                value={form.sales_program_id}
                onChange={(e) => setForm({ ...form, sales_program_id: e.target.value })}
                className={inputClass}
              >
                <option value="">Program auswählen…</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.company.name}
                  </option>
                ))}
              </select>
              {programs.length === 0 && (
                <p className="font-label text-xs text-outline mt-1.5">
                  Noch kein Sales-Program vorhanden. Lege zuerst eines unter <em>Sales → Programs</em> an.
                </p>
              )}
            </Field>
          )}

          <Field label={mode === "template" ? "Funnel-Name (optional, sonst Template-Name)" : "Funnel-Name *"}>
            <input
              required={mode === "blank"}
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={
                mode === "template"
                  ? "Leer lassen für Template-Default"
                  : purpose === "sales" ? "B2B Closer — Outreach A" : "Lagerarbeiter Variante A"
              }
              className={inputClass}
            />
          </Field>

          {mode === "blank" && (
          <>
          <Field label="URL-Slug">
            <div className="flex items-center gap-0 bg-surface-container-low border border-outline-variant/20 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors">
              <span className="px-3 py-2.5 font-label text-xs text-outline border-r border-outline-variant/20 whitespace-nowrap">
                apply.domain.com/
              </span>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder={purpose === "sales" ? "b2b-closer-a" : "lagerarbeiter-a"}
                className="flex-1 bg-transparent px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none"
              />
            </div>
          </Field>

          <Field label="Startseite Headline">
            <input
              value={form.intro_headline}
              onChange={(e) => setForm({ ...form, intro_headline: e.target.value })}
              placeholder={purpose === "sales" ? "Mehr Umsatz für B2B-Sales-Teams" : "Wir suchen dich als Lagerarbeiter!"}
              className={inputClass}
            />
          </Field>

          <Field label="Startseite Beschreibung">
            <textarea
              value={form.intro_subtext}
              onChange={(e) => setForm({ ...form, intro_subtext: e.target.value })}
              placeholder={purpose === "sales" ? "Kostenfreies Erstgespräch in 2 Minuten anfragen…" : "Bewirb dich jetzt in nur 2 Minuten…"}
              rows={2}
              className={inputClass + " resize-none"}
            />
          </Field>

          <Field label={purpose === "sales" ? "Consent-Text (Opt-In für Anruf) *" : "Datenschutz-Text"}>
            <textarea
              value={form.consent_text}
              onChange={(e) => setForm({ ...form, consent_text: e.target.value })}
              rows={purpose === "sales" ? 3 : 2}
              className={inputClass + " resize-none text-xs"}
            />
            {purpose === "sales" && (
              <p className="font-label text-xs text-outline mt-1.5">
                Pflicht: Der Text muss das Opt-In für den telefonischen Kontakt dokumentieren. Ohne validen Consent-Text lässt sich der Funnel nicht speichern.
              </p>
            )}
          </Field>
          </>
          )}

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
                : <span className="material-symbols-outlined text-sm">{mode === "template" ? "auto_awesome" : "save"}</span>}
              {mode === "template" ? "Aus Template erstellen" : "Erstellen & Editor öffnen"}
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
