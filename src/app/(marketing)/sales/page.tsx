import type { Metadata } from "next";
import { MarketingNav } from "../_components/marketing-nav";
import { Hero } from "../_components/hero";
import { PainList } from "../_components/pain-list";
import { MetricCard } from "../_components/metric-card";
import { HowItWorks } from "../_components/how-it-works";
import { DogfoodCTA } from "../_components/dogfood-cta";
import { ICPGrid } from "../_components/icp-grid";
import { CTAFooter } from "../_components/cta-footer";
import { MarketingFooter } from "../_components/marketing-footer";
import { StickyCTABar } from "../_components/sticky-cta-bar";

const SALES_COLOR = "#1A3A6E";

export const metadata: Metadata = {
  title: "Für Vertrieb: KI ruft deinen Lead in 30 Sekunden zurück",
  description:
    "Speed-to-Lead ist die #1-Vertriebs-Kennzahl. Unser KI-Voice-Agent ruft jeden Funnel-Submit binnen Sekunden zurück — 24/7, vollautomatisch.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/sales",
    languages: {
      de: "https://app.neuronic-automation.ai/sales",
      en: "https://app.neuronic-automation.ai/en/sales",
      "x-default": "https://app.neuronic-automation.ai/sales",
    },
  },
};

export default function SalesPage() {
  const lang = "de" as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <MarketingNav lang={lang} />
      <main>
        <Hero
          lang={lang}
          eyebrowKey="sales.eyebrow"
          headlineKey="sales.headline"
          headlineAccentKey="sales.headline_accent"
          subKey="sales.sub"
          primaryCtaKey="sales.primary_cta"
          primaryHref="#dogfood"
          secondaryCtaKey="sales.secondary_cta"
          secondaryHref="https://cal.com/martin-amon-l2hybo/30min"
          accentColor={SALES_COLOR}
        />
        <PainList lang={lang} sectionKey="sales.pain" accentColor={SALES_COLOR} />
        <MetricCard
          lang={lang}
          labelKey="sales.metric.label"
          valueKey="sales.metric.value"
          afterKey="sales.metric.after"
          noteKey="sales.metric.note"
          color={SALES_COLOR}
        />
        <HowItWorks lang={lang} sectionKey="sales.how" accentColor={SALES_COLOR} />
        <div id="dogfood">
          <DogfoodCTA lang={lang} variant="sales" accentColor={SALES_COLOR} />
        </div>
        <ICPGrid lang={lang} sectionKey="sales.icp" accentColor={SALES_COLOR} />
        <CTAFooter lang={lang} sectionKey="sales.final_cta" accentColor={SALES_COLOR} />
      </main>
      <MarketingFooter lang={lang} />
      <StickyCTABar lang={lang} variant="sales" />
    </div>
  );
}
