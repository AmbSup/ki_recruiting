// Provider-agnostisches LLM-Interface — abstraktiert über Anthropic (Claude)
// und Azure OpenAI (GPT-4o) hinweg. Analyzer rufen ausschließlich diesen
// Interface auf und wissen nicht WO inferenziert wird.

export type LLMTier = "large" | "small";

export type LLMContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif"; base64: string };

export interface LLMRequest {
  /** Semantic model tier; Adapter mapped auf konkrete Modelle/Deployments */
  tier: LLMTier;
  /** Optional system-prompt */
  system?: string;
  /** User message — single string oder mixed content blocks (text + images) */
  user: string | LLMContentBlock[];
  /** Maximale Output-Tokens. Default tier-abhängig im Adapter. */
  maxTokens?: number;
  /** Bei true wird ein JSON-Object erzwungen (Azure: response_format, Anthropic: Prompt-Anweisung) */
  jsonMode?: boolean;
}

export interface LLMClient {
  /** Vereinheitlichter completion-Call. Wirft bei Provider-Fehler. */
  complete(req: LLMRequest): Promise<string>;
  /** Name des aktiven Providers für Logs/Diagnose */
  readonly providerName: "anthropic" | "azure-openai";
}
