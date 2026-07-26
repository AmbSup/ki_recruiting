import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { t } from "../_lib/t";
import { MarketingNav } from "../_components/marketing-nav";
import { Hero } from "../_components/hero";
import { LogoCloud } from "../_components/logo-cloud";
import { SplitFocus } from "../_components/split-focus";
import { HowItWorks } from "../_components/how-it-works";
import { DogfoodCTA } from "../_components/dogfood-cta";
import { ShowcaseTeaser } from "../_components/showcase-teaser";
import { CTAFooter } from "../_components/cta-footer";
import { MarketingFooter } from "../_components/marketing-footer";
import { StickyCTABar } from "../_components/sticky-cta-bar";

export const metadata: Metadata = {
  title: "AI Funnel Expert — The AI Call in 30 Seconds",
  description:
    "AI funnels for Sales and Recruiting. Your lead or candidate gets called back within 30 seconds. Fully automated. 24/7.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/en",
    languages: {
      de: "https://app.neuronic-automation.ai/",
      en: "https://app.neuronic-automation.ai/en",
      "x-default": "https://app.neuronic-automation.ai/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.neuronic-automation.ai/en",
    title: "AI Funnel Expert — The AI Call in 30 Seconds",
    description:
      "AI funnels for Sales and Recruiting. Your lead or candidate gets called back within 30 seconds. Fully automated. 24/7.",
  },
  twitter: {
    card: "summary",
    title: "AI Funnel Expert — The AI Call in 30 Seconds",
    description:
      "AI funnels for Sales and Recruiting. Your lead or candidate gets called back within 30 seconds. Fully automated. 24/7.",
  },
};

export default async function EnHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const lang = "en" as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <MarketingNav lang={lang} />
      <main>
        <Hero
          lang={lang}
          eyebrowKey="home.eyebrow"
          headlineKey="home.headline"
          headlineAccentKey="home.headline_accent"
          subKey="home.sub"
          primaryCtaKey="home.primary_cta"
          primaryHref="#dogfood"
          secondaryCtaKey="home.secondary_cta"
          secondaryHref="https://cal.com/martin-amon-l2hybo/30min"
          photo={{
            src: "/marketing/home-hero.jpg",
            alt: "Woman smiling while taking a call on her phone",
            slogan: t(lang, "home.hero_photo_slogan"),
            priority: true,
          }}
        />
        <LogoCloud lang={lang} sectionKey="shared.clients" />
        <LogoCloud lang={lang} sectionKey="shared.competence" />
        <SplitFocus lang={lang} />
        <ShowcaseTeaser lang={lang} />
        <HowItWorks lang={lang} sectionKey="home.how_it_works" />
        <div id="dogfood">
          <DogfoodCTA lang={lang} variant="home" />
        </div>
        <CTAFooter lang={lang} sectionKey="home.final_cta" />
      </main>
      <MarketingFooter lang={lang} />
      <StickyCTABar lang={lang} variant="home" />
    </div>
  );
}
