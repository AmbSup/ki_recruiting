import { dict, type Lang } from "../_lib/dict";
import { t } from "../_lib/t";
import { BRAND_COLOR } from "../_lib/brand";

type Industry = { name: string; pain: string };

// Für Sales + Recruiting Pages: Zielgruppen-Grid mit Branchen + Pain Points.
// Untendrunter: Firmengröße + Tech-Stack als Kontext-Zeile.
export function ICPGrid({
  lang,
  sectionKey,
  accentColor = "#1A3A6E",
}: {
  lang: Lang;
  sectionKey: string;
  accentColor?: string;
}) {
  const section = getNested(dict[lang], sectionKey);
  const industries = (section?.industries ?? []) as Industry[];
  const size = section?.size as string | undefined;
  const stack = section?.stack as string | undefined;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center mb-10">
        <p
          className="font-label text-[15.6px] font-bold uppercase tracking-widest mb-3"
          style={{ color: BRAND_COLOR }}
        >
          {t(lang, `${sectionKey}.eyebrow`)}
        </p>
        <h2 className="font-headline text-3xl sm:text-4xl italic text-slate-900 max-w-2xl mx-auto leading-tight">
          {t(lang, `${sectionKey}.headline`)}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {industries.map((i) => (
          <div
            key={i.name}
            className="rounded-xl bg-white border border-slate-200 p-4 hover:border-slate-300 transition"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <h3 className="font-body font-semibold text-sm text-slate-900">{i.name}</h3>
            </div>
            <p className="font-body text-xs text-slate-500 leading-relaxed">{i.pain}</p>
          </div>
        ))}
      </div>

      {(size || stack) && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
          {size && (
            <span>
              <span className="font-bold uppercase tracking-widest text-[10px] mr-2">
                Size
              </span>
              {size}
            </span>
          )}
          {stack && (
            <span>
              <span className="font-bold uppercase tracking-widest text-[10px] mr-2">
                Stack
              </span>
              {stack}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

function getNested(
  obj: unknown,
  path: string,
): { industries?: Industry[]; size?: string; stack?: string } | null {
  const parts = path.split(".");
  let cursor: unknown = obj;
  for (const p of parts) {
    if (cursor && typeof cursor === "object" && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else return null;
  }
  return cursor as { industries?: Industry[]; size?: string; stack?: string };
}
