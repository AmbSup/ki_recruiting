import type { MetadataRoute } from "next";

const BASE_URL = "https://app.neuronic-automation.ai";

type Entry = {
  de: string;
  en?: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

// Nur die statischen Marketing-Seiten. Kandidaten/Lead-Funnels ([slug]) sind
// Ad-Landingpages ohne organischen Discovery-Zweck (siehe robots.ts) und
// bleiben daher außen vor.
const ENTRIES: Entry[] = [
  { de: "/", en: "/en", priority: 1, changeFrequency: "weekly" },
  { de: "/recruiting", en: "/en/recruiting", priority: 0.9, changeFrequency: "weekly" },
  { de: "/sales", en: "/en/sales", priority: 0.9, changeFrequency: "weekly" },
  { de: "/pricing", en: "/en/pricing", priority: 0.8, changeFrequency: "monthly" },
  { de: "/kmu", priority: 0.7, changeFrequency: "monthly" },
  { de: "/wissen", priority: 0.7, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return ENTRIES.flatMap((entry) => {
    const languages: Record<string, string> = {
      de: `${BASE_URL}${entry.de}`,
      ...(entry.en ? { en: `${BASE_URL}${entry.en}` } : {}),
    };

    const deEntry: MetadataRoute.Sitemap[number] = {
      url: `${BASE_URL}${entry.de}`,
      lastModified: now,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      ...(entry.en ? { alternates: { languages } } : {}),
    };

    if (!entry.en) return [deEntry];

    const enEntry: MetadataRoute.Sitemap[number] = {
      url: `${BASE_URL}${entry.en}`,
      lastModified: now,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority * 0.9,
      alternates: { languages },
    };

    return [deEntry, enEntry];
  });
}
