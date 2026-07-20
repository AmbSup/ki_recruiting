import type { MetadataRoute } from "next";

const BASE_URL = "https://app.neuronic-automation.ai";

// Marketing-Seiten sind das einzige SEO-relevante Ziel. Alles andere
// (Operator-Dashboard, API, Auth, dynamische Kandidaten/Lead-Funnels) soll
// nicht gecrawlt werden — Funnels sind Ad-Landingpages ohne organischen
// Such-Traffic-Zweck und würden nur als Duplicate/Thin-Content auffallen.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/companies",
        "/jobs",
        "/funnels",
        "/applicants",
        "/campaigns",
        "/calls",
        "/invoices",
        "/users",
        "/settings",
        "/sales-dashboard",
        "/showcase-feedback",
        "/sales/leads",
        "/sales/programs",
        "/sales/calls",
        "/login",
        "/register",
        "/showcase",
        "/en/showcase",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
