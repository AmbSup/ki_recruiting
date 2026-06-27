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

async function loadBundles(): Promise<Bundle[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("funnels")
    .select(`
      id, slug, name, intro_headline, intro_subtext, branding,
      sales_program_id, job_id,
      funnel_pages!inner(blocks, page_order)
    `)
    .eq("status", "active")
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

  const bundles: Bundle[] = data
    .filter((f) => f.slug && !f.slug.startsWith("ext-")) // dropp Test-Funnels
    .map((f) => {
      const row = f as unknown as FunnelRow;
      const offerImg = row.sales_program_id ? offerImages.get(row.sales_program_id) : null;

      let hero: string | null = offerImg ?? null;
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

export default async function ShowcasePage() {
  const bundles = await loadBundles();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <header className="text-center mb-14">
          <p className="font-label text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
            Neuronic Automation Showcase
          </p>
          <h1 className="font-headline text-5xl md:text-6xl italic leading-tight text-slate-900 mb-5">
            Teste unsere KI-Funnel-Bundles
          </h1>
          <p className="font-body text-base text-slate-600 max-w-2xl mx-auto">
            Jeder Funnel beendet mit einem echten KI-Anruf. Klick auf einen Bundle
            zum Testen — und lass uns danach kurz wissen wie's war.
            Aufnahmebutton unter jeder Karte.
          </p>
        </header>

        {bundles.length === 0 ? (
          <p className="text-center text-slate-500">Keine aktiven Bundles gefunden.</p>
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
