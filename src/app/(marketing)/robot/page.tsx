import type { Metadata } from "next";
import Image from "next/image";
import { t } from "../_lib/t";
import { BRAND_COLOR } from "../_lib/brand";
import { MarketingNav } from "../_components/marketing-nav";
import { Hero } from "../_components/hero";
import { MetricCard } from "../_components/metric-card";
import { PainList } from "../_components/pain-list";
import { HowItWorks } from "../_components/how-it-works";
import { BenefitGrid } from "../_components/benefit-grid";
import { Checklist } from "../_components/checklist";
import { CTAFooter } from "../_components/cta-footer";
import { MarketingFooter } from "../_components/marketing-footer";

// Petrol/Teal — eigenständiger Ton für Robotik/Industrie, noch nicht belegt
// (Navy/Amber/Rust/Tannengrün/Indigo sind schon vergeben, siehe andere Pages).
const ACCENT = "#0F4C5C";

const BOOKING_URL = "https://cal.com/martin-amon-l2hybo/30min";

// Eigenständige Pilot-Pitch-Seite für einen konkreten Robotik-Use-Case
// (Oberflächenprüfung lackierter Kunststoff-Teile in der Automobil-Produktion).
// Kein Bezug zum Kern-Produkt (AI-Call-Funnels) — analog zu /aria: eigene
// Positionierung, eigener Akzentton, eigenes CTA-Ziel (Pilot-Rahmen-Call statt
// Funnel-Demo).

export const metadata: Metadata = {
  title: "Humanoid Surface Quality Worker — Oberflächenprüfung für die Automobil-Produktion",
  description:
    "Automatisierte Qualitätsprüfung und Nacharbeit lackierter Kunststoff-Teile per Humanoid-Roboter. Pilot-Rahmen für die Serienfreigabe.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/robot",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://app.neuronic-automation.ai/robot",
    title: "Humanoid Surface Quality Worker — Oberflächenprüfung für die Automobil-Produktion",
    description:
      "Automatisierte Qualitätsprüfung und Nacharbeit lackierter Kunststoff-Teile per Humanoid-Roboter. Pilot-Rahmen für die Serienfreigabe.",
  },
  twitter: {
    card: "summary",
    title: "Humanoid Surface Quality Worker",
    description:
      "Automatisierte Qualitätsprüfung und Nacharbeit lackierter Kunststoff-Teile per Humanoid-Roboter.",
  },
};

export default function RobotPage() {
  const lang = "de" as const;

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav lang={lang} />
      <main>
        <Hero
          lang={lang}
          eyebrowKey="robot.eyebrow"
          headlineKey="robot.headline"
          headlineAccentKey="robot.headline_accent"
          subKey="robot.sub"
          primaryCtaKey="robot.primary_cta"
          primaryHref={BOOKING_URL}
          secondaryCtaKey="robot.secondary_cta"
          secondaryHref="#prozess"
          accentColor={ACCENT}
          photo={{
            src: "/marketing/robot-lack-manuell.jpg",
            alt: "Zwei Mitarbeiter prüfen lackierte Stoßfänger von Hand an der Produktionslinie",
            slogan: "Heute: manuelle Sichtprüfung, Bauteil für Bauteil.",
            priority: true,
          }}
        />

        <MetricCard
          lang={lang}
          labelKey="robot.metric.label"
          valueKey="robot.metric.value"
          afterKey="robot.metric.after"
          noteKey="robot.metric.note"
          color={ACCENT}
        />

        <PainList lang={lang} sectionKey="robot.pain" accentColor={ACCENT} />

        <section className="mx-auto max-w-5xl px-6 py-8">
          <p
            className="mb-4 text-center font-label text-[15.6px] font-bold uppercase tracking-widest"
            style={{ color: BRAND_COLOR }}
          >
            {t(lang, "robot.solution.eyebrow")}
          </p>
          <div className="relative overflow-hidden rounded-3xl shadow-[0_24px_60px_-28px_rgba(15,23,42,0.42)]">
            <Image
              src="/marketing/robots_3.jpg"
              alt="Zwei humanoide Roboter prüfen und bearbeiten lackierte Stoßfänger an derselben Produktionslinie"
              width={1200}
              height={896}
              className="w-full h-auto object-cover"
              priority={false}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
            />
            <p className="absolute inset-x-0 bottom-6 px-6 text-center font-headline italic text-xl leading-snug text-white drop-shadow-md sm:bottom-8 sm:px-12 sm:text-2xl">
              {t(lang, "robot.solution_claim")}
            </p>
          </div>
        </section>

        <div id="prozess">
          <HowItWorks lang={lang} sectionKey="robot.process" accentColor={ACCENT} />
        </div>

        <BenefitGrid lang={lang} sectionKey="robot.tech" accentColor={ACCENT} />

        <Checklist lang={lang} sectionKey="robot.pilot_benefits" accentColor={ACCENT} columns={2} />

        <Checklist lang={lang} sectionKey="robot.scope" accentColor={ACCENT} columns={1} />

        <CTAFooter lang={lang} sectionKey="robot.final_cta" accentColor={ACCENT} href={BOOKING_URL} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
