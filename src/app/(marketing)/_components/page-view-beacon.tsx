"use client";

import { useEffect } from "react";

// Fire-and-forget Page-View-Event (1× pro Mount). Gleiches Muster wie
// funnel-player.tsx — Tracking-Fehler dürfen die Seite nicht blocken.
export function PageViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    void fetch("/api/pages/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page_slug: slug,
        utm: {
          source: params.get("utm_source"),
          medium: params.get("utm_medium"),
          campaign: params.get("utm_campaign"),
        },
        referrer: document.referrer || null,
      }),
    }).catch(() => { /* fire-and-forget */ });
  }, [slug]);

  return null;
}
