import { dict, type Lang } from "../_lib/dict";

const BASE_URL = "https://app.neuronic-automation.ai";

// Site-wide Organization + WebSite Schema. Einmal pro Seite gerendert (via
// (marketing)/layout.tsx) — Google dedupliziert über die gleichbleibende
// @id/url, kein Duplicate-Content-Risiko.
export function OrganizationJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "Neuronic Automation",
        url: "https://neuronic-automation.ai",
        logo: `${BASE_URL}/branding/neuronic-logo.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        name: "AI Funnel Expert",
        url: BASE_URL,
        publisher: { "@id": `${BASE_URL}/#organization` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

type FaqItem = { q: string; a: string };

// Baut das FAQPage-Schema direkt aus dict[lang].pricing.faq.items — derselben
// Quelle, aus der PricingFAQ die sichtbaren <details>-Elemente rendert. Damit
// ist 1:1-Übereinstimmung mit dem sichtbaren Content garantiert (Google-
// Anforderung für FAQ-Rich-Snippets), keine zweite Content-Quelle zum
// Pflegen.
export function FaqJsonLd({ lang }: { lang: Lang }) {
  const items = ((dict[lang] as { pricing?: { faq?: { items?: FaqItem[] } } })
    ?.pricing?.faq?.items ?? []) as FaqItem[];

  if (items.length === 0) return null;

  const json = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
