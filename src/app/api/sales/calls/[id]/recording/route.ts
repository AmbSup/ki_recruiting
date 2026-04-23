import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Audio-Streaming für Sales-Call-Recordings. Priorität:
//   1. Supabase Storage (sales-recordings/<path>) — gemirrort vom Claude-Analyzer
//   2. Vapi-Storage-URL (Fallback bei alten Calls, die noch nicht migriert sind)
// Same-Origin-Endpoint → Browser kann Range-Requests zuverlässig nutzen (seek/scrub).
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const range = req.headers.get("range") ?? undefined;

  // ── 1. Supabase Storage wenn verfügbar ────────────────────────────────────
  if (call.recording_storage_path) {
    const { data: blob, error } = await supabase.storage
      .from("sales-recordings")
      .download(call.recording_storage_path);

    if (!error && blob) {
      const buf = Buffer.from(await blob.arrayBuffer());
      const total = buf.byteLength;
      const contentType = (blob as Blob).type || "audio/wav";

      // Range-Request handhaben (Browser seekt/scrubbt über Range)
      if (range) {
        const match = /bytes=(\d+)-(\d*)/.exec(range);
        if (match) {
          const start = parseInt(match[1], 10);
          const end = match[2] ? parseInt(match[2], 10) : total - 1;
          const slice = buf.subarray(start, end + 1);
          return new Response(slice, {
            status: 206,
            headers: {
              "content-type": contentType,
              "content-length": String(slice.byteLength),
              "content-range": `bytes ${start}-${end}/${total}`,
              "accept-ranges": "bytes",
            },
          });
        }
      }

      return new Response(buf, {
        status: 200,
        headers: {
          "content-type": contentType,
          "content-length": String(total),
          "accept-ranges": "bytes",
        },
      });
    }
    console.error("[recording proxy] storage download failed:", error);
    // Fall through zum Vapi-Fallback
  }

  // ── 2. Vapi-Storage-Fallback ──────────────────────────────────────────────
  if (!call.recording_url) {
    return NextResponse.json({ error: "Keine Aufnahme verfügbar" }, { status: 404 });
  }

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
