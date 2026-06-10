"use client";

import { useRef, useState } from "react";

// Knowledge-PDF-Upload pro Sales-Offer. Lädt das PDF über die Server-Route
// /api/sales/offers/[id]/knowledge hoch — dort wird der Text extrahiert
// und in sales_offers.knowledge_text gecached. Beim Vapi-Sales-Call wird
// der Text als matched_offer_knowledge in den System-Prompt injiziert.

type Props = {
  offerId: string;
  offerName: string;
  /** Initial-State vom Server-Render */
  initialHasKnowledge: boolean;
  initialCharCount: number | null;
  initialUpdatedAt: string | null;
  /** Optional: Callback nach Upload/Delete für parent-state-refresh */
  onChange?: () => void;
};

export function OfferKnowledgeUpload({
  offerId,
  offerName,
  initialHasKnowledge,
  initialCharCount,
  initialUpdatedAt,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasKnowledge, setHasKnowledge] = useState(initialHasKnowledge);
  const [charCount, setCharCount] = useState<number | null>(initialCharCount);
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialUpdatedAt);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setInfo(null);

    if (file.type !== "application/pdf") {
      setError("Nur PDFs erlaubt");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError(`PDF zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB) — max 20 MB.`);
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch(`/api/sales/offers/${offerId}/knowledge`, {
        method: "POST",
        body: form,
      });
      const json = (await resp.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
        chars_extracted?: number;
        truncated?: boolean;
        preview?: string;
      };
      if (!resp.ok || !json.success) {
        setError(json.error ?? `Upload fehlgeschlagen (${resp.status})`);
        return;
      }
      setHasKnowledge(true);
      setCharCount(json.chars_extracted ?? null);
      setUpdatedAt(new Date().toISOString());
      setInfo(
        json.truncated
          ? `PDF gekürzt: KI sieht nur die ersten ~50.000 Zeichen (~10-15 Seiten).`
          : `PDF erfolgreich gelesen (${json.chars_extracted?.toLocaleString("de-AT")} Zeichen).`,
      );
      onChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netzwerkfehler beim Upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!confirm(`Knowledge-PDF für "${offerName}" wirklich entfernen?`)) return;
    setDeleting(true);
    setError(null);
    setInfo(null);
    try {
      const resp = await fetch(`/api/sales/offers/${offerId}/knowledge`, {
        method: "DELETE",
      });
      const json = (await resp.json().catch(() => ({}))) as { error?: string; success?: boolean };
      if (!resp.ok || !json.success) {
        setError(json.error ?? `Löschen fehlgeschlagen (${resp.status})`);
        return;
      }
      setHasKnowledge(false);
      setCharCount(null);
      setUpdatedAt(null);
      onChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netzwerkfehler beim Löschen");
    } finally {
      setDeleting(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const busy = uploading || deleting;

  return (
    <div className="space-y-2">
      <div
        className={
          "rounded-xl border-2 border-dashed px-3 py-2.5 text-xs transition " +
          (busy
            ? "border-gray-200 bg-gray-50 opacity-60"
            : hasKnowledge
              ? "border-emerald-200 bg-emerald-50/40"
              : "border-gray-200 bg-gray-50/60 hover:border-gray-300")
        }
        onDragOver={(e) => e.preventDefault()}
        onDrop={busy ? undefined : handleDrop}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {hasKnowledge ? (
              <>
                <div className="font-semibold text-emerald-700">PDF aktiv</div>
                <div className="text-[11px] text-gray-600">
                  {charCount?.toLocaleString("de-AT")} Zeichen extrahiert
                  {updatedAt && (
                    <>
                      {" "}· aktualisiert {new Date(updatedAt).toLocaleDateString("de-AT")}
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="font-semibold text-gray-700">Kein Knowledge-PDF</div>
                <div className="text-[11px] text-gray-500">
                  PDF mit Datenblatt / Aktionsinfos hier ablegen oder per Klick wählen (max 20 MB).
                </div>
              </>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-1.5">
            {hasKnowledge && (
              <a
                href={`/api/sales/offers/${offerId}/knowledge`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
              >
                Ansehen
              </a>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-lg bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {uploading ? "Lädt…" : hasKnowledge ? "Ersetzen" : "PDF wählen"}
            </button>
            {hasKnowledge && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? "…" : "Entfernen"}
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && (
        <p className="text-[11px] text-red-600">{error}</p>
      )}
      {info && !error && (
        <p className="text-[11px] text-emerald-700">{info}</p>
      )}
    </div>
  );
}
