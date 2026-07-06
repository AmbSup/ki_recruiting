import { dict, type Lang } from "../_lib/dict";
import { t } from "../_lib/t";

// Kompakte 2-Spalten-Liste der 10 größten Handwerk-Zeitfresser.
// Dient als Problem-Bewusstsein-Anker vor der Solutions-Grid.
export function ProblemTiles({ lang }: { lang: Lang }) {
  const items = (
    (dict[lang] as { handwerk?: { problems?: { items?: string[] } } })?.handwerk?.problems?.items ??
    []
  ) as string[];

  return (
    <section className="mx-auto max-w-4xl px-6 py-14">
      <div className="text-center mb-8">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          {t(lang, "handwerk.problems.eyebrow")}
        </p>
        <h2 className="font-headline text-3xl sm:text-4xl italic text-slate-900 leading-tight">
          {t(lang, "handwerk.problems.headline")}
        </h2>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-3xl mx-auto">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex items-start gap-3 rounded-lg bg-slate-50/60 px-4 py-3 border border-slate-100"
          >
            <span className="font-mono text-[11px] text-slate-400 mt-0.5 flex-shrink-0 w-4">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className="font-body text-sm text-slate-700 leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
