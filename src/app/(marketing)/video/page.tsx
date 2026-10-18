import type { Metadata } from "next";
import Image from "next/image";
import { MarketingNav } from "../_components/marketing-nav";
import { MarketingFooter } from "../_components/marketing-footer";
import { Camera, Captions, Check, Clapperboard, Film, Scissors, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Videoproduktion & Schnitt",
  description: "Videoagentur für Firmenvideos, Kameraarbeit, Schnitt und Animationen.",
  alternates: { canonical: "https://app.neuronic-automation.ai/video" },
};

const benefits = [
  { icon: Scissors, title: "Klarer Schnitt", text: "Aus Rohmaterial wird eine verständliche Geschichte mit sauberem Rhythmus." },
  { icon: Captions, title: "Untertitel & Motion", text: "Texte, Übergänge und Animationen folgen deinem Inhalt und deiner Marke." },
  { icon: Film, title: "Passende Formate", text: "Fertige Videos für Website, LinkedIn, Reels, Shorts oder TikTok." },
];

const agencyServices = [
  { icon: Camera, title: "Kameraarbeit", text: "Dreharbeiten vor Ort — Interviews, Produktaufnahmen, Immobilien, Events." },
  { icon: Clapperboard, title: "Firmenvideos", text: "Imagefilme, Recruiting- und Produktvideos, die zu deiner Marke passen." },
  { icon: Scissors, title: "Schnitt", text: "Von Rohmaterial zu fertigem Video — sauberer Rhythmus, klare Story." },
  { icon: Sparkles, title: "Animationen", text: "Motion Graphics, Untertitel und Übergänge, die deinen Inhalt unterstützen." },
];

const packageItems = [
  "20 professionell geschnittene Reels",
  "Story-Formate passend zu deinen Reels",
  "Untertitel, Musik und dynamische Schnitte",
  "Optimiert für Instagram, TikTok und YouTube Shorts",
  "Eine gemeinsame Korrekturrunde",
];

const faqs = [
  {
    question: "Welche Art von Videos produziert ihr?",
    answer: "Firmenvideos, Immobilien- und Produktvideos, Social-Media-Reels und Recruiting-Videos — von der Kameraarbeit vor Ort bis zum fertigen Schnitt.",
  },
  {
    question: "Übernehmt ihr auch die Dreharbeiten?",
    answer: "Ja. Wir kommen mit der Kamera zu dir — für Interviews, Produktaufnahmen, Immobilien oder Events — oder bearbeiten dein vorhandenes Rohmaterial.",
  },
  {
    question: "Was bedeutet „20 Reels plus Storys“?",
    answer: "Du erhältst 20 fertige Hochkant-Videos. Ausgewählte Inhalte bereiten wir zusätzlich als passende Story-Formate auf.",
  },
  {
    question: "Sind Untertitel und Musik enthalten?",
    answer: "Ja. Schnitt, lesbare Untertitel, passende Musik und dezente Animationen sind im Paket enthalten.",
  },
];

const contactHref = "https://cal.com/martin-amon-l2hybo/30min";

export default function VideoPage() {
  return (
    <div className="min-h-screen bg-surface">
      <MarketingNav lang="de" />
      <main>
        <section id="top" className="mx-auto max-w-4xl px-6 pb-16 pt-8 lg:pb-24 lg:pt-12">
          <h1 className="max-w-2xl text-balance font-headline text-[clamp(3rem,6vw,5.75rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-on-surface">
            Dein Rohmaterial. Professionell geschnitten.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-on-surface-variant">
            Kameraarbeit, Schnitt und Animation aus einer Hand — für Firmenvideos, Social Media und alles dazwischen.
          </p>

          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-xl bg-[#0A1A1F]">
            <Image src="/marketing/video-editing.webp" alt="Professioneller Videoschnitt am Schnittplatz" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover opacity-80" priority />
            <div className="absolute inset-x-5 bottom-5 max-w-sm rounded-xl bg-white p-4 shadow-[0_12px_30px_rgba(10,26,31,0.2)]">
              <p className="font-headline text-xl font-semibold text-on-surface">Von lang zu klar.</p>
              <p className="mt-1 text-sm text-on-surface-variant">Schnitt, Untertitel und Formate aus einer Hand.</p>
            </div>
          </div>

          <a href={contactHref} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dim focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            Projekt besprechen
          </a>
        </section>

        <section className="border-y border-outline-variant bg-surface-container-lowest px-6 py-20 sm:py-28">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-center lg:gap-20">
            <div className="w-full max-w-xs shrink-0">
              <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] border-4 border-on-surface bg-black shadow-[0_24px_60px_-24px_rgba(16,24,32,0.45)]">
                <video
                  src="/videos/beispiel-reel.mp4"
                  poster="/videos/beispiel-reel-poster.jpg"
                  controls
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                >
                  Dein Browser unterstützt dieses Video-Format nicht.
                </video>
              </div>
            </div>
            <div className="max-w-lg text-center lg:text-left">
              <p className="font-label text-sm font-bold uppercase tracking-widest text-primary">Beispiel-Ergebnis</p>
              <h2 className="mt-3 text-balance font-headline text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
                So sieht ein fertiges Reel aus.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-on-surface-variant">
                Aus Rohmaterial einer Immobilien-Besichtigung wurde dieses Hochkant-Reel — geschnitten, vertont und mit Untertiteln versehen. Genau dieses Ergebnis erwartet dich auch mit deinem Material.
              </p>
            </div>
          </div>
        </section>

        {/* Allgemeine Videoagentur: Kameraarbeit, Firmenvideos, Schnitt, Animation. */}
        <section id="animationen" className="scroll-mt-24 border-b border-outline-variant bg-white px-6 py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
            <div>
              <p className="font-label text-sm font-bold uppercase tracking-widest text-primary">Videoagentur</p>
              <h2 className="mt-3 text-balance font-headline text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
                Mehr als Schnitt.
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-on-surface-variant">
                Wir übernehmen dein gesamtes Videoprojekt — von der Kameraarbeit vor Ort über den Schnitt bis zur Animation. Für Firmenvideos, Produktvideos und Social Media.
              </p>
              <ul className="mt-8 grid gap-6 sm:grid-cols-2">
                {agencyServices.map(({ icon: Icon, title, text }) => (
                  <li key={title}>
                    <Icon className="mb-3 h-6 w-6 text-primary" aria-hidden="true" />
                    <p className="font-semibold text-on-surface">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{text}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#0A1A1F]">
              <Image
                src="/marketing/two-people-reviewing-storyboard.jpg"
                alt="Zwei Personen besprechen ein Storyboard neben einer professionellen Filmkamera"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section className="border-b border-outline-variant bg-white">
          <div className="mx-auto grid max-w-7xl divide-y divide-outline-variant px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
            {benefits.map(({ icon: Icon, title, text }) => (
              <article key={title} className="py-10 md:px-8 md:first:pl-0 md:last:pr-0">
                <Icon className="mb-5 h-7 w-7 text-primary" aria-hidden="true" />
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-3 leading-relaxed text-on-surface-variant">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-on-surface px-6 py-20 text-white sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20">
            <div>
              <h2 className="text-balance font-headline text-4xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-6xl">
                Ein Paket. Ein Monat Content.
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/70">
                Du lieferst das Rohmaterial. Wir machen daraus eine kompakte Serie für deinen Social-Media-Auftritt.
              </p>
            </div>

            <div className="rounded-xl bg-white p-7 text-on-surface shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:p-10">
              <div className="flex flex-col gap-5 border-b border-outline-variant pb-7 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="font-headline text-3xl font-semibold">20 Reels + Storys</h3>
                  <p className="mt-2 text-on-surface-variant">Komplett geschnitten und bereit zum Posten.</p>
                </div>
                <p className="shrink-0 font-headline text-5xl font-semibold tracking-[-0.03em] tabular-nums">
                  990 <span className="text-2xl">€</span>
                </p>
              </div>

              <ul className="my-7 space-y-4">
                {packageItems.map((item) => (
                  <li key={item} className="flex gap-3 leading-relaxed">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <a href={contactHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dim focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                Paket anfragen
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-balance font-headline text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">Kurz beantwortet.</h2>
            <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">Die wichtigsten Fragen zu unserer Arbeit.</p>
          </div>
          <div className="divide-y divide-outline-variant border-y border-outline-variant">
            {faqs.map(({ question, answer }) => (
              <details key={question} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-headline text-xl font-semibold marker:content-none">
                  {question}
                  <span className="relative h-5 w-5 shrink-0 text-primary" aria-hidden="true">
                    <span className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 bg-current" />
                    <span className="absolute left-1/2 top-0 h-5 w-0.5 -translate-x-1/2 bg-current transition-transform group-open:rotate-90 group-open:scale-y-0" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 pr-10 leading-relaxed text-on-surface-variant">{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-outline-variant bg-white px-6 py-20 text-center sm:py-28">
          <h2 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">Lass uns dein Projekt besprechen.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-on-surface-variant">Ob Kameraarbeit, Firmenvideo oder Rohmaterial zum Schneiden — schreib uns kurz, worum es geht.</p>
          <a href={contactHref} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-dim">Termin vereinbaren</a>
        </section>
      </main>

      <MarketingFooter lang="de" />
    </div>
  );
}
