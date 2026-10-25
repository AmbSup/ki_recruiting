import type { Metadata } from "next";
import { MarketingNav } from "../_components/marketing-nav";
import { ExpertHome } from "../_components/expert-home";
import { MarketingFooter } from "../_components/marketing-footer";

// /home — bewusstes Duplikat von "/" OHNE Auth-Redirect. "/" schickt
// eingeloggte Operatoren automatisch zu /dashboard; /home bleibt für jeden
// Besucher (auch eingeloggt) die öffentliche Marketing-Seite — z.B. zum
// Teilen des Links, während man selbst als Operator eingeloggt ist.
// Canonical zeigt auf "/", damit Google das nicht als Duplicate Content wertet.

export const metadata: Metadata = {
  title: { absolute: "KI-Beratung & KI-Agentur in Wien | KI Expert:innen – Neuronic" },
  description:
    "KI Expert:innen aus Wien: KI-Beratung, KI-Agenten, KI-Schulung und AI-Act-Begleitung für KMU und Unternehmen in Österreich, Deutschland und der Schweiz – von der Strategie bis zum produktiven System.",
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
    url: "https://app.neuronic-automation.ai/home",
    title: "KI-Beratung & KI-Agentur in Wien | KI Expert:innen – Neuronic",
    description:
      "KI Expert:innen aus Wien: KI-Beratung, KI-Agenten, KI-Schulung und AI-Act-Begleitung für KMU und Unternehmen in Österreich, Deutschland und der Schweiz – von der Strategie bis zum produktiven System.",
  },
  twitter: {
    card: "summary",
    title: "KI-Beratung & KI-Agentur in Wien | KI Expert:innen – Neuronic",
    description:
      "KI Expert:innen aus Wien: KI-Beratung, KI-Agenten, KI-Schulung und AI-Act-Begleitung für KMU und Unternehmen in Österreich, Deutschland und der Schweiz – von der Strategie bis zum produktiven System.",
  },
};

export default function HomeAliasPage() {
  const lang = "de" as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <MarketingNav lang={lang} />
      <main>
        <ExpertHome lang={lang} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
