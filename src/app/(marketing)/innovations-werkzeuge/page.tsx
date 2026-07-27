import type { Metadata } from "next";
import { MarketingNav } from "../_components/marketing-nav";
import { SitTool } from "../_components/sit-tool";
import { MarketingFooter } from "../_components/marketing-footer";
import { PageViewBeacon } from "../_components/page-view-beacon";

export const metadata: Metadata = {
  title: "5 Werkzeuge für systematisch innovatives Denken",
  description:
    "Interaktives Arbeitsblatt für Systematic Inventive Thinking: Subtraktion, Division, Multiplikation, Aufgabenvereinigung, Eigenschaftsabhängigkeit — wende die 5 Methoden auf dein eigenes Produkt an.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/innovations-werkzeuge",
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: "https://app.neuronic-automation.ai/innovations-werkzeuge",
    title: "5 Werkzeuge für systematisch innovatives Denken",
    description:
      "Interaktives Arbeitsblatt für Systematic Inventive Thinking: Subtraktion, Division, Multiplikation, Aufgabenvereinigung, Eigenschaftsabhängigkeit — wende die 5 Methoden auf dein eigenes Produkt an.",
  },
  twitter: {
    card: "summary",
    title: "5 Werkzeuge für systematisch innovatives Denken",
    description:
      "Interaktives Arbeitsblatt für Systematic Inventive Thinking: Subtraktion, Division, Multiplikation, Aufgabenvereinigung, Eigenschaftsabhängigkeit — wende die 5 Methoden auf dein eigenes Produkt an.",
  },
};

export default function InnovationsWerkzeugePage() {
  const lang = "de" as const;

  return (
    <div className="min-h-screen bg-white">
      <PageViewBeacon slug="innovations-werkzeuge" />
      <MarketingNav lang={lang} />
      <main>
        <SitTool lang={lang} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
