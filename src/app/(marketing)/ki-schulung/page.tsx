import type { Metadata } from "next";
import { MarketingNav } from "../_components/marketing-nav";
import { TopicPage } from "../_components/topic-page";
import { MarketingFooter } from "../_components/marketing-footer";

// SEO-Themenseite (nur DE). Inhalt: dict.de.topics.ki_schulung
export const metadata: Metadata = {
  title: { absolute: "KI-Schulung & Workshops für Unternehmen in Wien und remote | Neuronic" },
  description: "KI-Schulung für Mitarbeitende und Führungskräfte: praxisnahe Workshops zu ChatGPT, Copilot, Automatisierung und KI-Kompetenz nach Art. 4 AI Act – in Wien, Österreich oder remote.",
  alternates: { canonical: "https://app.neuronic-automation.ai/ki-schulung" },
  openGraph: {
    type: "website",
    locale: "de_AT",
    url: "https://app.neuronic-automation.ai/ki-schulung",
    title: "KI-Schulung & Workshops für Unternehmen in Wien und remote | Neuronic",
    description: "KI-Schulung für Mitarbeitende und Führungskräfte: praxisnahe Workshops zu ChatGPT, Copilot, Automatisierung und KI-Kompetenz nach Art. 4 AI Act – in Wien, Österreich oder remote.",
  },
};

export default function KiSchulungPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <MarketingNav lang="de" />
      <main>
        <TopicPage topic="ki_schulung" />
      </main>
      <MarketingFooter lang="de" />
    </div>
  );
}
