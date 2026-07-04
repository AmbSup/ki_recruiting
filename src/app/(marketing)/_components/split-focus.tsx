import Link from "next/link";
import { t, tList, type Lang } from "../_lib/t";

type SplitCardData = {
  badge: string;
  headline: string;
  sub: string;
  metricLabel: string;
  metricValue: string;
  metricAfter: string;
  bullets: string[];
  cta: string;
  href: string;
  color: string;
};

// Home-Only. Zwei riesige nebeneinander-Cards für "Vertrieb" / "Recruiting".
// Bewusst gleich groß + gleich strukturiert damit der Prospect erkennt: "Ich
// muss mich für einen Pfad entscheiden."
export function SplitFocus({ lang }: { lang: Lang }) {
  const sales: SplitCardData = {
    badge: t(lang, "home.sales_card.badge"),
    headline: t(lang, "home.sales_card.headline"),
    sub: t(lang, "home.sales_card.sub"),
    metricLabel: t(lang, "home.sales_card.metric_label"),
    metricValue: t(lang, "home.sales_card.metric_value"),
    metricAfter: t(lang, "home.sales_card.metric_after"),
    bullets: tList(lang, "home.sales_card.bullets"),
    cta: t(lang, "home.sales_card.cta"),
    href: lang === "de" ? "/sales" : "/en/sales",
    color: "#1A3A6E",
  };
  const recruiting: SplitCardData = {
    badge: t(lang, "home.recruiting_card.badge"),
    headline: t(lang, "home.recruiting_card.headline"),
    sub: t(lang, "home.recruiting_card.sub"),
    metricLabel: t(lang, "home.recruiting_card.metric_label"),
    metricValue: t(lang, "home.recruiting_card.metric_value"),
    metricAfter: t(lang, "home.recruiting_card.metric_after"),
    bullets: tList(lang, "home.recruiting_card.bullets"),
    cta: t(lang, "home.recruiting_card.cta"),
    href: lang === "de" ? "/recruiting" : "/en/recruiting",
    color: "#0E7C66",
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center mb-12">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
          {t(lang, "home.split_eyebrow")}
        </p>
        <p className="font-body text-lg text-slate-600 max-w-2xl mx-auto">
          {t(lang, "home.split_intro")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[sales, recruiting].map((c) => (
          <Link
            key={c.badge}
            href={c.href}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-8 hover:border-slate-300 hover:shadow-[0_12px_32px_-8px_rgba(15,23,42,0.15)] transition-all"
            style={{ borderTopWidth: 4, borderTopColor: c.color }}
          >
            <span
              className="inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: `${c.color}18`, color: c.color }}
            >
              {c.badge}
            </span>

            <h3 className="font-headline text-2xl italic text-slate-900 leading-tight mb-3">
              {c.headline}
            </h3>
            <p className="font-body text-slate-600 mb-6 leading-relaxed">{c.sub}</p>

            <div className="flex items-baseline gap-2 mb-6 py-4 border-y border-slate-100">
              <span
                className="font-headline italic text-4xl"
                style={{ color: c.color }}
              >
                {c.metricValue}
              </span>
              <span className="text-sm text-slate-400">{c.metricAfter}</span>
              <span className="ml-auto font-label text-[10px] uppercase tracking-widest text-slate-500">
                {c.metricLabel}
              </span>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {c.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1 text-slate-400" style={{ color: c.color }}>
                    ✓
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <span
              className="inline-flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all"
              style={{ color: c.color }}
            >
              {c.cta}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
