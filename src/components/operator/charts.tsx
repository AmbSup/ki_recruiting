// Plain-SVG-Charts für das Funnel-Analytics-Dashboard. Keine library-dep.
// Bewusst minimal: BarWaterfall, LineChart, Donut.

type WaterfallStep = { label: string; visitors: number; pct: number };

export function BarWaterfall({ steps, accent }: { steps: WaterfallStep[]; accent?: string }) {
  if (steps.length === 0) {
    return <p className="font-body text-sm text-outline italic">Keine Page-View-Daten in den letzten 30 Tagen.</p>;
  }
  const color = accent ?? "#1f2937";
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-40 flex-shrink-0">
            <div className="font-label text-xs text-outline truncate" title={s.label}>
              {s.label}
            </div>
          </div>
          <div className="flex-1 h-8 bg-surface-container-low rounded-md overflow-hidden relative">
            <div
              className="h-full transition-all"
              style={{
                width: `${Math.max(s.pct, 2)}%`,
                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
              }}
            />
          </div>
          <div className="w-24 flex-shrink-0 text-right">
            <div className="font-headline text-base text-on-surface leading-none">{s.visitors}</div>
            <div className="font-label text-[10px] text-outline">{s.pct.toFixed(1)}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}

type DayPoint = { date: string; visits: number; submits: number; cr: number };

export function LineChart({ points, accent, height = 180 }: { points: DayPoint[]; accent?: string; height?: number }) {
  if (points.length === 0) {
    return <p className="font-body text-sm text-outline italic">Keine Daten in den letzten 30 Tagen.</p>;
  }
  const color = accent ?? "#1f2937";
  const padding = { top: 16, right: 12, bottom: 24, left: 32 };
  const W = 600;
  const H = height;
  const innerW = W - padding.left - padding.right;
  const innerH = H - padding.top - padding.bottom;
  const maxVisits = Math.max(...points.map((p) => p.visits), 1);
  const stepX = innerW / Math.max(points.length - 1, 1);
  const visitsPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${padding.left + i * stepX} ${padding.top + innerH - (p.visits / maxVisits) * innerH}`)
    .join(" ");
  const crPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${padding.left + i * stepX} ${padding.top + innerH - (p.cr / 100) * innerH}`)
    .join(" ");
  const xLabels = points.filter((_, i) => i % 5 === 0 || i === points.length - 1);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
        {/* Y-Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
          <line
            key={i}
            x1={padding.left}
            x2={W - padding.right}
            y1={padding.top + innerH * (1 - g)}
            y2={padding.top + innerH * (1 - g)}
            stroke="#e5e7eb"
            strokeDasharray="2 4"
            strokeWidth="1"
          />
        ))}
        {/* Visits-Linie (absolut, links Y) */}
        <path d={visitsPath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* CR-Linie (rechts Y, gestrichelt) */}
        <path d={crPath} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 4" />
        {/* X-Labels */}
        {xLabels.map((p, i) => {
          const idx = points.indexOf(p);
          return (
            <text
              key={i}
              x={padding.left + idx * stepX}
              y={H - 6}
              fontSize="9"
              fill="#9ca3af"
              textAnchor="middle"
            >
              {p.date.slice(5)}
            </text>
          );
        })}
        {/* Y-Achse */}
        <text x={4} y={padding.top + 4} fontSize="9" fill="#9ca3af">{maxVisits}</text>
        <text x={4} y={H - padding.bottom + 2} fontSize="9" fill="#9ca3af">0</text>
      </svg>
      <div className="flex items-center gap-4 mt-2 font-label text-xs text-outline">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5" style={{ background: color }} />
          Besuche
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: "#10b981" }} />
          Conversion-Rate
        </span>
      </div>
    </div>
  );
}

type DonutSlice = { type: string; count: number; pct: number };

export function Donut({ slices, accent }: { slices: DonutSlice[]; accent?: string }) {
  if (slices.length === 0) {
    return <p className="font-body text-sm text-outline italic">Keine Daten.</p>;
  }
  const colors = [accent ?? "#1f2937", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];
  const labels: Record<string, string> = {
    mobile: "Mobile",
    desktop: "Desktop",
    tablet: "Tablet",
    unknown: "Unbekannt",
  };
  const r = 50;
  const cx = 70;
  const cy = 70;
  let cumulative = 0;
  const total = slices.reduce((s, x) => s + x.pct, 0) || 1;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 140 140" className="w-32 h-32 flex-shrink-0">
        {slices.map((s, i) => {
          const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
          cumulative += s.pct;
          const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
          return <path key={i} d={path} fill={colors[i % colors.length]} />;
        })}
        <circle cx={cx} cy={cy} r={28} fill="white" />
      </svg>
      <div className="flex-1 space-y-1.5">
        {slices.map((s, i) => (
          <div key={s.type} className="flex items-center gap-2 font-label text-xs">
            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: colors[i % colors.length] }} />
            <span className="text-on-surface">{labels[s.type] ?? s.type}</span>
            <span className="ml-auto text-outline">{s.count} · {s.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
