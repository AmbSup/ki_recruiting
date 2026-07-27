import { NextRequest, NextResponse } from "next/server";
import { completeLLM } from "@/services/llm/client";
import { SIT_TOOLS, type Lang } from "@/app/(marketing)/_lib/sit-tools-data";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Public, unauthenticated Endpoint für das Innovations-Werkzeuge-Tool
// (/innovations-werkzeuge). Nimmt Produkt + optionalen Kontext, lässt
// Claude 3 konkrete Anwendungen der jeweiligen SIT-Methode generieren
// (inkl. Begründung, warum das wertvoll sein könnte).
//
// Kein Login vorhanden (Marketing-Tool) → kein DB-Rate-Limit wie bei
// /api/showcase/feedback (bräuchte eine neue Tabelle). Stattdessen:
// harte Input-Caps (Produkt/Kontext-Länge, Anzahl Kontext-Felder) und ein
// knappes maxTokens-Budget, die den Worst-Case-Cost pro Call begrenzen,
// plus ein simpler In-Memory-Sliding-Window-Limiter pro IP-Hash (best
// effort — überlebt keinen Cold-Start/Multi-Instance, aber bremst
// naive Scripted-Abuse-Versuche ab).

const MAX_PRODUCT_LEN = 160;
const MAX_CONTEXT_VALUE_LEN = 300;
const MAX_CONTEXT_FIELDS = 6;
const SUGGESTION_COUNT = 3;
const RATE_LIMIT_PER_HOUR = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

const hits = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const first = xff.split(",")[0]?.trim();
  if (first) return first;
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT_PER_HOUR;
}

type SuggestBody = {
  lang?: string;
  toolId?: string;
  product?: string;
  context?: Record<string, string>;
};

const COPY = {
  de: {
    intro: (name: string, def: string, example: string) =>
      `Du hilfst dabei, die Kreativitätsmethode "${name}" (Systematic Inventive Thinking) auf ein konkretes Produkt anzuwenden.\n\nMethode: ${def}\nBekanntes Beispiel: ${example}`,
    task: (product: string, contextLines: string) =>
      `Produkt/Service: ${product}${contextLines ? `\n${contextLines}` : ""}\n\nGeneriere genau ${SUGGESTION_COUNT} konkrete, unterschiedliche Anwendungen dieser Methode auf dieses Produkt. Sei spezifisch und ungewöhnlich, keine generischen Plattitüden. Jeder Vorschlag braucht zusätzlich eine kurze Begründung, warum das für Nutzer oder das Geschäft wertvoll sein könnte.`,
    jsonNote:
      'Antworte NUR mit einem validen JSON-Objekt der Form {"suggestions": [...]}, kein Markdown, keine Erklärung davor oder danach.',
    schemaIntro: (fieldSchema: string) => `Jedes Objekt im Suggestions-Array braucht genau diese Felder (${fieldSchema}):`,
  },
  en: {
    intro: (name: string, def: string, example: string) =>
      `You help apply the creativity method "${name}" (Systematic Inventive Thinking) to a concrete product.\n\nMethod: ${def}\nKnown example: ${example}`,
    task: (product: string, contextLines: string) =>
      `Product/service: ${product}${contextLines ? `\n${contextLines}` : ""}\n\nGenerate exactly ${SUGGESTION_COUNT} concrete, distinct applications of this method to this product. Be specific and unexpected, no generic platitudes. Each suggestion also needs a short rationale for why it could be valuable to users or the business.`,
    jsonNote:
      'Respond ONLY with a valid JSON object of the shape {"suggestions": [...]}, no markdown, no explanation before or after.',
    schemaIntro: (fieldSchema: string) => `Each object in the suggestions array needs exactly these fields (${fieldSchema}):`,
  },
} as const;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: SuggestBody;
  try {
    body = (await req.json()) as SuggestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const lang: Lang = body.lang === "en" ? "en" : "de";
  const tool = SIT_TOOLS[lang].find((t) => t.id === body.toolId);
  if (!tool) {
    return NextResponse.json({ error: "unknown_tool" }, { status: 400 });
  }

  const product = (body.product ?? "").trim().slice(0, MAX_PRODUCT_LEN);
  if (!product) {
    return NextResponse.json({ error: "product_required" }, { status: 400 });
  }

  const outputFields = tool.fields.filter((f) => f.key !== "product");
  const outputKeys = new Set(outputFields.map((f) => f.key));
  // Nur Felder, die die KI NICHT selbst generieren soll (z.B. "core" bei
  // Subtraktion), zählen als Kontext — sonst würde ein schon halb
  // ausgefülltes Output-Feld sich selbst als Vorgabe zurückspiegeln.
  const contextEntries = Object.entries(body.context ?? {})
    .filter(([key]) => !outputKeys.has(key))
    .slice(0, MAX_CONTEXT_FIELDS)
    .map(([key, value]) => {
      const field = tool.fields.find((f) => f.key === key);
      const label = field?.label ?? key;
      const v = String(value ?? "").trim().slice(0, MAX_CONTEXT_VALUE_LEN);
      return v ? `${label}: ${v}` : null;
    })
    .filter((line): line is string => Boolean(line));

  const copy = COPY[lang];
  const exampleText = `${tool.example.name} — ${tool.example.rows.map(([k, v]) => `${k}: ${v}`).join("; ")}`;
  const fieldSchema = [...outputFields.map((f) => `"${f.key}"`), '"why"'].join(", ");
  const fieldDescriptions = outputFields
    .map((f) => `- "${f.key}": ${f.label}`)
    .concat([`- "why": ${lang === "de" ? "1-2 Sätze, warum das wertvoll sein könnte" : "1-2 sentences on why this could be valuable"}`])
    .join("\n");

  const system = `${copy.intro(tool.name, tool.def, exampleText)}\n\n${copy.schemaIntro(fieldSchema)}\n${fieldDescriptions}\n\n${copy.jsonNote}`;
  const user = copy.task(product, contextEntries.join("\n"));

  let text: string;
  try {
    text = await completeLLM({
      tier: "small",
      system,
      user,
      maxTokens: 700,
      jsonMode: true,
    });
  } catch (e) {
    console.error("[sit-suggest] LLM error:", e);
    return NextResponse.json({ error: "llm_error" }, { status: 502 });
  }

  let suggestions: Record<string, string>[];
  try {
    const parsed: unknown = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed : (parsed as { suggestions?: unknown })?.suggestions;
    if (!Array.isArray(arr)) throw new Error("not_an_array");
    suggestions = arr.slice(0, SUGGESTION_COUNT).map((item) => {
      const record = (item ?? {}) as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const f of outputFields) out[f.key] = String(record[f.key] ?? "").trim();
      out.why = String(record.why ?? "").trim();
      return out;
    });
  } catch (e) {
    console.error("[sit-suggest] parse error:", e, text);
    return NextResponse.json({ error: "parse_error" }, { status: 502 });
  }

  return NextResponse.json({ suggestions });
}
