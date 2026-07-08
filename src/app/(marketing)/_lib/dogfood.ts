// Slugs der beiden purpose-built Demo-Funnels pro Sprache.
// CTAs auf den Marketing-Pages hängen `?test=1` an (siehe fix `6822849`) →
// jeder Klick = frischer Lead + Auto-Dial an die Prospect-Nummer.

export const DOGFOOD_FUNNELS = {
  sales: {
    de: "demo-sales",
    en: "demo-sales-en",
  },
  recruiting: {
    de: "demo-recruiting",
    en: "demo-recruiting-en",
  },
  // KMU-Demo bewusst DE-only — Positioning-Sub-Vertical (Handwerk/KMU) wird
  // aktuell nicht auf EN verkauft. EN-Fallback zeigt auf sales-en.
  kmu: {
    de: "demo-kmu",
    en: "demo-sales-en",
  },
} as const;

export function dogfoodUrl(
  vertical: "sales" | "recruiting" | "kmu",
  lang: "de" | "en",
): string {
  const slug = DOGFOOD_FUNNELS[vertical][lang];
  return `/${slug}?test=1`;
}
