"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Operator-View für eingegangenes Showcase-Audio-Feedback.
// Zeigt Bundle, Timestamp, Audio-Player und User-Agent (zum Debuggen).

type Row = {
  id: string;
  bundle_slug: string;
  audio_storage_path: string;
  duration_seconds: number | null;
  content_type: string | null;
  size_bytes: number | null;
  user_agent: string | null;
  created_at: string;
  transcript: string | null;
  transcript_at: string | null;
};

export default function ShowcaseFeedbackPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("showcase_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, []);

  async function handleDelete(r: Row) {
    if (!confirm(`Feedback zu "${r.bundle_slug}" wirklich löschen?`)) return;
    setDeletingId(r.id);
    try {
      const resp = await fetch(`/api/showcase/feedback/${r.id}`, { method: "DELETE" });
      if (!resp.ok) {
        const json = (await resp.json().catch(() => ({}))) as { error?: string };
        alert(json.error ?? `Löschen fehlgeschlagen (${resp.status})`);
        return;
      }
      setRows((prev) => prev?.filter((x) => x.id !== r.id) ?? null);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCopy(r: Row) {
    const audioUrl = `${window.location.origin}/api/showcase/feedback/${r.id}/audio`;
    const text = [
      `Showcase-Feedback`,
      `Bundle: ${r.bundle_slug}`,
      `Eingegangen: ${new Date(r.created_at).toLocaleString("de-AT")}`,
      r.duration_seconds != null ? `Dauer: ${r.duration_seconds} Sek` : null,
      r.size_bytes != null ? `Größe: ${(r.size_bytes / 1024).toFixed(1)} KB` : null,
      r.transcript ? `\nTranskript:\n${r.transcript}` : null,
      `\nAudio: ${audioUrl}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(r.id);
      window.setTimeout(() => setCopiedId((id) => (id === r.id ? null : id)), 1800);
    } catch {
      alert("Konnte nicht in die Zwischenablage kopieren — bitte manuell markieren.");
    }
  }

  async function handleTranscribe(r: Row) {
    setTranscribingId(r.id);
    try {
      const resp = await fetch(`/api/showcase/feedback/${r.id}/transcribe`, {
        method: "POST",
      });
      const json = (await resp.json().catch(() => ({}))) as {
        transcript?: string;
        transcript_at?: string;
        error?: string;
      };
      if (!resp.ok || !json.transcript) {
        alert(json.error ?? `Transkription fehlgeschlagen (${resp.status})`);
        return;
      }
      // Optimistic-Update der Row in der Liste
      setRows((prev) =>
        prev?.map((x) =>
          x.id === r.id
            ? { ...x, transcript: json.transcript!, transcript_at: json.transcript_at ?? new Date().toISOString() }
            : x,
        ) ?? null,
      );
    } finally {
      setTranscribingId(null);
    }
  }

  if (rows === null) {
    return (
      <div className="px-8 pt-10">
        <p className="text-outline">Laden…</p>
      </div>
    );
  }

  const filtered = filter
    ? rows.filter((r) => r.bundle_slug.toLowerCase().includes(filter.toLowerCase()))
    : rows;

  const bundles = Array.from(new Set(rows.map((r) => r.bundle_slug))).sort();

  return (
    <div className="px-8 pt-10 pb-32 max-w-[1200px]">
      <h1 className="font-headline text-4xl italic text-on-surface mb-1">Showcase Feedback</h1>
      <p className="font-body text-sm text-outline mb-8">
        Audio-Einreichungen von der Public Showcase-Seite ({rows.length} insgesamt)
      </p>

      {/* Filter-Chips */}
      {bundles.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter("")}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${filter === "" ? "bg-primary text-on-primary border-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            Alle ({rows.length})
          </button>
          {bundles.map((b) => (
            <button
              key={b}
              onClick={() => setFilter(b)}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${filter === b ? "bg-primary text-on-primary border-primary" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              {b} ({rows.filter((r) => r.bundle_slug === b).length})
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-10 text-center">
          <p className="text-outline">Noch kein Feedback eingegangen.</p>
          <p className="text-outline text-xs mt-2">
            Öffentliche Showcase-Seite:{" "}
            <Link href="/showcase" target="_blank" className="text-primary underline">
              /showcase
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_8px_24px_-4px_rgba(45,52,51,0.05)]"
            >
              <div className="flex items-start justify-between mb-3 gap-4">
                <div>
                  <Link
                    href={`/${r.bundle_slug}`}
                    target="_blank"
                    className="font-headline text-lg italic text-primary hover:underline"
                  >
                    {r.bundle_slug}
                  </Link>
                  <p className="font-body text-xs text-outline mt-0.5">
                    {new Date(r.created_at).toLocaleString("de-AT")}
                    {r.duration_seconds != null && ` · ${r.duration_seconds}s`}
                    {r.size_bytes != null && ` · ${(r.size_bytes / 1024).toFixed(1)} KB`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(r)}
                    className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border transition ${
                      copiedId === r.id
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                    title="Text-Zusammenfassung in Zwischenablage"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedId === r.id ? "check" : "content_copy"}
                    </span>
                    {copiedId === r.id ? "Kopiert" : "Kopieren"}
                  </button>
                  <a
                    href={`/api/showcase/feedback/${r.id}/audio`}
                    download
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                    title="Audio-Datei herunterladen"
                  >
                    <span className="material-symbols-outlined text-[14px]">download</span>
                    Download
                  </a>
                  <button
                    onClick={() => handleDelete(r)}
                    disabled={deletingId === r.id}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="Feedback löschen"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    {deletingId === r.id ? "..." : "Löschen"}
                  </button>
                </div>
              </div>
              <audio src={`/api/showcase/feedback/${r.id}/audio`} controls className="w-full" />

              {/* Transkript-Bereich: entweder gerendertes Transkript ODER Transkribieren-Button */}
              {r.transcript ? (
                <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Transkript
                    </span>
                    {r.transcript_at && (
                      <span className="text-[10px] text-outline">
                        {new Date(r.transcript_at).toLocaleString("de-AT")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {r.transcript}
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => handleTranscribe(r)}
                  disabled={transcribingId === r.id}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary-container/20 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {transcribingId === r.id ? "progress_activity" : "translate"}
                  </span>
                  {transcribingId === r.id ? "Whisper läuft…" : "Transkribieren"}
                </button>
              )}

              {r.user_agent && (
                <details className="mt-2">
                  <summary className="text-[10px] text-outline cursor-pointer">User-Agent</summary>
                  <p className="text-[10px] text-outline font-mono mt-1 break-all">{r.user_agent}</p>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
