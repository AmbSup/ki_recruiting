import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import Script from "next/script";
import { FunnelPlayer } from "./funnel-player";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("funnels")
    .select(
      "id, name, language, intro_headline, intro_subtext, job_id, sales_program_id, job:jobs(title, selected_ad_image_url, company:companies(name)), sales_program:sales_programs(name, product_pitch, value_proposition, company:companies(name))",
    )
    .eq("slug", slug)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  const job = Array.isArray(d?.job) ? d.job[0] : d?.job;
  const company = Array.isArray(job?.company) ? job.company[0] : job?.company;
  const salesProgram = Array.isArray(d?.sales_program) ? d.sales_program[0] : d?.sales_program;
  const salesCompany = Array.isArray(salesProgram?.company) ? salesProgram.company[0] : salesProgram?.company;
  const isSales = Boolean(d?.sales_program_id);
  const lang = (d?.language ?? "de").toLowerCase();

  // Title: Recruiting → "Job-Titel — Firma" / Sales → "Funnel-Name — Firma"
  const title = isSales
    ? `${d?.name ?? "Special-Aktion"}${salesCompany?.name ? ` — ${salesCompany.name}` : ""}`
    : job?.title
      ? `${job.title} — ${company?.name ?? ""}`
      : d?.name ?? "Bewerbung";

  // Description: Sales sollte NICHT "Jetzt bewerben" sagen. Wir nutzen den
  // operator-pflegbaren intro_subtext oder fallen auf den Funnel-Pitch.
  const description = isSales
    ? (d?.intro_subtext?.trim() ||
        salesProgram?.product_pitch?.trim() ||
        salesProgram?.value_proposition?.trim() ||
        (lang === "en"
          ? `Discover now: ${d?.name ?? "Special offer"}`
          : `Jetzt entdecken: ${d?.name ?? "Special-Aktion"}`))
    : `Jetzt bewerben: ${job?.title ?? d?.name ?? "Offene Stelle"}`;

  // Image: Recruiting nimmt job.selected_ad_image_url, Sales muss aus dem
  // ersten Hero-image-Block der funnel_pages holen. "Hero" = ohne
  // img_width-Einschränkung ODER img_width ≥ 50%. Damit überspringen wir
  // kleine Logo-Blocks (z.B. img_width: "30%") und landen beim ersten echten
  // Banner-Bild.
  let imageUrl: string | undefined = job?.selected_ad_image_url ?? undefined;
  if (isSales && d?.id) {
    const { data: pages } = await supabase
      .from("funnel_pages")
      .select("blocks")
      .eq("funnel_id", d.id)
      .order("page_order")
      .limit(3);
    for (const page of (pages ?? []) as Array<{ blocks?: unknown }>) {
      const blocks = Array.isArray(page.blocks) ? (page.blocks as Array<{ type?: string; content?: Record<string, unknown> }>) : [];
      const imgBlock = blocks.find(isHeroImageBlock);
      if (imgBlock) {
        imageUrl = imgBlock.content!.url as string;
        break;
      }
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

// Erkennt Hero-image-Blocks aus funnel_pages.blocks für OG-Image-Auswahl.
// Skipped:
//   - Nicht-image-Typen
//   - image-Blocks ohne content.url
//   - image-Blocks mit img_width < 50% (typischerweise Logos/Inline-Icons)
// img_width Format aus Operator-UI: "30%", "60%", "70%" o.ä.
function isHeroImageBlock(block: { type?: string; content?: Record<string, unknown> }): boolean {
  if (block.type !== "image") return false;
  if (typeof block.content?.url !== "string") return false;
  const w = block.content.img_width;
  if (typeof w === "string") {
    const num = parseInt(w, 10);
    if (!isNaN(num) && num < 50) return false;
  } else if (typeof w === "number" && w < 50) {
    return false;
  }
  return true;
}

export default async function FunnelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: funnel } = await supabase
    .from("funnels")
    .select("id, name, slug, status, funnel_type, external_url, branding, consent_text, thank_you_text, language, job_id, sales_program_id, views, job:jobs(title, selected_ad_image_url, company:companies(name))")
    .eq("slug", slug)
    .single();

  if (!funnel) notFound();

  // External funnels redirect directly
  if (funnel.funnel_type === "external" && funnel.external_url) {
    redirect(funnel.external_url);
  }

  // Only active funnels are publicly accessible
  if (funnel.status !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Dieser Funnel ist noch nicht verfügbar</h1>
          <p className="text-sm text-gray-500">Bitte versuche es später erneut.</p>
        </div>
      </div>
    );
  }

  const { data: pages } = await supabase
    .from("funnel_pages")
    .select("*")
    .eq("funnel_id", funnel.id)
    .order("page_order");

  // Track view (best-effort, ignore errors)
  try {
    await supabase.from("funnels").update({ views: (funnel.views ?? 0) + 1 }).eq("id", funnel.id);
  } catch { /* ignore */ }

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {pixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}</Script>
      )}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <FunnelPlayer funnel={funnel as any} pages={(pages ?? []) as any} />
    </>
  );
}
