import { dict, type Lang } from "../_lib/dict";
import { t } from "../_lib/t";

type Solution = {
  problem: string;
  solution: string;
  stack: string[];
};

type Category = {
  label: string;
  items: Solution[];
};

// Gruppiertes Grid für KMU-Lösungen, in Kategorien mit Subheading statt
// einer einzigen 21-Card-Wand. Jede Card zeigt:
//  - Problem-Titel (fett)
//  - Kurze Lösung (2-3 Sätze)
//  - Tech-Stack-Badges (Vapi / Claude / n8n / Supabase)
export function SolutionGrid({
  lang,
  accentColor = "#1A3A6E",
}: {
  lang: Lang;
  accentColor?: string;
}) {
  const section = (dict[lang] as { kmu?: { solutions?: { categories?: Category[] } } })?.kmu
    ?.solutions;
  const categories = (section?.categories ?? []) as Category[];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center mb-12">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          {t(lang, "kmu.solutions.eyebrow")}
        </p>
        <h2 className="font-headline text-3xl sm:text-4xl italic text-slate-900 mb-3 max-w-2xl mx-auto leading-tight">
          {t(lang, "kmu.solutions.headline")}
        </h2>
        <p className="font-body text-slate-600 max-w-2xl mx-auto text-sm">
          {t(lang, "kmu.solutions.sub")}
        </p>
      </div>

      <div className="space-y-12">
        {categories.map((category) => (
          <div key={category.label}>
            <h3 className="flex items-center gap-2 font-body text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: accentColor }}
              />
              {category.label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map((s) => (
                <div
                  key={s.problem}
                  className="rounded-xl bg-white border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition"
                >
                  <h4 className="font-body font-semibold text-sm text-slate-900 leading-tight mb-2">
                    {s.problem}
                  </h4>
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
          </div>
        ))}
      </div>
    </section>
  );
}
