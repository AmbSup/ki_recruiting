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
  company_name: string;          // LEAD's company (z.B. "Akme") — NICHT für Opener nutzen!
  role: string;
  notes: string;
  custom_fields_json: string;

  // Program
  program_name: string;
  product_pitch: string;
  value_proposition: string;
  target_persona: string;
  booking_link: string;
  caller_company: string;        // OPERATOR-Firma (z.B. "Neuronic") — für Opener: "Hier ist X von {{caller_company}}"

  // Call-Strategy (aus sales_programs.call_strategy JSONB)
  hook_promise: string;                       // legacy, fällt zurück auf hook_one_liner
  caller_name: string;
  fallback_resource_url: string;
  hard_qualifier_questions_list: string;       // legacy joined-list, ersetzt durch discovery_questions_block
  show_rate_confirmation_phrase: string;
  require_consent: boolean;                    // true → DTMF-Consent-Gate im Prompt (default true)

  // Strukturierte Strategie-Felder (Variant A — Sales-Strategie + Tonalität).
  // Listen-Felder sind bereits-formatierte Markdown-Strings — der Builder/trigger-call
  // formatiert die rohen Arrays zu bullets/Nummern/Pairs, bevor sie hier landen.
  hook_one_liner: string;
  pain_points_block: string;                   // markdown bullets, leer = "" (Sektion wird übersprungen)
  discovery_questions_block: string;           // nummerierte Liste, leer = ""
  disqualification_criteria: string;
  top_objections_block: string;                // "- 'Einwand' → Antwort"-Bullets, leer = ""
  success_definition: string;
  on_disqualify: string;                       // "hangup" | "redirect_resource" | ""
  verbal_commitment_required: boolean;
  tone_formality: string;                      // "formell" | "locker" | ""
  tone_warmth: string;                         // "sachlich" | "warm" | ""
  urgency_trigger: string;                     // Verknappung / Dringlichkeit: warum JETZT? (z.B. "begrenzte KfW-Förderung bis Q1 2026")

  // IDs (für Audit im Prompt, i.d.R. unverwendet)
  sales_lead_id: string;
  sales_call_id: string;
  sales_program_id: string;

  // Datum (gegen Datums-Halluzinationen)
  today_iso: string;
  today_weekday_de: string;

  // Per-program overrides (sales_programs.system_prompt_override / first_message_override).
  // Wenn gesetzt, ersetzen sie systemPromptBody bzw. firstMessageTemplate des Use-Case-Templates.
  system_prompt_override?: string;
  first_message_override?: string;

  // Cal.com-Konfiguration des Programs — wenn beide gesetzt, rendert builder.ts
  // den Calendar-Flow-Block (get_available_slots → book_meeting). Sonst fällt
  // der Assistant auf send_booking_link via SMS zurück.
  cal_username?: string;
  cal_event_type_slug?: string;
  cal_timezone?: string;
};
