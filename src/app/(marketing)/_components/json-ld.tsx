import { dict, type Lang } from "../_lib/dict";
import type { BlogPost } from "../_lib/blog-posts";

const BASE_URL = "https://app.neuronic-automation.ai";

// Site-wide Organization + WebSite Schema. Einmal pro Seite gerendert (via
// (marketing)/layout.tsx) — Google dedupliziert über die gleichbleibende
// @id/url, kein Duplicate-Content-Risiko.
export function OrganizationJsonLd() {
  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        // Doppel-Typ Organization + ProfessionalService: gleiche Entity
        // (ein @id), aber ProfessionalService gibt Google die NAP-Signale
        // (telephone/address/areaServed), die für den Local-Pack/Maps-Abgleich
        // mit dem Google Business Profile gebraucht werden. Adresse bewusst
        // nur auf Orts-Ebene (kein streetAddress) — Neuronic Automation läuft
        // im GBP als Service-Area-Business ohne öffentliche Straßenadresse;
        // Telefonnummer muss exakt mit dem GBP-Eintrag matchen (NAP-Konsistenz).
        "@type": ["Organization", "ProfessionalService"],
        "@id": `${BASE_URL}/#organization`,
        name: "Neuronic Automation",
        url: "https://neuronic-automation.ai",
        logo: `${BASE_URL}/branding/neuronic-logo.png`,
        image: `${BASE_URL}/branding/neuronic-logo.png`,
        telephone: "+43 677 63165057",
        email: "office@neuronic-automation.ai",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Wien",
          addressCountry: "AT",
        },
        areaServed: [
          { "@type": "Country", name: "Österreich" },
          { "@type": "City", name: "Wien" },
        ],
        sameAs: ["https://www.linkedin.com/company/neuronic-automation/"],
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

// BlogPosting-Schema pro Artikel. author/publisher zeigen auf dieselbe
// Organization-@id wie OrganizationJsonLd — kein zweiter Entity-Eintrag.
export function ArticleJsonLd({ post, lang }: { post: BlogPost; lang: Lang }) {
  const content = post[lang];
  const url = lang === "de" ? `${BASE_URL}/blog/${post.slug}` : `${BASE_URL}/en/blog/${post.slug}`;
  const json = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: url,
    headline: content.title,
    description: content.metaDescription,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    inLanguage: lang === "de" ? "de-DE" : "en-US",
    author: { "@id": `${BASE_URL}/#organization` },
    publisher: { "@id": `${BASE_URL}/#organization` },
    keywords: content.keywords.join(", "),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

type FaqItem = { q: string; a: string };

// Baut das FAQPage-Schema direkt aus dict[lang][sectionKey].items — derselben
// Quelle, aus der Faq/PricingFAQ die sichtbaren <details>-Elemente rendern.
// Damit ist 1:1-Übereinstimmung mit dem sichtbaren Content garantiert
// (Google-Anforderung für FAQ-Rich-Snippets), keine zweite Content-Quelle
// zum Pflegen. Default bleibt "pricing.faq" für Bestandsaufrufe ohne Prop.
export function FaqJsonLd({ lang, sectionKey = "pricing.faq" }: { lang: Lang; sectionKey?: string }) {
  const parts = sectionKey.split(".");
  let cursor: unknown = dict[lang];
  for (const p of parts) {
    if (cursor && typeof cursor === "object" && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else {
      cursor = null;
      break;
    }
  }
  const items = ((cursor as { items?: FaqItem[] } | null)?.items ?? []) as FaqItem[];

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
