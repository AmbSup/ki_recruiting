import type { Metadata } from "next";
import { MarketingNav } from "../_components/marketing-nav";
import { NetworkPage } from "../_components/network-page";
import { MarketingFooter } from "../_components/marketing-footer";

export const metadata: Metadata = {
  title: { absolute: "Unser Netzwerk – Die KI Expert:innen hinter Neuronic | KI-Beratung" },
  description:
    "Die Expert:innen, mit denen Neuronic KI-Projekte umsetzt: KI-Strategie, AI Act, KI-Agenten, Automatisierung, Machine Learning und Cloud-KI.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/netzwerk",
    languages: {
      de: "https://app.neuronic-automation.ai/netzwerk",
      en: "https://app.neuronic-automation.ai/en/netzwerk",
      "x-default": "https://app.neuronic-automation.ai/netzwerk",
    },
  },
};

export default function NetzwerkPage() {
  const lang = "de" as const;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <MarketingNav lang={lang} />
      <main>
        <NetworkPage lang={lang} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
