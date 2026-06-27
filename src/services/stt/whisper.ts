// Whisper-Transkription via Azure-OpenAI (gleiche Resource wie unsere
// GPT-Deployments, nur eigenes Whisper-Deployment). Wir wählen Azure
// gegenüber direktem OpenAI weil unsere LLM-Inferenz schon EU-residenz-
// konform läuft — Audio sollte nicht mehr ins US-Routing fallen.
//
// Env-Vars:
//   AZURE_OPENAI_ENDPOINT
//   AZURE_OPENAI_API_KEY
//   AZURE_OPENAI_API_VERSION   (Optional, Default unten)
//   AZURE_OPENAI_DEPLOYMENT_WHISPER  (Pflicht — z.B. "whisper-1")
//
// Falls AZURE_OPENAI_DEPLOYMENT_WHISPER nicht gesetzt ist, wirft die
// Funktion mit klarer Meldung — der API-Caller fängt + zeigt dem Operator
// "Whisper nicht konfiguriert".

import { AzureOpenAI, toFile } from "openai";

export type TranscribeOptions = {
  /** Audio-Bytes */
  buffer: Buffer;
  /** Filename mit korrekter Extension (.webm/.ogg/.mp3/.mp4/.wav) — Whisper braucht das für Format-Detection */
  filename: string;
  /** Optional: erwartete Sprache als ISO-639-1 ("de", "en"). Default: auto-detect */
  language?: string;
};

export type TranscribeResult = {
  text: string;
  /** Detected language (Whisper-Response) */
  language?: string;
  /** Duration in Sekunden (Whisper-Response) */
  durationSeconds?: number;
};

const DEFAULT_API_VERSION = "2024-08-01-preview";

export async function transcribeAudio(opts: TranscribeOptions): Promise<TranscribeResult> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.trim();
  const apiKey = process.env.AZURE_OPENAI_API_KEY?.trim();
  const apiVersion = (process.env.AZURE_OPENAI_API_VERSION?.trim() || DEFAULT_API_VERSION);
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_WHISPER?.trim();

  if (!endpoint || !apiKey) {
    throw new Error("Azure-OpenAI nicht konfiguriert (AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY fehlt).");
  }
  if (!deployment) {
    throw new Error(
      "Whisper-Deployment fehlt. In Azure-OpenAI-Studio ein Whisper-Modell deployen und AZURE_OPENAI_DEPLOYMENT_WHISPER in Vercel setzen (z.B. 'whisper-1').",
    );
  }

  const client = new AzureOpenAI({ endpoint, apiKey, apiVersion });

  // SDK-eigener Helper wandelt Buffer in das vom Endpunkt erwartete File-Like.
  // Sicherer als das globale File-Constructor weil's mit Node ENV variieren kann.
  const file = await toFile(opts.buffer, opts.filename, { type: guessMimeFromExt(opts.filename) });

  const result = await client.audio.transcriptions.create({
    model: deployment, // bei Azure ist "model" der Deployment-Name
    file,
    language: opts.language,
    response_format: "verbose_json",
  } as Parameters<typeof client.audio.transcriptions.create>[0]);

  // verbose_json gibt zusätzlich language + duration zurück
  const verbose = result as unknown as {
    text: string;
    language?: string;
    duration?: number;
  };

  return {
    text: (verbose.text ?? "").trim(),
    language: verbose.language,
    durationSeconds: verbose.duration,
  };
}

function guessMimeFromExt(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".webm")) return "audio/webm";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".mp4") || lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".mp3") || lower.endsWith(".mpeg")) return "audio/mpeg";
  if (lower.endsWith(".wav")) return "audio/wav";
  return "audio/webm";
}
