import type { Metadata } from "next";
import { MarketingNav } from "../_components/marketing-nav";
import { TopicPage } from "../_components/topic-page";
import { MarketingFooter } from "../_components/marketing-footer";

// SEO-Themenseite (nur DE). Inhalt: dict.de.topics.ki_agenten
export const metadata: Metadata = {
  title: { absolute: "KI-Agenten für Unternehmen – Beratung & Entwicklung für Wien & NÖ | Neuronic" },
  description: "KI-Agenten (AI Agents) für Unternehmen: Wir entwickeln KI-Agenten, die in CRM, E-Mail und ERP arbeiten – sicher, DSGVO-konform, mit Mensch im Loop. KI-Beratung für Wien und Niederösterreich.",
  alternates: { canonical: "https://app.neuronic-automation.ai/ki-agenten" },
  openGraph: {
    type: "website",
    locale: "de_AT",
    url: "https://app.neuronic-automation.ai/ki-agenten",
    title: "KI-Agenten für Unternehmen – Beratung & Entwicklung für Wien & NÖ | Neuronic",
    description: "KI-Agenten (AI Agents) für Unternehmen: Wir entwickeln KI-Agenten, die in CRM, E-Mail und ERP arbeiten – sicher, DSGVO-konform, mit Mensch im Loop. KI-Beratung für Wien und Niederösterreich.",
  },
};

export default function KiAgentenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <MarketingNav lang="de" />
      <main>
        <TopicPage topic="ki_agenten" />
      </main>
      <MarketingFooter lang="de" />
    </div>
  );
}
