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

const ACCENT = "#4F46E5"; // indigo-600 — eigenständige Farbe für Wissensmanagement-Positioning

export const metadata: Metadata = {
  title: "KI-Wissensmanagement: Profile & Dokumente sofort finden (RAG + GraphRAG)",
  description:
    "Modernstes KI-Wissensmanagement mit RAG und GraphRAG. HR-Berater finden Profile schneller, Interim-Agenturen matchen präziser, KMUs finden Dokumente sofort wieder.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/wissen",
  },
};

export default function WissenPage() {
  const lang = "de" as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <MarketingNav lang={lang} />
      <main>
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
        <p className="mx-auto max-w-3xl px-6 pb-16 text-center font-headline text-2xl sm:text-3xl italic text-slate-900 leading-snug">
          {t(lang, "wissen.universal_claim")}
        </p>
        <PainList lang={lang} sectionKey="wissen.pain" accentColor={ACCENT} />
        <MetricCard
          lang={lang}
          labelKey="wissen.metric.label"
          valueKey="wissen.metric.value"
          afterKey="wissen.metric.after"
          noteKey="wissen.metric.note"
          color={ACCENT}
        />
        <BenefitGrid lang={lang} sectionKey="wissen.benefits" accentColor={ACCENT} />
        <ICPGrid lang={lang} sectionKey="wissen.icp" accentColor={ACCENT} />
        <CTAFooter lang={lang} sectionKey="wissen.final_cta" accentColor={ACCENT} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
