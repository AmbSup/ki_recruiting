import { dict, type Lang } from "../_lib/dict";
import { t } from "../_lib/t";

type Solution = {
  problem: string;
  solution: string;
  stack: string[];
};

// 3-Spalten-Grid für Handwerk-Lösungen. Jede Card zeigt:
//  - Problem-Titel (fett)
//  - Kurze Lösung (2-3 Sätze)
//  - Tech-Stack-Badges (Vapi / Claude / n8n / Supabase)
// Bewusst kompakt gehalten — 21 Cards passen so übersichtlich auf eine Seite.
export function SolutionGrid({
  lang,
  accentColor = "#1A3A6E",
}: {
  lang: Lang;
  accentColor?: string;
}) {
  const section = (dict[lang] as { handwerk?: { solutions?: { items?: Solution[] } } })?.handwerk
    ?.solutions;
  const items = (section?.items ?? []) as Solution[];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center mb-10">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          {t(lang, "handwerk.solutions.eyebrow")}
        </p>
        <h2 className="font-headline text-3xl sm:text-4xl italic text-slate-900 mb-3 max-w-2xl mx-auto leading-tight">
          {t(lang, "handwerk.solutions.headline")}
        </h2>
        <p className="font-body text-slate-600 max-w-2xl mx-auto text-sm">
          {t(lang, "handwerk.solutions.sub")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((s, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-white border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition"
          >
            <div className="flex items-start gap-2 mb-2">
              <span
                className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: accentColor }}
              />
              <h3 className="font-body font-semibold text-sm text-slate-900 leading-tight">
                {s.problem}
              </h3>
            </div>
            <p className="font-body text-[13px] text-slate-600 leading-relaxed mb-3">
              {s.solution}
            </p>
            <div className="flex flex-wrap gap-1">
              {s.stack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-100"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
