// Compat-Shim. Die wirkliche Implementation lebt jetzt in `src/services/llm/`
// und ist provider-agnostisch (Anthropic ODER Azure OpenAI je nach
// `LLM_PROVIDER`-Env-Var).
//
// Dieser File re-exportiert die alten Funktions-Signaturen damit bestehende
// Importer (`import { generateText, generateTextHaiku } from '@/services/claude/client'`)
// ohne Änderung weiter funktionieren. Neue Code-Stellen sollten direkt aus
// `@/services/llm/client` importieren.

export { generateText, generateTextHaiku } from "@/services/llm/client";
