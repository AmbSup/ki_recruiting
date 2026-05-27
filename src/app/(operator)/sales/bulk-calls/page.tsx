"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Bulk-Calls — Upload CSV, importiert Leads über existing /api/sales/leads/import,
// dann iteriert per Batch über die zurückgegebenen lead_ids und feuert
// /api/sales/trigger-call. Live-Status via Polling der sales_calls-Tabelle.

type Program = { id: string; name: string; company: { name: string } };

type ImportResult = {
  created: number;
  updated: number;
  skipped_terminal: number;
  skipped_invalid: number;
  errors: { row: number; reason: string }[];
  lead_ids: string[];
};

type LeadRow = {
  id: string;
  phone: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  // Bulk-Run-State pro Lead. Initial 'queued'; via Batch-Engine 'in_flight';
  // via Polling der sales_calls → 'ringing', 'in_progress', 'completed',
  // 'failed'. Edge-Case: 'error' = trigger-call returnte 4xx/5xx (z.B. 409
  // active-call-Lock, 403 consent fehlt).
  status: "queued" | "in_flight" | "ringing" | "in_progress" | "completed" | "failed" | "error";
  call_id?: string | null;
  error_msg?: string | null;
};

const CSV_TEMPLATE = `phone,first_name,last_name,email,company_name,role,notes
+436771234567,Anna,Beispiel,anna@example.at,ACME GmbH,CEO,Erstkontakt Messe
+4367712345678,Boris,Test,boris@test.com,Test AG,Sales Lead,
`;

const FINAL_STATUSES = new Set(["completed", "failed", "error"]);
const POLL_INTERVAL_MS = 5000;

export default function BulkCallsPage() {
  // ─── Setup-State ─────────────────────────────────────────────────────────
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [concurrency, setConcurrency] = useState(5);

  // ─── Import-State ────────────────────────────────────────────────────────
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Bulk-Run-State ──────────────────────────────────────────────────────
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);   // Engine-Loop liest pausedRef.current
  const runIdRef = useRef(0);        // Stop-Button invalidiert Loop via Inkrement

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // ─── Programs laden ──────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sales_programs")
      .select("id, name, company:companies(name)")
      .in("status", ["active", "draft", "paused"])
      .order("name")
      .then(({ data }) => {
        if (data) setPrograms(data as unknown as Program[]);
      });
  }, []);

  // ─── CSV-Datei einlesen + Preview ────────────────────────────────────────
  async function onFileSelect(f: File | null) {
    setFile(f);
    setImportResult(null);
    setError(null);
    setLeads([]);
    if (!f) { setPreview([]); return; }
    const text = await f.text();
    const lines = text.split(/\r?\n/).slice(0, 6);
    setPreview(lines);
  }

  // ─── Import-Step: existing CSV-Import-Endpoint aufrufen ──────────────────
  async function startImport() {
    if (!programId) { setError("Bitte Program auswählen"); return; }
    if (!file) { setError("Bitte CSV-Datei auswählen"); return; }
    if (!consent) { setError("Bitte Opt-In bestätigen"); return; }

    setImporting(true);
    setError(null);
    setImportResult(null);
    setLeads([]);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("sales_program_id", programId);
    fd.append("consent_confirmed", "true");

    const res = await fetch("/api/sales/leads/import", { method: "POST", body: fd });
    const data = await res.json();
    setImporting(false);

    if (!res.ok) {
      setError(data.error ?? "Import fehlgeschlagen");
      return;
    }
    setImportResult(data as ImportResult);

    // Lead-Rows aus DB nachladen, damit wir Name/Phone in der Tabelle anzeigen
    if (Array.isArray(data.lead_ids) && data.lead_ids.length > 0) {
      const supabase = createClient();
      const { data: leadRows } = await supabase
        .from("sales_leads")
        .select("id, phone, full_name, first_name, last_name, company_name")
        .in("id", data.lead_ids);
      if (leadRows) {
        setLeads(
          (leadRows as Array<{
            id: string; phone: string; full_name: string | null;
            first_name: string | null; last_name: string | null; company_name: string | null;
          }>).map((l) => ({ ...l, status: "queued" as const })),
        );
      }
    }
  }

  // ─── Trigger-Call pro Lead-ID (mit X-Webhook-Secret? NEIN — der Operator
  // ist eingeloggt, requireWriterOrN8n erlaubt Session-Auth über cookies) ──
  const triggerOne = useCallback(async (leadId: string): Promise<{ success: boolean; call_id?: string; error?: string }> => {
    try {
      const res = await fetch("/api/sales/trigger-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales_lead_id: leadId }),
      });
      const data = await res.json();
      if (res.ok) return { success: true, call_id: data.sales_call_id };
      return { success: false, error: data.error ?? `HTTP ${res.status}` };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Network error" };
    }
  }, []);

  // ─── Batch-Engine: hält max `concurrency` parallele Calls am Laufen ──────
  const startBulk = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setPaused(false);
    pausedRef.current = false;
    const myRunId = ++runIdRef.current;

    // Queue: alle leads die noch nicht 'completed/failed/error' sind
    const queue: string[] = leads.filter((l) => l.status === "queued").map((l) => l.id);
    let inFlight = 0;

    // Hilfs-Funktion: einen Lead pro Slot pushen
    const launch = async (leadId: string) => {
      // Mark in_flight
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: "in_flight" } : l));
      const r = await triggerOne(leadId);
      if (runIdRef.current !== myRunId) return;   // Stop wurde geklickt
      if (r.success) {
        // trigger-call hat eine sales_calls-Row angelegt → status='initiated',
        // wird vom Polling weiter auf ringing/in_progress/completed gesetzt.
        setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: "ringing", call_id: r.call_id ?? null } : l));
      } else {
        setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: "error", error_msg: r.error ?? null } : l));
      }
      inFlight--;
    };

    // Loop: solange Queue + In-Flight nicht 0, slots auffüllen
    while ((queue.length > 0 || inFlight > 0) && runIdRef.current === myRunId) {
      if (pausedRef.current) {
        await sleep(500);
        continue;
      }
      while (inFlight < concurrency && queue.length > 0 && !pausedRef.current) {
        const leadId = queue.shift()!;
        inFlight++;
        void launch(leadId);
      }
      await sleep(500);
    }

    if (runIdRef.current === myRunId) {
      setRunning(false);
    }
  }, [concurrency, leads, running, triggerOne]);

  function pauseBulk() { setPaused(true); }
  function resumeBulk() { setPaused(false); }
  function stopBulk() {
    runIdRef.current++;   // alle laufenden Loops invalidieren
    setRunning(false);
    setPaused(false);
    // Queue-Stop: alle 'queued' bleiben queued, können später wieder via Start gestartet werden
  }

  // ─── Polling: sales_calls nach Status pro lead_id ────────────────────────
  useEffect(() => {
    if (leads.length === 0) return;
    const supabase = createClient();
    let cancelled = false;
    const poll = async () => {
      const activeIds = leads
        .filter((l) => l.call_id && !FINAL_STATUSES.has(l.status))
        .map((l) => l.call_id as string);
      if (activeIds.length === 0) return;
      const { data } = await supabase
        .from("sales_calls")
        .select("id, sales_lead_id, status, end_reason")
        .in("id", activeIds);
      if (cancelled || !data) return;
      setLeads((prev) => prev.map((l) => {
        if (!l.call_id) return l;
        const c = (data as Array<{ id: string; sales_lead_id: string; status: string; end_reason: string | null }>).find((x) => x.id === l.call_id);
        if (!c) return l;
        // Mapping sales_calls.status → UI-Status. 'completed' kommt mit end_reason.
        if (c.status === "completed") return { ...l, status: "completed", error_msg: c.end_reason };
        if (c.status === "failed") return { ...l, status: "failed", error_msg: c.end_reason };
        if (c.status === "in_progress") return { ...l, status: "in_progress" };
        if (c.status === "ringing") return { ...l, status: "ringing" };
        return l;
      }));
    };
    const iv = setInterval(poll, POLL_INTERVAL_MS);
    void poll();
    return () => { cancelled = true; clearInterval(iv); };
  }, [leads]);

  // ─── Counters ────────────────────────────────────────────────────────────
  const counters = leads.reduce(
    (acc, l) => {
      acc.total++;
      if (l.status === "queued") acc.queued++;
      else if (l.status === "in_flight" || l.status === "ringing" || l.status === "in_progress") acc.inFlight++;
      else if (l.status === "completed") acc.completed++;
      else if (l.status === "failed" || l.status === "error") acc.failed++;
      return acc;
    },
    { total: 0, queued: 0, inFlight: 0, completed: 0, failed: 0 },
  );

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_calls_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="px-8 pt-10 pb-32 max-w-[1200px]">
      <Link href="/sales" className="inline-flex items-center gap-1.5 text-outline hover:text-on-surface transition-colors mb-8">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest">Zurück zu Sales</span>
      </Link>

      <div className="mb-8">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
          <Link href="/sales" className="hover:text-primary transition-colors">Sales</Link> · Massen-Anrufe
        </p>
        <h1 className="font-headline text-4xl italic text-on-surface leading-none mb-2">Bulk Calls</h1>
        <p className="font-body text-on-surface-variant">
          Liste hochladen → Agent wählen → automatisch Calls auslösen. Ergebnisse landen in <Link href="/sales/calls" className="text-primary hover:underline">Calls</Link>.
        </p>
      </div>

      {/* Setup */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] space-y-5">
        <div>
          <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5">
            Ziel-Program (Agent) *
          </label>
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className={inputClass}
            disabled={importing || running}
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
              type="button"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Template
            </button>
          </div>
          <label className={`flex items-center gap-3 border-2 border-dashed border-outline-variant/30 rounded-xl px-4 py-8 hover:border-primary transition-colors bg-surface-container-low ${importing || running ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
            <span className="material-symbols-outlined text-3xl text-outline">upload_file</span>
            <div className="flex-1">
              {file ? (
                <>
                  <div className="font-label text-xs font-bold text-on-surface">{file.name}</div>
                  <div className="font-label text-xs text-outline">{(file.size / 1024).toFixed(1)} KB · {Math.max(0, preview.length - 1)} Datenzeilen (Preview)</div>
                </>
              ) : (
                <>
                  <div className="font-label text-xs font-bold text-on-surface">Klicken oder CSV hierhin ziehen</div>
                  <div className="font-label text-xs text-outline">Pflicht-Spalte: <code>phone</code>. Optional: first_name, last_name, email, company_name, role, notes</div>
                </>
              )}
            </div>
            <input type="file" accept=".csv,text/csv" className="hidden" disabled={importing || running} onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)} />
          </label>
          {preview.length > 0 && (
            <pre className="bg-surface-container-low rounded-xl px-3 py-2 mt-3 font-mono text-xs text-on-surface-variant overflow-x-auto max-h-32 overflow-y-auto whitespace-pre">
{preview.slice(0, 6).join("\n")}
            </pre>
          )}
        </div>

        <div>
          <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5">
            Parallel-Calls: <span className="text-primary">{concurrency}</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={concurrency}
            onChange={(e) => setConcurrency(Number(e.target.value))}
            className="w-full accent-primary"
            disabled={running}
          />
          <p className="font-label text-[10px] text-outline mt-1">
            Empfohlen: 5. Höher = schneller, aber Vapi/Twilio-Rate-Limits beachten.
          </p>
        </div>

        <div className="bg-tertiary-container/20 border border-tertiary-container/40 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" disabled={importing || running} />
            <div className="flex-1">
              <div className="font-label text-xs font-bold text-on-surface mb-1">
                Ich bestätige dokumentierten Opt-In *
              </div>
              <div className="font-body text-xs text-on-surface-variant">
                Für jeden Lead in dieser Datei liegt ein dokumentiertes Einverständnis zum telefonischen Kontakt durch einen KI-Assistenten vor (DSGVO / EU AI Act Art. 50).
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
          onClick={startImport}
          disabled={importing || running || !file || !programId || !consent}
          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary rounded-xl py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-sm">{importing ? "progress_activity" : "upload"}</span>
          {importing ? "Importiere…" : "1. Liste importieren"}
        </button>
      </div>

      {/* Import-Result-Stats */}
      {importResult && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] mt-6">
          <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-4">Import-Ergebnis</h3>
          <div className="grid grid-cols-4 gap-3">
            <Stat label="Neu erstellt" value={importResult.created} color="text-primary" />
            <Stat label="Aktualisiert" value={importResult.updated} color="text-tertiary" />
            <Stat label="Terminal übersprungen" value={importResult.skipped_terminal} color="text-outline" />
            <Stat label="Ungültig" value={importResult.skipped_invalid} color="text-error" />
          </div>
          {importResult.errors.length > 0 && (
            <details className="bg-surface-container-low rounded-xl p-4 mt-4">
              <summary className="font-label text-xs font-bold uppercase tracking-widest text-outline cursor-pointer">
                {importResult.errors.length} Fehler-Details
              </summary>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                {importResult.errors.slice(0, 20).map((e, i) => (
                  <li key={i} className="text-on-surface-variant">Zeile {e.row}: <span className="text-error">{e.reason}</span></li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Bulk-Run-Tabelle + Controls */}
      {leads.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] mt-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h3 className="font-headline text-2xl italic text-on-surface mb-1">Anrufe</h3>
              <p className="font-label text-xs text-outline">
                Total {counters.total} · Wartet {counters.queued} · Läuft {counters.inFlight} · Fertig {counters.completed} · Fehler {counters.failed}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!running && counters.queued > 0 && (
                <button
                  onClick={startBulk}
                  className="flex items-center gap-2 bg-primary text-on-primary rounded-xl px-5 py-2.5 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  2. Calls starten
                </button>
              )}
              {running && !paused && (
                <button
                  onClick={pauseBulk}
                  className="flex items-center gap-2 bg-surface-container-high text-on-surface rounded-xl px-4 py-2.5 font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container-highest transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">pause</span>
                  Pausieren
                </button>
              )}
              {running && paused && (
                <button
                  onClick={resumeBulk}
                  className="flex items-center gap-2 bg-primary text-on-primary rounded-xl px-4 py-2.5 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  Fortsetzen
                </button>
              )}
              {running && (
                <button
                  onClick={stopBulk}
                  className="flex items-center gap-2 border border-error/40 text-error rounded-xl px-4 py-2.5 font-label text-xs font-bold uppercase tracking-widest hover:bg-error-container/10 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">stop</span>
                  Stopp
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20 text-outline">
                  <th className="text-left font-label text-xs font-bold uppercase tracking-widest py-2">Name</th>
                  <th className="text-left font-label text-xs font-bold uppercase tracking-widest py-2">Telefon</th>
                  <th className="text-left font-label text-xs font-bold uppercase tracking-widest py-2">Firma</th>
                  <th className="text-left font-label text-xs font-bold uppercase tracking-widest py-2">Status</th>
                  <th className="text-left font-label text-xs font-bold uppercase tracking-widest py-2">Call</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const name = l.full_name || [l.first_name, l.last_name].filter(Boolean).join(" ") || "—";
                  return (
                    <tr key={l.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/40">
                      <td className="py-2.5 font-body text-on-surface">{name}</td>
                      <td className="py-2.5 font-mono text-xs text-on-surface-variant">{l.phone}</td>
                      <td className="py-2.5 font-body text-xs text-on-surface-variant">{l.company_name || "—"}</td>
                      <td className="py-2.5">
                        <StatusBadge status={l.status} errorMsg={l.error_msg ?? null} />
                      </td>
                      <td className="py-2.5">
                        {l.call_id ? (
                          <Link href={`/sales/calls/${l.call_id}`} className="text-primary hover:underline font-label text-xs">
                            Öffnen →
                          </Link>
                        ) : <span className="text-outline text-xs">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

function StatusBadge({ status, errorMsg }: { status: LeadRow["status"]; errorMsg: string | null }) {
  const cfg: Record<LeadRow["status"], { label: string; cls: string }> = {
    queued:      { label: "Warteschlange", cls: "bg-surface-container-high text-on-surface-variant" },
    in_flight:   { label: "Wird gestartet", cls: "bg-tertiary-container/40 text-on-tertiary-container" },
    ringing:     { label: "Klingelt",       cls: "bg-tertiary-container/60 text-on-tertiary-container" },
    in_progress: { label: "Im Gespräch",    cls: "bg-primary-container/50 text-on-primary-container" },
    completed:   { label: "Abgeschlossen",  cls: "bg-primary-container text-on-primary-container" },
    failed:      { label: "Fehlgeschlagen", cls: "bg-error-container/60 text-on-error-container" },
    error:       { label: "Fehler",         cls: "bg-error-container/60 text-on-error-container" },
  };
  const { label, cls } = cfg[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-label text-xs font-bold ${cls}`} title={errorMsg ?? undefined}>
      {label}
    </span>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const inputClass = "w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
