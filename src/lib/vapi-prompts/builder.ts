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

// Context-Block, der am Ende des System-Prompts angehängt wird — enthält
// die konkreten Lead- + Program-Daten als Referenz-Block.
function buildContextBlock(vars: Partial<PromptVariables>): string {
  return `

## Aktueller Call-Kontext

**Lead:** ${vars.full_name || vars.first_name || "(Name unbekannt)"}
${vars.company_name ? `**Firma:** ${vars.company_name}\n` : ""}${vars.role ? `**Rolle:** ${vars.role}\n` : ""}${vars.notes ? `**Notizen:** ${vars.notes}\n` : ""}**Custom-Fields (JSON):** ${vars.custom_fields_json || "{}"}

**Program:** ${vars.program_name || "(unbekannt)"}
${vars.product_pitch ? `**Pitch:** ${vars.product_pitch}\n` : ""}${vars.value_proposition ? `**Value Proposition:** ${vars.value_proposition}\n` : ""}${vars.target_persona ? `**Zielpersona:** ${vars.target_persona}\n` : ""}${vars.booking_link ? `**Booking-Link:** ${vars.booking_link}\n` : ""}${vars.hook_promise ? `**Hook aus Funnel:** ${vars.hook_promise}\n` : ""}
**HEUTE:** ${vars.today_weekday_de}, ${vars.today_iso} (Termine MÜSSEN in der Zukunft liegen)`;
}

/** Rendert den kompletten System-Prompt für einen Call. */
export function buildSystemPrompt(
  programType: SalesProgramType,
  vars: Partial<PromptVariables>,
): string {
  const template = templatesByType[programType] ?? genericUseCase;
  // DTMF-Consent-Gate wird direkt nach Base-Header eingehängt, falls aktiv.
  // require_consent default = true (opt-out), damit EU-AI-Act-konform.
  const consentEnabled = vars.require_consent !== false;
  const raw =
    interpolate(basePromptHeader, vars) +
    (consentEnabled ? interpolate(consentGateBlock, vars) : "") +
    interpolate(template.systemPromptBody, vars) +
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
  const opener = interpolate(template.firstMessageTemplate, vars).trim();

  const disclosure =
    "Ich möchte Ihnen gleich sagen: Ich bin ein KI-Assistent, und dieses Gespräch wird verarbeitet und ausgewertet.";

  const consentEnabled = vars.require_consent !== false;
  const consentQuestion = consentEnabled
    ? " Sind Sie damit einverstanden, dass wir das Gespräch führen? Drücken Sie einfach die Eins auf Ihrer Tastatur oder sagen Sie einfach Ja. Wenn nicht, legen Sie einfach auf — kein Problem."
    : "";

  return `${opener} ${disclosure}${consentQuestion}`;
}

export { templatesByType };
