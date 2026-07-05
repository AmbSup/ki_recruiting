"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Program = { id: string; name: string; company: { name: string } };

type ScrapeResult = {
  run_log_id: string;
  actor_run_id?: string;
  status: "running" | "succeeded" | "failed" | "budget_blocked";
  places_scraped?: number;
  leads_created?: number;
  leads_updated?: number;
  leads_skipped_terminal?: number;
  leads_skipped_invalid_phone?: number;
  cost_usd?: number;
  cost_eur?: number;
  error?: string;
  message?: string;
  budget_eur?: number;
  spent_eur?: number;
  projected_eur?: number;
};

type PollResult = {
  status: string;
  actual_count?: number;
  cost_usd?: number;
  cost_eur?: number;
  leads_created?: number;
  leads_updated?: number;
  leads_skipped_terminal?: number;
  leads_skipped_invalid_phone?: number;
  error_message?: string;
  apify_status?: string;
};

type RecentRun = {
  id: string;
  keyword: string;
  location: string;
  requested_count: number;
  actual_count: number | null;
  cost_eur: number | null;
  status: string;
  created_at: string;
};

export default function SalesLeadsScrapePage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("Wien, Österreich");
  const [maxResults, setMaxResults] = useState(100);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [polling, setPolling] = useState(false);
  const [pollResult, setPollResult] = useState<PollResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentRun[]>([]);
  const [monthSpentEur, setMonthSpentEur] = useState(0);

  const loadRecentRuns = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("apify_scrape_runs")
      .select("id, keyword, location, requested_count, actual_count, cost_eur, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    setRecent((data ?? []) as RecentRun[]);

    // Monat-bisher: Summe cost_eur
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { data: monthRuns } = await supabase
      .from("apify_scrape_runs")
      .select("cost_eur")
      .gte("created_at", monthStart.toISOString())
      .in("status", ["succeeded", "running"]);
    const spent = (monthRuns ?? []).reduce(
      (s, r) => s + (typeof r.cost_eur === "number" ? r.cost_eur : 0),
      0,
    );
    setMonthSpentEur(spent);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sales_programs")
      .select("id, name, company:companies(name)")
      .in("status", ["active", "draft", "paused"])
      .order("name")
      .then(({ data }) => { if (data) setPrograms(data as unknown as Program[]); });
    loadRecentRuns();
  }, [loadRecentRuns]);

  async function startScrape() {
    setError(null);
    setResult(null);
    setPollResult(null);
    if (!programId) { setError("Bitte Program auswählen"); return; }
    if (!keyword.trim()) { setError("Keyword fehlt"); return; }
    if (!location.trim()) { setError("Ort fehlt"); return; }

    setRunning(true);
    try {
      const res = await fetch("/api/sales/leads/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sales_program_id: programId,
          keyword: keyword.trim(),
          location: location.trim(),
          max_results: maxResults,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          setError(
            `Budget überschritten (€${data.budget_eur} Cap): bereits €${data.spent_eur} verbraucht, dieser Run würde €${data.projected_eur} kosten.`,
          );
        } else {
          setError(data.error ?? `Fehler ${res.status}`);
        }
      } else {
        setResult(data as ScrapeResult);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
      loadRecentRuns();
    }
  }

  async function pollRun() {
    if (!result?.run_log_id) return;
    setPolling(true);
    try {
      const res = await fetch(`/api/sales/leads/scrape/${result.run_log_id}`);
      const data = await res.json();
      setPollResult(data as PollResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPolling(false);
      loadRecentRuns();
    }
  }

  // Server-side authoritative cap in APIFY_MONTHLY_BUDGET_EUR. UI zeigt hier
  // nur den Anzeige-Default; wenn Server ablehnt (402), enthält die
  // Fehlermeldung die tatsächlichen Beträge.
  const budgetEur = 30;
  const budgetRemaining = Math.max(0, budgetEur - monthSpentEur);
  const budgetPct = Math.min(100, (monthSpentEur / budgetEur) * 100);

  return (
    <div className="px-8 pt-10 pb-32 max-w-5xl">
      <div className="mb-10">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
          <Link href="/sales-dashboard" className="hover:text-primary">Sales</Link> ·{" "}
          <Link href="/sales/leads" className="hover:text-primary">Leads</Link> · Scraper
        </p>
        <h1 className="font-headline text-5xl italic text-on-surface leading-none">
          Google-Maps-Scraper
        </h1>
        <p className="font-body text-on-surface-variant mt-2">
          Discovery-Leads aus Google-Maps ziehen (Apify). Landen in{" "}
          <code className="text-xs bg-surface-container-lowest px-1.5 py-0.5 rounded">
            status=discovered
          </code>{" "}
          + <code className="text-xs bg-surface-container-lowest px-1.5 py-0.5 rounded">
            consent_given=false
          </code>{" "}
          — Nur für E-Mail-Outreach via Instantly nutzen. Voice-Calls erst nach expliziter Einwilligung.
        </p>
      </div>

      {/* Budget-Übersicht */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 mb-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-widest text-outline">
              Apify-Budget diesen Monat
            </p>
            <p className="font-headline text-3xl italic text-on-surface mt-1">
              €{monthSpentEur.toFixed(2)} <span className="text-outline">/ €{budgetEur.toFixed(2)}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-label text-xs text-outline">Restbudget</p>
            <p className="font-headline text-2xl italic text-primary">€{budgetRemaining.toFixed(2)}</p>
          </div>
        </div>
        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${budgetPct}%` }}
          />
        </div>
      </div>

      {/* Scrape-Formular */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 mb-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
              Sales-Program
            </label>
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-high border-none font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">— Program wählen —</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.company?.name ? `${p.company.name} — ${p.name}` : p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
              Branche / Keyword
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="z.B. Bäckerei, Kfz-Werkstatt, Physiotherapie"
              className="w-full px-4 py-3 rounded-xl bg-surface-container-high border-none font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
              Ort / Region
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="z.B. Wien, Österreich"
              className="w-full px-4 py-3 rounded-xl bg-surface-container-high border-none font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
              Max Ergebnisse
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-high border-none font-body text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="mt-1 font-body text-[11px] text-outline">
              geschätzt ~€{(maxResults * 0.009 * 0.93).toFixed(2)} (bei $0.009/Place)
            </p>
          </div>
          <div className="flex items-end">
            <button
              onClick={startScrape}
              disabled={running || budgetRemaining <= 0}
              className="w-full bg-primary text-on-primary rounded-xl px-5 py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {running ? (
                <>
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  Scraper läuft…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">search</span>
                  Scrape starten
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-error-container/20 text-error rounded-xl font-body text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Aktueller Run-Status */}
      {result && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 mb-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
          <h3 className="font-headline text-xl italic text-on-surface mb-4">
            Run-Ergebnis
          </h3>
          {result.status === "succeeded" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Places gescraped" value={String(result.places_scraped ?? 0)} />
              <Stat label="Leads erstellt" value={String(result.leads_created ?? 0)} accent />
              <Stat label="Leads aktualisiert" value={String(result.leads_updated ?? 0)} />
              <Stat label="Übersprungen" value={String((result.leads_skipped_terminal ?? 0) + (result.leads_skipped_invalid_phone ?? 0))} />
              <Stat label="Kosten (EUR)" value={`€${(result.cost_eur ?? 0).toFixed(2)}`} accent />
              <Stat label="Kosten (USD)" value={`$${(result.cost_usd ?? 0).toFixed(2)}`} />
            </div>
          )}
          {result.status === "running" && (
            <div>
              <p className="font-body text-on-surface-variant mb-4">
                Actor läuft im Hintergrund. Klick auf Refresh um den Status zu prüfen — der Scraper importiert Leads automatisch sobald er fertig ist.
              </p>
              <button
                onClick={pollRun}
                disabled={polling}
                className="bg-primary text-on-primary rounded-xl px-4 py-2 font-label text-xs font-bold uppercase tracking-widest disabled:opacity-40"
              >
                {polling ? "Prüfe…" : "Refresh"}
              </button>
              {pollResult && (
                <div className="mt-4">
                  <p className="font-body text-sm text-on-surface-variant">
                    Apify-Status: <span className="font-semibold">{pollResult.apify_status ?? pollResult.status}</span>
                  </p>
                  {pollResult.status === "succeeded" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <Stat label="Places" value={String(pollResult.actual_count ?? 0)} />
                      <Stat label="Leads erstellt" value={String(pollResult.leads_created ?? 0)} accent />
                      <Stat label="Kosten (EUR)" value={`€${(pollResult.cost_eur ?? 0).toFixed(2)}`} accent />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Letzte Runs */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
        <h3 className="font-headline text-xl italic text-on-surface mb-4">Letzte Scrape-Runs</h3>
        {recent.length === 0 ? (
          <p className="font-body text-sm text-outline">Noch keine Scrape-Runs.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left font-label text-xs uppercase tracking-widest text-outline">
                  <th className="pb-3">Datum</th>
                  <th className="pb-3">Keyword</th>
                  <th className="pb-3">Ort</th>
                  <th className="pb-3 text-right">Angefragt</th>
                  <th className="pb-3 text-right">Tatsächlich</th>
                  <th className="pb-3 text-right">Kosten</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t border-outline-variant/20">
                    <td className="py-3 font-body text-outline text-xs">
                      {new Date(r.created_at).toLocaleString("de-AT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 font-body">{r.keyword}</td>
                    <td className="py-3 font-body text-outline">{r.location}</td>
                    <td className="py-3 font-body text-right font-mono">{r.requested_count}</td>
                    <td className="py-3 font-body text-right font-mono">{r.actual_count ?? "—"}</td>
                    <td className="py-3 font-body text-right font-mono">
                      {r.cost_eur != null ? `€${r.cost_eur.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3">
                      <StatusChip status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-1">
        {label}
      </p>
      <p className={`font-headline text-2xl italic ${accent ? "text-primary" : "text-on-surface"}`}>
        {value}
      </p>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    running:        { label: "Läuft",        bg: "bg-primary-container/40",  text: "text-primary" },
    succeeded:      { label: "Erfolgreich",  bg: "bg-tertiary-container/40", text: "text-tertiary" },
    failed:         { label: "Fehler",       bg: "bg-error-container/30",    text: "text-error" },
    budget_blocked: { label: "Budget-Stopp", bg: "bg-error-container/20",    text: "text-error" },
  };
  const c = config[status] ?? { label: status, bg: "bg-surface-container", text: "text-outline" };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full font-label text-[10px] font-bold uppercase tracking-widest ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}
