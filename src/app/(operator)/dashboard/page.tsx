import { KpiCard } from "@/components/operator/kpi-card";
import { RecentActivity } from "@/components/operator/recent-activity";
import { PipelineOverview } from "@/components/operator/pipeline-overview";
import { AlertsPanel } from "@/components/operator/alerts-panel";
import { DashboardHeader } from "@/components/operator/dashboard-header";

export default function DashboardPage() {
  return (
    <div className="px-8 pt-10 pb-32">
      {/* Editorial Header */}
      <DashboardHeader />

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-12 gap-5 mb-8">
        <KpiCard
          className="col-span-12 md:col-span-3"
          icon="domain"
          label="Aktive Firmen"
          value="7"
          trend="+2 diese Woche"
          trendUp
        />
        <KpiCard
          className="col-span-12 md:col-span-3"
          icon="work"
          label="Aktive Jobs"
          value="12"
          trend="4 neu heute"
          trendUp
        />
        <KpiCard
          className="col-span-12 md:col-span-3"
          icon="people"
          label="Neue Bewerber"
          value="23"
          trend="Heute"
          trendUp
        />
        <KpiCard
          className="col-span-12 md:col-span-3"
          icon="call"
          label="Calls heute"
          value="8"
          trend="3 geplant"
          trendUp
        />

        {/* Wide KPI – Monatsausgaben */}
        <div className="col-span-12 md:col-span-8 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
                Monatsausgaben Ads
              </span>
              <div className="font-headline text-4xl text-on-surface mt-1">€ 4.830</div>
              <div className="font-label text-xs text-outline mt-1">April 2026 · Budget: € 8.000</div>
            </div>
            <span className="material-symbols-outlined text-outline">bar_chart</span>
          </div>
          {/* Platzhalter Chart */}
          <div className="h-16 flex items-end gap-1">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-primary-container rounded-sm"
                style={{ height: `${Math.random() * 100}%`, opacity: 0.4 + i * 0.02 }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-label font-bold uppercase tracking-widest text-outline">
            <span>1. Apr</span>
            <span>Heute</span>
          </div>
        </div>

        {/* Cost per Lead */}
        <div className="col-span-12 md:col-span-4 bg-surface-container-low rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] flex flex-col justify-between">
          <div>
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
              Ø Cost per Lead
            </span>
            <div className="font-headline text-4xl text-on-surface mt-1">€ 18,40</div>
          </div>
          <div>
            <div className="flex justify-between text-[10px] font-label font-bold uppercase tracking-widest text-outline mb-2 mt-6">
              <span>Conversion Rate</span>
              <span>6,2%</span>
            </div>
            <div className="w-full bg-outline-variant/20 h-1.5 rounded-full">
              <div className="bg-primary h-full rounded-full" style={{ width: "62%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Pipeline + Activity */}
      <div className="grid grid-cols-12 gap-5 mb-8">
        <div className="col-span-12 md:col-span-7">
          <PipelineOverview />
        </div>
        <div className="col-span-12 md:col-span-5">
          <RecentActivity />
        </div>
      </div>

      {/* Bottom Row: Alerts */}
      <AlertsPanel />
    </div>
  );
}
