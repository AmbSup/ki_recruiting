"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Campaign = {
  id: string;
  name: string;
  platform: "facebook" | "instagram" | "linkedin";
  status: "draft" | "active" | "paused" | "completed";
  daily_budget: number;
  total_spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpl: number | null;
  started_at: string | null;
  job: { title: string; company: { name: string } };
  funnel: { name: string; slug: string } | null;
};

const platformConfig = {
  facebook:  { label: "Facebook",  icon: "thumb_up",   color: "text-blue-600",  bg: "bg-blue-50" },
  instagram: { label: "Instagram", icon: "photo_camera", color: "text-pink-600", bg: "bg-pink-50" },
  linkedin:  { label: "LinkedIn",  icon: "work",        color: "text-sky-700",   bg: "bg-sky-50" },
};

const statusConfig = {
  draft:     { label: "Entwurf",   bg: "bg-surface-container-high",  text: "text-outline" },
  active:    { label: "Aktiv",     bg: "bg-primary-container/40",     text: "text-primary" },
  paused:    { label: "Pausiert",  bg: "bg-tertiary-container/40",    text: "text-tertiary" },
  completed: { label: "Beendet",   bg: "bg-secondary-container",      text: "text-secondary" },
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
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("campaigns")
      .select(`
        id, name, platform, status, daily_budget, total_spent,
        impressions, clicks, conversions, cpl, started_at,
        job:jobs(title, company:companies(name)),
        funnel:funnels(name, slug)
      `)
      .order("started_at", { ascending: false, nullsFirst: false });
    setCampaigns((data ?? []) as unknown as Campaign[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = campaigns.filter((c) => {
    const matchPlatform = platformFilter === "all" || c.platform === platformFilter;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchPlatform && matchStatus;
  });

  const totalSpend = campaigns.reduce((s, c) => s + (c.total_spent ?? 0), 0);
  const totalConversions = campaigns.reduce((s, c) => s + (c.conversions ?? 0), 0);
  const avgCpl = campaigns.filter((c) => c.cpl).length > 0
    ? campaigns.reduce((s, c) => s + (c.cpl ?? 0), 0) / campaigns.filter((c) => c.cpl).length
    : null;

  return (
    <div className="px-8 pt-10 pb-32">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Operator Panel</p>
          <h1 className="font-headline text-5xl italic text-on-surface leading-none">Kampagnen</h1>
          <p className="font-body text-on-surface-variant mt-2">{loading ? "Lädt…" : `${campaigns.length} Ad-Kampagnen`}</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
          <span className="material-symbols-outlined text-sm">add</span>
          Neue Kampagne
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-12 gap-5 mb-8">
        {[
          { label: "Gesamtausgaben",  value: `€ ${totalSpend.toFixed(0)}`,  icon: "payments",      col: 3 },
          { label: "Leads gesamt",    value: totalConversions,               icon: "people",        col: 3 },
          { label: "Ø Cost per Lead", value: avgCpl ? `€ ${avgCpl.toFixed(2)}` : "—", icon: "show_chart", col: 3 },
          { label: "Aktive Kampagnen",value: campaigns.filter((c) => c.status === "active").length, icon: "campaign", col: 3 },
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {["all", "facebook", "instagram", "linkedin"].map((p) => (
          <button key={p} onClick={() => setPlatformFilter(p)}
            className={`px-5 py-2 rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors ${
              platformFilter === p
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
            }`}>
            {p === "all" ? "Alle" : platformConfig[p as keyof typeof platformConfig].label}
          </button>
        ))}
        <div className="w-px bg-outline-variant/20" />
        {["all", "active", "draft", "paused", "completed"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-5 py-2 rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors ${
              statusFilter === s
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
            }`}>
            {s === "all" ? "Alle Status" : statusConfig[s as keyof typeof statusConfig]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Campaigns */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">campaign</span>
          <h3 className="font-headline text-2xl italic text-on-surface mb-2">Noch keine Kampagnen</h3>
          <p className="font-body text-on-surface-variant mb-6">Erstelle deine erste Ad-Kampagne für einen Job.</p>
          <button className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
            <span className="material-symbols-outlined text-sm">add</span>
            Erste Kampagne erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((campaign) => {
            const platform = platformConfig[campaign.platform];
            const st = statusConfig[campaign.status];
            const ctr = campaign.impressions > 0 ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : "0";
            const budgetUsed = campaign.daily_budget > 0 ? Math.min((campaign.total_spent / (campaign.daily_budget * 30)) * 100, 100) : 0;

            return (
              <div key={campaign.id} className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] hover:bg-surface-bright transition-all">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${platform.bg} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined text-xl ${platform.color}`}>{platform.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-label text-sm font-bold text-on-surface">{campaign.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-label text-[10px] text-outline">{platform.label}</span>
                        <span className="text-outline-variant">·</span>
                        <span className="font-label text-[10px] text-outline">{campaign.job.title}</span>
                        <span className="text-outline-variant">·</span>
                        <span className="font-label text-[10px] text-outline">{campaign.job.company.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-label font-bold uppercase tracking-widest px-3 py-1 rounded-full ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                    <button className="material-symbols-outlined text-outline hover:text-on-surface text-xl">more_horiz</button>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-6 gap-4 mb-5">
                  <MetricBox label="Impressions" value={campaign.impressions.toLocaleString("de-AT")} />
                  <MetricBox label="Clicks" value={campaign.clicks.toLocaleString("de-AT")} />
                  <MetricBox label="CTR" value={`${ctr}%`} />
                  <MetricBox label="Leads" value={campaign.conversions} />
                  <MetricBox label="Cost/Lead" value={campaign.cpl ? `€ ${campaign.cpl.toFixed(2)}` : "—"} />
                  <MetricBox label="Ausgaben" value={`€ ${campaign.total_spent.toFixed(0)}`} sub={`Budget: € ${campaign.daily_budget}/Tag`} />
                </div>

                {/* Budget Bar */}
                <div>
                  <div className="flex justify-between text-[10px] font-label font-bold uppercase tracking-widest text-outline mb-1.5">
                    <span>Budget-Verbrauch</span>
                    <span>{budgetUsed.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-outline-variant/20 h-1.5 rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${budgetUsed > 90 ? "bg-error" : "bg-primary"}`}
                      style={{ width: `${budgetUsed}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-outline-variant/10">
                  {campaign.status === "active" && (
                    <button className="flex items-center gap-1.5 font-label text-[10px] font-bold uppercase tracking-widest text-tertiary hover:underline">
                      <span className="material-symbols-outlined text-xs">pause</span>
                      Pausieren
                    </button>
                  )}
                  {campaign.status === "paused" && (
                    <button className="flex items-center gap-1.5 font-label text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                      <span className="material-symbols-outlined text-xs">play_arrow</span>
                      Fortsetzen
                    </button>
                  )}
                  {campaign.status === "draft" && (
                    <button className="flex items-center gap-1.5 font-label text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                      <span className="material-symbols-outlined text-xs">rocket_launch</span>
                      Aktivieren
                    </button>
                  )}
                  <button className="flex items-center gap-1.5 font-label text-[10px] font-bold uppercase tracking-widest text-outline hover:text-on-surface transition-colors ml-auto">
                    <span className="material-symbols-outlined text-xs">sync</span>
                    Metriken sync
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
