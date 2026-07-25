import { dict, type Lang } from "../_lib/dict";
import { t } from "../_lib/t";
import { BRAND_COLOR } from "../_lib/brand";

type Step = { title: string; body: string };

// 3-Step-Process. Kann für Home, Sales, Recruiting genutzt werden über
// unterschiedliche section-Keys ("home.how_it_works", "sales.how", "recruiting.how").
export function HowItWorks({
  lang,
  sectionKey,
  accentColor = "#1A3A6E",
}: {
  lang: Lang;
  sectionKey: string;
  accentColor?: string;
}) {
  // Steps direkt aus dict lesen (Array-of-Objects — kein t()-Helper)
  const section = getNested(dict[lang], sectionKey);
  const steps = (section?.steps ?? []) as Step[];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center mb-12">
        <p
          className="font-label text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: BRAND_COLOR }}
        >
          {t(lang, `${sectionKey}.eyebrow`)}
        </p>
        <h2 className="font-headline text-3xl sm:text-4xl italic text-slate-900 leading-tight max-w-2xl mx-auto">
          {t(lang, `${sectionKey}.headline`)}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <div key={i} className="relative rounded-2xl bg-white border border-slate-200 p-6">
            <span
              className="absolute -top-4 left-6 flex items-center justify-center w-8 h-8 rounded-full text-white font-headline italic text-lg"
              style={{ backgroundColor: accentColor }}
            >
              {i + 1}
            </span>
            <h3 className="font-headline text-xl italic text-slate-900 mt-2 mb-3">
              {step.title}
            </h3>
            <p className="font-body text-sm text-slate-600 leading-relaxed">{step.body}</p>
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
