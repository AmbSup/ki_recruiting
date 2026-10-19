import type { Metadata } from "next";
import { MarketingNav } from "../../_components/marketing-nav";
import { NetworkPage } from "../../_components/network-page";
import { MarketingFooter } from "../../_components/marketing-footer";

export const metadata: Metadata = {
  title: "Our network — The AI experts behind Neuronic",
  description:
    "The experts Neuronic delivers AI projects with: AI strategy, AI Act, AI agents, automation, machine learning and cloud AI.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/en/netzwerk",
    languages: {
      de: "https://app.neuronic-automation.ai/netzwerk",
      en: "https://app.neuronic-automation.ai/en/netzwerk",
      "x-default": "https://app.neuronic-automation.ai/netzwerk",
    },
  },
};

export default function EnNetzwerkPage() {
  const lang = "en" as const;
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
