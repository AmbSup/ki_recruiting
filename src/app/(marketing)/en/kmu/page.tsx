import type { Metadata } from "next";
import { t } from "../../_lib/t";
import { MarketingNav } from "../../_components/marketing-nav";
import { Hero } from "../../_components/hero";
import { LogoCloud } from "../../_components/logo-cloud";
import { ProblemTiles } from "../../_components/problem-tiles";
import { SolutionGrid } from "../../_components/solution-grid";
import { CTAFooter } from "../../_components/cta-footer";
import { MarketingFooter } from "../../_components/marketing-footer";
import { PageViewBeacon } from "../../_components/page-view-beacon";

const ACCENT = "#B45309"; // amber-700 — warm earth tone for the SMB positioning

export const metadata: Metadata = {
  title: "Software Solutions for SMBs: AI Takes Over the Paperwork",
  description:
    "21 AI building blocks for SMBs: inquiries, quotes, material ordering, site reports, invoicing, dunning. Voice + Claude + Supabase.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/en/kmu",
    languages: {
      de: "https://app.neuronic-automation.ai/kmu",
      en: "https://app.neuronic-automation.ai/en/kmu",
      "x-default": "https://app.neuronic-automation.ai/kmu",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.neuronic-automation.ai/en/kmu",
    title: "Software Solutions for SMBs: AI Takes Over the Paperwork",
    description:
      "21 AI building blocks for SMBs: inquiries, quotes, material ordering, site reports, invoicing, dunning. Voice + Claude + Supabase.",
  },
  twitter: {
    card: "summary",
    title: "Software Solutions for SMBs: AI Takes Over the Paperwork",
    description:
      "21 AI building blocks for SMBs: inquiries, quotes, material ordering, site reports, invoicing, dunning. Voice + Claude + Supabase.",
  },
};

export default function EnKmuPage() {
  const lang = "en" as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <PageViewBeacon slug="kmu" />
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
          secondaryHref="/en/showcase"
          accentColor={ACCENT}
          photo={{
            src: "/marketing/kmu-hero.jpg",
            alt: "Owner of a mid-sized business in front of the company building",
            slogan: t(lang, "kmu.hero_photo_slogan"),
            priority: true,
          }}
        />
        <LogoCloud lang={lang} sectionKey="shared.clients" variant="compact" />
        <ProblemTiles lang={lang} />
        <SolutionGrid lang={lang} accentColor={ACCENT} />
        <CTAFooter lang={lang} sectionKey="kmu.final_cta" accentColor={ACCENT} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
