import Link from "next/link";
import { t, type Lang } from "../_lib/t";
import { dogfoodUrl } from "../_lib/dogfood";
import { BRAND_COLOR } from "../_lib/brand";

type Variant = "home" | "sales" | "recruiting" | "kmu";

// Die zentrale "Erlebe es selbst"-Sektion. Home-Variante bietet BEIDE Demo-
// Funnels an. Sales/Recruiting-Variante zeigt nur den einen passenden.
export function DogfoodCTA({
  lang,
  variant,
  accentColor = "#1A3A6E",
}: {
  lang: Lang;
  variant: Variant;
  accentColor?: string;
}) {
  const sectionKey = variant === "home" ? "home.dogfood" : `${variant}.dogfood`;

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div
        className="rounded-3xl p-8 sm:p-12 text-center"
        style={{ backgroundColor: `${accentColor}0a`, border: `1px solid ${accentColor}22` }}
      >
        <p
          className="font-label text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: BRAND_COLOR }}
        >
          {t(lang, `${sectionKey}.eyebrow`)}
        </p>
        <h2 className="font-headline text-3xl sm:text-4xl italic text-slate-900 leading-tight mb-4">
          {t(lang, `${sectionKey}.headline`)}
        </h2>
        <p className="font-body text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          {t(lang, `${sectionKey}.sub`)}
        </p>

        {variant === "home" ? (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <Link
              href={dogfoodUrl("sales", lang)}
              className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800 transition"
            >
              🎯 {t(lang, "home.dogfood.sales_link")}
            </Link>
            <Link
              href={dogfoodUrl("recruiting", lang)}
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-800 hover:border-slate-400 transition"
            >
              🧑‍💼 {t(lang, "home.dogfood.recruiting_link")}
            </Link>
          </div>
        ) : (
          <Link
            href={dogfoodUrl(variant, lang)}
            className="inline-flex items-center rounded-full px-6 py-3 text-sm font-medium text-white transition mb-6"
            style={{ backgroundColor: accentColor }}
          >
            {t(lang, `${sectionKey}.cta`)}
          </Link>
        )}

        {variant === "home" && (
          <p className="font-body text-xs text-slate-500 max-w-md mx-auto">
            {t(lang, "home.dogfood.note")}
          </p>
        )}
      </div>
    </section>
  );
}
