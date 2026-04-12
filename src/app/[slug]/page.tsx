import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Script from "next/script";
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

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;

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
      {appId && (
        <Script id="fb-sdk" strategy="afterInteractive">{`
          window.fbAsyncInit = function() {
            FB.init({
              appId: '${appId}',
              autoLogAppEvents: true,
              xfbml: false,
              version: 'v21.0'
            });
          };
          (function(d,s,id){
            var js,fjs=d.getElementsByTagName(s)[0];
            if(d.getElementById(id))return;
            js=d.createElement(s);js.id=id;
            js.src="https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js,fjs);
          }(document,'script','facebook-jssdk'));
        `}</Script>
      )}
      <FunnelPlayer funnel={funnel as any} pages={(pages ?? []) as any} />
    </>
  );
}
