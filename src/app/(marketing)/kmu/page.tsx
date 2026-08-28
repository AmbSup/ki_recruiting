import type { Metadata } from "next";
import { t } from "../_lib/t";
import { MarketingNav } from "../_components/marketing-nav";
import { Hero } from "../_components/hero";
import { LogoCloud } from "../_components/logo-cloud";
import { ProblemTiles } from "../_components/problem-tiles";
import { SolutionGrid } from "../_components/solution-grid";
import { CTAFooter } from "../_components/cta-footer";
import { MarketingFooter } from "../_components/marketing-footer";
import { PageViewBeacon } from "../_components/page-view-beacon";
import { DogfoodCTA } from "../_components/dogfood-cta";
import { ProductPath } from "../_components/product-path";

const ACCENT = "#B45309"; // amber-700 — warmer Erdton für KMU-Positioning

export const metadata: Metadata = {
  title: "Softwarelösungen für KMUs: KI übernimmt die Bürokratie",
  description:
    "21 KI-Bausteine für KMUs: Anfragen, Angebote, Materialbestellung, Baustellenberichte, Rechnungen, Mahnwesen. Voice + Claude + Supabase.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/kmu",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://app.neuronic-automation.ai/kmu",
    title: "Softwarelösungen für KMUs: KI übernimmt die Bürokratie",
    description:
      "21 KI-Bausteine für KMUs: Anfragen, Angebote, Materialbestellung, Baustellenberichte, Rechnungen, Mahnwesen. Voice + Claude + Supabase.",
  },
  twitter: {
    card: "summary",
    title: "Softwarelösungen für KMUs: KI übernimmt die Bürokratie",
    description:
      "21 KI-Bausteine für KMUs: Anfragen, Angebote, Materialbestellung, Baustellenberichte, Rechnungen, Mahnwesen. Voice + Claude + Supabase.",
  },
};

export default function KmuPage() {
  const lang = "de" as const;

  return (
    <div className="min-h-screen bg-[#fbfaf7]">
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
          secondaryHref="/showcase"
          accentColor={ACCENT}
          photo={{
            src: "/marketing/kmu-hero.jpg",
            alt: "Inhaber eines mittelständischen Unternehmens vor dem Firmengebäude",
            slogan: t(lang, "kmu.hero_photo_slogan"),
            priority: true,
          }}
          proofItems={["21 kombinierbare KI-Bausteine", "Einzeln statt als Zwangs-Suite", "Pilot in 3–14 Tagen"]}
          showEyebrow={false}
        />
        <LogoCloud lang={lang} sectionKey="shared.clients" variant="compact" />
        <ProblemTiles lang={lang} />
        <ProductPath
          accentColor={ACCENT}
          heading="Klein anfangen. Im Alltag beweisen. Dann ausbauen."
          intro="Keine monatelange Plattform-Einführung: Wir wählen den Prozess mit dem klarsten Engpass und bauen genau dafür einen belastbaren ersten Baustein."
          steps={[
            { title: "Zeitfresser auswählen", body: "Gemeinsam priorisieren wir den Prozess, der täglich Arbeit bindet oder Umsatz verzögert." },
            { title: "Mit echten Fällen testen", body: "Der Baustein arbeitet mit realistischen Anfragen, Dokumenten oder Sprachmemos aus deinem Betrieb." },
            { title: "Messbar entscheiden", body: "Du siehst, wie viel Zeit der Ablauf spart und ob sich Integration und Ausbau wirtschaftlich lohnen." },
          ]}
        />
        <div id="dogfood">
          <DogfoodCTA lang={lang} variant="kmu" accentColor={ACCENT} />
        </div>
        <SolutionGrid lang={lang} accentColor={ACCENT} />
        <CTAFooter lang={lang} sectionKey="kmu.final_cta" accentColor={ACCENT} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
