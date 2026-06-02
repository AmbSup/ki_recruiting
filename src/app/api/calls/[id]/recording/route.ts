import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireReader } from "@/lib/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Audio-Streaming für Recruiting-Call-Recordings.
// Pendant zu /api/sales/calls/[id]/recording, aber voice_calls hat (Stand 2026-06-02)
// keinen Supabase-Storage-Mirror — nur Vapi-Storage. Wenn der ?download=1 Query-
// Parameter gesetzt ist, wird Content-Disposition: attachment gesendet, sonst
// inline (für <audio>-Element).
//
// Vapi-Retention ist plan-bound (30-90 Tage), daher TODO: gleicher Storage-Mirror
// wie bei Sales aufsetzen, damit alte Recordings nicht verloren gehen.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireReader();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: call } = await supabase
    .from("voice_calls")
    .select("recording_url, recording_storage_path, application_id")
    .eq("id", id)
    .maybeSingle();

  if (!call) {
    return NextResponse.json({ error: "Call nicht gefunden" }, { status: 404 });
  }

  const download = req.nextUrl.searchParams.get("download") === "1";

  // ── 1. Supabase Storage via Signed URL (priorisiert, übersteht Vapi-Retention) ──
  if (call.recording_storage_path) {
    const { data, error } = await supabase.storage
      .from("recruiting-recordings")
      .createSignedUrl(call.recording_storage_path, 3600, download ? {
        download: `recruiting-call-${id}.${call.recording_storage_path.split(".").pop() ?? "wav"}`,
      } : undefined);

    if (!error && data?.signedUrl) {
      return NextResponse.redirect(data.signedUrl, 307);
    }
    console.error("[recording proxy] signed URL failed:", error);
    // Fall through zum Vapi-Fallback
  }

  // ── 2. Vapi-Storage-Fallback (für Pre-Mirror-Calls + wenn Storage failt) ──
  if (!call.recording_url) {
    return NextResponse.json({ error: "Keine Aufnahme verfügbar" }, { status: 404 });
  }

  // Range-Forward für korrektes Audio-Element-Streaming
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

  if (download) {
    const ct = headers.get("content-type") ?? "audio/wav";
    const ext = ct.includes("mpeg") ? "mp3" : ct.includes("ogg") ? "ogg" : ct.includes("mp4") ? "m4a" : "wav";
    const filename = `recruiting-call-${id}.${ext}`;
    headers.set("content-disposition", `attachment; filename="${filename}"`);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
