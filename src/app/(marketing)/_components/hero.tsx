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
}: HeroProps) {
  const eyebrow = t(lang, eyebrowKey);
  const headline = t(lang, headlineKey);
  const accent = headlineAccentKey ? t(lang, headlineAccentKey) : null;
  const sub = t(lang, subKey);
  const primaryLabel = t(lang, primaryCtaKey);
  const secondaryLabel = secondaryCtaKey ? t(lang, secondaryCtaKey) : null;

  const text = (
    <div className={photo ? "text-center lg:text-left" : "text-center"}>
      <p
        className="font-label text-[15.6px] font-bold uppercase tracking-widest mb-4"
        style={{ color: BRAND_COLOR }}
      >
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
      <p
        className={`font-body text-lg text-slate-600 mb-8 leading-relaxed ${
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
    </div>
  );

  if (!photo) {
    return <section className="mx-auto max-w-4xl px-6 pt-20 pb-12">{text}</section>;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
        {text}
        <div className="relative">
          <div
            aria-hidden
            style={{ backgroundColor: accentColor }}
            className="pointer-events-none absolute -top-8 -right-8 sm:-top-10 sm:-right-10 w-40 h-40 sm:w-56 sm:h-56 rounded-full blur-3xl opacity-30 -z-10"
          />
          <div className="relative aspect-[4/3] lg:aspect-[16/11] rounded-3xl overflow-hidden shadow-xl shadow-black/5">
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
                <p className="absolute inset-x-0 bottom-6 sm:bottom-8 px-6 sm:px-10 text-center font-body font-bold text-lg sm:text-2xl text-white leading-snug drop-shadow-md">
                  {photo.slogan}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
