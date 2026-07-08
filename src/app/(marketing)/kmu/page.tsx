import type { Metadata } from "next";
import { MarketingNav } from "../_components/marketing-nav";
import { Hero } from "../_components/hero";
import { ProblemTiles } from "../_components/problem-tiles";
import { SolutionGrid } from "../_components/solution-grid";
import { DogfoodCTA } from "../_components/dogfood-cta";
import { CTAFooter } from "../_components/cta-footer";
import { MarketingFooter } from "../_components/marketing-footer";

const ACCENT = "#B45309"; // amber-700 — warmer Erdton für KMU-Positioning

export const metadata: Metadata = {
  title: "Softwarelösungen für KMUs: KI übernimmt die Bürokratie",
  description:
    "21 KI-Bausteine für KMUs: Anfragen, Angebote, Materialbestellung, Baustellenberichte, Rechnungen, Mahnwesen. Voice + Claude + Supabase.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/kmu",
  },
};

export default function KmuPage() {
  const lang = "de" as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <MarketingNav lang={lang} />
      <main>
        <Hero
          lang={lang}
          eyebrowKey="kmu.eyebrow"
          headlineKey="kmu.headline"
          headlineAccentKey="kmu.headline_accent"
          subKey="kmu.sub"
          primaryCtaKey="kmu.primary_cta"
          primaryHref="https://cal.com/martin-amon-l2hybo/30min"
          secondaryCtaKey="kmu.secondary_cta"
          secondaryHref="/demo-kmu?test=1"
          accentColor={ACCENT}
        />
        <ProblemTiles lang={lang} />
        <SolutionGrid lang={lang} accentColor={ACCENT} />
        <DogfoodCTA lang={lang} variant="kmu" accentColor={ACCENT} />
        <CTAFooter lang={lang} sectionKey="kmu.final_cta" accentColor={ACCENT} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
