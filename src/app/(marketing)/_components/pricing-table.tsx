import { dict, type Lang } from "../_lib/dict";
import { t } from "../_lib/t";

type RateStep = { label: string; rate: string };

type Tier = {
  key: string;
  name: string;
  tagline: string;
  setup: string;
  base_monthly: string;
  entry_rate: string;
  rate_tiers: RateStep[];
  example: string;
  highlight: boolean;
  bullets: string[];
};

// Drei-Karten-Preis-Layout mit Setup + Base + Per-Minute-Staffel.
// Highlighted Tier (Pro) hebt sich per Border-Accent und "Empfohlen"-Chip ab.
// Preis-Zone hat 3 Zeilen: Setup einmalig, Base/Mo, Einstiegs-Minutenpreis.
// Darunter kleine Rate-Staffel-Tabelle + Beispielrechnung, dann Features.
export function PricingTable({
  lang,
  accentColor = "#1A3A6E",
}: {
  lang: Lang;
  accentColor?: string;
}) {
  const section = (dict[lang] as { pricing?: Record<string, unknown> })?.pricing ?? {};
  const tiers = ((section as { tiers?: Tier[] }).tiers ?? []) as Tier[];

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const isHighlighted = tier.highlight;
          return (
            <div
              key={tier.key}
              className={
                "relative rounded-2xl bg-white p-8 flex flex-col transition-shadow " +
                (isHighlighted
                  ? "border-2 shadow-lg"
                  : "border border-slate-200 shadow-sm hover:shadow-md")
              }
              style={isHighlighted ? { borderColor: accentColor } : undefined}
            >
              {isHighlighted && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {t(lang, "pricing.recommended")}
                </span>
              )}

              <div className="mb-5">
                <h3 className="font-headline text-2xl italic text-slate-900 mb-2">
                  {tier.name}
                </h3>
                <p className="font-body text-xs text-slate-500 leading-relaxed min-h-[3rem]">
                  {tier.tagline}
                </p>
              </div>

              <div className="mb-5 pb-5 border-b border-slate-100 space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-body text-xs uppercase tracking-widest text-slate-500 font-semibold">
                    {t(lang, "pricing.setup_label")}
                  </span>
                  <span className="text-right">
                    <span className="font-headline text-xl italic text-slate-900">
                      {tier.setup}
                    </span>
                    <span className="font-body text-[10px] text-slate-400 ml-1">
                      {t(lang, "pricing.setup_note")}
                    </span>
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-body text-xs uppercase tracking-widest text-slate-500 font-semibold">
                    {t(lang, "pricing.base_label")}
                  </span>
                  <span className="text-right">
                    <span className="font-headline text-xl italic text-slate-900">
                      {tier.base_monthly}
                    </span>
                    <span className="font-body text-[10px] text-slate-400 ml-1">
                      /{" "}
                      {t(lang, "pricing.base_note")
                        .replace(/^pro /, "")
                        .replace(/^per /, "")}
                    </span>
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-body text-xs uppercase tracking-widest text-slate-500 font-semibold">
                    {t(lang, "pricing.per_min_label")}
                  </span>
                  <span className="text-right">
                    <span className="font-body text-[10px] text-slate-400 mr-1">
                      {t(lang, "pricing.per_min_from")}
                    </span>
                    <span
                      className="font-headline text-xl italic"
                      style={{ color: accentColor }}
                    >
                      {tier.entry_rate}
                    </span>
                  </span>
                </div>
              </div>

              {/* Rate-Staffel: kleine Tabelle mit Volume-Breaks */}
              <div className="mb-4">
                <ul className="space-y-1 text-[11px]">
                  {tier.rate_tiers.map((step, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between text-slate-600 font-body"
                    >
                      <span>{step.label}</span>
                      <span className="font-semibold text-slate-700">
                        {step.rate}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Beispielrechnung */}
              <div
                className="mb-6 rounded-lg px-3 py-2.5 text-[11px] leading-snug"
                style={{ backgroundColor: `${accentColor}10` }}
              >
                <span
                  className="font-semibold uppercase tracking-widest text-[9px] mr-1"
                  style={{ color: accentColor }}
                >
                  {t(lang, "pricing.example_prefix")}
                </span>
                <span className="font-body text-slate-700">{tier.example}</span>
              </div>

              <ul className="space-y-2 mb-8 flex-grow">
                {tier.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 10.5L8 14.5L16 6"
                        stroke={accentColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="font-body text-sm text-slate-700 leading-snug">
                      {b}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="https://cal.com/martin-amon-l2hybo/30min"
                target="_blank"
                rel="noopener noreferrer"
                className={
                  "inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition " +
                  (isHighlighted
                    ? "text-white hover:opacity-90"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900")
                }
                style={
                  isHighlighted ? { backgroundColor: accentColor } : undefined
                }
              >
                {t(lang, "pricing.cta_primary")}
              </a>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 text-center">
        <span>{t(lang, "pricing.billing_note")}</span>
      </div>
    </section>
  );
}
