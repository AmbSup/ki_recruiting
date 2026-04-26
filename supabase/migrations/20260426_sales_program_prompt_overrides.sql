-- Per-program prompt overrides — allows configuring a custom system prompt + first message
-- per sales_programs row without touching code (no new use-case file required).
-- builder.ts uses these when present, falls back to the use-case-template otherwise.

alter table sales_programs
  add column if not exists system_prompt_override text,
  add column if not exists first_message_override text;

comment on column sales_programs.system_prompt_override is
  'Optional per-program system prompt body. When set, vapi-prompts/builder.ts uses this instead of the use-case-template body. Funnel-agnostic: any program can plug a custom prompt without code changes.';
comment on column sales_programs.first_message_override is
  'Optional per-program FirstMessage opener. When set, replaces the use-case-template firstMessageTemplate. Disclosure + consent question are still appended automatically by builder.ts.';
