import { NextRequest, NextResponse } from "next/server";
import { runCallAnalysis, TranscriptMessage } from "@/agents/call-analyzer";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

// Vapi-API-Response-Shape (relevante Felder). Hat optional `artifact.messages`
// (newer Vapi) und/oder `messages` (older). `transcript` ist der full-text.
type VapiCall = {
  id: string;
  status?: string;
  startedAt?: string;
  endedAt?: string;
  recordingUrl?: string;
  transcript?: string;
  summary?: string;
  messages?: Array<{ role?: string; message?: string }>;
  artifact?: {
    messages?: Array<{ role?: string; message?: string }>;
    recordingUrl?: string;
    transcript?: string;
  };
};

/**
 * Recovery-Endpoint: holt einen Vapi-Call per API + persistiert Transcript +
 * Analysis. Idempotent — falls eine voice_calls-Row mit derselben vapi_call_id
 * existiert, wird sie (cascade) gelöscht und neu angelegt. Keine Duplikate.
 *
 * Body: { vapi_call_id: string, application_id: string }
 * Auth: server-side admin-client; UI ruft mit operator-session auf, kein
 *       zusätzlicher Auth-Check hier (Endpoint ist nicht öffentlich verlinkt,
 *       aber sollte langfristig session-gegated sein — Backlog).
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "VAPI_API_KEY nicht gesetzt — bitte in Vercel-Env-Vars hinterlegen (siehe n8n-Credential 'Vapi API').",
      },
      { status: 500 },
    );
  }

  let body: { vapi_call_id?: string; application_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { vapi_call_id, application_id } = body;
  if (!vapi_call_id || !application_id) {
    return NextResponse.json({ error: "vapi_call_id + application_id erforderlich" }, { status: 422 });
  }

  // 1. Vapi-API: Call-Daten holen.
  const vapiRes = await fetch(`https://api.vapi.ai/call/${encodeURIComponent(vapi_call_id)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!vapiRes.ok) {
    const text = await vapiRes.text().catch(() => "");
    return NextResponse.json(
      { error: `Vapi-API ${vapiRes.status}: ${text.slice(0, 300)}` },
      { status: 502 },
    );
  }
  const call = (await vapiRes.json()) as VapiCall;

  // 2. Transcript + Messages extrahieren — Vapi hat zwei Shapes.
  const rawMessages = call.artifact?.messages ?? call.messages ?? [];
  const transcript_messages: TranscriptMessage[] = rawMessages
    .filter((m) => typeof m.message === "string" && m.role !== "system")
    .map((m) => ({
      role: m.role === "bot" || m.role === "assistant" ? "assistant" : "user",
      text: m.message ?? "",
    }));
  const transcript_text =
    call.artifact?.transcript ??
    call.transcript ??
    transcript_messages.map((m) => `${m.role}: ${m.text}`).join("\n");
  const recording_url = call.artifact?.recordingUrl ?? call.recordingUrl ?? null;

  if (!transcript_text && transcript_messages.length === 0) {
    return NextResponse.json(
      { error: "Vapi hat kein Transcript für diesen Call (leer oder noch nicht verarbeitet)" },
      { status: 422 },
    );
  }

  // 3. Existierende voice_calls-Row(s) mit derselben vapi_call_id löschen
  //    → CASCADE entfernt alte transcripts + call_analyses. Verhindert Dupes.
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("voice_calls")
    .select("id")
    .eq("vapi_call_id", vapi_call_id);
  const existingIds = (existing ?? []).map((r: { id: string }) => r.id);
  if (existingIds.length > 0) {
    await supabase.from("voice_calls").delete().in("id", existingIds);
  }

  // 4. Run analyzer — legt voice_calls + transcripts + call_analyses sauber an.
  const result = await runCallAnalysis({
    application_id,
    vapi_call_id,
    started_at: call.startedAt ?? null,
    ended_at: call.endedAt ?? null,
    recording_url,
    transcript_messages,
    transcript_text,
    summary: call.summary ?? null,
  });

  if (!result) {
    return NextResponse.json({ error: "Analyse-Run fehlgeschlagen" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    voice_call_id: result.voice_call_id,
    replaced_existing: existingIds.length,
    transcript_chars: transcript_text.length,
    message_count: transcript_messages.length,
  });
}
