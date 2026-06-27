import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriter } from "@/lib/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/showcase/feedback/[id] — Operator-Aktion zum Wegputzen
// eines einzelnen Feedback-Eintrags. Räumt Audio aus dem Bucket UND
// die DB-Row weg. Idempotent: 404 wenn die Row schon weg ist, sonst 200.

const BUCKET = "showcase-feedback";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("showcase_feedback")
    .select("audio_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  // Erst Audio-File weg, dann Row. Falls Storage-Delete fail't, loggen wir
  // und löschen die Row trotzdem — verwaiste Files sind erträglich, geisterhafte
  // Rows in der Operator-Liste sind nervig.
  if (row.audio_storage_path) {
    const { error: storageErr } = await supabase.storage
      .from(BUCKET)
      .remove([row.audio_storage_path]);
    if (storageErr) {
      console.error("[showcase/feedback DELETE] storage remove failed:", storageErr);
    }
  }

  const { error: delErr } = await supabase
    .from("showcase_feedback")
    .delete()
    .eq("id", id);
  if (delErr) {
    return NextResponse.json({ error: `DB-Delete fehlgeschlagen: ${delErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
