import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MarketingNav } from "../_components/marketing-nav";
import { ExpertHome } from "../_components/expert-home";
import { MarketingFooter } from "../_components/marketing-footer";

export const metadata: Metadata = {
  title: "Neuronic — AI Experts & Freelancers for Your AI Project",
  description:
    "AI strategy, AI Act, GenAI, AI agents, automation, machine learning and training: Neuronic connects you with experienced AI freelancers from Austria, Germany and Switzerland.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/en",
    languages: {
      de: "https://app.neuronic-automation.ai/",
      en: "https://app.neuronic-automation.ai/en",
      "x-default": "https://app.neuronic-automation.ai/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.neuronic-automation.ai/en",
    title: "Neuronic — AI Experts & Freelancers for Your AI Project",
    description:
      "AI strategy, AI Act, GenAI, AI agents, automation, machine learning and training: Neuronic connects you with experienced AI freelancers from Austria, Germany and Switzerland.",
  },
  twitter: {
    card: "summary",
    title: "Neuronic — AI Experts & Freelancers for Your AI Project",
    description:
      "AI strategy, AI Act, GenAI, AI agents, automation, machine learning and training: Neuronic connects you with experienced AI freelancers from Austria, Germany and Switzerland.",
  },
};

export default async function EnHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const lang = "en" as const;

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
