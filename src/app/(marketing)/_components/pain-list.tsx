import { dict, type Lang } from "../_lib/dict";
import { t } from "../_lib/t";
import { BRAND_COLOR } from "../_lib/brand";

type PainItem = { title: string; body: string };

// Sales + Recruiting Page: "Was kostet dich der Status Quo"-Sektion.
// Nummerierte Pain-Cards, groß + emotional.
export function PainList({
  lang,
  sectionKey,
  accentColor = "#1A3A6E",
}: {
  lang: Lang;
  sectionKey: string;
  accentColor?: string;
}) {
  const section = getNested(dict[lang], sectionKey);
  const items = (section?.items ?? []) as PainItem[];

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center mb-10">
        <p
          className="font-label text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: BRAND_COLOR }}
        >
          {t(lang, `${sectionKey}.eyebrow`)}
        </p>
        <h2 className="font-headline text-3xl sm:text-4xl italic text-slate-900 max-w-2xl mx-auto leading-tight">
          {t(lang, `${sectionKey}.headline`)}
        </h2>
      </div>
      <div className="space-y-4">
        {items.map((it, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white border border-slate-200 p-6 flex gap-5 items-start"
          >
            <span
              className="font-headline italic text-3xl leading-none opacity-40 flex-shrink-0 min-w-[2ch]"
              style={{ color: accentColor }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="font-body font-semibold text-slate-900 mb-1.5">
                {it.title}
              </h3>
              <p className="font-body text-sm text-slate-600 leading-relaxed">{it.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function getNested(obj: unknown, path: string): { items?: PainItem[] } | null {
  const parts = path.split(".");
  let cursor: unknown = obj;
  for (const p of parts) {
    if (cursor && typeof cursor === "object" && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else return null;
  }
  return cursor as { items?: PainItem[] };
}
