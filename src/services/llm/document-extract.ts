// Provider-agnostische Dokument-Extraktion. Wandelt PDF/DOCX/Image-Bytes in
// LLMContentBlock-Listen die sowohl Anthropic Claude als auch Azure OpenAI
// GPT-4o verarbeiten können.
//
// PDF: Anthropic kann PDFs nativ via DocumentBlockParam lesen, Azure nicht.
//      → wir extrahieren server-seitig zu Plain-Text via pdf-parse. Verlorenes
//        Layout-Info bei Mehrspaltern wird durch Fallback abgefedert (Image-
//        Konversion bei zu wenig extrahiertem Text — Backlog, siehe TODO).
// DOCX: mammoth-Extraktion zu Plain-Text (provider-agnostisch).
// Image: bleibt base64, beide Provider verstehen Vision-Input (Anthropic
//        ImageBlock / OpenAI vision-content-part).

import mammoth from "mammoth";
import type { LLMContentBlock } from "./types";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type SupportedImageMediaType = "image/png" | "image/jpeg" | "image/webp" | "image/gif";

export type ExtractedDocument = {
  /** Provider-agnostische Content-Blocks (text + optional image) */
  blocks: LLMContentBlock[];
  /** Diagnostik: was der Extractor erkannt hat */
  detected: "pdf" | "docx" | "image" | "text";
  /** Bei text/pdf/docx: Länge des extrahierten Texts. Bei image: 0. */
  textLength: number;
};

/**
 * Hauptfunktion. Nimmt CV-Bytes + Content-Type/URL und produziert
 * provider-agnostische Content-Blocks.
 *
 * @param buffer ArrayBuffer der Datei
 * @param contentType MIME-Type (z.B. "application/pdf", "image/png")
 * @param url Optional — wird zur Endung-Detection genutzt wenn contentType ambivalent ist
 */
export async function extractDocument(
  buffer: ArrayBuffer,
  contentType: string,
  url?: string,
): Promise<ExtractedDocument> {
  const ct = (contentType || "").toLowerCase();
  const isDocx =
    ct.includes(DOCX_MIME) ||
    ct.includes("officedocument.wordprocessingml") ||
    (!!url && /\.docx(\?|$)/i.test(url));

  if (isDocx) {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    const text = (result.value ?? "").trim();
    if (!text) throw new Error("DOCX-Extraktion ergab leeren Text");
    return {
      blocks: [{ type: "text", text }],
      detected: "docx",
      textLength: text.length,
    };
  }

  if (ct.includes("pdf") || (!!url && /\.pdf(\?|$)/i.test(url))) {
    // Dynamic import um pdf-parse nur server-seitig zu laden. pdf-parse v2.x
    // exportiert `pdf()` als named export.
    const { pdf: pdfParse } = await import("pdf-parse");
    const parsed = await pdfParse(Buffer.from(buffer));
    const text = (parsed.text ?? "").trim();
    if (!text || text.length < 50) {
      // TODO (Backlog): Fallback auf PDF-to-image + Vision-Pfad für komplexe
      // Layouts. Aktuell werfen wir und Caller fängt mit "CV konnte nicht
      // geladen werden" wie heute.
      throw new Error(`PDF-Text-Extraktion zu kurz (${text.length} chars) — Layout möglicherweise visuell strukturiert`);
    }
    return {
      blocks: [{ type: "text", text }],
      detected: "pdf",
      textLength: text.length,
    };
  }

  if (ct.includes("image")) {
    const mediaType = pickImageMediaType(ct);
    const base64 = Buffer.from(buffer).toString("base64");
    return {
      blocks: [{ type: "image", mediaType, base64 }],
      detected: "image",
      textLength: 0,
    };
  }

  throw new Error(`Unbekanntes Dokument-Format: contentType="${contentType}"`);
}

function pickImageMediaType(contentType: string): SupportedImageMediaType {
  if (contentType.includes("png")) return "image/png";
  if (contentType.includes("jpg") || contentType.includes("jpeg")) return "image/jpeg";
  if (contentType.includes("webp")) return "image/webp";
  if (contentType.includes("gif")) return "image/gif";
  return "image/png";
}
