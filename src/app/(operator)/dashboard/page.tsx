import Link from "next/link";
import { AlertsPanel } from "@/components/operator/alerts-panel";
import { DashboardHeader } from "@/components/operator/dashboard-header";
import { KpiCard } from "@/components/operator/kpi-card";
import { PipelineOverview } from "@/components/operator/pipeline-overview";
import { RecentActivity } from "@/components/operator/recent-activity";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const dashboard = await getDashboardData();

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
      <DashboardHeader refreshedAt={dashboard.refreshedAt} />

      {dashboard.state !== "ready" && (
        <div role="status" className="mb-5 flex items-start gap-3 rounded-xl bg-tertiary-container/35 px-4 py-3 text-on-tertiary-container">
          <span className="material-symbols-outlined mt-0.5 text-lg" aria-hidden="true">sync_problem</span>
          <div className="min-w-0">
            <p className="font-label text-sm font-bold">Daten nur teilweise verfügbar</p>
            <p className="mt-0.5 font-body text-sm leading-relaxed">
              {dashboard.state === "error"
                ? "Das Dashboard konnte keine Live-Daten laden. Öffnen Sie die Detailbereiche oder laden Sie die Seite erneut."
                : `Nicht geladen: ${dashboard.unavailable.join(", ")}. Alle übrigen Werte sind aktuell.`}
            </p>
          </div>
        </div>
      )}

      <section aria-labelledby="automation-health" className="mb-6 overflow-hidden rounded-xl bg-inverse-surface text-on-primary shadow-[0_18px_48px_-20px_rgba(12,15,14,0.45)]">
        <div className="grid lg:grid-cols-[1.25fr_1fr]">
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="automation-health" className="font-body text-base font-bold">Automatisierungsstatus</h2>
              <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-white/10 px-3 font-label text-xs font-bold">
                <span className={`h-2 w-2 rounded-full ${dashboard.health.failedCalls > 0 ? "bg-error-container" : "bg-primary-fixed-dim"}`} />
                {dashboard.health.failedCalls > 0 ? "Handlungsbedarf" : "System bereit"}
              </span>
            </div>
            <div className="mt-8 flex flex-wrap items-end gap-4">
              <strong className="font-headline text-6xl font-medium leading-none tabular-nums sm:text-7xl">
                {dashboard.health.withinThirtySecondsPercent === null ? "—" : `${dashboard.health.withinThirtySecondsPercent}%`}
              </strong>
              <p className="max-w-56 pb-1 font-body text-sm leading-snug text-white/70">
                der neuen Kontakte wurden innerhalb von 30 Sekunden angerufen.
              </p>
            </div>
            <p className="mt-4 font-label text-xs text-white/60">
              {dashboard.health.contacted} kontaktiert · {dashboard.health.eligible} neue Kontakte · letzte 24 Stunden
            </p>
          </div>
          <div className="grid grid-cols-3 border-t border-white/10 lg:border-l lg:border-t-0">
            {[
              { label: "Aktiv", value: dashboard.health.activeCalls, icon: "phone_in_talk", href: "/calls" },
              { label: "Geplant", value: dashboard.health.queuedCalls, icon: "schedule", href: "/calls?status=scheduled" },
              { label: "Prüfen", value: dashboard.health.failedCalls, icon: "error", href: "/calls?status=failed", alert: dashboard.health.failedCalls > 0 },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="group flex min-h-36 flex-col justify-between border-r border-white/10 p-4 last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-fixed-dim sm:p-5 lg:min-h-full">
                <span className={`material-symbols-outlined text-xl ${item.alert ? "text-error-container" : "text-white/50"}`} aria-hidden="true">{item.icon}</span>
                <span>
                  <strong className="block font-headline text-3xl font-medium tabular-nums">{item.value}</strong>
                  <span className="font-label text-xs text-white/60 group-hover:text-white">{item.label}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <AlertsPanel alerts={dashboard.alerts} />

      <section aria-label="Geschäftskennzahlen" className="my-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        <KpiCard href="/companies" icon="domain" label="Aktive Firmen" value={dashboard.metrics.activeCompanies} detail="Firmenübersicht öffnen" />
        <KpiCard href="/jobs" icon="work" label="Aktive Jobs" value={dashboard.metrics.activeJobs} detail="Stellen verwalten" />
        <KpiCard href="/applicants" icon="people" label="Neue Kontakte" value={dashboard.metrics.newContactsToday} detail="Heute eingegangen" />
        <KpiCard href="/calls" icon="call" label="Anrufe abgeschlossen" value={dashboard.metrics.completedCallsToday} detail="Heute" />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <PipelineOverview stages={dashboard.pipeline} />
        <RecentActivity activities={dashboard.activities} />
      </section>
    </div>
  );
}
