const stages = [
  { key: "new",            label: "Neu",           color: "bg-outline-variant",       count: 14 },
  { key: "cv_analyzed",    label: "CV analysiert",  color: "bg-tertiary-container",    count: 9 },
  { key: "call_scheduled", label: "Call geplant",   color: "bg-primary-container",     count: 6 },
  { key: "call_completed", label: "Call fertig",    color: "bg-primary/30",            count: 5 },
  { key: "evaluated",      label: "Bewertet",       color: "bg-primary/60",            count: 4 },
  { key: "presented",      label: "Freigegeben",    color: "bg-primary",               count: 3 },
  { key: "accepted",       label: "Akzeptiert",     color: "bg-primary-dim",           count: 2 },
  { key: "rejected",       label: "Abgelehnt",      color: "bg-error-container/50",    count: 7 },
];

export function PipelineOverview() {
  const total = stages.reduce((s, st) => s + st.count, 0);

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
            Bewerber-Pipeline
          </span>
          <div className="font-headline text-2xl text-on-surface mt-1">{total} Bewerber</div>
        </div>
        <a
          href="/applicants"
          className="text-[10px] font-label font-bold uppercase tracking-widest text-primary hover:underline"
        >
          Alle ansehen
        </a>
      </div>

      {/* Pipeline Bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-6 gap-0.5">
        {total === 0 ? (
          <div className="flex-1 bg-outline-variant/20 rounded-full" />
        ) : (
          stages.map((stage) =>
            stage.count > 0 ? (
              <div
                key={stage.key}
                className={`${stage.color} transition-all`}
                style={{ width: `${(stage.count / total) * 100}%` }}
                title={`${stage.label}: ${stage.count}`}
              />
            ) : null
          )
        )}
      </div>

      {/* Stage List */}
      <div className="space-y-2">
        {stages.map((stage) => (
          <div key={stage.key} className="flex items-center justify-between py-1.5 group">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
              <span className="font-label text-xs font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors">
                {stage.label}
              </span>
            </div>
            <span className="font-headline text-lg text-on-surface">{stage.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
