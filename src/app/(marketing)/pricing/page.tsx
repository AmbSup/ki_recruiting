import type { Metadata } from "next";
import { MarketingNav } from "../_components/marketing-nav";
import { Hero } from "../_components/hero";
import { PricingTable } from "../_components/pricing-table";
import { PilotBanner } from "../_components/pilot-banner";
import { PricingFAQ } from "../_components/pricing-faq";
import { CTAFooter } from "../_components/cta-footer";
import { MarketingFooter } from "../_components/marketing-footer";
import { FaqJsonLd } from "../_components/json-ld";

const ACCENT = "#1A3A6E";

export const metadata: Metadata = {
  title: "Preise: Setup + Monatsabo. Alle KI-Anrufe inklusive.",
  description:
    "Klare Preise für unsere KI-Voice-Funnels. Setup einmalig, danach €499-3.999 pro Monat mit inkludierten Anrufen. Keine Per-Minute-Überraschungen.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/pricing",
    languages: {
      de: "https://app.neuronic-automation.ai/pricing",
      en: "https://app.neuronic-automation.ai/en/pricing",
      "x-default": "https://app.neuronic-automation.ai/pricing",
    },
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://app.neuronic-automation.ai/pricing",
    title: "Preise: Setup + Monatsabo. Alle KI-Anrufe inklusive.",
    description:
      "Klare Preise für unsere KI-Voice-Funnels. Setup einmalig, danach €499-3.999 pro Monat mit inkludierten Anrufen. Keine Per-Minute-Überraschungen.",
  },
  twitter: {
    card: "summary",
    title: "Preise: Setup + Monatsabo. Alle KI-Anrufe inklusive.",
    description:
      "Klare Preise für unsere KI-Voice-Funnels. Setup einmalig, danach €499-3.999 pro Monat mit inkludierten Anrufen. Keine Per-Minute-Überraschungen.",
  },
};

export default function PricingPage() {
  const lang = "de" as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <MarketingNav lang={lang} />
      <main>
        <Hero
          lang={lang}
          eyebrowKey="pricing.eyebrow"
          headlineKey="pricing.headline"
          subKey="pricing.sub"
          primaryCtaKey="pricing.cta_primary"
          primaryHref="https://cal.com/martin-amon-l2hybo/30min"
          secondaryCtaKey="pricing.cta_secondary"
          secondaryHref="mailto:office@neuronic-automation.ai"
          accentColor={ACCENT}
        />
        <PricingTable lang={lang} accentColor={ACCENT} />
        <PilotBanner lang={lang} accentColor={ACCENT} />
        <PricingFAQ lang={lang} />
        <FaqJsonLd lang={lang} />
        <CTAFooter lang={lang} sectionKey="home.final_cta" accentColor={ACCENT} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
