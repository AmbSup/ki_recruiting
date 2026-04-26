import { basePromptHeader, consentGateBlock } from "./base-prompt";
import { genericUseCase } from "./use-cases/generic";
import { recruitingUseCase } from "./use-cases/recruiting";
import { realEstateUseCase } from "./use-cases/real_estate";
import { coachingUseCase } from "./use-cases/coaching";
import { ecommerceHightickedUseCase } from "./use-cases/ecommerce_highticket";
import { handwerkUseCase } from "./use-cases/handwerk";
import type { SalesProgramType } from "./schemas";
import type { PromptVariables, UseCaseTemplate } from "./types";

const templatesByType: Record<SalesProgramType, UseCaseTemplate> = {
  generic: genericUseCase,
  recruiting: recruitingUseCase,
  real_estate: realEstateUseCase,
  coaching: coachingUseCase,
  ecommerce_highticket: ecommerceHightickedUseCase,
  handwerk: handwerkUseCase,
};

// Einfacher Mustache-ähnlicher {{variable}}-Replacer. Unbekannte Variablen
// werden durch "" ersetzt, damit keine {{…}}-Literale im Prompt landen.
function interpolate(template: string, vars: Partial<PromptVariables>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_match, rawKey: string) => {
    // Unterstützt {{foo}} und {{custom_fields.foo}} (punkt-pfad in custom_fields_json)
    if (rawKey.startsWith("custom_fields.")) {
      try {
        const obj = JSON.parse(vars.custom_fields_json ?? "{}") as Record<string, unknown>;
        const field = rawKey.slice("custom_fields.".length);
        const val = obj[field];
        return val == null ? "" : String(val);
      } catch {
        return "";
      }
    }
    const val = (vars as Record<string, unknown>)[rawKey];
    if (val == null) return "";
    return String(val);
  });
}

// Strategie-Block, der zwischen Use-Case-Body und Context eingehängt wird.
// Rendert pro Sektion nur, wenn der entsprechende Var-Wert nicht leer ist —
// damit alte Programs ohne Strategie-Felder nicht plötzlich leere Headlines
// im Prompt sehen.
function buildStrategyBlock(vars: Partial<PromptVariables>): string {
  const sections: string[] = [];

  if (vars.hook_one_liner?.trim()) {
    sections.push(`**Hook (zum Einsatz, wenn Aufmerksamkeit nachlässt):** ${vars.hook_one_liner}`);
  }
  if (vars.pain_points_block?.trim()) {
    sections.push(`**Pain Points, die wir lösen:**\n${vars.pain_points_block}`);
  }
  if (vars.discovery_questions_block?.trim()) {
    sections.push(`**Discovery-Fragen — must-ask, BEVOR du den Pitch machst:**\n${vars.discovery_questions_block}`);
  }
  if (vars.disqualification_criteria?.trim()) {
    const action = vars.on_disqualify === "redirect_resource"
      ? `→ höflich verabschieden + Fallback-Ressource per SMS senden${vars.fallback_resource_url ? ` (${vars.fallback_resource_url})` : ""}`
      : vars.on_disqualify === "hangup"
        ? "→ höflich verabschieden + Call beenden"
        : "→ höflich verabschieden";
    sections.push(`**Disqualifikation:** Wenn ${vars.disqualification_criteria} ${action}`);
  }
  if (vars.top_objections_block?.trim()) {
    sections.push(`**Häufige Einwände + deine Antwort:**\n${vars.top_objections_block}`);
  }
  if (vars.success_definition?.trim()) {
    sections.push(`**Erfolgs-Definition (was du erreichen sollst):** ${vars.success_definition}`);
  }
  if (vars.verbal_commitment_required) {
    sections.push(`**Verbale Bestätigung:** Vor jedem Termin EXPLIZIT eine "Ja"-Bestätigung einholen — nicht nur Kopfnicken oder "klingt gut".`);
  }
  if (vars.tone_formality || vars.tone_warmth) {
    const parts: string[] = [];
    if (vars.tone_formality) parts.push(vars.tone_formality === "formell" ? "formell (Sie-Form, gewählte Wortwahl)" : "locker (Sie-Form bleibt, aber persönlicher Ton)");
    if (vars.tone_warmth) parts.push(vars.tone_warmth === "warm" ? "warm (emotional spiegeln, Empathie zeigen)" : "sachlich (faktenfokussiert, wenig emotionale Spiegelung)");
    sections.push(`**Tonalität:** ${parts.join(" + ")}`);
  }

  if (sections.length === 0) return "";
  return `\n\n## Sales-Strategie\n\n${sections.join("\n\n")}\n`;
}

// Context-Block, der am Ende des System-Prompts angehängt wird — enthält
// die konkreten Lead- + Program-Daten als Referenz-Block.
//
// Splittet custom_fields in lesbare Sektionen (lead_context, funnel_summary)
// + einen kompakten JSON-Rest für strukturierte Per-Frage-Keys. Damit der
// Assistant den Funnel-Hook direkt sieht statt JSON parsen zu müssen.
function buildContextBlock(vars: Partial<PromptVariables>): string {
  let cf: Record<string, unknown> = {};
  try { cf = JSON.parse(vars.custom_fields_json ?? "{}") as Record<string, unknown>; }
  catch { cf = {}; }

  const leadContext = typeof cf.lead_context === "string" ? cf.lead_context.trim() : "";
  const funnelSummary = typeof cf.funnel_summary === "string" ? cf.funnel_summary.trim() : "";

  // Restliche Custom-Fields ohne die drei "rendered" Schlüssel — Per-Frage-Slugs
  // bleiben drin, damit der Assistant den Roh-Wert zitieren kann.
  const rest: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cf)) {
    if (k === "lead_context" || k === "funnel_summary" || k === "funnel_qa") continue;
    rest[k] = v;
  }
  const hasRest = Object.keys(rest).length > 0;

  return `

## Aktueller Call-Kontext

**Lead:** ${vars.full_name || vars.first_name || "(Name unbekannt)"}
${leadContext ? `**Hook:** ${leadContext}\n` : ""}${vars.company_name ? `**Firma:** ${vars.company_name}\n` : ""}${vars.role ? `**Rolle:** ${vars.role}\n` : ""}${vars.notes ? `**Notizen:** ${vars.notes}\n` : ""}${funnelSummary ? `\n### Funnel-Antworten\n${funnelSummary}\n` : ""}${hasRest ? `\n**Custom-Fields:** ${JSON.stringify(rest)}\n` : ""}
**Program:** ${vars.program_name || "(unbekannt)"}
${vars.product_pitch ? `**Pitch:** ${vars.product_pitch}\n` : ""}${vars.value_proposition ? `**Value Proposition:** ${vars.value_proposition}\n` : ""}${vars.target_persona ? `**Zielpersona:** ${vars.target_persona}\n` : ""}${vars.booking_link ? `**Booking-Link (NIEMALS LAUT AUSSPRECHEN — nur via book_meeting Tool oder als SMS-Hinweis "Ich schicke Ihnen den Link gleich"):** ${vars.booking_link}\n` : ""}${vars.hook_promise ? `**Hook aus Funnel:** ${vars.hook_promise}\n` : ""}
**HEUTE:** ${vars.today_weekday_de}, ${vars.today_iso} (Termine MÜSSEN in der Zukunft liegen)`;
}

/** Rendert den kompletten System-Prompt für einen Call. */
export function buildSystemPrompt(
  programType: SalesProgramType,
  vars: Partial<PromptVariables>,
): string {
  const template = templatesByType[programType] ?? genericUseCase;
  // Per-program override hat Priorität — erlaubt Custom-Prompts pro sales_program
  // ohne neue Use-Case-Datei. Falls leer/null → Use-Case-Template-Body.
  const bodyTemplate = vars.system_prompt_override?.trim() || template.systemPromptBody;
  // DTMF-Consent-Gate wird direkt nach Base-Header eingehängt, falls aktiv.
  // require_consent default = true (opt-out), damit EU-AI-Act-konform.
  const consentEnabled = vars.require_consent !== false;
  const raw =
    interpolate(basePromptHeader, vars) +
    (consentEnabled ? interpolate(consentGateBlock, vars) : "") +
    interpolate(bodyTemplate, vars) +
    buildStrategyBlock(vars) +
    buildContextBlock(vars);
  return raw;
}

/**
 * Rendert die First Message.
 * Struktur (auto-assembled):
 *   1. Use-Case-spezifischer Opener (Begrüßung + Grund)
 *   2. KI-Disclosure (wortgetreu, EU AI Act Art. 50 — immer)
 *   3. Consent-Frage (nur wenn require_consent !== false)
 * Damit ist die Reihenfolge garantiert, unabhängig davon ob der LLM den
 * System-Prompt strikt befolgt.
 */
export function buildFirstMessage(
  programType: SalesProgramType,
  vars: Partial<PromptVariables>,
): string {
  const template = templatesByType[programType] ?? genericUseCase;
  const openerSrc = vars.first_message_override?.trim() || template.firstMessageTemplate;
  const opener = interpolate(openerSrc, vars).trim();

  const disclosure =
    "Ich möchte Ihnen gleich sagen: Ich bin ein KI-Assistent, und dieses Gespräch wird verarbeitet und ausgewertet.";

  const consentEnabled = vars.require_consent !== false;
  const consentQuestion = consentEnabled
    ? " Sind Sie damit einverstanden, dass wir das Gespräch führen? Drücken Sie einfach die Eins auf Ihrer Tastatur oder sagen Sie einfach Ja. Wenn nicht, legen Sie einfach auf — kein Problem."
    : "";

  return `${opener} ${disclosure}${consentQuestion}`;
}

export { templatesByType };
