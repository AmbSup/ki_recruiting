// Anthropic-Adapter. Implementiert LLMClient via @anthropic-ai/sdk.
// Models pro Tier hardcoded — Anthropic hat keine "Deployments" wie Azure.

import Anthropic from "@anthropic-ai/sdk";
import type { LLMClient, LLMRequest, LLMContentBlock } from "./types";

const MODEL_BY_TIER = {
  large: "claude-sonnet-4-6",
  small: "claude-haiku-4-5-20251001",
} as const;

const DEFAULT_MAX_TOKENS = {
  large: 1500,
  small: 120,
} as const;

export class AnthropicLLMClient implements LLMClient {
  public readonly providerName = "anthropic" as const;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(req: LLMRequest): Promise<string> {
    const model = MODEL_BY_TIER[req.tier];
    const maxTokens = req.maxTokens ?? DEFAULT_MAX_TOKENS[req.tier];
    const content = this.userToAnthropic(req.user, req.jsonMode === true);

    const message = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      ...(req.system ? { system: req.system } : {}),
      messages: [{ role: "user", content }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Anthropic-Response enthielt keinen Text-Block");
    }
    return textBlock.text;
  }

  private userToAnthropic(
    user: string | LLMContentBlock[],
    jsonMode: boolean,
  ): Anthropic.MessageParam["content"] {
    const blocks: LLMContentBlock[] =
      typeof user === "string" ? [{ type: "text", text: user }] : user;

    // JSON-Mode bei Anthropic: per Prompt-Instruktion (kein dedizierter
    // response_format-Feature) — wir hängen den Hinweis als Text-Suffix an
    // den letzten text-Block, oder fügen einen finalen Text-Block hinzu.
    const finalBlocks: LLMContentBlock[] = jsonMode
      ? [
          ...blocks,
          {
            type: "text",
            text: "Antworte AUSSCHLIESSLICH als valides JSON-Objekt — keine Markdown-Codeblöcke, keine Erklärung außerhalb des JSON.",
          },
        ]
      : blocks;

    return finalBlocks.map((b) => {
      if (b.type === "text") {
        return { type: "text", text: b.text };
      }
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: b.mediaType,
          data: b.base64,
        },
      } as Anthropic.ImageBlockParam;
    });
  }
}
