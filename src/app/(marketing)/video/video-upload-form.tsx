"use client";

import { CheckCircle2, FileVideo2, LoaderCircle, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const MAX_FILES = 8;

type UploadTicket = { url: string; key: string; label: string };

export function VideoUploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function selectFiles(incoming: FileList | File[]) {
    setError("");
    const next = Array.from(incoming);
    if (files.length + next.length > MAX_FILES) {
      setError(`Du kannst maximal ${MAX_FILES} Videos pro Auftrag hochladen.`);
      return;
    }
    if (next.some((file) => file.type !== "video/mp4" && !file.name.toLowerCase().endsWith(".mp4"))) {
      setError("Bitte lade ausschließlich MP4-Videos hoch.");
      return;
    }
    if (next.some((file) => file.size > MAX_FILE_SIZE)) {
      setError("Ein Video ist größer als 500 MB.");
      return;
    }
    setFiles((current) => [...current, ...next]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files.length) {
      setError("Wähle mindestens ein Video aus.");
      return;
    }

    setBusy(true);
    setError("");
    setStatus("Upload wird vorbereitet …");
    const form = new FormData(event.currentTarget);

    try {
      const startResponse = await fetch("/api/video-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          consent: form.get("consent") === "on",
          website: form.get("website"),
          files: files.map((file) => ({ name: file.name, size: file.size, type: file.type })),
        }),
      });
      const startData = await startResponse.json() as { projectId?: string; uploads?: UploadTicket[]; completionToken?: string; error?: string };
      if (!startResponse.ok || !startData.projectId || !startData.uploads || !startData.completionToken) throw new Error(startData.error || "Upload konnte nicht gestartet werden.");

      for (let index = 0; index < files.length; index += 1) {
        setStatus(`Video ${index + 1} von ${files.length} wird hochgeladen …`);
        const response = await fetch(startData.uploads[index].url, {
          method: "PUT",
          headers: { "Content-Type": "video/mp4" },
          body: files[index],
        });
        if (!response.ok) throw new Error(`„${files[index].name}“ konnte nicht hochgeladen werden.`);
      }

      setStatus("Upload wird abgeschlossen …");
      const completeResponse = await fetch("/api/video-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          projectId: startData.projectId,
          completionToken: startData.completionToken,
          uploads: startData.uploads.map(({ key, label }) => ({ key, label })),
        }),
      });
      const completeData = await completeResponse.json() as { error?: string };
      if (!completeResponse.ok) throw new Error(completeData.error || "Upload konnte nicht abgeschlossen werden.");

      setDone(true);
      setStatus("");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload fehlgeschlagen. Bitte versuche es erneut.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-[30rem] flex-col items-center justify-center px-6 text-center">
        <CheckCircle2 className="mb-5 h-12 w-12 text-primary" aria-hidden="true" />
        <h2 className="text-3xl font-semibold">Deine Videos sind angekommen.</h2>
        <p className="mt-3 max-w-md text-on-surface-variant">Ich prüfe dein Material und melde mich über deine angegebenen Kontaktdaten.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" autoComplete="name" placeholder="Vor- und Nachname" />
        <Field label="E-Mail" name="email" type="email" autoComplete="email" placeholder="name@unternehmen.at" />
        <div className="sm:col-span-2">
          <Field label="Telefonnummer" name="phone" type="tel" autoComplete="tel" placeholder="+43 …" />
        </div>
      </div>

      <label
        className={`mt-6 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-colors ${dragging ? "border-primary bg-primary-container" : "border-outline-variant bg-surface hover:border-primary"}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); selectFiles(event.dataTransfer.files); }}
      >
        <UploadCloud className="mb-4 h-9 w-9 text-primary" aria-hidden="true" />
        <span className="font-semibold text-on-surface">Videos hier ablegen oder auswählen</span>
        <span className="mt-2 text-sm text-on-surface-variant">Bis zu {MAX_FILES} MP4-Dateien, jeweils maximal 500 MB</span>
        <input ref={inputRef} className="sr-only" type="file" accept="video/mp4,.mp4" multiple onChange={(event) => event.target.files && selectFiles(event.target.files)} />
      </label>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2" aria-label="Ausgewählte Videos">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.lastModified}`} className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 text-sm">
              <FileVideo2 className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
              <span className="text-on-surface-variant">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
              <button type="button" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface" aria-label={`${file.name} entfernen`}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="sr-only" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-on-surface-variant">
        <input required name="consent" type="checkbox" className="mt-1 h-4 w-4 accent-[#0095B3]" />
        <span>Ich stimme der Verarbeitung meiner Angaben und Videos zur Bearbeitung meiner Anfrage gemäß der <a className="font-medium text-primary underline underline-offset-4" href="https://www.neuronic-automation.ai/datenschutz" target="_blank" rel="noreferrer">Datenschutzerklärung</a> zu.</span>
      </label>

      {error && <p role="alert" className="mt-5 rounded-xl bg-error-container/20 px-4 py-3 text-sm font-medium text-error">{error}</p>}
      {status && <p role="status" className="mt-5 text-sm font-medium text-primary">{status}</p>}

      <button disabled={busy} type="submit" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-dim disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> : <UploadCloud className="h-5 w-5" aria-hidden="true" />}
        {busy ? "Videos werden hochgeladen" : "Videos sicher hochladen"}
      </button>
    </form>
  );
}

function Field({ label, name, type = "text", autoComplete, placeholder }: { label: string; name: string; type?: string; autoComplete: string; placeholder: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-on-surface">
      {label}
      <input required name={name} type={type} autoComplete={autoComplete} placeholder={placeholder} className="min-h-12 rounded-xl border border-outline-variant bg-white px-4 font-normal text-on-surface outline-none transition-shadow placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary-container" />
    </label>
  );
}
