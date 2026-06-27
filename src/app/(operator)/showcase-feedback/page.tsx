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
};

export default function ShowcaseFeedbackPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("showcase_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setRows((data ?? []) as Row[]));
  }, []);

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
                <a
                  href={`/api/showcase/feedback/${r.id}/audio`}
                  download
                  className="text-xs font-medium text-gray-600 hover:text-primary"
                >
                  Download
                </a>
              </div>
              <audio src={`/api/showcase/feedback/${r.id}/audio`} controls className="w-full" />
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
