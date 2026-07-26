import { dict, type Lang } from "../_lib/dict";
import { t } from "../_lib/t";
import { BRAND_COLOR } from "../_lib/brand";

type Step = { label: string; title: string; intro: string; bullets: string[]; result: string };

// Mehrstufiger Prozess-Timeline (z.B. "Woche 1-4"). Anders als HowItWorks:
// jeder Step hat eine eigene Bullet-Liste + einen hervorgehobenen
// "Ergebnis"-Callout statt nur Titel + Fließtext. Vertikal gestapelt statt
// Grid, weil die Steps inhaltlich unterschiedlich lang sind.
export function ProcessTimeline({
  lang,
  sectionKey,
  accentColor = "#1A3A6E",
}: {
  lang: Lang;
  sectionKey: string;
  accentColor?: string;
}) {
  const section = getNested(dict[lang], sectionKey);
  const steps = (section?.steps ?? []) as Step[];

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center mb-12">
        <p
          className="font-label text-[15.6px] font-bold uppercase tracking-widest mb-3"
          style={{ color: BRAND_COLOR }}
        >
          {t(lang, `${sectionKey}.eyebrow`)}
        </p>
        <h2 className="font-headline text-3xl sm:text-4xl italic text-slate-900 leading-tight max-w-2xl mx-auto">
          {t(lang, `${sectionKey}.headline`)}
        </h2>
      </div>

      <div className="space-y-6">
        {steps.map((step, i) => (
          <div key={i} className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
              <span
                className="font-label text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1"
                style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
              >
                {step.label}
              </span>
              <h3 className="font-headline text-xl sm:text-2xl italic text-slate-900">
                {step.title}
              </h3>
            </div>
            <p className="font-body text-sm text-slate-600 leading-relaxed mb-4">{step.intro}</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
              {step.bullets.map((b, bi) => (
                <li key={bi} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div
              className="rounded-lg px-4 py-3 text-sm font-body"
              style={{ backgroundColor: `${accentColor}0d`, color: accentColor }}
            >
              <span className="font-semibold">{t(lang, `${sectionKey}.result_label`)}: </span>
              {step.result}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function getNested(obj: unknown, path: string): { steps?: Step[] } | null {
  const parts = path.split(".");
  let cursor: unknown = obj;
  for (const p of parts) {
    if (cursor && typeof cursor === "object" && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else return null;
  }
  return cursor as { steps?: Step[] };
}
