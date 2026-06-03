import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vapi-Tool-Handler für get_current_time. Wird direkt vom Vapi-Bot
// aufgerufen (server.url in tool-definitions.ts zeigt auf diesen Pfad),
// NICHT über den n8n-Tools-Webhook — Time muss latenz-arm und ohne
// Workflow-Overhead antworten.
//
// Vapi-Tool-Call-Body:
//   { message: { type: "tool-calls", toolCalls: [{ id, function: {...} }] } }
// Vapi-Response-Shape:
//   { results: [{ toolCallId, result: "<string>" }] }

const TZ = "Europe/Vienna";

function formatHuman(now: Date): string {
  return new Intl.DateTimeFormat("de-AT", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now) + " (Wien-Zeit)";
}

function formatIso(now: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now).replace(" ", "T");
}

export async function POST(req: NextRequest) {
  let body: { message?: { toolCalls?: Array<{ id?: string }> } } = {};
  try {
    body = await req.json();
  } catch {
    // leerer Body ist tolerierbar — wir antworten trotzdem mit dem Zeit-String.
  }

  const now = new Date();
  const result = `Aktuelle Zeit: ${formatHuman(now)}. ISO: ${formatIso(now)}.`;

  const toolCalls = body.message?.toolCalls ?? [];
  const results = toolCalls.length > 0
    ? toolCalls.map((tc) => ({ toolCallId: tc.id ?? "", result }))
    : [{ toolCallId: "", result }];

  return NextResponse.json({ results });
}

// Sanity-Check via GET im Browser ohne Vapi-Envelope.
export async function GET() {
  const now = new Date();
  return NextResponse.json({
    human: formatHuman(now),
    iso: formatIso(now),
    timezone: TZ,
  });
}
