import { dict, type Lang } from "../_lib/dict";
import { t } from "../_lib/t";
import { BRAND_COLOR } from "../_lib/brand";

// Generische Checkmark-Liste mit Eyebrow/Headline/optionalem Intro- und
// Closing-Satz. Für Sections, die reine Aufzählungen sind (Kriterien,
// Ergebnisse, Erkenntnisse) ohne das Problem/Lösung-Framing von ProblemTiles
// oder BenefitGrid.
export function Checklist({
  lang,
  sectionKey,
  accentColor = "#1A3A6E",
  columns = 2,
}: {
  lang: Lang;
  sectionKey: string;
  accentColor?: string;
  columns?: 1 | 2;
}) {
  const section = getNested(dict[lang], sectionKey);
  const items = (section?.items ?? []) as string[];
  const intro = section?.intro;
  const closing = section?.closing;

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center mb-8">
        <p
          className="font-label text-[15.6px] font-bold uppercase tracking-widest mb-3"
          style={{ color: BRAND_COLOR }}
        >
          {t(lang, `${sectionKey}.eyebrow`)}
        </p>
        <h2 className="font-headline text-3xl sm:text-4xl italic text-slate-900 leading-tight max-w-2xl mx-auto mb-3">
          {t(lang, `${sectionKey}.headline`)}
        </h2>
        {intro && (
          <p className="font-body text-slate-600 max-w-2xl mx-auto text-sm">{intro}</p>
        )}
      </div>

      <ul
        className={`grid grid-cols-1 ${columns === 2 ? "sm:grid-cols-2" : ""} gap-2.5 max-w-3xl mx-auto`}
      >
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
            <span
              className="mt-0.5 flex-shrink-0 font-bold"
              style={{ color: accentColor }}
              aria-hidden
            >
              ✓
            </span>
            <span className="leading-snug">{item}</span>
          </li>
        ))}
      </ul>

      {closing && (
        <p className="font-body text-sm text-slate-500 max-w-2xl mx-auto text-center mt-8 leading-relaxed">
          {closing}
        </p>
      )}
    </section>
  );
}

function getNested(
  obj: unknown,
  path: string,
): { items?: string[]; intro?: string; closing?: string } | null {
  const parts = path.split(".");
  let cursor: unknown = obj;
  for (const p of parts) {
    if (cursor && typeof cursor === "object" && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else return null;
  }
  return cursor as { items?: string[]; intro?: string; closing?: string };
}
