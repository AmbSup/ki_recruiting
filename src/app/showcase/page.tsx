import { createAdminClient } from "@/lib/supabase/admin";
import { BundleCard } from "@/components/showcase/bundle-card";

// Public Showcase-Page mit allen aktiven Funnels als Bundles. Besucher kann
// jeden Funnel öffnen + per Audio-Feedback eine Mic-Aufnahme abgeben.
//
// Bundle-Hero-Image wird aus dem Funnel selbst abgeleitet (Priorität):
//   1. erstes sales_offers.image_url des Programms
//   2. erster Block vom Typ "image" auf Page 1 (content.url)
//   3. erster "profile_header" Block (content.image_url) — typisch für Recruiting
//   4. Fallback: kein Bild → solid colored card mit primary_color

export const dynamic = "force-dynamic";
export const revalidate = 60;

type Bundle = {
  slug: string;
  name: string;
  tagline: string | null;
  hero_image: string | null;
  primary_color: string;
  funnel_type: "sales" | "recruiting" | null;
};

type FunnelRow = {
  id: string;
  slug: string;
  name: string;
  intro_headline: string | null;
  intro_subtext: string | null;
  branding: { primary_color?: string; logo_url?: string } | null;
  sales_program_id: string | null;
  job_id: string | null;
  sales_offers?: { image_url: string | null }[];
  funnel_pages?: { blocks: unknown }[];
};

function extractHeroFromBlocks(blocks: unknown): string | null {
  if (!Array.isArray(blocks)) return null;
  for (const b of blocks) {
    if (!b || typeof b !== "object") continue;
    const rec = b as { type?: string; content?: Record<string, unknown> };
    if (rec.type === "image" && typeof rec.content?.url === "string" && rec.content.url) {
      return rec.content.url;
    }
  }
  for (const b of blocks) {
    if (!b || typeof b !== "object") continue;
    const rec = b as { type?: string; content?: Record<string, unknown> };
    if (rec.type === "profile_header" && typeof rec.content?.image_url === "string" && rec.content.image_url) {
      return rec.content.image_url;
    }
  }
  return null;
}

export async function loadBundles(lang: "de" | "en" = "de"): Promise<Bundle[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("funnels")
    .select(`
      id, slug, name, intro_headline, intro_subtext, branding, language,
      sales_program_id, job_id,
      funnel_pages!inner(blocks, page_order)
    `)
    .eq("status", "active")
    .eq("language", lang)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[showcase] funnels load failed:", error);
    return [];
  }

  // Sammle offer-Bilder pro Programm in einem zweiten Roundtrip — sonst
  // wird der join über die polymorphe Sales/Recruiting-Trennung kompliziert.
  const programIds = data.map((f) => f.sales_program_id).filter((id): id is string => !!id);
  const offerImages = new Map<string, string>();
  if (programIds.length > 0) {
    const { data: offers } = await supabase
      .from("sales_offers")
      .select("sales_program_id, image_url")
      .in("sales_program_id", programIds)
      .not("image_url", "is", null);
    for (const o of offers ?? []) {
      const row = o as { sales_program_id: string; image_url: string | null };
      if (row.image_url && !offerImages.has(row.sales_program_id)) {
        offerImages.set(row.sales_program_id, row.image_url);
      }
    }
  }

  // Funnels die auf der Showcase-Page NICHT auftauchen sollen
  // (z.B. veraltete oder nicht-funktionierende Test-Funnels).
  const EXCLUDED_FROM_SHOWCASE = new Set(["filialleiter-innsbruck"]);

  // Per-Slug Hero-Image-Overrides. Wird VOR der Auto-Pull-Kaskade angewandt
  // (offer-image > block-image > profile-header). Wenn die im Funnel
  // gespeicherten Bilder optisch unpassend sind (z.B. Logo statt Hero),
  // hier ein besseres Bild pinnen. Unsplash-Stock-Bilder sind OK weil's
  // Showcase ist, keine Production-Funnel-Inhalte.
  const HERO_OVERRIDES: Record<string, string> = {
    "photovoltaik-spezial-angebot":
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200",
    "b2b-closer":
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200",
  };

  const bundles: Bundle[] = data
    .filter((f) => f.slug && !f.slug.startsWith("ext-") && !EXCLUDED_FROM_SHOWCASE.has(f.slug))
    .map((f) => {
      const row = f as unknown as FunnelRow;
      const override = HERO_OVERRIDES[row.slug];
      const offerImg = row.sales_program_id ? offerImages.get(row.sales_program_id) : null;

      let hero: string | null = override ?? offerImg ?? null;
      if (!hero) {
        // Suche auf Page 1
        const pages = (row.funnel_pages ?? []) as { blocks: unknown; page_order?: number }[];
        const firstPage = pages.find((p) => (p as { page_order?: number }).page_order === 1) ?? pages[0];
        hero = firstPage ? extractHeroFromBlocks(firstPage.blocks) : null;
      }

      const primaryColor = row.branding?.primary_color || "#1A3A6E";
      const funnelType: Bundle["funnel_type"] = row.sales_program_id
        ? "sales"
        : row.job_id
          ? "recruiting"
          : null;

      return {
        slug: row.slug,
        name: row.intro_headline || row.name,
        tagline: row.intro_subtext,
        hero_image: hero,
        primary_color: primaryColor,
        funnel_type: funnelType,
      };
    });

  return bundles;
}

const COPY = {
  de: {
    eyebrow: "Neuronic Automation Showcase",
    headline: "Teste unsere KI-Funnel-Bundles",
    sub:
      "Jeder Funnel beendet mit einem echten KI-Anruf. Klick auf einen Bundle zum Testen — und lass uns danach kurz wissen wie's war. Aufnahmebutton unter jeder Karte.",
    empty: "Keine aktiven Bundles gefunden.",
    lang_switch: "Switch to English →",
    lang_switch_href: "/en/showcase",
  },
  en: {
    eyebrow: "Neuronic Automation Showcase",
    headline: "Try our AI funnel bundles",
    sub:
      "Every funnel ends with a real AI call. Click a bundle to try it — and let us know how it felt. Recording button below each card.",
    empty: "No active bundles found.",
    lang_switch: "Zur deutschen Version →",
    lang_switch_href: "/showcase",
  },
} as const;

export async function ShowcasePageInner({ lang }: { lang: "de" | "en" }) {
  const bundles = await loadBundles(lang);
  const c = COPY[lang];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <header className="text-center mb-14 relative">
          <a
            href={c.lang_switch_href}
            className="hidden md:inline-flex absolute top-0 right-0 items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-slate-300 hover:text-slate-900"
          >
            {c.lang_switch}
          </a>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            {c.eyebrow}
          </p>
          <h1 className="font-headline text-5xl md:text-6xl italic leading-tight text-slate-900 mb-5">
            {c.headline}
          </h1>
          <p className="font-body text-base text-slate-600 max-w-2xl mx-auto">
            {c.sub}
          </p>
          <a
            href={c.lang_switch_href}
            className="md:hidden inline-flex mt-4 items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600"
          >
            {c.lang_switch}
          </a>
        </header>

        {bundles.length === 0 ? (
          <p className="text-center text-slate-500">{c.empty}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((b) => (
              <BundleCard key={b.slug} bundle={b} />
            ))}
          </div>
        )}

        <footer className="text-center mt-20 text-xs text-slate-400">
          <p>Powered by Neuronic Automation · {new Date().getFullYear()}</p>
        </footer>
      </div>
    </main>
  );
}

export default async function ShowcasePage() {
  return <ShowcasePageInner lang="de" />;
}
