import { NextRequest, NextResponse } from "next/server";
import { completeLLM } from "@/services/llm/client";
import { SIT_TOOLS, type Lang } from "@/app/(marketing)/_lib/sit-tools-data";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Public, unauthenticated Endpoint für das Innovations-Werkzeuge-Tool
// (/innovations-werkzeuge). Produkt + Komponenten werden EINMAL oben auf
// der Seite eingegeben und für alle 5 Werkzeuge als Kontext mitgeschickt —
// jeder Tool-Call generiert nur noch seine eigenen Output-Felder (removed/
// effect, line/reorg, ...), alles davon ist KI-Output.
//
// Kein Login vorhanden (Marketing-Tool) → kein DB-Rate-Limit wie bei
// /api/showcase/feedback (bräuchte eine neue Tabelle). Stattdessen: harte
// Input-Caps (Produkt-/Komponenten-Länge) und ein knappes maxTokens-Budget,
// die den Worst-Case-Cost pro Call begrenzen, plus ein simpler In-Memory-
// Sliding-Window-Limiter pro IP (best effort — überlebt keinen Cold-Start/
// Multi-Instance, aber bremst naive Scripted-Abuse-Versuche ab).

const MAX_PRODUCT_LEN = 160;
const MAX_COMPONENTS_LEN = 500;
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
  components?: string;
};

const COPY = {
  de: {
    intro: (name: string, def: string, example: string) =>
      `Du hilfst dabei, die Kreativitätsmethode "${name}" (Systematic Inventive Thinking) auf ein konkretes Produkt anzuwenden.\n\nMethode: ${def}\nBekanntes Beispiel: ${example}`,
    task: (product: string, componentsLine: string) =>
      `Produkt/Service: ${product}${componentsLine}\n\nGeneriere genau ${SUGGESTION_COUNT} konkrete, unterschiedliche Anwendungen dieser Methode auf dieses Produkt. Sei spezifisch und ungewöhnlich, keine generischen Plattitüden. Jeder Vorschlag braucht zusätzlich eine kurze Begründung, warum das für Nutzer oder das Geschäft wertvoll sein könnte.`,
    componentsPrefix: "Vorhandene Komponenten",
    jsonNote:
      'Antworte NUR mit einem validen JSON-Objekt der Form {"suggestions": [...]}, kein Markdown, keine Erklärung davor oder danach.',
    schemaIntro: (fieldSchema: string) => `Jedes Objekt im Suggestions-Array braucht genau diese Felder (${fieldSchema}):`,
    groundingNote:
      "Halte dich STRIKT an die oben angegebene Komponentenliste. Erfinde keine Komponenten, Teile oder Details, die dort nicht genannt sind — wähle unter den genannten aus.",
    pitfallPrefix: "Häufiger Fallstrick, den du unbedingt vermeiden musst",
  },
  en: {
    intro: (name: string, def: string, example: string) =>
      `You help apply the creativity method "${name}" (Systematic Inventive Thinking) to a concrete product.\n\nMethod: ${def}\nKnown example: ${example}`,
    task: (product: string, componentsLine: string) =>
      `Product/service: ${product}${componentsLine}\n\nGenerate exactly ${SUGGESTION_COUNT} concrete, distinct applications of this method to this product. Be specific and unexpected, no generic platitudes. Each suggestion also needs a short rationale for why it could be valuable to users or the business.`,
    componentsPrefix: "Existing components",
    jsonNote:
      'Respond ONLY with a valid JSON object of the shape {"suggestions": [...]}, no markdown, no explanation before or after.',
    schemaIntro: (fieldSchema: string) => `Each object in the suggestions array needs exactly these fields (${fieldSchema}):`,
    groundingNote:
      "Stick STRICTLY to the components list given above. Do not invent components, parts, or details that aren't mentioned there — choose among the ones given.",
    pitfallPrefix: "Common pitfall you must avoid",
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
  const components = (body.components ?? "").trim().slice(0, MAX_COMPONENTS_LEN);

  const copy = COPY[lang];
  const exampleText = `${tool.example.name} — ${tool.example.rows.map(([k, v]) => `${k}: ${v}`).join("; ")}`;
  const fieldSchema = [...tool.fields.map((f) => `"${f.key}"`), '"why"'].join(", ");
  const fieldDescriptions = tool.fields
    .map((f) => `- "${f.key}": ${f.label}`)
    .concat([`- "why": ${lang === "de" ? "1-2 Sätze, warum das wertvoll sein könnte" : "1-2 sentences on why this could be valuable"}`])
    .join("\n");

  const groundingLine = components ? `\n\n${copy.groundingNote}` : "";
  const pitfallLine = `\n\n${copy.pitfallPrefix}: ${tool.pitfall}`;
  const system = `${copy.intro(tool.name, tool.def, exampleText)}${pitfallLine}\n\n${copy.schemaIntro(fieldSchema)}\n${fieldDescriptions}${groundingLine}\n\n${copy.jsonNote}`;
  const componentsLine = components ? `\n${copy.componentsPrefix}: ${components}` : "";
  const user = copy.task(product, componentsLine);

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
      for (const f of tool.fields) out[f.key] = String(record[f.key] ?? "").trim();
      out.why = String(record.why ?? "").trim();
      return out;
    });
  } catch (e) {
    console.error("[sit-suggest] parse error:", e, text);
    return NextResponse.json({ error: "parse_error" }, { status: 502 });
  }

  return NextResponse.json({ suggestions });
}
