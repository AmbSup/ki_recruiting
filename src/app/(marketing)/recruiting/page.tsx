import type { Metadata } from "next";
import { t } from "../_lib/t";
import { MarketingNav } from "../_components/marketing-nav";
import { Hero } from "../_components/hero";
import { HeroPhoto } from "../_components/hero-photo";
import { PainList } from "../_components/pain-list";
import { MetricCard } from "../_components/metric-card";
import { HowItWorks } from "../_components/how-it-works";
import { DogfoodCTA } from "../_components/dogfood-cta";
import { ICPGrid } from "../_components/icp-grid";
import { ComplianceStrip } from "../_components/compliance-strip";
import { CTAFooter } from "../_components/cta-footer";
import { MarketingFooter } from "../_components/marketing-footer";
import { StickyCTABar } from "../_components/sticky-cta-bar";

const REC_COLOR = "#0E7C66";

export const metadata: Metadata = {
  title: "Fürs Recruiting: KI screent Kandidaten in Minuten",
  description:
    "Time-to-Hire ist die #1-Kandidaten-Barriere. Unser KI-Voice-Agent screent Kandidaten in Minuten nach der Bewerbung. DSGVO-konform, EU-Region.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/recruiting",
    languages: {
      de: "https://app.neuronic-automation.ai/recruiting",
      en: "https://app.neuronic-automation.ai/en/recruiting",
      "x-default": "https://app.neuronic-automation.ai/recruiting",
    },
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://app.neuronic-automation.ai/recruiting",
    title: "Fürs Recruiting: KI screent Kandidaten in Minuten",
    description:
      "Time-to-Hire ist die #1-Kandidaten-Barriere. Unser KI-Voice-Agent screent Kandidaten in Minuten nach der Bewerbung. DSGVO-konform, EU-Region.",
  },
  twitter: {
    card: "summary",
    title: "Fürs Recruiting: KI screent Kandidaten in Minuten",
    description:
      "Time-to-Hire ist die #1-Kandidaten-Barriere. Unser KI-Voice-Agent screent Kandidaten in Minuten nach der Bewerbung. DSGVO-konform, EU-Region.",
  },
};

export default function RecruitingPage() {
  const lang = "de" as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <MarketingNav lang={lang} />
      <main>
        <Hero
          lang={lang}
          eyebrowKey="recruiting.eyebrow"
          headlineKey="recruiting.headline"
          headlineAccentKey="recruiting.headline_accent"
          subKey="recruiting.sub"
          primaryCtaKey="recruiting.primary_cta"
          primaryHref="#dogfood"
          secondaryCtaKey="recruiting.secondary_cta"
          secondaryHref="https://cal.com/martin-amon-l2hybo/30min"
          accentColor={REC_COLOR}
        />
        <HeroPhoto
          src="/marketing/recruiting-hero.jpg"
          alt="Recruiter sichtet Kandidatenprofile am Laptop"
          slogan={t(lang, "recruiting.hero_photo_slogan")}
          accentColor={REC_COLOR}
          priority
        />
        <PainList lang={lang} sectionKey="recruiting.pain" accentColor={REC_COLOR} />
        <MetricCard
          lang={lang}
          labelKey="recruiting.metric.label"
          valueKey="recruiting.metric.value"
          afterKey="recruiting.metric.after"
          noteKey="recruiting.metric.note"
          color={REC_COLOR}
        />
        <HowItWorks lang={lang} sectionKey="recruiting.how" accentColor={REC_COLOR} />
        <div id="dogfood">
          <DogfoodCTA lang={lang} variant="recruiting" accentColor={REC_COLOR} />
        </div>
        <ICPGrid lang={lang} sectionKey="recruiting.icp" accentColor={REC_COLOR} />
        <ComplianceStrip lang={lang} />
        <CTAFooter lang={lang} sectionKey="recruiting.final_cta" accentColor={REC_COLOR} />
      </main>
      <MarketingFooter lang={lang} />
      <StickyCTABar lang={lang} variant="recruiting" />
    </div>
  );
}
