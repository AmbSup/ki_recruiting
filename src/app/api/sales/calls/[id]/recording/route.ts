import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireReader } from "@/lib/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Audio-Streaming für Sales-Call-Recordings. Priorität:
//   1. Supabase Storage via Signed URL → 307-Redirect (voller Range-Support,
//      CDN-Streaming, kein Memory-Overhead im Vercel-Worker)
//   2. Vapi-Storage-URL (Fallback bei alten Calls, die noch nicht migriert sind)
//      → Proxy-Stream (Vapi unterstützt Range-Requests nicht immer direkt)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireReader();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: call } = await supabase
    .from("sales_calls")
    .select("recording_url, recording_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (!call) {
    return NextResponse.json({ error: "Call nicht gefunden" }, { status: 404 });
  }

  // ── 1. Supabase Storage via Signed URL ────────────────────────────────────
  if (call.recording_storage_path) {
    const { data, error } = await supabase.storage
      .from("sales-recordings")
      .createSignedUrl(call.recording_storage_path, 3600); // 1 Stunde gültig

    if (!error && data?.signedUrl) {
      return NextResponse.redirect(data.signedUrl, 307);
    }
    console.error("[recording proxy] signed URL failed:", error);
    // Fall through zum Vapi-Fallback
  }

  // ── 2. Vapi-Storage-Fallback ──────────────────────────────────────────────
  if (!call.recording_url) {
    return NextResponse.json({ error: "Keine Aufnahme verfügbar" }, { status: 404 });
  }

  const range = req.headers.get("range") ?? undefined;
  const upstream = await fetch(call.recording_url, {
    headers: range ? { range } : undefined,
    cache: "no-store",
  });

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json(
      { error: `Vapi storage returned ${upstream.status}` },
      { status: 502 },
    );
  }

  const headers = new Headers();
  const passThrough = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "last-modified",
    "etag",
  ];
  for (const h of passThrough) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  if (!headers.has("content-type")) headers.set("content-type", "audio/wav");
  if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
