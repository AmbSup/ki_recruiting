import type { Metadata } from "next";
import { MarketingNav } from "../../_components/marketing-nav";
import { SitTool } from "../../_components/sit-tool";
import { MarketingFooter } from "../../_components/marketing-footer";
import { PageViewBeacon } from "../../_components/page-view-beacon";

export const metadata: Metadata = {
  title: "5 Tools for Systematically Innovative Thinking",
  description:
    "Interactive worksheet for Systematic Inventive Thinking: Subtraction, Division, Multiplication, Task Unification, Attribute Dependency — apply the 5 methods to your own product.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/en/innovations-werkzeuge",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.neuronic-automation.ai/en/innovations-werkzeuge",
    title: "5 Tools for Systematically Innovative Thinking",
    description:
      "Interactive worksheet for Systematic Inventive Thinking: Subtraction, Division, Multiplication, Task Unification, Attribute Dependency — apply the 5 methods to your own product.",
  },
  twitter: {
    card: "summary",
    title: "5 Tools for Systematically Innovative Thinking",
    description:
      "Interactive worksheet for Systematic Inventive Thinking: Subtraction, Division, Multiplication, Task Unification, Attribute Dependency — apply the 5 methods to your own product.",
  },
};

export default function InnovationToolsPageEn() {
  const lang = "en" as const;

  return (
    <div className="min-h-screen bg-white">
      <PageViewBeacon slug="en/innovations-werkzeuge" />
      <MarketingNav lang={lang} />
      <main>
        <SitTool lang={lang} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
