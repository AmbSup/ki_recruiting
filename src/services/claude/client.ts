import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export async function generateText(prompt: string, maxTokens = 1500): Promise<string> {
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text;
}

// Haiku-Variante für kurze, latency-sensitive Tasks (z.B. Lead-Context-Summary
// im /api/apply-Pfad). Default 120 Tokens reicht für 1-Satz-Zusammenfassungen.
export async function generateTextHaiku(prompt: string, maxTokens = 120): Promise<string> {
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = message.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text;
}
