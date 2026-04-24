/**
 * Prompt-Template für einen Sales Use-Case. Der Builder setzt
 *   basePromptHeader + systemPromptBody + contextBlock(lead, program)
 * zusammen und ersetzt alle {{placeholder}}-Tokens.
 */
export type UseCaseTemplate = {
  /** Körper des System-Prompts (nach base-prompt-header, vor context-block). */
  systemPromptBody: string;
  /** Die erste Zeile, die der Assistant spricht — ersetzt die Vapi-Dashboard-FirstMessage. */
  firstMessageTemplate: string;
};

/**
 * Platzhalter, die der builder interpoliert.
 * Jeder Use-Case-Prompt darf alle Felder nutzen; fehlende werden durch ""
 * ersetzt, damit niemals ein {{literal}} im gesprochenen Prompt landet.
 */
export type PromptVariables = {
  // Lead
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  role: string;
  notes: string;
  custom_fields_json: string;

  // Program
  program_name: string;
  product_pitch: string;
  value_proposition: string;
  target_persona: string;
  booking_link: string;

  // Call-Strategy (aus sales_programs.call_strategy JSONB)
  hook_promise: string;
  caller_name: string;
  fallback_resource_url: string;
  hard_qualifier_questions_list: string;
  show_rate_confirmation_phrase: string;
  require_consent: boolean; // true → DTMF-Consent-Gate im Prompt (default true)

  // IDs (für Audit im Prompt, i.d.R. unverwendet)
  sales_lead_id: string;
  sales_call_id: string;
  sales_program_id: string;

  // Datum (gegen Datums-Halluzinationen)
  today_iso: string;
  today_weekday_de: string;
};
