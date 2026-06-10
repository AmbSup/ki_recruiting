import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriter } from "@/lib/auth/guards";
import { extractDocument } from "@/services/llm/document-extract";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// PDF-Knowledge-Upload pro Sales-Offer. Operator lädt im Program-Detail ein
// PDF pro Offer hoch (Datenblatt, Aktions-Brief). Wir extrahieren den Text
// per pdf-parse (gleiche Pipeline wie CV-Analyzer in cv-analyzer/index.ts)
// und cachen ihn in sales_offers.knowledge_text. Beim Vapi-Call-Trigger
// wird der Text als matched_offer_knowledge in den System-Prompt gemerged.
//
// Route: POST/DELETE/GET /api/sales/offers/[id]/knowledge
//   POST   multipart/form-data { file } → uploads + extracts + persists
//   DELETE → entfernt Bucket-File + nullt die 3 knowledge_*-Spalten
//   GET    → 307-Redirect auf signed URL (Operator-Preview/Download)

const BUCKET = "sales-offer-knowledge";
const MAX_TEXT_CHARS = 50_000;
const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20 MB (Bucket-Limit)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Multipart-Body erwartet" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Feld 'file' fehlt" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Nur PDFs erlaubt" }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json(
      { error: `PDF zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB) — max 20 MB.` },
      { status: 413 },
    );
  }

  const supabase = createAdminClient();

  const { data: offer, error: offerErr } = await supabase
    .from("sales_offers")
    .select("id, name, knowledge_storage_path")
    .eq("id", id)
    .maybeSingle();
  if (offerErr || !offer) {
    return NextResponse.json({ error: "Offer nicht gefunden" }, { status: 404 });
  }

  // PDF erst extrahieren BEVOR der Upload passiert — wenn die Text-Extraktion
  // fehlschlägt (Scan/Layout-only), wollen wir keine Datei-Leiche im Bucket.
  const buffer = await file.arrayBuffer();
  let extractedText: string;
  try {
    const extracted = await extractDocument(buffer, file.type);
    if (extracted.detected !== "pdf") {
      return NextResponse.json({ error: "Datei wurde nicht als PDF erkannt" }, { status: 400 });
    }
    const textBlock = extracted.blocks.find((b) => b.type === "text") as
      | { type: "text"; text: string }
      | undefined;
    extractedText = textBlock?.text ?? "";
  } catch (e) {
    const msg = e instanceof Error ? e.message : "PDF konnte nicht gelesen werden";
    return NextResponse.json(
      {
        error: `PDF-Text-Extraktion fehlgeschlagen: ${msg}. Tipp: text-basiertes PDF hochladen (keine Scan-Bilder, keine Layout-only-Templates).`,
      },
      { status: 422 },
    );
  }

  if (!extractedText.trim()) {
    return NextResponse.json(
      { error: "PDF enthielt keinen lesbaren Text." },
      { status: 422 },
    );
  }

  const truncated = extractedText.length > MAX_TEXT_CHARS;
  const finalText = truncated ? extractedText.slice(0, MAX_TEXT_CHARS) : extractedText;

  // Alte Datei wegräumen falls vorhanden (sonst Bucket-Müll bei Re-Upload).
  if (offer.knowledge_storage_path) {
    await supabase.storage.from(BUCKET).remove([offer.knowledge_storage_path]);
  }

  const storagePath = `${id}.pdf`;
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, Buffer.from(buffer), {
      contentType: "application/pdf",
      upsert: true,
    });
  if (uploadErr) {
    return NextResponse.json(
      { error: `Upload fehlgeschlagen: ${uploadErr.message}` },
      { status: 500 },
    );
  }

  const { error: updErr } = await supabase
    .from("sales_offers")
    .update({
      knowledge_storage_path: storagePath,
      knowledge_text: finalText,
      knowledge_updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updErr) {
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
    return NextResponse.json(
      { error: `DB-Update fehlgeschlagen: ${updErr.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    chars_extracted: finalText.length,
    truncated,
    preview: finalText.slice(0, 200),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const supabase = createAdminClient();
  const { data: offer } = await supabase
    .from("sales_offers")
    .select("knowledge_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (!offer) {
    return NextResponse.json({ error: "Offer nicht gefunden" }, { status: 404 });
  }

  if (offer.knowledge_storage_path) {
    await supabase.storage.from(BUCKET).remove([offer.knowledge_storage_path]);
  }

  const { error: updErr } = await supabase
    .from("sales_offers")
    .update({
      knowledge_storage_path: null,
      knowledge_text: null,
      knowledge_updated_at: null,
    })
    .eq("id", id);
  if (updErr) {
    return NextResponse.json({ error: `DB-Update fehlgeschlagen: ${updErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const supabase = createAdminClient();
  const { data: offer } = await supabase
    .from("sales_offers")
    .select("knowledge_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (!offer?.knowledge_storage_path) {
    return NextResponse.json({ error: "Kein Knowledge-PDF vorhanden" }, { status: 404 });
  }

  const { data: signed, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(offer.knowledge_storage_path, 3600);
  if (error || !signed) {
    return NextResponse.json(
      { error: "Signed URL konnte nicht erstellt werden" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(signed.signedUrl, 307);
}
