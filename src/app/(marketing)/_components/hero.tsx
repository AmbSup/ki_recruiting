import Image from "next/image";
import Link from "next/link";
import { t, type Lang } from "../_lib/t";
import { BRAND_COLOR } from "../_lib/brand";

type HeroPhoto = {
  src: string;
  alt: string;
  slogan?: string;
  priority?: boolean;
};

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
  photo?: HeroPhoto; // wenn gesetzt: Text + Foto nebeneinander statt gestapelt
  proofItems?: string[];
  showEyebrow?: boolean;
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
  photo,
  proofItems = [],
  showEyebrow = true,
}: HeroProps) {
  const eyebrow = t(lang, eyebrowKey);
  const headline = t(lang, headlineKey);
  const accent = headlineAccentKey ? t(lang, headlineAccentKey) : null;
  const sub = t(lang, subKey);
  const primaryLabel = t(lang, primaryCtaKey);
  const secondaryLabel = secondaryCtaKey ? t(lang, secondaryCtaKey) : null;

  const text = (
    <div className={photo ? "text-center lg:text-left" : "text-center"}>
      {showEyebrow && (
        <p className="mb-4 font-label text-sm font-bold uppercase tracking-widest" style={{ color: BRAND_COLOR }}>
          {eyebrow}
        </p>
      )}
      <h1 className="font-headline text-[clamp(2.75rem,6vw,5.25rem)] font-medium leading-[0.98] tracking-[-0.03em] text-slate-950 mb-6 text-balance">
        {headline}
        {accent && (
          <>
            <br />
            <span className="italic" style={{ color: accentColor }}>{accent}</span>
          </>
        )}
      </h1>
      <p
        className={`font-body text-base sm:text-lg text-slate-600 mb-8 leading-relaxed ${
          photo ? "max-w-xl mx-auto lg:mx-0" : "max-w-2xl mx-auto"
        }`}
      >
        {sub}
      </p>
      <div
        className={`flex flex-wrap items-center gap-3 ${
          photo ? "justify-center lg:justify-start" : "justify-center"
        }`}
      >
        <Link
          href={primaryHref}
          className="inline-flex min-h-12 items-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          {primaryLabel}
        </Link>
        {secondaryLabel && secondaryHref && (
          <a
            href={secondaryHref}
            target={secondaryHref.startsWith("http") ? "_blank" : undefined}
            rel={secondaryHref.startsWith("http") ? "noopener noreferrer" : undefined}
            className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-slate-500 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            {secondaryLabel}
          </a>
        )}
      </div>
    </div>
  );

  if (!photo) {
    return <section className="mx-auto max-w-4xl px-6 pt-20 pb-12">{text}</section>;
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20">
      <div className="grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:items-center">
        {text}
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-[0_24px_60px_-28px_rgba(15,23,42,0.42)] lg:aspect-[16/11]">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority={photo.priority}
            />
            {photo.slogan && (
              <>
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
                />
                <p className="absolute inset-x-0 bottom-5 px-6 text-left font-body text-base font-bold leading-snug text-white drop-shadow-md sm:bottom-7 sm:px-8 sm:text-xl">
                  {photo.slogan}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      {proofItems.length > 0 && (
        <ul className="mt-10 grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-3" aria-label="Produktvorteile">
          {proofItems.map((item) => (
            <li key={item} className="flex min-h-14 items-center gap-3 border-b border-slate-200 px-4 py-3 font-body text-sm font-semibold text-slate-700 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accentColor }} aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
