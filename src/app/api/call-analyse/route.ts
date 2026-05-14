import { NextRequest, NextResponse } from "next/server";
import { runCallAnalysis, TranscriptMessage } from "@/agents/call-analyzer";
import { verifyN8nSecret } from "@/lib/auth/guards";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = verifyN8nSecret(req);
  if (!auth.ok) return auth.response;
  let body: {
    application_id?: string;
    vapi_call_id?: string | null;
    started_at?: string | null;
    ended_at?: string | null;
    recording_url?: string | null;
    transcript_messages?: TranscriptMessage[];
    transcript_text?: string;
    summary?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.application_id) {
    return NextResponse.json({ error: "application_id fehlt" }, { status: 422 });
  }

  const result = await runCallAnalysis({
    application_id: body.application_id,
    vapi_call_id: body.vapi_call_id ?? null,
    started_at: body.started_at ?? null,
    ended_at: body.ended_at ?? null,
    recording_url: body.recording_url ?? null,
    transcript_messages: body.transcript_messages ?? [],
    transcript_text: body.transcript_text ?? "",
    summary: body.summary ?? null,
  });

  if (!result) {
    return NextResponse.json({ error: "Analyse fehlgeschlagen" }, { status: 500 });
  }

  return NextResponse.json({ success: true, voice_call_id: result.voice_call_id }, { status: 201 });
}
