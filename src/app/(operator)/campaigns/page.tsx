"use client";

import { useState, useEffect, useCallback } from "react";

type Campaign = {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget_cents: number;
  impressions: number;
  clicks: number;
  leads: number;
  spend_cents: number;
  cpl_cents: number;
  created_time: string;
  job: { title: string; company: { name: string } } | null;
  funnel: { name: string; slug: string } | null;
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  active:    { label: "Aktiv",     bg: "bg-primary-container/40",    text: "text-primary" },
  paused:    { label: "Pausiert",  bg: "bg-tertiary-container/40",   text: "text-tertiary" },
  deleted:   { label: "Gelöscht", bg: "bg-error-container/40",      text: "text-error" },
  archived:  { label: "Archiviert", bg: "bg-surface-container-high", text: "text-outline" },
};

function MetricBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div>
      <div className="font-headline text-2xl text-on-surface">{value}</div>
      <div className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">{label}</div>
      {sub && <div className="font-label text-[10px] text-outline-variant">{sub}</div>}
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/meta/campaigns/list");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fehler beim Laden");
      setCampaigns(json.campaigns ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const syncMetrics = async () => {
    setSyncing(true);
    try {
      await fetch("/api/meta/performance/sync", { method: "POST" });
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const filtered = campaigns.filter((c) =>
    statusFilter === "all" || c.status === statusFilter
  );

  const totalSpend = campaigns.reduce((s, c) => s + c.spend_cents, 0);
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const avgCpl = totalLeads > 0 ? Math.round(totalSpend / totalLeads) : 0;

  return (
    <div className="px-8 pt-10 pb-32">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Operator Panel</p>
          <h1 className="font-headline text-5xl italic text-on-surface leading-none">Kampagnen</h1>
          <p className="font-body text-on-surface-variant mt-2">
            {loading ? "Lädt von Meta…" : error ? "Fehler beim Laden" : `${campaigns.length} Kampagnen von Facebook Ads`}
          </p>
        </div>
        <button
          onClick={syncMetrics}
          disabled={syncing}
          className="flex items-center gap-2 bg-surface-container-highest text-on-surface px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-sm ${syncing ? "animate-spin" : ""}`}>sync</span>
          {syncing ? "Syncing…" : "Metriken sync"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-error-container/30 rounded-xl text-error font-label text-sm flex items-center gap-3">
          <span className="material-symbols-outlined text-xl">error</span>
          {error}
          <button onClick={load} className="ml-auto underline">Erneut versuchen</button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-12 gap-5 mb-8">
        {[
          { label: "Gesamtausgaben (30d)",  value: `€ ${(totalSpend / 100).toFixed(0)}`,   icon: "payments",   col: 3 },
          { label: "Leads gesamt (30d)",    value: totalLeads,                               icon: "people",     col: 3 },
          { label: "Ø Cost per Lead",       value: avgCpl > 0 ? `€ ${(avgCpl / 100).toFixed(2)}` : "—", icon: "show_chart", col: 3 },
          { label: "Aktive Kampagnen",      value: activeCampaigns.length,                  icon: "campaign",   col: 3 },
        ].map((k) => (
          <div key={k.label} className={`col-span-12 md:col-span-${k.col} bg-surface-container-lowest rounded-xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">{k.label}</span>
              <span className="material-symbols-outlined text-outline-variant text-xl">{k.icon}</span>
            </div>
            <div className="font-headline text-3xl text-on-surface">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-3 mb-8">
        {["all", "active", "paused", "archived"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-5 py-2 rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors ${
              statusFilter === s
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
            }`}>
            {s === "all" ? "Alle" : statusConfig[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Campaigns */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 animate-spin">progress_activity</span>
          <p className="font-body text-on-surface-variant">Kampagnen werden von Meta geladen…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">campaign</span>
          <h3 className="font-headline text-2xl italic text-on-surface mb-2">Keine Kampagnen gefunden</h3>
          <p className="font-body text-on-surface-variant">Erstelle eine Kampagne über den Funnels-Bereich.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((campaign) => {
            const st = statusConfig[campaign.status] ?? { label: campaign.status, bg: "bg-surface-container-high", text: "text-outline" };
            const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : "0";
            const dailyBudgetEur = (campaign.daily_budget_cents / 100).toFixed(0);
            const spentEur = (campaign.spend_cents / 100).toFixed(0);

            return (
              <div key={campaign.id} className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] hover:bg-surface-bright transition-all">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl text-blue-600">thumb_up</span>
                    </div>
                    <div>
                      <h3 className="font-label text-sm font-bold text-on-surface">{campaign.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-label text-[10px] text-outline">Facebook Ads</span>
                        {campaign.job && (
                          <>
                            <span className="text-outline-variant">·</span>
                            <span className="font-label text-[10px] text-outline">{campaign.job.title}</span>
                            <span className="text-outline-variant">·</span>
                            <span className="font-label text-[10px] text-outline">{campaign.job.company.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-label font-bold uppercase tracking-widest px-3 py-1 rounded-full ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                    <a
                      href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${process.env.NEXT_PUBLIC_META_AD_ACCOUNT_ID ?? '2548572985537368'}&selected_campaign_ids=${campaign.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="material-symbols-outlined text-outline hover:text-on-surface text-xl"
                      title="In Meta Ads Manager öffnen"
                    >
                      open_in_new
                    </a>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-6 gap-4 mb-5">
                  <MetricBox label="Impressions" value={campaign.impressions.toLocaleString("de-AT")} />
                  <MetricBox label="Clicks" value={campaign.clicks.toLocaleString("de-AT")} />
                  <MetricBox label="CTR" value={`${ctr}%`} />
                  <MetricBox label="Leads" value={campaign.leads} />
                  <MetricBox label="Cost/Lead" value={campaign.cpl_cents > 0 ? `€ ${(campaign.cpl_cents / 100).toFixed(2)}` : "—"} />
                  <MetricBox label="Ausgaben (30d)" value={`€ ${spentEur}`} sub={campaign.daily_budget_cents > 0 ? `Budget: € ${dailyBudgetEur}/Tag` : undefined} />
                </div>

                {/* Funnel link */}
                {campaign.funnel && (
                  <div className="pt-4 border-t border-outline-variant/10">
                    <a
                      href={`/${campaign.funnel.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 font-label text-[10px] font-bold uppercase tracking-widest text-outline hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-xs">link</span>
                      Funnel: {campaign.funnel.name}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
