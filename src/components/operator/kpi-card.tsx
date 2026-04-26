interface KpiCardProps {
  icon: string;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function KpiCard({ icon, label, value, trend, trendUp, className = "" }: KpiCardProps) {
  return (
    <div
      className={`bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] hover:bg-surface-bright transition-all group ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">
          {label}
        </span>
        <span className="material-symbols-outlined text-outline-variant text-xl">{icon}</span>
      </div>
      <div className="font-headline text-4xl text-on-surface leading-none mb-2">{value}</div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-label font-bold uppercase tracking-widest ${trendUp ? "text-primary" : "text-outline"}`}>
          {trendUp && (
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
              trending_up
            </span>
          )}
          {trend}
        </div>
      )}
    </div>
  );
}
