import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireReader } from "@/lib/auth/guards";
import { getRun, fetchDataset } from "@/lib/apify/client";
import { normalizePlace, USD_TO_EUR } from "@/lib/apify/normalize";
import { isTerminalSalesStatus } from "@/lib/phone";

export const maxDuration = 60;

/**
 * GET /api/sales/leads/scrape/[run_log_id]
 *
 * Poll-Endpoint für lange Actor-Runs die nach 50s (Vercel max-Duration) noch
 * nicht fertig waren. Wenn Apify inzwischen SUCCEEDED ist und der Log noch
 * "running" — Dataset ingesten + Log finalisieren.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ run_log_id: string }> },
) {
  const auth = await requireReader();
  if (!auth.ok) return auth.response;

  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "APIFY_API_TOKEN nicht konfiguriert" }, { status: 500 });
  }

  const { run_log_id } = await params;
  const supabase = createAdminClient();
  const { data: runLog, error: runErr } = await supabase
    .from("apify_scrape_runs")
    .select("id, actor_run_id, sales_program_id, status, actual_count, cost_usd, cost_eur, error_message, requested_count, keyword, location, created_at, completed_at")
    .eq("id", run_log_id)
    .maybeSingle();
  if (runErr || !runLog) {
    return NextResponse.json({ error: "run nicht gefunden" }, { status: 404 });
  }

  // Terminal-States bleiben stabil zurückgegeben — kein zweites Apify-Roundtrip
  if (runLog.status !== "running" || !runLog.actor_run_id) {
    return NextResponse.json(runLog);
  }

  // Re-check Apify
  let apifyRun;
  try {
    apifyRun = await getRun({ token, runId: runLog.actor_run_id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ...runLog, poll_error: msg }, { status: 502 });
  }

  if (apifyRun.status === "SUCCEEDED") {
    if (!runLog.sales_program_id) {
      // Program wurde inzwischen gelöscht → als failed markieren
      await supabase
        .from("apify_scrape_runs")
        .update({
          status: "failed",
          error_message: "sales_program_id ist null (Program gelöscht?)",
          completed_at: new Date().toISOString(),
        })
        .eq("id", runLog.id);
      return NextResponse.json(
        { ...runLog, status: "failed", error_message: "sales_program_id is null" },
        { status: 500 },
      );
    }
    const ingest = await ingestDataset({
      token,
      datasetId: apifyRun.defaultDatasetId,
      salesProgramId: runLog.sales_program_id,
      supabase,
    });
    const costUsd =
      typeof apifyRun.usageUsd === "number"
        ? apifyRun.usageUsd
        : (runLog.requested_count ?? 0) * 0.009;
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
      .eq("id", runLog.id);
    return NextResponse.json({
      ...runLog,
      status: "succeeded",
      actual_count: ingest.total,
      cost_usd: costUsd,
      cost_eur: costEur,
      leads_created: ingest.created,
      leads_updated: ingest.updated,
      leads_skipped_terminal: ingest.skippedTerminal,
      leads_skipped_invalid_phone: ingest.skippedInvalid,
    });
  }

  if (apifyRun.status === "FAILED" || apifyRun.status === "TIMED-OUT" || apifyRun.status === "ABORTED") {
    await supabase
      .from("apify_scrape_runs")
      .update({
        status: "failed",
        error_message: `Actor ${apifyRun.status}`,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runLog.id);
    return NextResponse.json({ ...runLog, status: "failed", error_message: `Actor ${apifyRun.status}` });
  }

  // Immer noch RUNNING
  return NextResponse.json({ ...runLog, apify_status: apifyRun.status });
}

// Duplicate of the ingestDataset in the POST route for locality; small enough
// that the DRY-tax isn't worth exporting.
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
        updated++;
      }
    }
  }

  return { total: places.length, created, updated, skippedTerminal, skippedInvalid };
}
