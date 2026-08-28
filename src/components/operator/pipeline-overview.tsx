import Link from "next/link";

const stageColors = [
  "bg-outline-variant",
  "bg-tertiary-container",
  "bg-primary-container",
  "bg-primary-fixed-dim",
  "bg-primary/60",
  "bg-primary",
  "bg-primary-dim",
  "bg-error-container/70",
];

export function PipelineOverview({ stages }: { stages: Array<{ key: string; label: string; count: number }> }) {
  const total = stages.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <section aria-labelledby="pipeline-heading" className="min-w-0 rounded-xl bg-surface-container-lowest p-5 shadow-[0_12px_32px_-8px_rgba(45,52,51,0.08)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="pipeline-heading" className="font-body text-base font-bold text-on-surface">Bewerber-Pipeline</h2>
          <p className="mt-1 font-label text-xs text-outline">{total} Bewerber in allen Phasen</p>
        </div>
        <Link href="/applicants" className="inline-flex min-h-11 items-center gap-1 font-label text-xs font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Alle ansehen
          <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
        </Link>
      </div>

      {total === 0 ? (
        <div className="mt-8 rounded-lg bg-surface-container-low px-5 py-8 text-center">
          <span className="material-symbols-outlined text-3xl text-outline-variant" aria-hidden="true">group_add</span>
          <p className="mt-2 font-label text-sm font-bold text-on-surface">Noch keine Bewerber</p>
          <p className="mt-1 font-body text-sm text-on-surface-variant">Neue Bewerbungen erscheinen automatisch in dieser Pipeline.</p>
        </div>
      ) : (
        <>
          <div className="mt-7 flex h-2 overflow-hidden rounded-full bg-surface-container" aria-hidden="true">
            {stages.map((stage, index) => stage.count > 0 && (
              <span key={stage.key} className={stageColors[index]} style={{ width: `${(stage.count / total) * 100}%` }} />
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-1 sm:grid-cols-4">
            {stages.map((stage, index) => (
              <Link key={stage.key} href={`/applicants?stage=${stage.key}`} className="group flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${stageColors[index]}`} aria-hidden="true" />
                  <span className="truncate font-label text-xs text-on-surface-variant group-hover:text-on-surface">{stage.label}</span>
                </span>
                <strong className="font-headline text-lg font-medium tabular-nums text-on-surface">{stage.count}</strong>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
