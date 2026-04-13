"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getFunnelPublicUrl } from "@/lib/funnel-url";

// ─── Types ───────────────────────────────────────────────────────────────────

type FunnelData = {
  id: string;
  name: string;
  slug: string;
  funnel_type: string;
  external_url: string | null;
  job_id: string;
  job: { id: string; title: string; company: { id: string; name: string } } | null;
};

type WizardForm = {
  funnel_id: string;
  job_id: string;
  company_id: string;
  job_category: string;
  // Step 1
  campaign_name: string;
  objective: string;
  special_category: string;
  // Step 2
  regions: string[];
  age_min: number;
  age_max: number;
  gender: "ALL" | "MALE" | "FEMALE";
  interests: string[];
  // Step 3
  budget_type: "daily" | "lifetime";
  daily_budget: string;
  start_date: string;
  // Step 4
  placement_type: "automatic" | "manual";
  placements: string[];
  // Step 5
  primary_text: string;
  headline: string;
  cta_type: string;
  destination_url: string;
  ad_image_url: string;
  // Step 6
  pixel_id: string;
  utm_campaign: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const JOB_CATEGORIES = [
  "Elektriker", "Maurer", "Installateur", "Maler", "Schlosser",
  "Lagerarbeiter", "Fahrer", "Verkäufer", "Filialleiter", "Sonstiges",
];

const AUSTRIAN_REGIONS = [
  "Wien", "Niederösterreich", "Oberösterreich", "Steiermark",
  "Tirol", "Salzburg", "Kärnten", "Vorarlberg", "Burgenland",
];

const PLACEMENTS = [
  { id: "facebook_feed",      label: "Facebook Feed",      icon: "web" },
  { id: "facebook_stories",   label: "Facebook Stories",   icon: "amp_stories" },
  { id: "facebook_reels",     label: "Facebook Reels",     icon: "movie" },
  { id: "instagram_feed",     label: "Instagram Feed",     icon: "photo_camera" },
  { id: "instagram_stories",  label: "Instagram Stories",  icon: "amp_stories" },
  { id: "messenger",          label: "Messenger",          icon: "chat" },
];

const CTA_OPTIONS = [
  { value: "APPLY_NOW",   label: "Jetzt bewerben" },
  { value: "LEARN_MORE",  label: "Mehr erfahren" },
  { value: "SIGN_UP",     label: "Registrieren" },
  { value: "GET_QUOTE",   label: "Angebot anfordern" },
];

const STEPS = [
  { label: "Kampagne",    icon: "campaign" },
  { label: "Zielgruppe",  icon: "people" },
  { label: "Budget",      icon: "payments" },
  { label: "Platzierung", icon: "devices" },
  { label: "Creative",    icon: "image" },
  { label: "Tracking",    icon: "analytics" },
  { label: "Review",      icon: "rocket_launch" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AdsSetupClient({ funnelId }: { funnelId: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [funnels, setFunnels] = useState<FunnelData[]>([]);
  const [loadingFunnel, setLoadingFunnel] = useState(!!funnelId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interestInput, setInterestInput] = useState("");

  const [form, setForm] = useState<WizardForm>({
    funnel_id: funnelId ?? "",
    job_id: "",
    company_id: "",
    job_category: "",
    campaign_name: "",
    objective: "OUTCOME_LEADS",
    special_category: "EMPLOYMENT",
    regions: [],
    age_min: 18,
    age_max: 55,
    gender: "ALL",
    interests: [],
    budget_type: "daily",
    daily_budget: "50",
    start_date: todayIso(),
    placement_type: "automatic",
    placements: [],
    primary_text: "",
    headline: "",
    cta_type: "APPLY_NOW",
    destination_url: "",
    ad_image_url: "",
    pixel_id: "",
    utm_campaign: "",
  });

  // Load funnel data on mount
  useEffect(() => {
    if (funnelId) {
      // Pre-selected funnel via query param
      setLoadingFunnel(true);
      supabase
        .from("funnels")
        .select("id, name, slug, funnel_type, external_url, job_id, job:jobs(id, title, selected_ad_image_url, company:companies(id, name))")
        .eq("id", funnelId)
        .single()
        .then(({ data }) => {
          if (!data) { setLoadingFunnel(false); return; }
          const f = data as unknown as FunnelData;
          setFunnel(f);
          const jobTitle = f.job?.title ?? "";
          const campaignName = `[KI] ${jobTitle} – Österreich`;
          // Supabase may return nested joins as array or object — handle both
          const rawCompany = f.job?.company as unknown;
          const companyId = Array.isArray(rawCompany)
            ? (rawCompany as { id: string }[])[0]?.id ?? ""
            : (rawCompany as { id: string } | null)?.id ?? "";
          const rawJob = f.job as unknown as { selected_ad_image_url?: string | null } | null;
          const adImageUrl = rawJob?.selected_ad_image_url ?? "";
          setForm((prev) => ({
            ...prev,
            funnel_id: f.id,
            job_id: f.job_id,
            company_id: companyId,
            campaign_name: campaignName,
            utm_campaign: slugify(campaignName),
            destination_url: getFunnelPublicUrl(f),
            ad_image_url: adImageUrl,
          }));
          setLoadingFunnel(false);
        });
    } else {
      // No funnel pre-selected — load all available funnels for picker
      supabase
        .from("funnels")
        .select("id, name, slug, funnel_type, external_url, job_id, job:jobs(id, title, company:companies(id, name))")
        .in("status", ["active", "draft"])
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setFunnels(data as unknown as FunnelData[]);
        });
    }
  }, [funnelId]);

  function update(patch: Partial<WizardForm>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function toggleRegion(r: string) {
    update({ regions: form.regions.includes(r) ? form.regions.filter((x) => x !== r) : [...form.regions, r] });
  }

  function togglePlacement(p: string) {
    update({ placements: form.placements.includes(p) ? form.placements.filter((x) => x !== p) : [...form.placements, p] });
  }

  function addInterest() {
    const v = interestInput.trim();
    if (v && !form.interests.includes(v)) update({ interests: [...form.interests, v] });
    setInterestInput("");
  }

  function removeInterest(i: string) {
    update({ interests: form.interests.filter((x) => x !== i) });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/meta/campaigns/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: form.job_id,
        company_id: form.company_id,
        job_category: form.job_category,
        daily_budget_cents: Math.round(parseFloat(form.daily_budget || "50") * 100),
        regions: form.regions,
        funnel_id: form.funnel_id,
        campaign_name: form.campaign_name,
        objective: form.objective,
        special_category: form.special_category,
        age_min: form.age_min,
        age_max: form.age_max,
        gender: form.gender,
        placement_type: form.placement_type,
        placements: form.placements,
        destination_url: form.destination_url || undefined,
        primary_text: form.primary_text || undefined,
        headline: form.headline || undefined,
        cta_type: form.cta_type,
        ad_image_url: form.ad_image_url || undefined,
        pixel_id: form.pixel_id || undefined,
        utm_campaign: form.utm_campaign || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Unbekannter Fehler");
      setSubmitting(false);
    } else {
      router.push("/campaigns");
    }
  }

  const ctaLabel = CTA_OPTIONS.find((c) => c.value === form.cta_type)?.label ?? "Jetzt bewerben";

  if (loadingFunnel) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="material-symbols-outlined text-3xl text-outline animate-spin">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-outline-variant/20 bg-surface-container-lowest flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors font-label text-xs font-bold uppercase tracking-widest"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Zurück
        </button>
        <div className="w-px h-5 bg-outline-variant/30" />
        {funnel ? (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm">conversion_path</span>
            <span className="font-body text-sm text-on-surface">{funnel.name}</span>
            {funnel.job && (
              <>
                <span className="text-outline-variant">·</span>
                <span className="font-label text-xs text-outline">{funnel.job.title}</span>
                <span className="text-outline-variant">·</span>
                <span className="font-label text-xs text-outline">{funnel.job.company.name}</span>
              </>
            )}
          </div>
        ) : (
          <span className="font-headline text-xl italic text-on-surface">Neue Kampagne</span>
        )}
        <div className="ml-auto font-label text-[10px] font-bold uppercase tracking-widest text-outline">
          Schritt {step + 1} von {STEPS.length}
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Step Sidebar */}
        <nav className="w-52 flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant/20 py-6 px-3 overflow-y-auto">
          <p className="px-3 font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-4">Schritte</p>
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <button
                key={i}
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-left transition-all ${
                  active
                    ? "bg-primary-container text-on-primary-container"
                    : done
                    ? "text-on-surface-variant hover:bg-surface-container cursor-pointer"
                    : "text-outline cursor-not-allowed opacity-50"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-lg ${active ? "" : done ? "text-primary" : ""}`}
                  style={active || done ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {done ? "check_circle" : s.icon}
                </span>
                <span className="font-label text-sm font-semibold">{s.label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Step Content */}
        <main className="flex-1 overflow-y-auto px-10 py-8">
          <div className="max-w-xl">
            <h2 className="font-headline text-3xl italic text-on-surface mb-1">{STEPS[step].label}</h2>
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-8">
              Schritt {step + 1} · {STEPS[step].label}
            </p>

            {/* ── Step 1: Campaign ─────────────────────────────────────── */}
            {step === 0 && (
              <div className="space-y-5">
                <Field label="Kampagnenname *">
                  <input
                    value={form.campaign_name}
                    onChange={(e) => update({ campaign_name: e.target.value, utm_campaign: slugify(e.target.value) })}
                    className={inputClass}
                    placeholder="[KI] Elektriker Wien – Österreich"
                  />
                </Field>
                <Field label="Ziel *">
                  <select value={form.objective} onChange={(e) => update({ objective: e.target.value })} className={inputClass}>
                    <option value="OUTCOME_LEADS">Leads (empfohlen)</option>
                    <option value="OUTCOME_TRAFFIC">Traffic</option>
                    <option value="OUTCOME_SALES">Sales / Conversions</option>
                    <option value="OUTCOME_ENGAGEMENT">Engagement</option>
                    <option value="OUTCOME_AWARENESS">Awareness</option>
                  </select>
                  <p className={hintClass}>Für Recruiting-Funnels empfohlen: Leads</p>
                </Field>
                <Field label="Sonderkategorie">
                  <select value={form.special_category} onChange={(e) => update({ special_category: e.target.value })} className={inputClass}>
                    <option value="">Keine</option>
                    <option value="EMPLOYMENT">Beschäftigung (Employment)</option>
                    <option value="HOUSING">Wohnen (Housing)</option>
                    <option value="CREDIT">Kredit (Credit)</option>
                  </select>
                  <p className={hintClass}>Meta schreibt "Employment" für Stellenanzeigen vor</p>
                </Field>
                <Field label="Jobkategorie *">
                  <select value={form.job_category} onChange={(e) => update({ job_category: e.target.value })} className={inputClass}>
                    <option value="">Kategorie wählen…</option>
                    {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <p className={hintClass}>Bestimmt KI-generierte Anzeigentexte und Zielgruppen-Interessen</p>
                </Field>
              </div>
            )}

            {/* ── Step 2: Audience ─────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-6">
                <Field label="Regionen (leer = ganz Österreich)">
                  <div className="flex flex-wrap gap-2">
                    {AUSTRIAN_REGIONS.map((r) => (
                      <button key={r} type="button" onClick={() => toggleRegion(r)}
                        className={`px-3 py-1.5 rounded-lg font-label text-[10px] font-bold uppercase tracking-widest transition-colors ${
                          form.regions.includes(r)
                            ? "bg-primary-container text-on-primary-container"
                            : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                        }`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Alter">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className={hintClass}>Minimum</label>
                      <input type="number" min={18} max={64} value={form.age_min}
                        onChange={(e) => update({ age_min: +e.target.value })} className={inputClass} />
                    </div>
                    <span className="text-outline mt-4">–</span>
                    <div className="flex-1">
                      <label className={hintClass}>Maximum</label>
                      <input type="number" min={19} max={65} value={form.age_max}
                        onChange={(e) => update({ age_max: +e.target.value })} className={inputClass} />
                    </div>
                  </div>
                </Field>

                <Field label="Geschlecht">
                  <div className="flex gap-3">
                    {(["ALL", "MALE", "FEMALE"] as const).map((g) => (
                      <button key={g} type="button" onClick={() => update({ gender: g })}
                        className={`flex-1 py-2.5 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest transition-colors border ${
                          form.gender === g
                            ? "bg-primary-container border-primary text-on-primary-container"
                            : "bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:bg-surface-container"
                        }`}>
                        {g === "ALL" ? "Alle" : g === "MALE" ? "Männlich" : "Weiblich"}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Interessen / Berufe">
                  <div className="flex gap-2 mb-2">
                    <input
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                      placeholder="z.B. Elektrotechnik, Handwerk…"
                      className={inputClass}
                    />
                    <button type="button" onClick={addInterest}
                      className="px-4 py-2.5 bg-surface-container-high rounded-xl font-label text-xs font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors flex-shrink-0">
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.interests.map((i) => (
                      <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full font-label text-[10px] font-bold">
                        {i}
                        <button onClick={() => removeInterest(i)} className="hover:opacity-70">
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                  <p className={hintClass}>Leer lassen → KI wählt Interessen basierend auf Jobkategorie</p>
                </Field>
              </div>
            )}

            {/* ── Step 3: Budget ───────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-5">
                <Field label="Budget-Typ">
                  <div className="flex gap-3">
                    {(["daily", "lifetime"] as const).map((bt) => (
                      <button key={bt} type="button" onClick={() => update({ budget_type: bt })}
                        className={`flex-1 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest transition-colors border ${
                          form.budget_type === bt
                            ? "bg-primary-container border-primary text-on-primary-container"
                            : "bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:bg-surface-container"
                        }`}>
                        {bt === "daily" ? "Tagesbudget" : "Gesamtbudget"}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label={form.budget_type === "daily" ? "Tagesbudget *" : "Gesamtbudget *"}>
                  <div className="flex items-center gap-0 bg-surface-container-low border border-outline-variant/20 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors">
                    <span className="px-3 py-2.5 font-label text-sm text-outline border-r border-outline-variant/20">€</span>
                    <input type="number" min="1" max="500" step="1" value={form.daily_budget}
                      onChange={(e) => update({ daily_budget: e.target.value })}
                      className="flex-1 bg-transparent px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none" />
                    <span className="px-3 py-2.5 font-label text-[10px] text-outline border-l border-outline-variant/20">
                      {form.budget_type === "daily" ? "/Tag" : "gesamt"}
                    </span>
                  </div>
                  <p className={hintClass}>Kill-Switch stoppt bei €500 Tagesausgabe</p>
                </Field>

                <Field label="Startdatum">
                  <input type="date" value={form.start_date}
                    onChange={(e) => update({ start_date: e.target.value })} className={inputClass} />
                </Field>
              </div>
            )}

            {/* ── Step 4: Placements ───────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <Field label="Platzierungs-Typ">
                  <div className="flex gap-3">
                    {(["automatic", "manual"] as const).map((pt) => (
                      <button key={pt} type="button" onClick={() => update({ placement_type: pt })}
                        className={`flex-1 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest transition-colors border ${
                          form.placement_type === pt
                            ? "bg-primary-container border-primary text-on-primary-container"
                            : "bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:bg-surface-container"
                        }`}>
                        {pt === "automatic" ? "Automatisch (empfohlen)" : "Manuell"}
                      </button>
                    ))}
                  </div>
                  <p className={hintClass}>Automatisch lässt Meta die besten Platzierungen wählen</p>
                </Field>

                {form.placement_type === "manual" && (
                  <Field label="Platzierungen auswählen">
                    <div className="space-y-2">
                      {PLACEMENTS.map((p) => (
                        <label key={p.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                          form.placements.includes(p.id)
                            ? "bg-primary-container/30 border-primary/30"
                            : "bg-surface-container-low border-outline-variant/20 hover:bg-surface-container"
                        }`}>
                          <input type="checkbox" checked={form.placements.includes(p.id)}
                            onChange={() => togglePlacement(p.id)} className="hidden" />
                          <span className={`material-symbols-outlined text-base ${form.placements.includes(p.id) ? "text-primary" : "text-outline"}`}
                            style={form.placements.includes(p.id) ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                            {form.placements.includes(p.id) ? "check_box" : "check_box_outline_blank"}
                          </span>
                          <span className={`material-symbols-outlined text-base text-outline`}>{p.icon}</span>
                          <span className="font-body text-sm text-on-surface">{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                )}
              </div>
            )}

            {/* ── Step 5: Ad Creative ──────────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-5">

                {/* Ad Image from job selection */}
                {form.ad_image_url ? (
                  <div>
                    <Field label="Ad-Bild">
                      <div className="relative rounded-xl overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={form.ad_image_url} alt="Ad Bild" className="w-full aspect-square object-cover" />
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-primary/90 rounded-full px-2 py-0.5">
                          <span className="material-symbols-outlined text-on-primary text-xs">check_circle</span>
                          <span className="font-label text-[9px] font-bold text-on-primary uppercase tracking-widest">Aktiv</span>
                        </div>
                      </div>
                      <p className="font-label text-[10px] text-outline mt-1.5">
                        Aus Job-Einstellungen übernommen · <button className="text-primary underline" onClick={() => router.push(`/jobs/${form.job_id}`)}>Ändern</button>
                      </p>
                    </Field>
                  </div>
                ) : (
                  <div className="bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-outline text-xl">image</span>
                    <div>
                      <p className="font-label text-xs font-bold text-on-surface-variant">Kein Ad-Bild ausgewählt</p>
                      <button className="font-label text-[10px] text-primary underline" onClick={() => router.push(`/jobs/${form.job_id}`)}>
                        Im Job ein Bild auswählen
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-primary-container/10 border border-primary-container/30 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary">KI-Generierung</span>
                  </div>
                  <p className="font-body text-xs text-on-surface-variant">
                    Felder leer lassen → Claude generiert 9 Varianten automatisch (3 Hooks × 3 Adsets). Eigene Texte überschreiben die KI.
                  </p>
                </div>

                <Field label="Primary Text">
                  <textarea rows={4} value={form.primary_text}
                    onChange={(e) => update({ primary_text: e.target.value })}
                    placeholder="Wir suchen Elektriker in Wien! ⚡ Verdiene bis zu €3500/Monat. Bewirb dich jetzt in 60 Sekunden…"
                    className={inputClass + " resize-none"} />
                  <p className={hintClass}>{form.primary_text.length}/125 Zeichen empfohlen</p>
                </Field>

                <Field label="Headline">
                  <input value={form.headline} onChange={(e) => update({ headline: e.target.value })}
                    placeholder="Elektriker gesucht – Wien ⚡"
                    className={inputClass} />
                </Field>

                <Field label="Call to Action">
                  <select value={form.cta_type} onChange={(e) => update({ cta_type: e.target.value })} className={inputClass}>
                    {CTA_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </Field>

                {funnel ? (
                  <Field label="Ziel-URL">
                    <div className={inputClass + " bg-surface-container-low text-outline cursor-default select-text"}>
                      {form.destination_url}
                    </div>
                    <p className={hintClass}>Aus Funnel: {funnel.name}</p>
                  </Field>
                ) : (
                  <Field label="Funnel auswählen">
                    <select
                      value={form.funnel_id}
                      onChange={(e) => {
                        const selected = funnels.find((f) => f.id === e.target.value);
                        if (!selected) return;
                        const jobTitle = selected.job?.title ?? "";
                        const campaignName = `[KI] ${jobTitle} – Österreich`;
                        const rawC = selected.job?.company as unknown;
                        const cId = Array.isArray(rawC)
                          ? (rawC as { id: string }[])[0]?.id ?? ""
                          : (rawC as { id: string } | null)?.id ?? "";
                        update({
                          funnel_id: selected.id,
                          job_id: selected.job_id,
                          company_id: cId,
                          destination_url: getFunnelPublicUrl(selected),
                          campaign_name: campaignName,
                          utm_campaign: slugify(campaignName),
                        });
                      }}
                      className={inputClass}
                    >
                      <option value="">– Funnel wählen –</option>
                      {funnels.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    {form.destination_url && (
                      <p className={hintClass}>Ziel-URL: {form.destination_url}</p>
                    )}
                  </Field>
                )}
              </div>
            )}

            {/* ── Step 6: Tracking ─────────────────────────────────────── */}
            {step === 5 && (
              <div className="space-y-5">
                <Field label="Meta Pixel ID (optional)">
                  <input value={form.pixel_id} onChange={(e) => update({ pixel_id: e.target.value })}
                    placeholder="1234567890"
                    className={inputClass} />
                  <p className={hintClass}>Für Conversion-Tracking. Leer lassen wenn kein Pixel vorhanden.</p>
                </Field>

                <Field label="UTM-Parameter">
                  <div className="space-y-3">
                    {[
                      { key: "utm_source",   label: "utm_source",   value: "facebook",    readOnly: true },
                      { key: "utm_medium",   label: "utm_medium",   value: "cpc",         readOnly: true },
                      { key: "utm_campaign", label: "utm_campaign", value: form.utm_campaign, readOnly: false },
                    ].map((p) => (
                      <div key={p.key} className="flex items-center gap-0 bg-surface-container-low border border-outline-variant/20 rounded-xl overflow-hidden">
                        <span className="px-3 py-2.5 font-label text-[10px] text-outline border-r border-outline-variant/20 whitespace-nowrap w-36">{p.label}</span>
                        <input value={p.value} readOnly={p.readOnly}
                          onChange={!p.readOnly ? (e) => update({ utm_campaign: e.target.value }) : undefined}
                          className={`flex-1 bg-transparent px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none ${p.readOnly ? "text-outline" : ""}`} />
                      </div>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {/* ── Step 7: Review ───────────────────────────────────────── */}
            {step === 6 && (
              <div className="space-y-4">
                {[
                  { label: "Kampagne",   items: [
                    { k: "Name",           v: form.campaign_name },
                    { k: "Ziel",           v: form.objective },
                    { k: "Sonderkategorie",v: form.special_category || "Keine" },
                    { k: "Jobkategorie",   v: form.job_category },
                  ]},
                  { label: "Zielgruppe", items: [
                    { k: "Regionen",    v: form.regions.length > 0 ? form.regions.join(", ") : "Ganz Österreich" },
                    { k: "Alter",       v: `${form.age_min} – ${form.age_max}` },
                    { k: "Geschlecht",  v: form.gender === "ALL" ? "Alle" : form.gender === "MALE" ? "Männlich" : "Weiblich" },
                    { k: "Interessen",  v: form.interests.length > 0 ? form.interests.join(", ") : "KI-automatisch" },
                  ]},
                  { label: "Budget", items: [
                    { k: "Typ",         v: form.budget_type === "daily" ? "Tagesbudget" : "Gesamtbudget" },
                    { k: "Betrag",      v: `€ ${form.daily_budget}` },
                    { k: "Start",       v: form.start_date },
                  ]},
                  { label: "Platzierung", items: [
                    { k: "Typ",         v: form.placement_type === "automatic" ? "Automatisch" : "Manuell" },
                    { k: "Flächen",     v: form.placement_type === "automatic" ? "Meta bestimmt" : (form.placements.join(", ") || "Keine gewählt") },
                  ]},
                  { label: "Creative", items: [
                    { k: "Headline",    v: form.headline || "KI-generiert" },
                    { k: "CTA",         v: ctaLabel },
                    { k: "Ziel-URL",    v: form.destination_url },
                  ]},
                  { label: "Tracking", items: [
                    { k: "Pixel",       v: form.pixel_id || "Kein Pixel" },
                    { k: "UTM",         v: `utm_campaign=${form.utm_campaign}` },
                  ]},
                ].map((section) => (
                  <div key={section.label} className="bg-surface-container rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-surface-container-high border-b border-outline-variant/10">
                      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">{section.label}</span>
                    </div>
                    <div className="divide-y divide-outline-variant/10">
                      {section.items.map((item) => (
                        <div key={item.k} className="flex items-start justify-between px-4 py-2.5">
                          <span className="font-label text-xs text-outline w-36 flex-shrink-0">{item.k}</span>
                          <span className="font-body text-sm text-on-surface text-right">{item.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {error && (
                  <div className="flex items-center gap-2 bg-error-container/20 border border-error-container/40 rounded-xl px-4 py-3">
                    <span className="material-symbols-outlined text-error text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                    <span className="font-body text-sm text-error">{error}</span>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-10">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 border border-outline-variant/30 text-on-surface-variant rounded-xl px-6 py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Zurück
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button onClick={() => setStep(step + 1)}
                  disabled={step === 0 && (!form.campaign_name || !form.job_category)}
                  className="flex items-center gap-2 bg-primary text-on-primary rounded-xl px-6 py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-50 ml-auto">
                  Weiter
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex items-center gap-2 bg-primary text-on-primary rounded-xl px-8 py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-60 ml-auto">
                  {submitting
                    ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    : <span className="material-symbols-outlined text-sm">rocket_launch</span>}
                  Kampagne starten
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Ad Preview Panel */}
        <aside className="w-80 flex-shrink-0 bg-surface-container-lowest border-l border-outline-variant/20 py-6 px-4 overflow-y-auto">
          <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-4">Vorschau</p>

          {/* Facebook Ad Mockup */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            {/* Post Header */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-on-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[13px] text-gray-900 leading-tight">KI Recruit</div>
                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                  Gesponsert ·
                  <span className="material-symbols-outlined text-[11px]">public</span>
                </div>
              </div>
              <span className="text-gray-400 text-xl">···</span>
            </div>

            {/* Ad Text */}
            <div className="px-3 pb-2">
              <p className="text-[13px] text-gray-800 leading-snug line-clamp-3">
                {form.primary_text || (
                  <span className="text-gray-400 italic">Primary Text wird von der KI generiert…</span>
                )}
              </p>
            </div>

            {/* Image Placeholder */}
            <div className="w-full h-36 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-primary/60">image</span>
            </div>

            {/* Link Preview */}
            <div className="border-t border-gray-100 px-3 py-2.5 bg-gray-50 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] text-gray-400 uppercase truncate">
                  {form.destination_url ? new URL(form.destination_url.startsWith("http") ? form.destination_url : `https://${form.destination_url}`).hostname : "apply.domain.com"}
                </div>
                <div className="text-[13px] font-bold text-gray-900 truncate">
                  {form.headline || <span className="text-gray-400 font-normal italic">Headline von KI…</span>}
                </div>
              </div>
              <button className="flex-shrink-0 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[11px] font-bold px-3 py-1.5 rounded whitespace-nowrap transition-colors">
                {ctaLabel}
              </button>
            </div>
          </div>

          {/* Stats estimate */}
          <div className="mt-5 space-y-3">
            <div className="bg-surface-container rounded-xl p-4">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-3">Schätzwerte</p>
              <div className="space-y-2.5">
                {[
                  { label: "Reichweite/Tag",  value: form.regions.length === 0 ? "~120.000" : `~${Math.round(120000 / 9 * (form.regions.length || 9)).toLocaleString("de-AT")}` },
                  { label: "Klicks/Tag",      value: `~${Math.round((parseFloat(form.daily_budget) || 50) * 8)}` },
                  { label: "Est. Leads/Tag",  value: `~${Math.round((parseFloat(form.daily_budget) || 50) * 0.4)}` },
                  { label: "Est. CPL",        value: `€ ${((parseFloat(form.daily_budget) || 50) / Math.max(Math.round((parseFloat(form.daily_budget) || 50) * 0.4), 1)).toFixed(2)}` },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center">
                    <span className="font-label text-[10px] text-outline">{s.label}</span>
                    <span className="font-headline text-sm text-on-surface">{s.value}</span>
                  </div>
                ))}
              </div>
              <p className="font-label text-[10px] text-outline-variant mt-3">Schätzwerte basierend auf Erfahrungswerten</p>
            </div>

            {/* Adset breakdown */}
            <div className="bg-surface-container rounded-xl p-4">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-2">KI erstellt automatisch</p>
              {["Broad 22–55", "Interests 25–45", "Retargeting 22–50"].map((a) => (
                <div key={a} className="flex items-center gap-2 py-1.5">
                  <span className="material-symbols-outlined text-primary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body text-xs text-on-surface-variant">{a}</span>
                </div>
              ))}
              <p className="font-label text-[10px] text-outline-variant mt-1">3 Ad Sets · je 3 KI-Creatives</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const hintClass = "font-label text-[10px] text-outline-variant mt-1";
