import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriter } from "@/lib/auth/guards";
import { transcribeAudio } from "@/services/stt/whisper";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// POST /api/showcase/feedback/[id]/transcribe
//
// Operator-Aktion: lädt das Audio aus dem Bucket, schickt es zu Azure-
// Whisper, speichert das Transcript in showcase_feedback.transcript +
// transcript_at. Idempotent: wenn schon transkribiert, returnt direkt
// das gecachte transcript.

const BUCKET = "showcase-feedback";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const supabase = createAdminClient();

  const { data: row, error: rowErr } = await supabase
    .from("showcase_feedback")
    .select("audio_storage_path, transcript, transcript_at")
    .eq("id", id)
    .maybeSingle();

  if (rowErr || !row) {
    return NextResponse.json({ error: "Feedback nicht gefunden" }, { status: 404 });
  }

  if (!row.audio_storage_path) {
    return NextResponse.json({ error: "Audio nicht verfügbar" }, { status: 422 });
  }

  // Wenn schon transkribiert → cached zurückgeben, kein erneuter Whisper-Call.
  if (row.transcript) {
    return NextResponse.json({
      cached: true,
      transcript: row.transcript,
      transcript_at: row.transcript_at,
    });
  }

  // Audio aus dem Bucket laden
  const { data: blob, error: dlErr } = await supabase.storage
    .from(BUCKET)
    .download(row.audio_storage_path);
  if (dlErr || !blob) {
    return NextResponse.json(
      { error: `Audio konnte nicht geladen werden: ${dlErr?.message ?? "unknown"}` },
      { status: 500 },
    );
  }

  const buffer = Buffer.from(await blob.arrayBuffer());

  // Whisper-Call
  let transcribed: { text: string; language?: string; durationSeconds?: number };
  try {
    transcribed = await transcribeAudio({
      buffer,
      filename: row.audio_storage_path,
      // language undefined = auto-detect (Whisper kann DE+EN sauber)
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Transkription fehlgeschlagen";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  if (!transcribed.text) {
    return NextResponse.json(
      { error: "Whisper lieferte leeren Text — Audio möglicherweise zu kurz oder zu leise." },
      { status: 422 },
    );
  }

  const transcriptAt = new Date().toISOString();
  const { error: updErr } = await supabase
    .from("showcase_feedback")
    .update({ transcript: transcribed.text, transcript_at: transcriptAt })
    .eq("id", id);
  if (updErr) {
    return NextResponse.json({ error: `DB-Update fehlgeschlagen: ${updErr.message}` }, { status: 500 });
  }

  return NextResponse.json({
    cached: false,
    transcript: transcribed.text,
    transcript_at: transcriptAt,
    detected_language: transcribed.language,
    duration_seconds: transcribed.durationSeconds,
  });
}
