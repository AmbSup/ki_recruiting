"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Program = { id: string; name: string; company: { name: string } };

type ImportResult = {
  created: number;
  updated: number;
  skipped_terminal: number;
  skipped_invalid: number;
  errors: { row: number; reason: string }[];
};

const CSV_TEMPLATE = `phone,first_name,last_name,email,company_name,role,linkedin_url,notes
+436771234567,Anna,Beispiel,anna@example.at,ACME GmbH,CEO,https://linkedin.com/in/anna,Erstkontakt Messe
+4367712345678,Boris,Test,boris@test.com,Test AG,Sales Lead,,
`;

export default function SalesLeadsImportPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sales_programs")
      .select("id, name, company:companies(name)")
      .in("status", ["active", "draft", "paused"])
      .order("name")
      .then(({ data }) => { if (data) setPrograms(data as unknown as Program[]); });
  }, []);

  async function onFileSelect(f: File | null) {
    setFile(f); setResult(null); setError(null);
    if (!f) { setPreview([]); return; }
    const text = await f.text();
    const lines = text.split(/\r?\n/).slice(0, 6);
    setPreview(lines);
  }

  async function upload() {
    if (!programId) { setError("Bitte Program auswählen"); return; }
    if (!file) { setError("Bitte CSV-Datei auswählen"); return; }
    if (!consent) { setError("Bitte Opt-In bestätigen"); return; }
    setUploading(true); setError(null); setResult(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("sales_program_id", programId);
    fd.append("consent_confirmed", "true");

    const res = await fetch("/api/sales/leads/import", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);

    if (!res.ok) {
      setError(data.error ?? "Upload fehlgeschlagen");
      return;
    }
    setResult(data as ImportResult);
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales_leads_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="px-8 pt-10 pb-32 max-w-[900px]">
      <Link href="/sales/leads" className="inline-flex items-center gap-1.5 text-outline hover:text-on-surface transition-colors mb-8">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest">Zurück zur Liste</span>
      </Link>

      <div className="mb-8">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
          <Link href="/sales" className="hover:text-primary transition-colors">Sales</Link> ·
          <Link href="/sales/leads" className="hover:text-primary transition-colors ml-1">Leads</Link> ·
          Import
        </p>
        <h1 className="font-headline text-4xl italic text-on-surface leading-none mb-2">CSV Import</h1>
        <p className="font-body text-on-surface-variant">
          Leads hochladen. Dedupe auf <code>(program, phone)</code>. Terminale Status (contacted, meeting_booked, not_interested, do_not_call) werden nie auf &bdquo;Neu&ldquo; zurückgesetzt.
        </p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] space-y-5">
        <div>
          <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5">
            Ziel-Program *
          </label>
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className={inputClass}
          >
            <option value="">Program auswählen…</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · {p.company.name}</option>
            ))}
          </select>
          {programs.length === 0 && (
            <p className="font-label text-xs text-error mt-1.5">
              Noch kein Program. Zuerst unter <Link href="/sales/programs" className="underline">Sales → Programs</Link> anlegen.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-label text-xs font-bold uppercase tracking-widest text-outline">
              CSV-Datei *
            </label>
            <button
              onClick={downloadTemplate}
              className="font-label text-xs text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Template herunterladen
            </button>
          </div>
          <label className="flex items-center gap-3 border-2 border-dashed border-outline-variant/30 rounded-xl px-4 py-8 cursor-pointer hover:border-primary transition-colors bg-surface-container-low">
            <span className="material-symbols-outlined text-3xl text-outline">upload_file</span>
            <div className="flex-1">
              {file ? (
                <>
                  <div className="font-label text-xs font-bold text-on-surface">{file.name}</div>
                  <div className="font-label text-xs text-outline">{(file.size / 1024).toFixed(1)} KB · {preview.length - 1} Datenzeilen (Preview)</div>
                </>
              ) : (
                <>
                  <div className="font-label text-xs font-bold text-on-surface">Klicken oder Datei hierhin ziehen</div>
                  <div className="font-label text-xs text-outline">Nur CSV · Erste Zeile = Header</div>
                </>
              )}
            </div>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)} />
          </label>
          {preview.length > 0 && (
            <pre className="bg-surface-container-low rounded-xl px-3 py-2 mt-3 font-mono text-xs text-on-surface-variant overflow-x-auto max-h-48 overflow-y-auto whitespace-pre">
{preview.slice(0, 6).join("\n")}
            </pre>
          )}
        </div>

        <div className="bg-tertiary-container/20 border border-tertiary-container/40 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
            <div className="flex-1">
              <div className="font-label text-xs font-bold text-on-surface mb-1">
                Ich bestätige dokumentierten Opt-In *
              </div>
              <div className="font-body text-xs text-on-surface-variant">
                Für jeden Lead in dieser Datei liegt ein dokumentiertes Einverständnis zum telefonischen Kontakt vor (DSGVO). Ohne diese Bestätigung wird nicht importiert.
              </div>
            </div>
          </label>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-error-container/20 border border-error-container/40 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-error text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            <span className="font-body text-sm text-error">{error}</span>
          </div>
        )}

        <button
          onClick={upload}
          disabled={uploading || !file || !programId || !consent}
          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary rounded-xl py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">{uploading ? "progress_activity" : "upload"}</span>
          {uploading ? "Lädt…" : "Import starten"}
        </button>
      </div>

      {result && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] mt-6">
          <h3 className="font-headline text-2xl italic text-on-surface mb-4">Ergebnis</h3>
          <div className="grid grid-cols-4 gap-3 mb-5">
            <Stat label="Neu erstellt" value={result.created} color="text-primary" />
            <Stat label="Aktualisiert" value={result.updated} color="text-tertiary" />
            <Stat label="Terminal übersprungen" value={result.skipped_terminal} color="text-outline" />
            <Stat label="Ungültig" value={result.skipped_invalid} color="text-error" />
          </div>
          {result.errors.length > 0 && (
            <details className="bg-surface-container-low rounded-xl p-4">
              <summary className="font-label text-xs font-bold uppercase tracking-widest text-outline cursor-pointer">
                {result.errors.length} Fehler-Details
              </summary>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                {result.errors.slice(0, 20).map((e, i) => (
                  <li key={i} className="text-on-surface-variant">Zeile {e.row}: <span className="text-error">{e.reason}</span></li>
                ))}
                {result.errors.length > 20 && (
                  <li className="text-outline">… und {result.errors.length - 20} weitere</li>
                )}
              </ul>
            </details>
          )}
          <div className="mt-5">
            <Link href="/sales/leads" className="inline-flex items-center gap-2 text-primary hover:underline font-label text-xs font-bold uppercase tracking-widest">
              Zur Leads-Liste
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-4 text-center">
      <div className={`font-headline text-3xl ${color} leading-none`}>{value}</div>
      <div className="font-label text-xs font-bold uppercase tracking-widest text-outline mt-1">{label}</div>
    </div>
  );
}

const inputClass = "w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
