import Link from "next/link";
import type { DashboardData } from "@/lib/dashboard-data";

const styles = {
  error: { surface: "bg-error-container/20", text: "text-error", icon: "error" },
  warning: { surface: "bg-tertiary-container/30", text: "text-tertiary", icon: "warning" },
  info: { surface: "bg-primary-container/25", text: "text-primary", icon: "info" },
};

export function AlertsPanel({ alerts }: { alerts: DashboardData["alerts"] }) {
  return (
    <section aria-labelledby="attention-heading">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 id="attention-heading" className="font-body text-base font-bold text-on-surface">Jetzt wichtig</h2>
        <span className="font-label text-xs text-outline">{alerts.length} offen</span>
      </div>
      {alerts.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl bg-surface-container-low px-4 py-4">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">check_circle</span>
          <div>
            <p className="font-label text-sm font-bold text-on-surface">Keine offenen Ausnahmen</p>
            <p className="mt-0.5 font-body text-sm text-on-surface-variant">Alle erkannten Anrufe und Freigaben sind aktuell bearbeitet.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-3">
          {alerts.slice(0, 3).map((alert) => {
            const style = styles[alert.type];
            return (
              <article key={alert.id} className={`flex min-w-0 flex-col justify-between rounded-xl p-4 ${style.surface}`}>
                <div className="flex items-start gap-3">
                  <span className={`material-symbols-outlined mt-0.5 shrink-0 ${style.text}`} aria-hidden="true">{style.icon}</span>
                  <div className="min-w-0">
                    <h3 className="font-body text-sm font-bold leading-snug text-on-surface">{alert.title}</h3>
                    <p className="mt-1 line-clamp-2 font-body text-sm leading-relaxed text-on-surface-variant">{alert.description}</p>
                  </div>
                </div>
                <Link href={alert.href} className={`mt-4 inline-flex min-h-11 items-center gap-1 self-start font-label text-xs font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${style.text}`}>
                  {alert.action}
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
