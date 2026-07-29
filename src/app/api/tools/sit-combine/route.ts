import { NextRequest, NextResponse } from "next/server";
import { completeLLM } from "@/services/llm/client";
import { SIT_TOOLS, type Lang } from "@/app/(marketing)/_lib/sit-tools-data";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Public, unauthenticated Endpoint für das Innovations-Werkzeuge-Tool.
// Nimmt die vom Nutzer bereits "übernommenen" Vorschläge über beliebig viele
// der 5 SIT-Werkzeuge und lässt eine KI kritisch prüfen, ob sie sich zu EINER
// kohärenten Gesamtlösung kombinieren lassen — bewusst KEIN Zwang zur
// Kombination: bei fehlender inhaltlicher Passung antwortet die KI ehrlich
// mit combinable:false statt eine künstliche Verbindung zu erfinden.

const MAX_PRODUCT_LEN = 160;
const MAX_PROBLEM_LEN = 300;
const MIN_PICKS = 2;
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

type CombineBody = {
  lang?: string;
  product?: string;
  problem?: string;
  answers?: Record<string, Record<string, string>>;
};

const COPY = {
  de: {
    intro: (product: string, problemLine: string) =>
      `Du bewertest kritisch, ob mehrere unabhängig entwickelte Innovations-Ideen zu unterschiedlichen Kreativitätsmethoden (Systematic Inventive Thinking) tatsächlich zu EINER kohärenten, wertvolleren Gesamtlösung kombinierbar sind — oder ob sie nur lose nebeneinander stehen.\n\nProdukt/Service: ${product}${problemLine}`,
    problemPrefix: "Problem/Ausgangslage",
    ideasIntro: "Ausgewählte Ideen (vom Nutzer übernommen):",
    task:
      'WICHTIG: Sei streng. Eine Kombination ist nur dann sinnvoll, wenn sich die Ideen inhaltlich ergänzen, sich nicht widersprechen, und zusammen ein stimmigeres, wertvolleres Gesamtbild ergeben als jede Einzelidee für sich. Erzwinge NIEMALS eine künstliche Verbindung nur weil mehrere Ideen vorliegen — wenn sie nicht wirklich zusammenpassen, sag das ehrlich.\n\nAntworte NUR mit einem validen JSON-Objekt:\n- Wenn kombinierbar: {"combinable": true, "title": "kurzer Name der Gesamtlösung", "summary": "3-5 Sätze, wie die Ideen zusammen eine Gesamtlösung ergeben", "synergy": "1-2 Sätze, warum das zusammen mehr wert ist als die Einzelteile"}\n- Wenn NICHT kombinierbar: {"combinable": false, "reason": "1-2 Sätze, warum die Ideen nicht sinnvoll zusammenpassen"}\nKein Markdown, keine Erklärung davor oder danach.',
  },
  en: {
    intro: (product: string, problemLine: string) =>
      `You critically assess whether several independently generated innovation ideas from different creativity methods (Systematic Inventive Thinking) actually combine into ONE coherent, more valuable overall solution — or whether they just sit loosely side by side.\n\nProduct/service: ${product}${problemLine}`,
    problemPrefix: "Problem/starting situation",
    ideasIntro: "Selected ideas (applied by the user):",
    task:
      'IMPORTANT: Be strict. A combination is only worthwhile if the ideas genuinely complement each other, don\'t contradict each other, and together form a more coherent, more valuable overall picture than any single idea alone. NEVER force an artificial connection just because multiple ideas exist — if they don\'t really fit together, say so honestly.\n\nRespond ONLY with a valid JSON object:\n- If combinable: {"combinable": true, "title": "short name for the overall solution", "summary": "3-5 sentences on how the ideas combine into an overall solution", "synergy": "1-2 sentences on why this is worth more combined than as separate parts"}\n- If NOT combinable: {"combinable": false, "reason": "1-2 sentences on why the ideas don\'t genuinely fit together"}\nNo markdown, no explanation before or after.',
  },
} as const;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: CombineBody;
  try {
    body = (await req.json()) as CombineBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const lang: Lang = body.lang === "en" ? "en" : "de";
  const product = (body.product ?? "").trim().slice(0, MAX_PRODUCT_LEN);
  if (!product) {
    return NextResponse.json({ error: "product_required" }, { status: 400 });
  }
  const problem = (body.problem ?? "").trim().slice(0, MAX_PROBLEM_LEN);

  const tools = SIT_TOOLS[lang];
  const answers = body.answers ?? {};

  const ideaBlocks: string[] = [];
  for (const tool of tools) {
    const values = answers[tool.id];
    if (!values) continue;
    const lines = tool.fields
      .map((f) => {
        const v = (values[f.key] ?? "").trim();
        return v ? `- ${f.label}: ${v}` : null;
      })
      .filter((l): l is string => l !== null);
    if (lines.length === 0) continue;
    ideaBlocks.push(`${tool.num} ${tool.name}:\n${lines.join("\n")}`);
  }

  if (ideaBlocks.length < MIN_PICKS) {
    return NextResponse.json({ error: "not_enough_picks" }, { status: 400 });
  }

  const copy = COPY[lang];
  const problemLine = problem ? `\n${copy.problemPrefix}: ${problem}` : "";
  const system = `${copy.intro(product, problemLine)}\n\n${copy.ideasIntro}\n\n${ideaBlocks.join("\n\n")}\n\n${copy.task}`;

  let text: string;
  try {
    text = await completeLLM({
      tier: "small",
      system,
      user: lang === "de" ? "Bewerte jetzt die Kombinierbarkeit." : "Now assess combinability.",
      maxTokens: 500,
      jsonMode: true,
    });
  } catch (e) {
    console.error("[sit-combine] LLM error:", e);
    return NextResponse.json({ error: "llm_error" }, { status: 502 });
  }

  try {
    const parsed = JSON.parse(text) as
      | { combinable: true; title?: string; summary?: string; synergy?: string }
      | { combinable: false; reason?: string };
    if (parsed.combinable) {
      return NextResponse.json({
        combinable: true,
        title: String(parsed.title ?? "").trim(),
        summary: String(parsed.summary ?? "").trim(),
        synergy: String(parsed.synergy ?? "").trim(),
      });
    }
    return NextResponse.json({
      combinable: false,
      reason: String(parsed.reason ?? "").trim(),
    });
  } catch (e) {
    console.error("[sit-combine] parse error:", e, text);
    return NextResponse.json({ error: "parse_error" }, { status: 502 });
  }
}
