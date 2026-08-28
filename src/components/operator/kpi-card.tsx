import Link from "next/link";

type KpiCardProps = {
  icon: string;
  label: string;
  value: number | null;
  detail: string;
  href: string;
};

export function KpiCard({ icon, label, value, detail, href }: KpiCardProps) {
  return (
    <Link
      href={href}
      className="group min-w-0 rounded-xl bg-surface-container-lowest p-4 shadow-[0_12px_32px_-8px_rgba(45,52,51,0.08)] transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-5"
      aria-label={`${label}: ${value ?? "nicht verfügbar"}. ${detail}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 font-label text-xs font-bold leading-snug text-outline">{label}</span>
        <span className="material-symbols-outlined shrink-0 text-lg text-outline-variant" aria-hidden="true">{icon}</span>
      </div>
      <div className="mt-5 font-headline text-3xl font-medium leading-none text-on-surface tabular-nums sm:text-4xl">
        {value ?? "—"}
      </div>
      <div className="mt-2 flex items-center gap-1 font-label text-xs text-on-surface-variant">
        <span className="truncate">{value === null ? "Daten nicht verfügbar" : detail}</span>
        <span className="material-symbols-outlined text-sm text-outline transition-transform group-hover:translate-x-0.5" aria-hidden="true">arrow_forward</span>
      </div>
    </Link>
  );
}
