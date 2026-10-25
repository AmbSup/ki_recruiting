import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MarketingNav } from "./_components/marketing-nav";
import { ExpertHome } from "./_components/expert-home";
import { MarketingFooter } from "./_components/marketing-footer";

// DE Home (Root /) — Auth-aware: eingeloggter Operator → Dashboard.
// Für alle sonst: Marketing-Landing als KI-Beratung (ExpertHome).

export const metadata: Metadata = {
  // Bing Webmaster Tools (zusätzlich zu public/BingSiteAuth.xml)
  verification: { other: { "msvalidate.01": "F0E78849D1F22B73C1FA7D6B65E6A163" } },
  title: "KI Expert:innen — Die KI-Beratung für Ihr Projekt, Ihr KMU und Ihren Drive forward",
  description:
    "KI-Beratung von der Strategie bis zum produktiven System: AI Act, Generative AI, KI-Agenten, Automatisierung, Machine Learning und Schulungen — für Unternehmen in Österreich, Deutschland und der Schweiz.",
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
    title: "KI Expert:innen — Die KI-Beratung für Ihr Projekt, Ihr KMU und Ihren Drive forward",
    description:
      "KI-Beratung von der Strategie bis zum produktiven System: AI Act, Generative AI, KI-Agenten, Automatisierung, Machine Learning und Schulungen — für Unternehmen in Österreich, Deutschland und der Schweiz.",
  },
  twitter: {
    card: "summary",
    title: "KI Expert:innen — Die KI-Beratung für Ihr Projekt, Ihr KMU und Ihren Drive forward",
    description:
      "KI-Beratung von der Strategie bis zum produktiven System: AI Act, Generative AI, KI-Agenten, Automatisierung, Machine Learning und Schulungen — für Unternehmen in Österreich, Deutschland und der Schweiz.",
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
        <ExpertHome lang={lang} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
