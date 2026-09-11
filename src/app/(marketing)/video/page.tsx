import type { Metadata } from "next";
import Image from "next/image";
import { Captions, Check, Film, Scissors } from "lucide-react";
import { MarketingFooter } from "../_components/marketing-footer";
import { MarketingNav } from "../_components/marketing-nav";
import { VideoUploadForm } from "./video-upload-form";

export const metadata: Metadata = {
  title: "Video schneiden lassen",
  description: "Rohvideos hochladen und professionell für Website, Reels, Shorts und Social Media schneiden lassen.",
  alternates: { canonical: "https://app.neuronic-automation.ai/video" },
};

const benefits = [
  { icon: Scissors, title: "Klarer Schnitt", text: "Aus Rohmaterial wird eine verständliche Geschichte mit sauberem Rhythmus." },
  { icon: Captions, title: "Untertitel & Motion", text: "Texte, Übergänge und Animationen folgen deinem Inhalt und deiner Marke." },
  { icon: Film, title: "Passende Formate", text: "Fertige Videos für Website, LinkedIn, Reels, Shorts oder TikTok." },
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
    question: "Welches Rohmaterial kann ich hochladen?",
    answer: "Handyvideos, Interviews, Podcasts oder bestehende Aufnahmen im MP4-Format. Nach dem Upload prüfe ich, was sich daraus am besten schneiden lässt.",
  },
  {
    question: "Was bedeutet „20 Reels plus Storys“?",
    answer: "Du erhältst 20 fertige Hochkant-Videos. Ausgewählte Inhalte bereite ich zusätzlich als passende Story-Formate auf.",
  },
  {
    question: "Sind Untertitel und Musik enthalten?",
    answer: "Ja. Schnitt, lesbare Untertitel, passende Musik und dezente Animationen sind im Paket enthalten.",
  },
  {
    question: "Wie geht es nach dem Upload weiter?",
    answer: "Ich prüfe dein Material und melde mich für Stil, Zielgruppe und Timing. Danach erhältst du einen klaren Liefertermin.",
  },
];

export default function VideoPage() {
  return (
    <div className="min-h-screen bg-surface">
      <MarketingNav lang="de" />
      <main>
        <section id="top" className="mx-auto grid max-w-7xl scroll-mt-24 gap-12 px-6 pb-16 pt-16 lg:grid-cols-[0.86fr_1.14fr] lg:items-start lg:gap-16 lg:pb-24 lg:pt-24">
          <div className="lg:sticky lg:top-28">
            <h1 className="max-w-2xl text-balance font-headline text-[clamp(3rem,6vw,5.75rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-on-surface">
              Dein Rohmaterial. Professionell geschnitten.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-on-surface-variant">
              Lade deine Videos direkt hoch. Ich strukturiere, schneide und verfeinere sie für den Kanal, auf dem sie wirken sollen.
            </p>

            <div className="relative mt-10 aspect-[16/10] overflow-hidden rounded-xl bg-[#0A1A1F]">
              <Image src="/marketing/video-editing.webp" alt="Professioneller Videoschnitt am Schnittplatz" fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover opacity-80" priority />
              <div className="absolute inset-x-5 bottom-5 rounded-xl bg-white p-4 shadow-[0_12px_30px_rgba(10,26,31,0.2)]">
                <p className="font-headline text-xl font-semibold text-on-surface">Von lang zu klar.</p>
                <p className="mt-1 text-sm text-on-surface-variant">Schnitt, Untertitel und Formate aus einer Hand.</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-[0_12px_36px_rgba(16,24,32,0.10)]">
            <div className="border-b border-outline-variant px-6 py-5 sm:px-8">
              <h2 className="text-2xl font-semibold">Videos hochladen</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Deine Dateien werden direkt und verschlüsselt in den Projektspeicher übertragen.</p>
            </div>
            <VideoUploadForm />
          </div>
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
                Du lieferst das Rohmaterial. Ich mache daraus eine kompakte Serie für deinen Social-Media-Auftritt.
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

              <a href="#top" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dim focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                Paket anfragen & Videos hochladen
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-balance font-headline text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">Kurz beantwortet.</h2>
            <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">Die wichtigsten Fragen vor deinem Upload.</p>
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
          <h2 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">Hochladen. Abstimmen. Fertig.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-on-surface-variant">Nach dem Upload prüfe ich dein Material und melde mich für Ziel, Format und Stil. Danach startet der Schnitt.</p>
          <a href="#top" className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-dim">Jetzt Videos hochladen</a>
        </section>
      </main>
      <MarketingFooter lang="de" />
    </div>
  );
}
