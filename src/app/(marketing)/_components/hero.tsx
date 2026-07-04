import Link from "next/link";
import { t, type Lang } from "../_lib/t";

type HeroProps = {
  lang: Lang;
  eyebrowKey: string;
  headlineKey: string;
  headlineAccentKey?: string;
  subKey: string;
  primaryCtaKey: string;
  primaryHref: string;
  secondaryCtaKey?: string;
  secondaryHref?: string;
  accentColor?: string; // Hex, wird als Farbe des Accent-Wortes verwendet
};

// Sichtbares Element Nummer 1 auf jeder Page. Große Serif-italic Headline,
// optional 2-Zeilen mit Accent-Farbe für den zweiten Teil.
export function Hero({
  lang,
  eyebrowKey,
  headlineKey,
  headlineAccentKey,
  subKey,
  primaryCtaKey,
  primaryHref,
  secondaryCtaKey,
  secondaryHref,
  accentColor = "#1A3A6E",
}: HeroProps) {
  const eyebrow = t(lang, eyebrowKey);
  const headline = t(lang, headlineKey);
  const accent = headlineAccentKey ? t(lang, headlineAccentKey) : null;
  const sub = t(lang, subKey);
  const primaryLabel = t(lang, primaryCtaKey);
  const secondaryLabel = secondaryCtaKey ? t(lang, secondaryCtaKey) : null;

  return (
    <section className="mx-auto max-w-4xl px-6 pt-20 pb-12 text-center">
      <p className="font-label text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
        {eyebrow}
      </p>
      <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl italic leading-[1.05] text-slate-900 mb-6">
        {headline}
        {accent && (
          <>
            <br />
            <span style={{ color: accentColor }}>{accent}</span>
          </>
        )}
      </h1>
      <p className="font-body text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
        {sub}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={primaryHref}
          className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800 transition shadow-sm"
        >
          {primaryLabel}
        </Link>
        {secondaryLabel && secondaryHref && (
          <a
            href={secondaryHref}
            target={secondaryHref.startsWith("http") ? "_blank" : undefined}
            rel={secondaryHref.startsWith("http") ? "noopener noreferrer" : undefined}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:border-slate-300 hover:text-slate-900 transition"
          >
            {secondaryLabel}
          </a>
        )}
      </div>
    </section>
  );
}
