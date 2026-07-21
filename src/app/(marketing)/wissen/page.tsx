import type { Metadata } from "next";
import { t } from "../_lib/t";
import { MarketingNav } from "../_components/marketing-nav";
import { Hero } from "../_components/hero";
import { PainList } from "../_components/pain-list";
import { MetricCard } from "../_components/metric-card";
import { BenefitGrid } from "../_components/benefit-grid";
import { ICPGrid } from "../_components/icp-grid";
import { CTAFooter } from "../_components/cta-footer";
import { MarketingFooter } from "../_components/marketing-footer";
import { ColorBlock } from "../_components/color-block";
import { WissenGraphIllustration } from "../_components/wissen-graph-illustration";
import { WissenSearchIllustration } from "../_components/wissen-search-illustration";

// Tertiary-Ton aus dem Claude-Design-System (globals.css) — eigenständige,
// aber zur warmen Rust/Cream-Palette passende Farbe für Wissensmanagement-
// Positioning. KMU-Page belegt bereits Amber, Sales/Recruiting Navy.
const ACCENT = "#7b555c";

export const metadata: Metadata = {
  title: "KI-Wissensmanagement: Profile & Dokumente sofort finden (RAG + GraphRAG)",
  description:
    "KI-Wissensmanagement mit RAG und GraphRAG: HR-Berater finden Profile schneller, Interim-Agenturen matchen präziser, KMUs Dokumente sofort.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/wissen",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://app.neuronic-automation.ai/wissen",
    title: "KI-Wissensmanagement: Profile & Dokumente sofort finden (RAG + GraphRAG)",
    description:
      "KI-Wissensmanagement mit RAG und GraphRAG: HR-Berater finden Profile schneller, Interim-Agenturen matchen präziser, KMUs Dokumente sofort.",
  },
  twitter: {
    card: "summary",
    title: "KI-Wissensmanagement: Profile & Dokumente sofort finden (RAG + GraphRAG)",
    description:
      "KI-Wissensmanagement mit RAG und GraphRAG: HR-Berater finden Profile schneller, Interim-Agenturen matchen präziser, KMUs Dokumente sofort.",
  },
};

export default function WissenPage() {
  const lang = "de" as const;

  return (
    <div className="min-h-screen bg-background">
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
            />
          </div>
        </div>

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
