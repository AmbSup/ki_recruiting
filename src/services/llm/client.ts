// LLM-Client-Factory + Singleton. Wählt anhand der `LLM_PROVIDER` Env-Var
// zwischen Anthropic und Azure OpenAI. Default: anthropic (Status Quo,
// kein Verhalten-Change bis Azure-Setup verifiziert ist).
//
// Provider-Switch ist 1-Klick-Rollback per Env-Var-Flip ohne Code-Deploy.

import type { LLMClient, LLMRequest } from "./types";
import { AnthropicLLMClient } from "./anthropic-adapter";
import { AzureOpenAILLMClient, type AzureLLMConfig } from "./azure-adapter";

let _client: LLMClient | null = null;

function pickProvider(): "anthropic" | "azure-openai" {
  const raw = (process.env.LLM_PROVIDER ?? "anthropic").toLowerCase();
  if (raw === "azure" || raw === "azure-openai") return "azure-openai";
  return "anthropic";
}

function buildClient(): LLMClient {
  const provider = pickProvider();

  if (provider === "azure-openai") {
    const config: AzureLLMConfig = {
      endpoint: must("AZURE_OPENAI_ENDPOINT"),
      apiKey: must("AZURE_OPENAI_API_KEY"),
      apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? "2024-08-01-preview",
      deploymentLarge: must("AZURE_OPENAI_DEPLOYMENT_LARGE"),
      deploymentSmall: must("AZURE_OPENAI_DEPLOYMENT_SMALL"),
    };
    return new AzureOpenAILLMClient(config);
  }

  const apiKey = must("ANTHROPIC_API_KEY");
  return new AnthropicLLMClient(apiKey);
}

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Env-Var ${name} fehlt (benötigt für LLM_PROVIDER=${pickProvider()})`);
  return v;
}

/** Singleton-Zugang zum aktiven Provider. */
export function getLLM(): LLMClient {
  if (!_client) _client = buildClient();
  return _client;
}

// ─── Convenience-Helfer, kompatibel zum bisherigen claude/client.ts-Shape ───
// Bestehende Importer rufen `generateText(prompt, maxTokens)` und
// `generateTextHaiku(prompt, maxTokens)` — Signatur bleibt identisch.

export async function generateText(prompt: string, maxTokens = 1500): Promise<string> {
  const llm = getLLM();
  return llm.complete({ tier: "large", user: prompt, maxTokens });
}

export async function generateTextHaiku(prompt: string, maxTokens = 120): Promise<string> {
  const llm = getLLM();
  return llm.complete({ tier: "small", user: prompt, maxTokens });
}

/** Erweiterte API für Analyzer die strukturierte Content-Blocks + JSON-Mode brauchen */
export async function completeLLM(req: LLMRequest): Promise<string> {
  const llm = getLLM();
  return llm.complete(req);
}
