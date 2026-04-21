"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type FunnelWithJob = {
  id: string;
  name: string;
  job_id: string | null;
  job: { id: string; title: string; company: { name: string } } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  funnel: FunnelWithJob | null;
};

const JOB_CATEGORIES = [
  "Elektriker",
  "Maurer",
  "Installateur",
  "Maler",
  "Schlosser",
  "Lagerarbeiter",
  "Fahrer",
  "Verkäufer",
  "Filialleiter",
  "Sonstiges",
];

const AUSTRIAN_REGIONS = [
  "Wien",
  "Niederösterreich",
  "Oberösterreich",
  "Steiermark",
  "Tirol",
  "Salzburg",
  "Kärnten",
  "Vorarlberg",
  "Burgenland",
];

export function MetaAdsSetupModal({ open, onClose, funnel }: Props) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [adImageUrl, setAdImageUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    job_category: "",
    daily_budget: "50",
    regions: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ campaignName: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (open && funnel?.job_id) {
      setForm({ job_category: "", daily_budget: "50", regions: [] });
      setError(null);
      setSuccess(null);
      setAdImageUrl(null);
      supabase
        .from("jobs")
        .select("company_id, selected_ad_image_url")
        .eq("id", funnel.job_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setCompanyId((data as { company_id: string }).company_id);
            setAdImageUrl((data as { selected_ad_image_url: string | null }).selected_ad_image_url ?? null);
          }
        });
    }
  }, [open, funnel?.job_id]);

  function toggleRegion(region: string) {
    setForm((prev) => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter((r) => r !== region)
        : [...prev.regions, region],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!funnel || !companyId) return;

    const budget = parseFloat(form.daily_budget);
    if (isNaN(budget) || budget < 1) {
      setError("Tagesbudget muss mindestens €1 sein");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/meta/campaigns/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: funnel.job_id,
        company_id: companyId,
        job_category: form.job_category,
        daily_budget_cents: Math.round(budget * 100),
        regions: form.regions,
        funnel_id: funnel.id,
        ad_image_url: adImageUrl ?? undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Unbekannter Fehler");
      setLoading(false);
    } else {
      setSuccess({ campaignName: data.campaign_name ?? "Kampagne erstellt" });
      setLoading(false);
    }
  }

  if (!open || !funnel) return null;
  // Meta-Ads-Setup ist aktuell nur für Recruiting-Funnels (job_id).
  // Sales-Funnels werden in einer späteren Iteration unterstützt.
  if (!funnel.job_id) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline text-2xl italic text-on-surface">Meta Ads Setup</h2>
            <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mt-0.5">
              Kampagne für diesen Funnel starten
            </p>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface transition-colors">
            close
          </button>
        </div>

        {success ? (
          /* Success State */
          <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <div>
              <h3 className="font-headline text-2xl italic text-on-surface mb-1">Kampagne gestartet!</h3>
              <p className="font-body text-sm text-on-surface-variant">{success.campaignName}</p>
            </div>
            <p className="font-body text-xs text-outline max-w-xs">
              Die KI-Agenten optimieren deine Kampagne automatisch. Du kannst die Performance im Dashboard verfolgen.
            </p>
            <button
              onClick={onClose}
              className="mt-2 bg-primary text-on-primary rounded-xl px-8 py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
            >
              Fertig
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Funnel Info (read-only) */}
            <div className="bg-surface-container rounded-xl px-4 py-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">conversion_path</span>
                <span className="font-body text-sm text-on-surface font-medium">{funnel.name}</span>
              </div>
              {funnel.job && (
                <p className="font-label text-xs text-outline pl-6">
                  {funnel.job.title} · {funnel.job.company.name}
                </p>
              )}
            </div>

            {/* Job Category */}
            <div>
              <label className={labelClass}>Jobkategorie *</label>
              <select
                required
                value={form.job_category}
                onChange={(e) => setForm({ ...form, job_category: e.target.value })}
                className={inputClass}
              >
                <option value="">Kategorie wählen…</option>
                {JOB_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="font-label text-xs text-outline-variant mt-1">
                Bestimmt Zielgruppen und KI-generierte Anzeigentexte
              </p>
            </div>

            {/* Daily Budget */}
            <div>
              <label className={labelClass}>Tagesbudget *</label>
              <div className="flex items-center gap-0 bg-surface-container-low border border-outline-variant/20 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors">
                <span className="px-3 py-2.5 font-label text-sm text-outline border-r border-outline-variant/20">€</span>
                <input
                  required
                  type="number"
                  min="1"
                  max="500"
                  step="1"
                  value={form.daily_budget}
                  onChange={(e) => setForm({ ...form, daily_budget: e.target.value })}
                  className="flex-1 bg-transparent px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none"
                />
                <span className="px-3 py-2.5 font-label text-xs text-outline border-l border-outline-variant/20">/Tag</span>
              </div>
              <p className="font-label text-xs text-outline-variant mt-1">
                Min. €1 · Max. €500 · Kill-Switch stoppt bei €500 Tagesausgabe
              </p>
            </div>

            {/* Regions */}
            <div>
              <label className={labelClass}>Regionen (optional)</label>
              <div className="flex flex-wrap gap-2">
                {AUSTRIAN_REGIONS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => toggleRegion(region)}
                    className={`px-3 py-1.5 rounded-lg font-label text-xs font-bold uppercase tracking-widest transition-colors ${
                      form.regions.includes(region)
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
              <p className="font-label text-xs text-outline-variant mt-2">
                Keine Auswahl = ganz Österreich
              </p>
            </div>

            {/* Ad Image Preview */}
            {adImageUrl && (
              <div>
                <label className={labelClass}>Ad-Bild</label>
                <div className="relative rounded-xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={adImageUrl} alt="Ad Bild" className="w-full aspect-square object-cover" />
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-primary/90 rounded-full px-2 py-0.5">
                    <span className="material-symbols-outlined text-on-primary text-xs">check_circle</span>
                    <span className="font-label text-[9px] font-bold text-on-primary uppercase tracking-widest">Ausgewählt</span>
                  </div>
                </div>
                <p className="font-label text-xs text-outline mt-1.5">Aus Job-Einstellungen übernommen</p>
              </div>
            )}

            {/* What the AI does */}
            <div className="bg-primary-container/10 border border-primary-container/30 rounded-xl px-4 py-3">
              <p className="font-label text-xs font-bold uppercase tracking-widest text-primary mb-2">Was die KI macht</p>
              <ul className="space-y-1">
                {[
                  "3 Anzeigensets (Broad, Interessen, Retargeting)",
                  "9 KI-generierte Anzeigentexte via Claude",
                  "Automatische Budget-Optimierung täglich",
                  "Kill-Switch bei schlechter Performance",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 font-body text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-error-container/20 border border-error-container/40 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-error text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                <span className="font-body text-sm text-error">{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-outline-variant/30 text-on-surface-variant rounded-xl py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-on-primary rounded-xl py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">campaign</span>
                )}
                Kampagne starten
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const labelClass = "font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5";
const inputClass =
  "w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
