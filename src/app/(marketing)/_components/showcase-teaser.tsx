import Link from "next/link";
import { t, type Lang } from "../_lib/t";

// Home-Section die auf /showcase verlinkt. Wichtig für Prospects die "echte
// Cases" sehen wollen bevor sie die Demo-Funnels probieren.
export function ShowcaseTeaser({ lang }: { lang: Lang }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <p className="font-label text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            {t(lang, "home.showcase_teaser.eyebrow")}
          </p>
          <h2 className="font-headline text-3xl sm:text-4xl italic leading-tight mb-3">
            {t(lang, "home.showcase_teaser.headline")}
          </h2>
          <p className="font-body text-slate-300 leading-relaxed max-w-xl">
            {t(lang, "home.showcase_teaser.sub")}
          </p>
        </div>
        <Link
          href="/showcase"
          className="inline-flex flex-shrink-0 items-center rounded-full bg-white px-6 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100 transition"
        >
          {t(lang, "home.showcase_teaser.cta")}
        </Link>
      </div>
    </section>
  );
}
