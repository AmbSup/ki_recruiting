import { dict, type Lang } from "../_lib/dict";
import { t } from "../_lib/t";
import { BRAND_COLOR } from "../_lib/brand";

type UseCase = {
  title: string;
  body: string;
  quotes?: string[];
  listLabel?: string;
  list?: string[];
};

// Anwendungsfall-Liste: Titel + Beschreibung, plus entweder Beispiel-Zitate
// (kursiv, für "so klingt eine Nutzerfrage") oder eine kurze Tag-Liste
// ("Geeignet für: Rechnungen, Verträge, ..."). Beides kombiniert deckt die
// zwei Muster ab, die Anwendungsfall-Sections typischerweise brauchen.
export function UseCaseList({
  lang,
  sectionKey,
  accentColor = "#1A3A6E",
}: {
  lang: Lang;
  sectionKey: string;
  accentColor?: string;
}) {
  const section = getNested(dict[lang], sectionKey);
  const items = (section?.items ?? []) as UseCase[];

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center mb-10">
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

      <div className="space-y-5">
        {items.map((uc, idx) => (
          <div key={idx} className="rounded-2xl bg-white border border-slate-200 p-6">
            <h3 className="font-headline text-xl italic text-slate-900 mb-2">{uc.title}</h3>
            <p className="font-body text-sm text-slate-600 leading-relaxed mb-4">{uc.body}</p>

            {uc.quotes && uc.quotes.length > 0 && (
              <div className="space-y-2">
                {uc.quotes.map((q, qi) => (
                  <p
                    key={qi}
                    className="font-body text-sm italic text-slate-500 border-l-2 pl-3"
                    style={{ borderColor: accentColor }}
                  >
                    „{q}“
                  </p>
                ))}
              </div>
            )}

            {uc.list && uc.list.length > 0 && (
              <div>
                {uc.listLabel && (
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    {uc.listLabel}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {uc.list.map((tag, ti) => (
                    <span
                      key={ti}
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium bg-slate-50 text-slate-600 border border-slate-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function getNested(obj: unknown, path: string): { items?: UseCase[] } | null {
  const parts = path.split(".");
  let cursor: unknown = obj;
  for (const p of parts) {
    if (cursor && typeof cursor === "object" && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else return null;
  }
  return cursor as { items?: UseCase[] };
}
