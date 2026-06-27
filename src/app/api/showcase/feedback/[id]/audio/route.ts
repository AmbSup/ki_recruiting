import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireReader } from "@/lib/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Audio-Proxy für Operator-Page. Erstellt eine signierte URL und macht
// 307-Redirect — Browser streamt direkt aus Supabase Storage. Auth via
// requireReader (admin/operator/viewer).

const BUCKET = "showcase-feedback";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireReader();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from("showcase_feedback")
    .select("audio_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (!row?.audio_storage_path) {
    return NextResponse.json({ error: "Audio nicht gefunden" }, { status: 404 });
  }

  const { data: signed, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.audio_storage_path, 3600);
  if (error || !signed) {
    return NextResponse.json({ error: "Signed URL fehlgeschlagen" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl, 307);
}
