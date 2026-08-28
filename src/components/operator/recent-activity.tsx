import Link from "next/link";

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  return new Intl.DateTimeFormat("de-AT", { day: "2-digit", month: "short" }).format(new Date(value));
}

type Activity = { id: string; title: string; detail: string; occurredAt: string; href: string; icon: string };

export function RecentActivity({ activities }: { activities: Activity[] }) {
  return (
    <section aria-labelledby="activity-heading" className="min-w-0 rounded-xl bg-surface-container-lowest p-5 shadow-[0_12px_32px_-8px_rgba(45,52,51,0.08)] sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 id="activity-heading" className="font-body text-base font-bold text-on-surface">Neue Bewerbungen</h2>
        <span className="material-symbols-outlined text-xl text-outline-variant" aria-hidden="true">history</span>
      </div>
      {activities.length === 0 ? (
        <div className="py-12 text-center">
          <span className="material-symbols-outlined text-3xl text-outline-variant" aria-hidden="true">inbox</span>
          <p className="mt-2 font-label text-sm font-bold text-on-surface">Heute noch keine Bewerbung</p>
          <p className="mt-1 font-body text-sm text-on-surface-variant">Neue Kontakte erscheinen hier, sobald ein Funnel übermittelt wurde.</p>
        </div>
      ) : (
        <ol className="mt-5 divide-y divide-outline-variant/15">
          {activities.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="group flex min-h-16 items-start gap-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                  <span className="material-symbols-outlined text-base" aria-hidden="true">{item.icon}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body text-sm font-medium text-on-surface group-hover:text-primary">{item.title}</span>
                  <span className="mt-0.5 block truncate font-label text-xs text-outline">{item.detail}</span>
                </span>
                <time dateTime={item.occurredAt} className="shrink-0 font-label text-xs text-outline">{relativeTime(item.occurredAt)}</time>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
