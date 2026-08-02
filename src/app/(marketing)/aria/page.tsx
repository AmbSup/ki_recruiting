import type { Metadata } from "next";
import Image from "next/image";
import { t } from "../_lib/t";
import { MarketingNav } from "../_components/marketing-nav";
import { Hero } from "../_components/hero";
import { LogoCloud } from "../_components/logo-cloud";
import { PainList } from "../_components/pain-list";
import { BenefitGrid } from "../_components/benefit-grid";
import { ICPGrid } from "../_components/icp-grid";
import { CTAFooter } from "../_components/cta-footer";
import { MarketingFooter } from "../_components/marketing-footer";
import { ColorBlock } from "../_components/color-block";
import { AriaGraphIllustration } from "../_components/aria-graph-illustration";

// Dunkles Tannengrün — eigenständiger Ton, noch nicht belegt (Home/Sales Navy,
// Recruiting Grün #0E7C66, KMU Amber, Wissen Rust sind schon vergeben).
const ACCENT = "#1f5c3d";

// ARIA ist bestehender Produkt-Code außerhalb dieses Repos — diese Seite ist
// reines Marketing mit Link zur Live-Demo, kein eigenes Backend hier.
const DEMO_URL = "https://aria-demo.178.104.78.145.sslip.io/";

export const metadata: Metadata = {
  title: "ARIA — Die neue Unternehmensintelligenz",
  description:
    "ARIA verteilt euer Unternehmenswissen permission-aware: jeder bekommt die richtige Information, aus der richtigen Quelle, zum richtigen Zeitpunkt.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/aria",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://app.neuronic-automation.ai/aria",
    title: "ARIA — Die neue Unternehmensintelligenz",
    description:
      "ARIA verteilt euer Unternehmenswissen permission-aware: jeder bekommt die richtige Information, aus der richtigen Quelle, zum richtigen Zeitpunkt.",
  },
  twitter: {
    card: "summary",
    title: "ARIA — Die neue Unternehmensintelligenz",
    description:
      "ARIA verteilt euer Unternehmenswissen permission-aware: jeder bekommt die richtige Information, aus der richtigen Quelle, zum richtigen Zeitpunkt.",
  },
};

export default function AriaPage() {
  const lang = "de" as const;

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav lang={lang} />
      <main>
        <div className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-32 w-[32rem] h-[32rem] rounded-full bg-primary-container blur-3xl opacity-40"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -left-40 w-[28rem] h-[28rem] rounded-full bg-tertiary-container blur-3xl opacity-30"
          />
          <div className="relative">
            <Hero
              lang={lang}
              eyebrowKey="aria.eyebrow"
              headlineKey="aria.headline"
              headlineAccentKey="aria.headline_accent"
              subKey="aria.sub"
              primaryCtaKey="aria.primary_cta"
              primaryHref={DEMO_URL}
              accentColor={ACCENT}
              photo={{
                src: "/marketing/Aria.jpg",
                alt: "KI-Datenvisualisierungen neben einem biometrisch gescannten Auge — Sinnbild für Unternehmensintelligenz mit ARIA",
                priority: true,
              }}
            />
          </div>
        </div>

        <LogoCloud lang={lang} sectionKey="shared.clients" variant="compact" />

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <ColorBlock
            variant="primary"
            text={t(lang, "aria.universal_claim")}
            illustration={<AriaGraphIllustration className="text-on-primary-container" />}
          />
        </section>

        <PainList lang={lang} sectionKey="aria.pain" accentColor={ACCENT} />

        <section className="mx-auto max-w-6xl px-6 py-8">
          <ColorBlock
            variant="tertiary"
            eyebrow={t(lang, "aria.pullquote.eyebrow")}
            text={t(lang, "aria.pullquote.text")}
            illustration={
              <Image
                src="/marketing/ki-netzwerk.jpg"
                alt="KI-Netzwerk aus verteilten, verbundenen Knoten"
                width={640}
                height={355}
                className="rounded-2xl object-cover w-full max-w-md"
              />
            }
          />
        </section>

        <BenefitGrid lang={lang} sectionKey="aria.benefits" accentColor={ACCENT} />
        <ICPGrid lang={lang} sectionKey="aria.icp" accentColor={ACCENT} />
        <CTAFooter lang={lang} sectionKey="aria.final_cta" accentColor={ACCENT} href={DEMO_URL} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
