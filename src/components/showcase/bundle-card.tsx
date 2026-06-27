"use client";

import { useEffect, useRef, useState } from "react";

type Bundle = {
  slug: string;
  name: string;
  tagline: string | null;
  hero_image: string | null;
  primary_color: string;
  funnel_type: "sales" | "recruiting" | null;
};

type RecordingState = "idle" | "asking" | "recording" | "preview" | "uploading" | "done" | "error";

const MAX_DURATION_SEC = 60;
const MIN_DURATION_SEC = 2;

export function BundleCard({ bundle }: { bundle: Bundle }) {
  const [state, setState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const stoppedByTimer = useRef(false);

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startRecording() {
    setError(null);
    setState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime = pickMimeType();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      stoppedByTimer.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stopStream();
        if (timerRef.current) window.clearInterval(timerRef.current);
        setState("preview");
      };

      recorder.start();
      setElapsed(0);
      setState("recording");

      timerRef.current = window.setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_DURATION_SEC) {
            stoppedByTimer.current = true;
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Mikrofon-Zugriff verweigert";
      setError(msg);
      setState("error");
      stopStream();
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  function discard() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsed(0);
    setState("idle");
  }

  async function submit() {
    if (!audioBlob) return;
    if (elapsed < MIN_DURATION_SEC) {
      setError(`Mindestens ${MIN_DURATION_SEC} Sekunden aufnehmen`);
      return;
    }
    setError(null);
    setState("uploading");
    try {
      const form = new FormData();
      form.append("audio", audioBlob, `feedback.${blobExtension(audioBlob.type)}`);
      form.append("bundle_slug", bundle.slug);
      form.append("duration_seconds", String(elapsed));

      const resp = await fetch("/api/showcase/feedback", {
        method: "POST",
        body: form,
      });
      const json = (await resp.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!resp.ok || !json.success) {
        setError(json.error ?? `Upload fehlgeschlagen (${resp.status})`);
        setState("preview");
        return;
      }
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Netzwerkfehler");
      setState("preview");
    }
  }

  const isRecording = state === "recording";
  const isUploading = state === "uploading";
  const showRecorder = state !== "idle" && state !== "done";

  return (
    <article
      className="bg-white rounded-2xl overflow-hidden shadow-[0_8px_24px_-8px_rgba(15,23,42,0.10)] hover:shadow-[0_12px_32px_-8px_rgba(15,23,42,0.18)] transition-shadow flex flex-col"
      style={{ borderTop: `4px solid ${bundle.primary_color}` }}
    >
      {/* Hero */}
      <div
        className="h-48 bg-cover bg-center"
        style={{
          backgroundColor: bundle.primary_color,
          backgroundImage: bundle.hero_image ? `url(${bundle.hero_image})` : undefined,
        }}
      />

      <div className="p-5 flex flex-col flex-1">
        {/* Title + Tagline */}
        <h2 className="font-headline text-xl italic text-slate-900 leading-snug mb-2">
          {bundle.name}
        </h2>
        {bundle.tagline && (
          <p className="font-body text-sm text-slate-600 mb-4 line-clamp-2">{bundle.tagline}</p>
        )}

        {/* Tag */}
        <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <span className="px-2 py-0.5 rounded bg-slate-100">
            {bundle.funnel_type === "sales" ? "Sales-Funnel" : bundle.funnel_type === "recruiting" ? "Recruiting" : "Funnel"}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-2">
          <a
            href={`/${bundle.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-white text-sm font-medium py-2.5 rounded-xl hover:opacity-90 transition"
            style={{ backgroundColor: bundle.primary_color }}
          >
            Funnel öffnen →
          </a>

          {state === "done" ? (
            <div className="text-center py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm">
              ✓ Danke fürs Feedback!
            </div>
          ) : !showRecorder ? (
            <button
              onClick={startRecording}
              className="block w-full text-center text-slate-700 text-sm font-medium py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            >
              🎙 Audio-Feedback geben
            </button>
          ) : (
            <RecorderPanel
              state={state}
              elapsed={elapsed}
              audioUrl={audioUrl}
              isRecording={isRecording}
              isUploading={isUploading}
              onStop={stopRecording}
              onDiscard={discard}
              onSubmit={submit}
              error={error}
              primaryColor={bundle.primary_color}
            />
          )}
          {error && state === "error" && (
            <p className="text-xs text-red-600 text-center mt-1">{error}</p>
          )}
        </div>
      </div>
    </article>
  );
}

function RecorderPanel({
  state, elapsed, audioUrl, isRecording, isUploading,
  onStop, onDiscard, onSubmit, error, primaryColor,
}: {
  state: RecordingState;
  elapsed: number;
  audioUrl: string | null;
  isRecording: boolean;
  isUploading: boolean;
  onStop: () => void;
  onDiscard: () => void;
  onSubmit: () => void;
  error: string | null;
  primaryColor: string;
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50">
      {state === "asking" && (
        <p className="text-xs text-slate-600 text-center">Bitte Mikrofon erlauben…</p>
      )}

      {isRecording && (
        <>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-slate-700">
              {formatTime(elapsed)} / {formatTime(MAX_DURATION_SEC)}
            </span>
          </div>
          <button
            onClick={onStop}
            className="block w-full text-center text-white text-sm font-medium py-2 rounded-lg bg-red-500 hover:bg-red-600"
          >
            ◼ Stopp + Vorschau
          </button>
        </>
      )}

      {state === "preview" && audioUrl && (
        <>
          <audio src={audioUrl} controls className="w-full" />
          <div className="flex gap-2">
            <button
              onClick={onDiscard}
              disabled={isUploading}
              className="flex-1 text-center text-slate-700 text-sm font-medium py-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50"
            >
              Verwerfen
            </button>
            <button
              onClick={onSubmit}
              disabled={isUploading}
              className="flex-1 text-center text-white text-sm font-medium py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {isUploading ? "Lädt…" : "Absenden"}
            </button>
          </div>
          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
        </>
      )}
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function pickMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return null;
}

function blobExtension(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4")) return "mp4";
  if (mime.includes("mpeg")) return "mp3";
  return "webm";
}
