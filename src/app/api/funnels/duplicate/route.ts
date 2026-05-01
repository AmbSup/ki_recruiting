import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 30;
export const runtime = "nodejs";

// POST /api/funnels/duplicate
// Body:
// {
//   source: { type: 'funnel', funnel_id: string } | { type: 'template', template_id: string },
//   target_anchor: { job_id: string } | { sales_program_id: string },
//   new_name?: string,
//   new_slug?: string,
//   rebrand?: { primary_color?: string, logo_url?: string }
// }
//
// Returns { funnel_id, slug, edit_url }
//
// Spawnt einen neuen Funnel aus zwei möglichen Quellen:
//  - 'funnel': bestehender Funnel wird kopiert (für "Duplizieren"-Button im Listing)
//  - 'template': built-in Niche-Template wird ausgerollt (für "Aus Template starten")
//
// Slug-Collision: bei Konflikt wird "-1", "-2", ... angehängt bis frei.

type Source =
  | { type: "funnel"; funnel_id: string }
  | { type: "template"; template_id: string };

type TargetAnchor = { job_id: string } | { sales_program_id: string };

type Body = {
  source?: Source;
  target_anchor?: TargetAnchor;
  new_name?: string;
  new_slug?: string;
  rebrand?: { primary_color?: string; logo_url?: string };
};

type SourceData = {
  name: string;
  slug: string;
  intro_headline: string | null;
  intro_subtext: string | null;
  consent_text: string | null;
  thank_you_text: string | null;
  branding: Record<string, unknown>;
  pages: Array<{ page_order: number; blocks: unknown; is_required: boolean }>;
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[äöü]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue" }[c] ?? c))
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { source, target_anchor, new_name, new_slug, rebrand } = body;
  if (!source || !target_anchor) {
    return NextResponse.json({ error: "source + target_anchor erforderlich" }, { status: 422 });
  }

  const job_id = "job_id" in target_anchor ? target_anchor.job_id : null;
  const sales_program_id = "sales_program_id" in target_anchor ? target_anchor.sales_program_id : null;
  if (!job_id && !sales_program_id) {
    return NextResponse.json({ error: "target_anchor.job_id oder target_anchor.sales_program_id erforderlich" }, { status: 422 });
  }
  if (job_id && sales_program_id) {
    return NextResponse.json({ error: "Genau einer von job_id/sales_program_id, nicht beide" }, { status: 422 });
  }

  const supabase = createAdminClient();

  // 1. Source laden
  let src: SourceData;
  try {
    src = await loadSource(supabase, source);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 404 });
  }

  // 2. Target-Anchor validieren
  if (job_id) {
    const { data: job } = await supabase.from("jobs").select("id").eq("id", job_id).maybeSingle();
    if (!job) return NextResponse.json({ error: "Job nicht gefunden" }, { status: 404 });
  } else if (sales_program_id) {
    const { data: program } = await supabase.from("sales_programs").select("id").eq("id", sales_program_id).maybeSingle();
    if (!program) return NextResponse.json({ error: "Sales-Program nicht gefunden" }, { status: 404 });
  }

  // 3. Name + Slug bestimmen
  const nameForFunnel = (new_name ?? "").trim() || `${src.name} (Kopie)`;
  const baseSlug = (new_slug ?? "").trim() || slugify(nameForFunnel);
  const finalSlug = await findFreeSlug(supabase, baseSlug);

  // 4. Branding zusammenführen (Rebrand-Override gewinnt)
  const branding: Record<string, unknown> = { ...src.branding };
  if (rebrand?.primary_color) branding.primary_color = rebrand.primary_color;
  if (rebrand?.logo_url) branding.logo_url = rebrand.logo_url;

  // 5. INSERT funnels — Status zurück auf 'draft', views/submissions auf 0
  const { data: created, error: insErr } = await supabase
    .from("funnels")
    .insert([
      {
        job_id,
        sales_program_id,
        name: nameForFunnel,
        slug: finalSlug,
        intro_headline: src.intro_headline,
        intro_subtext: src.intro_subtext,
        consent_text: src.consent_text,
        thank_you_text: src.thank_you_text,
        branding,
        status: "draft",
        funnel_type: "internal",
      },
    ])
    .select("id")
    .single();
  if (insErr || !created) {
    return NextResponse.json(
      { error: insErr?.message ?? "Funnel-Insert fehlgeschlagen" },
      { status: 500 },
    );
  }
  const newFunnelId = created.id as string;

  // 6. INSERT funnel_pages — Bulk
  if (src.pages.length > 0) {
    const pagesPayload = src.pages.map((p) => ({
      funnel_id: newFunnelId,
      page_order: p.page_order,
      blocks: p.blocks,
      is_required: p.is_required,
      page_type: "intro" as const, // legacy enum, required NOT NULL — selber Wert wie editor save() nutzt
    }));
    const { error: pageErr } = await supabase.from("funnel_pages").insert(pagesPayload);
    if (pageErr) {
      // Rollback Funnel-Row falls Pages fehlschlagen
      await supabase.from("funnels").delete().eq("id", newFunnelId);
      return NextResponse.json({ error: `funnel_pages-Insert fehlgeschlagen: ${pageErr.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({
    funnel_id: newFunnelId,
    slug: finalSlug,
    edit_url: `/funnels/${newFunnelId}/editor`,
  });
}

// ─── Source-Loader ────────────────────────────────────────────────────────────

type AdminClient = ReturnType<typeof createAdminClient>;

async function loadSource(supabase: AdminClient, source: Source): Promise<SourceData> {
  if (source.type === "funnel") {
    const { data: f, error } = await supabase
      .from("funnels")
      .select("name, slug, intro_headline, intro_subtext, consent_text, thank_you_text, branding")
      .eq("id", source.funnel_id)
      .single();
    if (error || !f) throw new Error("Source-Funnel nicht gefunden");
    const { data: pagesRaw } = await supabase
      .from("funnel_pages")
      .select("page_order, blocks, is_required")
      .eq("funnel_id", source.funnel_id)
      .order("page_order");
    return {
      name: (f.name as string) ?? "Unbenannt",
      slug: (f.slug as string) ?? "",
      intro_headline: (f.intro_headline as string | null) ?? null,
      intro_subtext: (f.intro_subtext as string | null) ?? null,
      consent_text: (f.consent_text as string | null) ?? null,
      thank_you_text: (f.thank_you_text as string | null) ?? null,
      branding: ((f.branding as Record<string, unknown> | null) ?? {}),
      pages: ((pagesRaw ?? []) as Array<{ page_order: number; blocks: unknown; is_required: boolean | null }>).map((p) => ({
        page_order: p.page_order,
        blocks: p.blocks ?? [],
        is_required: p.is_required ?? true,
      })),
    };
  }
  // type === 'template'
  const { data: t, error } = await supabase
    .from("funnel_templates")
    .select("name, slug, intro_headline, intro_subtext, consent_text, default_branding, pages")
    .eq("id", source.template_id)
    .single();
  if (error || !t) throw new Error("Template nicht gefunden");
  const tplPages = Array.isArray(t.pages) ? (t.pages as Array<{ page_order: number; blocks: unknown; is_required?: boolean }>) : [];
  return {
    name: (t.name as string) ?? "Unbenannt",
    slug: (t.slug as string) ?? "",
    intro_headline: (t.intro_headline as string | null) ?? null,
    intro_subtext: (t.intro_subtext as string | null) ?? null,
    consent_text: (t.consent_text as string | null) ?? null,
    thank_you_text: null,
    branding: ((t.default_branding as Record<string, unknown> | null) ?? {}),
    pages: tplPages.map((p) => ({
      page_order: p.page_order,
      blocks: p.blocks ?? [],
      is_required: p.is_required ?? true,
    })),
  };
}

// ─── Slug-Collision-Handling ──────────────────────────────────────────────────

async function findFreeSlug(supabase: AdminClient, base: string): Promise<string> {
  const baseSlug = base || "funnel";
  const { data: existing } = await supabase.from("funnels").select("slug").like("slug", `${baseSlug}%`);
  const taken = new Set((existing ?? []).map((r: { slug: string }) => r.slug));
  if (!taken.has(baseSlug)) return baseSlug;
  for (let i = 1; i < 1000; i += 1) {
    const candidate = `${baseSlug}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  // extrem unwahrscheinlich, aber sauber: random suffix als letzter Ausweg
  return `${baseSlug}-${Date.now().toString(36)}`;
}
