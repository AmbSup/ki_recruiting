import type { Metadata } from "next";
import { t } from "../../_lib/t";
import { MarketingNav } from "../../_components/marketing-nav";
import { Hero } from "../../_components/hero";
import { LogoCloud } from "../../_components/logo-cloud";
import { PainList } from "../../_components/pain-list";
import { MetricCard } from "../../_components/metric-card";
import { BenefitGrid } from "../../_components/benefit-grid";
import { ICPGrid } from "../../_components/icp-grid";
import { CTAFooter } from "../../_components/cta-footer";
import { MarketingFooter } from "../../_components/marketing-footer";
import { ColorBlock } from "../../_components/color-block";
import { WissenGraphIllustration } from "../../_components/wissen-graph-illustration";
import { WissenSearchIllustration } from "../../_components/wissen-search-illustration";
import { PageViewBeacon } from "../../_components/page-view-beacon";

const ACCENT = "#7b555c";

export const metadata: Metadata = {
  title: "AI Knowledge Management: Find Profiles & Documents Instantly (RAG + GraphRAG)",
  description:
    "AI knowledge management with RAG and GraphRAG: HR consultants find profiles faster, interim agencies match more precisely, SMBs find documents instantly.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/en/wissen",
    languages: {
      de: "https://app.neuronic-automation.ai/wissen",
      en: "https://app.neuronic-automation.ai/en/wissen",
      "x-default": "https://app.neuronic-automation.ai/wissen",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.neuronic-automation.ai/en/wissen",
    title: "AI Knowledge Management: Find Profiles & Documents Instantly (RAG + GraphRAG)",
    description:
      "AI knowledge management with RAG and GraphRAG: HR consultants find profiles faster, interim agencies match more precisely, SMBs find documents instantly.",
  },
  twitter: {
    card: "summary",
    title: "AI Knowledge Management: Find Profiles & Documents Instantly (RAG + GraphRAG)",
    description:
      "AI knowledge management with RAG and GraphRAG: HR consultants find profiles faster, interim agencies match more precisely, SMBs find documents instantly.",
  },
};

export default function EnWissenPage() {
  const lang = "en" as const;

  return (
    <div className="min-h-screen bg-background">
      <PageViewBeacon slug="wissen" />
      <MarketingNav lang={lang} />
      <main>
        <div className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-32 w-[32rem] h-[32rem] rounded-full bg-tertiary-container blur-3xl opacity-40"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -left-40 w-[28rem] h-[28rem] rounded-full bg-primary-container blur-3xl opacity-30"
          />
          <div className="relative">
            <Hero
              lang={lang}
              eyebrowKey="wissen.eyebrow"
              headlineKey="wissen.headline"
              headlineAccentKey="wissen.headline_accent"
              subKey="wissen.sub"
              primaryCtaKey="wissen.primary_cta"
              primaryHref="https://cal.com/martin-amon-l2hybo/30min"
              accentColor={ACCENT}
              photo={{
                src: "/marketing/wissen-hero.jpg",
                alt: "Employee searching through binders for a document",
                slogan: t(lang, "wissen.hero_photo_slogan"),
                priority: true,
              }}
            />
          </div>
        </div>

        <LogoCloud lang={lang} sectionKey="shared.clients" variant="compact" />

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <ColorBlock
            variant="primary"
            text={t(lang, "wissen.universal_claim")}
            illustration={<WissenGraphIllustration className="text-on-primary-container" />}
          />
        </section>

        <PainList lang={lang} sectionKey="wissen.pain" accentColor={ACCENT} />
        <MetricCard
          lang={lang}
          labelKey="wissen.metric.label"
          valueKey="wissen.metric.value"
          afterKey="wissen.metric.after"
          noteKey="wissen.metric.note"
          color={ACCENT}
        />

        <section className="mx-auto max-w-6xl px-6 py-8">
          <ColorBlock
            variant="tertiary"
            eyebrow={t(lang, "wissen.pullquote.eyebrow")}
            text={t(lang, "wissen.pullquote.text")}
            illustration={<WissenSearchIllustration className="text-on-tertiary-container" />}
          />
        </section>

        <BenefitGrid lang={lang} sectionKey="wissen.benefits" accentColor={ACCENT} />
        <ICPGrid lang={lang} sectionKey="wissen.icp" accentColor={ACCENT} />
        <CTAFooter lang={lang} sectionKey="wissen.final_cta" accentColor={ACCENT} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
