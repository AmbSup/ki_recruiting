import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { FunnelPlayer } from "./funnel-player";

export default async function FunnelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: funnel } = await supabase
    .from("funnels")
    .select("id, name, slug, status, funnel_type, external_url, branding, consent_text, job_id, views, job:jobs(title, company:companies(name))")
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

  return (
    <FunnelPlayer
      funnel={funnel as Parameters<typeof FunnelPlayer>[0]["funnel"]}
      pages={(pages ?? []) as Parameters<typeof FunnelPlayer>[0]["pages"]}
    />
  );
}
