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
    .select("name, job:jobs(title, selected_ad_image_url, company:companies(name))")
    .eq("slug", slug)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  const job = Array.isArray(d?.job) ? d.job[0] : d?.job;
  const company = Array.isArray(job?.company) ? job.company[0] : job?.company;
  const title = job?.title ? `${job.title} — ${company?.name ?? ""}` : d?.name ?? "Bewerbung";
  const imageUrl = job?.selected_ad_image_url ?? undefined;

  return {
    title,
    description: `Jetzt bewerben: ${job?.title ?? d?.name ?? "Offene Stelle"}`,
    openGraph: {
      title,
      description: `Jetzt bewerben: ${job?.title ?? d?.name ?? "Offene Stelle"}`,
      ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function FunnelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: funnel } = await supabase
    .from("funnels")
    .select("id, name, slug, status, funnel_type, external_url, branding, consent_text, job_id, sales_program_id, views, job:jobs(title, selected_ad_image_url, company:companies(name))")
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <FunnelPlayer funnel={funnel as any} pages={(pages ?? []) as any} />
    </>
  );
}
