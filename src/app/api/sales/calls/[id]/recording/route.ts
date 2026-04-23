import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
// WAV-Recordings sind gross — keine Caching-Zeit kappen
export const dynamic = "force-dynamic";

// Proxy für Vapi-Recording-URLs. Vapi-Storage antwortet bei direkter Einbindung
// in <audio> teils ohne Range-Support → Browser kann nicht streamen. Über diesen
// Same-Origin-Endpoint bleibt Range intakt und wir haben konsistente Auth.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: call } = await supabase
    .from("sales_calls")
    .select("recording_url")
    .eq("id", id)
    .maybeSingle();

  if (!call?.recording_url) {
    return NextResponse.json({ error: "Recording nicht gefunden" }, { status: 404 });
  }

  const range = req.headers.get("range");
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
