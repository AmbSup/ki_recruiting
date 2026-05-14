import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireReader } from "@/lib/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Signed-URL-Proxy für den privaten cvs-Bucket. Auth → 1h-signed-URL → 307.
// Format: GET /api/cvs/<funnel-id>/<timestamp>.<ext>
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const auth = await requireReader();
  if (!auth.ok) return auth.response;

  const { path } = await params;
  if (!path || path.length === 0) {
    return NextResponse.json({ error: "Pfad fehlt" }, { status: 400 });
  }
  const storagePath = path.map((p) => decodeURIComponent(p)).join("/");

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from("cvs")
    .createSignedUrl(storagePath, 3600);

  if (error || !data?.signedUrl) {
    console.error("[cvs proxy] signed URL failed:", error);
    return NextResponse.json({ error: "CV nicht abrufbar" }, { status: 404 });
  }
  return NextResponse.redirect(data.signedUrl, 307);
}
