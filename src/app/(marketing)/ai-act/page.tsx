import type { Metadata } from "next";
import { MarketingNav } from "../_components/marketing-nav";
import { TopicPage } from "../_components/topic-page";
import { MarketingFooter } from "../_components/marketing-footer";

// SEO-Themenseite (nur DE). Inhalt: dict.de.topics.ai_act
export const metadata: Metadata = {
  title: { absolute: "AI Act für KMU: Pflichten, Fristen & Checkliste | KI-Beratung Neuronic" },
  description: "Der EU AI Act im Überblick für KMU in Österreich: Risikostufen, wichtige Termine, KI-Kompetenzpflicht und Checkliste – mit Unterstützung durch zertifizierte KI-Beauftragte.",
  alternates: { canonical: "https://app.neuronic-automation.ai/ai-act" },
  openGraph: {
    type: "website",
    locale: "de_AT",
    url: "https://app.neuronic-automation.ai/ai-act",
    title: "AI Act für KMU: Pflichten, Fristen & Checkliste | KI-Beratung Neuronic",
    description: "Der EU AI Act im Überblick für KMU in Österreich: Risikostufen, wichtige Termine, KI-Kompetenzpflicht und Checkliste – mit Unterstützung durch zertifizierte KI-Beauftragte.",
  },
};

export default function AiActPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <MarketingNav lang="de" />
      <main>
        <TopicPage topic="ai_act" />
      </main>
      <MarketingFooter lang="de" />
    </div>
  );
}
