import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MarketingNav } from "./_components/marketing-nav";
import { Hero } from "./_components/hero";
import { SplitFocus } from "./_components/split-focus";
import { HowItWorks } from "./_components/how-it-works";
import { DogfoodCTA } from "./_components/dogfood-cta";
import { ShowcaseTeaser } from "./_components/showcase-teaser";
import { CTAFooter } from "./_components/cta-footer";
import { MarketingFooter } from "./_components/marketing-footer";
import { StickyCTABar } from "./_components/sticky-cta-bar";

// DE Home (Root /) — Auth-aware: eingeloggter Operator → Dashboard.
// Für alle sonst: Marketing-Landing mit Split-Focus zwischen Sales / Recruiting.

export const metadata: Metadata = {
  title: "AI Funnel Expert — Der KI-Anruf in 30 Sekunden",
  description:
    "AI-Funnels für Vertrieb und Recruiting. Dein Lead oder Kandidat wird binnen 30 Sekunden vollautomatisch zurückgerufen. 24/7.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/",
    languages: {
      de: "https://app.neuronic-automation.ai/",
      en: "https://app.neuronic-automation.ai/en",
      "x-default": "https://app.neuronic-automation.ai/",
    },
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://app.neuronic-automation.ai/",
    title: "AI Funnel Expert — Der KI-Anruf in 30 Sekunden",
    description:
      "AI-Funnels für Vertrieb und Recruiting. Dein Lead oder Kandidat wird binnen 30 Sekunden vollautomatisch zurückgerufen. 24/7.",
  },
  twitter: {
    card: "summary",
    title: "AI Funnel Expert — Der KI-Anruf in 30 Sekunden",
    description:
      "AI-Funnels für Vertrieb und Recruiting. Dein Lead oder Kandidat wird binnen 30 Sekunden vollautomatisch zurückgerufen. 24/7.",
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const lang = "de" as const;

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
        />
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
