import { dict, type Lang } from "../_lib/dict";
import { t } from "../_lib/t";
import { BRAND_COLOR } from "../_lib/brand";

type Benefit = { title: string; body: string };

// Generisches Vorteils-Grid (2-4 Spalten). Anders als SolutionGrid: kein
// Problem/Lösung/Tech-Stack-Framing — nur Titel + Nutzen-Satz. Für Pages,
// die bewusst nicht erklären *wie* etwas gebaut ist, sondern nur *was* es bringt.
export function BenefitGrid({
  lang,
  sectionKey,
  accentColor = "#1A3A6E",
}: {
  lang: Lang;
  sectionKey: string;
  accentColor?: string;
}) {
  const section = getNested(dict[lang], sectionKey);
  const items = (section?.items ?? []) as Benefit[];

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center mb-10">
        <p
          className="font-label text-[15.6px] font-bold uppercase tracking-widest mb-3"
          style={{ color: BRAND_COLOR }}
        >
          {t(lang, `${sectionKey}.eyebrow`)}
        </p>
        <h2 className="font-headline text-3xl sm:text-4xl italic text-slate-900 mb-3 max-w-2xl mx-auto leading-tight">
          {t(lang, `${sectionKey}.headline`)}
        </h2>
        {section?.sub && (
          <p className="font-body text-slate-600 max-w-2xl mx-auto text-sm">
            {t(lang, `${sectionKey}.sub`)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((b, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-white border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition"
          >
            <div className="flex items-start gap-2 mb-1.5">
              <span
                className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: accentColor }}
              />
              <h3 className="font-body font-semibold text-sm text-slate-900 leading-tight">
                {b.title}
              </h3>
            </div>
            <p className="font-body text-[13px] text-slate-600 leading-relaxed">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function getNested(
  obj: unknown,
  path: string,
): { items?: Benefit[]; sub?: string } | null {
  const parts = path.split(".");
  let cursor: unknown = obj;
  for (const p of parts) {
    if (cursor && typeof cursor === "object" && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else return null;
  }
  return cursor as { items?: Benefit[]; sub?: string };
}
