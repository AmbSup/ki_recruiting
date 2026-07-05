import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriter } from "@/lib/auth/guards";
import { startGmapsScrape, waitForRun, fetchDataset } from "@/lib/apify/client";
import { normalizePlace, USD_TO_EUR } from "@/lib/apify/normalize";
import { isTerminalSalesStatus } from "@/lib/phone";

export const maxDuration = 60;

// Apify actor "compass~crawler-google-places" costs ~$9 per 1000 places.
// This value is a safety-cap projection; actual cost is written back from
// run.usageUsd after completion.
const APIFY_COST_PER_PLACE_USD = 0.009;

/**
 * POST /api/sales/leads/scrape
 *
 * Body: { keyword: string; location: string; sales_program_id: string; max_results: number }
 *
 * Fluss:
 *  1. Auth (writer role)
 *  2. Budget-Guard: aktuelle Monatssumme + projizierte Kosten <= APIFY_MONTHLY_BUDGET_EUR?
 *  3. INSERT apify_scrape_runs (status='running', actor_run_id NULL)
 *  4. Start Apify actor
 *  5. Warte bis SUCCEEDED oder max 50s
 *  6. Falls fertig: Dataset holen, normalisieren, upsert in sales_leads
 *  7. UPDATE apify_scrape_runs (status='succeeded', actual_count, cost_usd, cost_eur)
 *  8. Falls Timeout: UPDATE mit actor_run_id, status='running' — Client pollt via GET /[run_id]
 */
export async function POST(req: NextRequest) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;

  const token = process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_GMAPS_ACTOR_ID || "compass~crawler-google-places";
  const budgetEurRaw = process.env.APIFY_MONTHLY_BUDGET_EUR;
  if (!token) {
    return NextResponse.json({ error: "APIFY_API_TOKEN nicht konfiguriert" }, { status: 500 });
  }
  const budgetEur = budgetEurRaw ? Number(budgetEurRaw) : 30;
  if (!Number.isFinite(budgetEur) || budgetEur <= 0) {
    return NextResponse.json({ error: "APIFY_MONTHLY_BUDGET_EUR ist ungültig" }, { status: 500 });
  }

  let body: {
    keyword?: string;
    location?: string;
    sales_program_id?: string;
    max_results?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request-Body ist kein JSON" }, { status: 400 });
  }

  const keyword = (body.keyword ?? "").trim();
  const location = (body.location ?? "").trim();
  const salesProgramId = body.sales_program_id;
  const maxResults = Math.max(1, Math.min(1000, Number(body.max_results) || 100));

  if (!keyword) return NextResponse.json({ error: "keyword fehlt" }, { status: 422 });
  if (!location) return NextResponse.json({ error: "location fehlt" }, { status: 422 });
  if (!salesProgramId) return NextResponse.json({ error: "sales_program_id fehlt" }, { status: 422 });

  const supabase = createAdminClient();

  // Program existence + fetch für spätere Referenz
  const { data: program } = await supabase
    .from("sales_programs")
    .select("id")
    .eq("id", salesProgramId)
    .maybeSingle();
  if (!program) {
    return NextResponse.json({ error: "sales_program nicht gefunden" }, { status: 404 });
  }

  // Budget-Guard: Summe der bereits-verbrauchten EUR im laufenden Kalendermonat
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const { data: monthRuns } = await supabase
    .from("apify_scrape_runs")
    .select("cost_eur")
    .gte("created_at", monthStart.toISOString())
    .in("status", ["succeeded", "running"]);
  const spentEur = (monthRuns ?? []).reduce(
    (s, r) => s + (typeof r.cost_eur === "number" ? r.cost_eur : 0),
    0,
  );
  const projectedRunEur = maxResults * APIFY_COST_PER_PLACE_USD * USD_TO_EUR;
  if (spentEur + projectedRunEur > budgetEur) {
    // Log the block for audit
    await supabase.from("apify_scrape_runs").insert({
      keyword,
      location,
      sales_program_id: salesProgramId,
      requested_count: maxResults,
      status: "budget_blocked",
      error_message: `Budget €${budgetEur} überschritten: verbraucht €${spentEur.toFixed(2)}, projiziert €${projectedRunEur.toFixed(2)}`,
      created_by: auth.userId,
    });
    return NextResponse.json(
      {
        error: "budget_exceeded",
        budget_eur: budgetEur,
        spent_eur: Number(spentEur.toFixed(2)),
        projected_eur: Number(projectedRunEur.toFixed(2)),
      },
      { status: 402 },
    );
  }

  // INSERT run-log als "running" — falls Actor-Start fehlschlägt, machen wir daraus failed
  const { data: runRow, error: runInsertErr } = await supabase
    .from("apify_scrape_runs")
    .insert({
      keyword,
      location,
      sales_program_id: salesProgramId,
      requested_count: maxResults,
      status: "running",
      created_by: auth.userId,
    })
    .select("id")
    .single();
  if (runInsertErr || !runRow) {
    return NextResponse.json(
      { error: "run-log-insert-failed", details: runInsertErr?.message },
      { status: 500 },
    );
  }
  const runLogId = runRow.id;

  // Apify Actor starten
  let apifyRun;
  try {
    apifyRun = await startGmapsScrape({
      token,
      actorId,
      input: {
        searchStringsArray: [keyword],
        locationQuery: location,
        maxCrawledPlacesPerSearch: maxResults,
        language: "de",
        includeWebResults: true,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from("apify_scrape_runs")
      .update({ status: "failed", error_message: msg, completed_at: new Date().toISOString() })
      .eq("id", runLogId);
    return NextResponse.json({ error: "apify_start_failed", details: msg }, { status: 502 });
  }

  await supabase
    .from("apify_scrape_runs")
    .update({ actor_run_id: apifyRun.id })
    .eq("id", runLogId);

  // Warte bis Actor fertig oder 50s Timeout
  const final = await waitForRun({ token, runId: apifyRun.id, maxWaitMs: 50_000 });

  if (final.status === "SUCCEEDED") {
    const ingest = await ingestDataset({
      token,
      datasetId: final.defaultDatasetId,
      salesProgramId,
      supabase,
    });
    const costUsd = typeof final.usageUsd === "number" ? final.usageUsd : projectedRunEur / USD_TO_EUR;
    const costEur = Number((costUsd * USD_TO_EUR).toFixed(4));
    await supabase
      .from("apify_scrape_runs")
      .update({
        status: "succeeded",
        actual_count: ingest.total,
        cost_usd: costUsd,
        cost_eur: costEur,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runLogId);
    return NextResponse.json({
      run_log_id: runLogId,
      actor_run_id: apifyRun.id,
      status: "succeeded",
      places_scraped: ingest.total,
      leads_created: ingest.created,
      leads_updated: ingest.updated,
      leads_skipped_terminal: ingest.skippedTerminal,
      leads_skipped_invalid_phone: ingest.skippedInvalid,
      cost_usd: costUsd,
      cost_eur: costEur,
    });
  }

  if (final.status === "FAILED" || final.status === "TIMED-OUT" || final.status === "ABORTED") {
    await supabase
      .from("apify_scrape_runs")
      .update({
        status: "failed",
        error_message: `Actor ${final.status}`,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runLogId);
    return NextResponse.json(
      { run_log_id: runLogId, actor_run_id: apifyRun.id, status: "failed", reason: final.status },
      { status: 500 },
    );
  }

  // Immer noch RUNNING nach 50s → Client soll pollen
  return NextResponse.json({
    run_log_id: runLogId,
    actor_run_id: apifyRun.id,
    status: "running",
    message: "Actor läuft länger — bitte per GET /api/sales/leads/scrape/[run_log_id] pollen",
  });
}

async function ingestDataset(opts: {
  token: string;
  datasetId: string;
  salesProgramId: string;
  supabase: ReturnType<typeof createAdminClient>;
}): Promise<{
  total: number;
  created: number;
  updated: number;
  skippedTerminal: number;
  skippedInvalid: number;
}> {
  const places = await fetchDataset({ token: opts.token, datasetId: opts.datasetId });
  let created = 0;
  let updated = 0;
  let skippedTerminal = 0;
  let skippedInvalid = 0;

  for (const place of places) {
    const norm = normalizePlace(place);
    if (!norm) {
      skippedInvalid++;
      continue;
    }

    // Dedupe-Pattern übernommen von CSV-Import: lookup-or-update auf
    // (sales_program_id, phone). Terminal-Status wird nicht angetastet.
    const { data: existing } = await opts.supabase
      .from("sales_leads")
      .select("id, status, custom_fields")
      .eq("sales_program_id", opts.salesProgramId)
      .eq("phone", norm.phone)
      .maybeSingle();

    if (existing) {
      if (isTerminalSalesStatus(existing.status)) {
        skippedTerminal++;
        continue;
      }
      const merged = {
        ...(existing.custom_fields as Record<string, unknown>),
        ...norm.custom_fields,
      };
      const { error } = await opts.supabase
        .from("sales_leads")
        .update({
          custom_fields: merged,
          email: norm.email,
          company_name: norm.company_name,
          notes: norm.notes,
        })
        .eq("id", existing.id);
      if (!error) updated++;
    } else {
      const { error } = await opts.supabase.from("sales_leads").insert({
        sales_program_id: opts.salesProgramId,
        phone: norm.phone,
        email: norm.email,
        company_name: norm.company_name,
        notes: norm.notes,
        custom_fields: norm.custom_fields,
        source: norm.source,
        status: norm.status,
        consent_given: norm.consent_given,
      });
      if (!error) {
        created++;
      } else if ((error as { code?: string }).code === "23505") {
        // Race — treat as update
        updated++;
      }
    }
  }

  return { total: places.length, created, updated, skippedTerminal, skippedInvalid };
}
