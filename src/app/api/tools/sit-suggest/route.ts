import { NextRequest, NextResponse } from "next/server";
import { completeLLM } from "@/services/llm/client";
import { SIT_TOOLS, type Lang } from "@/app/(marketing)/_lib/sit-tools-data";

export const runtime = "nodejs";
// Zwei sequentielle LLM-Calls (Draft + Review) statt einem — 30s reichte im
// Worst Case (langsamer Azure-Call + Cold Start) knapp nicht.
export const maxDuration = 45;
export const dynamic = "force-dynamic";

// Public, unauthenticated Endpoint für das Innovations-Werkzeuge-Tool
// (/innovations-werkzeuge). Produkt + Problem/Ausgangslage + interne/externe
// Komponenten werden EINMAL oben auf der Seite eingegeben und für alle 5
// Werkzeuge als Kontext mitgeschickt — jeder Tool-Call generiert nur noch
// seine eigenen Output-Felder (removed/effect, line/reorg, ...), alles
// davon ist KI-Output.
//
// Kein Login vorhanden (Marketing-Tool) → kein DB-Rate-Limit wie bei
// /api/showcase/feedback (bräuchte eine neue Tabelle). Stattdessen: harte
// Input-Caps (Produkt-/Komponenten-Länge) und ein knappes maxTokens-Budget,
// die den Worst-Case-Cost pro Call begrenzen, plus ein simpler In-Memory-
// Sliding-Window-Limiter pro IP (best effort — überlebt keinen Cold-Start/
// Multi-Instance, aber bremst naive Scripted-Abuse-Versuche ab).

const MAX_PRODUCT_LEN = 160;
const MAX_PROBLEM_LEN = 300;
const MAX_COMPONENTS_LEN = 300;
// Erst mehr Kandidaten entwerfen als am Ende gezeigt werden, dann in einem
// zweiten LLM-Call kritisch nach Mehrwert filtern (DRAFT_COUNT -> SUGGESTION_COUNT).
// Reiner Prompt-Trick ("denk erst nach") reicht bei einem kleinen/schnellen
// Modell im JSON-Mode nicht zuverlässig — das Modell hat keinen sichtbaren
// Scratchpad-Raum, wenn die Antwort strikt nur das finale JSON sein darf.
const DRAFT_COUNT = 7;
const SUGGESTION_COUNT = 5;
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
  problem?: string;
  internalComponents?: string;
  externalComponents?: string;
};

const COPY = {
  de: {
    intro: (name: string, def: string, example: string) =>
      `Du hilfst dabei, die Kreativitätsmethode "${name}" (Systematic Inventive Thinking) auf ein konkretes Produkt anzuwenden.\n\nMethode: ${def}\nBekanntes Beispiel: ${example}`,
    draftTask: (product: string, contextLines: string) =>
      `Produkt/Service: ${product}${contextLines}\n\nGeneriere genau ${DRAFT_COUNT} konkrete, unterschiedliche Anwendungen dieser Methode auf dieses Produkt. Sei konkret und spezifisch — vage Plattitüden ohne echten Mechanismus zählen nicht. WICHTIG: Das schließt ausdrücklich die naheliegendste, direkteste Anwendung der Methode auf das genannte Problem mit ein, solange sie konkret beschrieben ist — naheliegend ist NICHT dasselbe wie generisch, und die einfachste Lösung ist oft die richtige. Erfinde nicht künstlich Umwege, nur um "originell" zu wirken. Jeder Vorschlag braucht zusätzlich eine kurze Begründung, warum das für Nutzer oder das Geschäft wertvoll sein könnte.`,
    problemPrefix: "Problem/Ausgangslage",
    internalComponentsPrefix: "Interne Komponenten",
    externalComponentsPrefix: "Externe Komponenten (Closed World)",
    jsonNote:
      'Antworte NUR mit einem validen JSON-Objekt der Form {"suggestions": [...]}, kein Markdown, keine Erklärung davor oder danach.',
    schemaIntro: (fieldSchema: string) => `Jedes Objekt im Suggestions-Array braucht genau diese Felder (${fieldSchema}):`,
    groundingNote:
      "Halte dich STRIKT an die oben angegebenen Komponentenlisten (intern UND extern). Erfinde keine Komponenten, Teile oder Details, die dort nicht genannt sind — wähle unter den genannten aus.",
    pitfallPrefix: "Häufiger Fallstrick, den du unbedingt vermeiden musst",
    fewShotIntro:
      "Zwei echte Fälle, wie diese Methode in der Praxis tatsächlich angewendet wurde (Ausgangslage → SIT-Eingriff → tatsächliche Lösung). Nutze sie NICHT als Vorlage zum Kopieren, sondern als Referenz dafür, wie konkret und spezifisch eine gute Lösung sein muss:",
    reviewIntro: (name: string) =>
      `Du bist jetzt ein kritischer Prüfer für ${DRAFT_COUNT} Kandidaten-Vorschläge zur Methode "${name}". Die Kandidaten stehen unten als JSON.`,
    reviewTask:
      `Bewerte jeden Kandidaten kritisch nach 3 Kriterien: (1) Verletzt er den oben genannten Fallstrick? (2) Ist er vage und unspezifisch, OHNE einen konkreten Mechanismus zu nennen (das ist eine Plattitüde)? ACHTUNG: Die naheliegendste/offensichtlichste Anwendung der Methode ist NICHT automatisch eine Plattitüde — verwirf einen Kandidaten niemals nur, weil er naheliegend wirkt; entscheidend ist allein, ob er konkret und spezifisch ist. (3) Ist er inhaltlich zu ähnlich zu einem anderen, bereits gewählten Kandidaten? Wähle die ${SUGGESTION_COUNT} STÄRKSTEN und UNTERSCHIEDLICHSTEN Kandidaten aus. Gib die gewählten Kandidaten UNVERÄNDERT zurück (exakt derselbe Text in jedem Feld wie im Original-Kandidaten, nichts umschreiben oder neu erfinden) — wähle nur aus, generiere nichts Neues.`,
    candidatesLabel: "Kandidaten",
  },
  en: {
    intro: (name: string, def: string, example: string) =>
      `You help apply the creativity method "${name}" (Systematic Inventive Thinking) to a concrete product.\n\nMethod: ${def}\nKnown example: ${example}`,
    draftTask: (product: string, contextLines: string) =>
      `Product/service: ${product}${contextLines}\n\nGenerate exactly ${DRAFT_COUNT} concrete, distinct applications of this method to this product. Be concrete and specific — vague platitudes with no real mechanism don't count. IMPORTANT: this explicitly includes the most obvious, most direct application of the method to the stated problem, as long as it's described concretely — obvious is NOT the same as generic, and the simplest solution is often the right one. Don't invent artificial detours just to seem "original". Each suggestion also needs a short rationale for why it could be valuable to users or the business.`,
    problemPrefix: "Problem/starting situation",
    internalComponentsPrefix: "Internal components",
    externalComponentsPrefix: "External components (Closed World)",
    jsonNote:
      'Respond ONLY with a valid JSON object of the shape {"suggestions": [...]}, no markdown, no explanation before or after.',
    schemaIntro: (fieldSchema: string) => `Each object in the suggestions array needs exactly these fields (${fieldSchema}):`,
    groundingNote:
      "Stick STRICTLY to the components lists given above (internal AND external). Do not invent components, parts, or details that aren't mentioned there — choose among the ones given.",
    pitfallPrefix: "Common pitfall you must avoid",
    fewShotIntro:
      "Two real cases showing how this method was actually applied in practice (situation → SIT move → actual solution). Do NOT use them as a template to copy — use them as a reference for how concrete and specific a good solution needs to be:",
    reviewIntro: (name: string) =>
      `You are now a critical reviewer for ${DRAFT_COUNT} candidate suggestions for the method "${name}". The candidates are listed below as JSON.`,
    reviewTask:
      `Critically evaluate each candidate against 3 criteria: (1) Does it violate the pitfall named above? (2) Is it vague and unspecific, with NO concrete mechanism named (that's a platitude)? WARNING: the most obvious/direct application of the method is NOT automatically a platitude — never discard a candidate just because it seems obvious; what matters is only whether it's concrete and specific. (3) Is it too similar in substance to another candidate you've already picked? Select the ${SUGGESTION_COUNT} STRONGEST and MOST DISTINCT candidates. Return the chosen candidates UNCHANGED (exact same text in every field as in the original candidate, don't rewrite or invent anything new) — only select, don't generate anything new.`,
    candidatesLabel: "Candidates",
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
  const problem = (body.problem ?? "").trim().slice(0, MAX_PROBLEM_LEN);
  const internalComponents = (body.internalComponents ?? "").trim().slice(0, MAX_COMPONENTS_LEN);
  const externalComponents = (body.externalComponents ?? "").trim().slice(0, MAX_COMPONENTS_LEN);
  const hasComponents = Boolean(internalComponents || externalComponents);

  const copy = COPY[lang];
  const exampleText = `${tool.example.name} — ${tool.example.rows.map(([k, v]) => `${k}: ${v}`).join("; ")}`;
  const fieldSchema = [...tool.fields.map((f) => `"${f.key}"`), '"why"'].join(", ");
  const fieldDescriptions = tool.fields
    .map((f) => `- "${f.key}": ${f.label}`)
    .concat([`- "why": ${lang === "de" ? "1-2 Sätze, warum das wertvoll sein könnte" : "1-2 sentences on why this could be valuable"}`])
    .join("\n");

  const groundingLine = hasComponents ? `\n\n${copy.groundingNote}` : "";
  const pitfallLine = `\n\n${copy.pitfallPrefix}: ${tool.pitfall}`;
  const fewShotLine = tool.fewShotExamples.length
    ? `\n\n${copy.fewShotIntro}\n\n${tool.fewShotExamples.join("\n\n---\n\n")}`
    : "";
  const schemaBlock = `${copy.schemaIntro(fieldSchema)}\n${fieldDescriptions}`;
  const draftSystem = `${copy.intro(tool.name, tool.def, exampleText)}${pitfallLine}${fewShotLine}\n\n${schemaBlock}${groundingLine}\n\n${copy.jsonNote}`;
  const problemLine = problem ? `\n${copy.problemPrefix}: ${problem}` : "";
  const internalLine = internalComponents ? `\n${copy.internalComponentsPrefix}: ${internalComponents}` : "";
  const externalLine = externalComponents ? `\n${copy.externalComponentsPrefix}: ${externalComponents}` : "";
  const draftUser = copy.draftTask(product, `${problemLine}${internalLine}${externalLine}`);

  const toolFields = tool.fields;
  function parseSuggestions(text: string, limit: number): Record<string, string>[] {
    const parsed: unknown = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed : (parsed as { suggestions?: unknown })?.suggestions;
    if (!Array.isArray(arr)) throw new Error("not_an_array");
    return arr.slice(0, limit).map((item) => {
      const record = (item ?? {}) as Record<string, unknown>;
      const out: Record<string, string> = {};
      for (const f of toolFields) out[f.key] = String(record[f.key] ?? "").trim();
      out.why = String(record.why ?? "").trim();
      return out;
    });
  }

  let draftText: string;
  try {
    draftText = await completeLLM({
      tier: "small",
      system: draftSystem,
      user: draftUser,
      maxTokens: 1700,
      jsonMode: true,
    });
  } catch (e) {
    console.error("[sit-suggest] draft LLM error:", e);
    return NextResponse.json({ error: "llm_error" }, { status: 502 });
  }

  let drafts: Record<string, string>[];
  try {
    drafts = parseSuggestions(draftText, DRAFT_COUNT);
  } catch (e) {
    console.error("[sit-suggest] draft parse error:", e, draftText);
    return NextResponse.json({ error: "parse_error" }, { status: 502 });
  }

  // Zweiter Call: kritisch nach Mehrwert filtern statt einfach die ersten
  // SUGGESTION_COUNT zu nehmen. Schlägt der Review-Call fehl, liefern wir
  // trotzdem die ungefilterten Drafts aus (besser als ein Fehler für den
  // Nutzer) statt den ganzen Request scheitern zu lassen.
  const reviewSystem = `${copy.reviewIntro(tool.name)}${pitfallLine}\n\n${copy.reviewTask}\n\n${schemaBlock}\n\n${copy.jsonNote}`;
  const reviewUser = `${copy.candidatesLabel}:\n${JSON.stringify(drafts)}`;

  try {
    const reviewText = await completeLLM({
      tier: "small",
      system: reviewSystem,
      user: reviewUser,
      maxTokens: 1300,
      jsonMode: true,
    });
    const reviewed = parseSuggestions(reviewText, SUGGESTION_COUNT);
    if (reviewed.length > 0) {
      return NextResponse.json({ suggestions: reviewed });
    }
  } catch (e) {
    console.error("[sit-suggest] review call failed, falling back to drafts:", e);
  }

  return NextResponse.json({ suggestions: drafts.slice(0, SUGGESTION_COUNT) });
}
