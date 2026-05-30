// Azure-OpenAI-Adapter. Implementiert LLMClient via openai-SDK mit
// Azure-spezifischer Konfiguration (Endpoint, API-Version, Deployment-Name
// pro Tier statt globaler Model-Name).
//
// Native JSON-Mode wird via response_format: { type: "json_object" } gesetzt
// — kein Prompt-Trick nötig wie bei Anthropic.
//
// Models pro Tier sind nicht im Code festgenagelt — Azure-Deployments sind
// benannt + via Env-Var konfiguriert. Das gibt Flexibilität (gpt-4o vs.
// gpt-4o-2024-11-20 vs. eigenes Fine-Tune).

import { AzureOpenAI } from "openai";
import type { LLMClient, LLMRequest, LLMContentBlock } from "./types";

const DEFAULT_MAX_TOKENS = {
  large: 1500,
  small: 120,
} as const;

export type AzureLLMConfig = {
  endpoint: string;
  apiKey: string;
  apiVersion: string;
  /** Deployment-Name für `large`-Tier (z.B. "gpt-4o-eu") */
  deploymentLarge: string;
  /** Deployment-Name für `small`-Tier (z.B. "gpt-4o-mini-eu") */
  deploymentSmall: string;
};

export class AzureOpenAILLMClient implements LLMClient {
  public readonly providerName = "azure-openai" as const;
  private client: AzureOpenAI;
  private config: AzureLLMConfig;

  constructor(config: AzureLLMConfig) {
    this.config = config;
    this.client = new AzureOpenAI({
      endpoint: config.endpoint,
      apiKey: config.apiKey,
      apiVersion: config.apiVersion,
      // deployment ist per-request gesetzt via `model`, daher hier kein default
    });
  }

  async complete(req: LLMRequest): Promise<string> {
    const deployment =
      req.tier === "large" ? this.config.deploymentLarge : this.config.deploymentSmall;
    const maxTokens = req.maxTokens ?? DEFAULT_MAX_TOKENS[req.tier];

    const messages: Array<{
      role: "system" | "user";
      content: string | Array<OpenAIContentPart>;
    }> = [];

    if (req.system) {
      messages.push({ role: "system", content: req.system });
    }

    messages.push({
      role: "user",
      content: this.userToOpenAI(req.user),
    });

    const response = await this.client.chat.completions.create({
      // Bei Azure ist `model` der Deployment-Name, nicht der OpenAI-Model-Name
      model: deployment,
      messages,
      max_tokens: maxTokens,
      ...(req.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
    });

    const text = response.choices[0]?.message?.content;
    if (!text) {
      throw new Error("Azure-OpenAI-Response enthielt keinen content");
    }
    return text;
  }

  private userToOpenAI(user: string | LLMContentBlock[]): string | Array<OpenAIContentPart> {
    if (typeof user === "string") return user;

    // Plain text + image: OpenAI braucht das content-parts-Format
    // mit { type: "text", text } und { type: "image_url", image_url: {url} }
    return user.map((b): OpenAIContentPart => {
      if (b.type === "text") {
        return { type: "text", text: b.text };
      }
      return {
        type: "image_url",
        image_url: {
          url: `data:${b.mediaType};base64,${b.base64}`,
        },
      };
    });
  }
}

type OpenAIContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };
