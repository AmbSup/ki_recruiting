// Apify-API-Client für Google-Maps-Scraper (compass/crawler-google-places).
// Auth via Authorization-Header (NIEMALS ?token= im Query — würde in Access-
// Logs + HTTP-Exceptions leaken).
//
// Design: synchron warten bis max ~50s (Vercel maxDuration=60), sonst returnt
// die Run-ID und der Client soll später via GET /api/sales/leads/scrape/[run_id]
// pollen. Für 500-Leads-Batches reicht das normalerweise (~30-60s Laufzeit).

const APIFY_BASE = "https://api.apify.com/v2";

export type ApifyGmapsInput = {
  searchStringsArray: string[];    // z.B. ["Bäckerei"]
  locationQuery: string;           // z.B. "Wien, Österreich"
  maxCrawledPlacesPerSearch: number;
  language?: string;               // "de" default
  includeWebResults?: boolean;
};

export type ApifyRunStatus =
  | "READY"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "TIMING-OUT"
  | "TIMED-OUT"
  | "ABORTING"
  | "ABORTED";

export type ApifyRun = {
  id: string;
  actId: string;
  status: ApifyRunStatus;
  startedAt: string;
  finishedAt: string | null;
  defaultDatasetId: string;
  stats: {
    inputBodyLen?: number;
    computeUnits?: number;
    memMaxBytes?: number;
  };
  usageUsd?: number;                // Cost in USD, filled once complete
};

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Start actor run. Returns the run ID immediately; caller polls or waits.
 * The actor id can be either the numeric id or the `username~actor-name` form.
 */
export async function startGmapsScrape(opts: {
  token: string;
  actorId: string;
  input: ApifyGmapsInput;
}): Promise<ApifyRun> {
  const url = `${APIFY_BASE}/acts/${encodeURIComponent(opts.actorId)}/runs`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(opts.token),
    body: JSON.stringify(opts.input),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Apify start failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data: ApifyRun };
  return json.data;
}

export async function getRun(opts: { token: string; runId: string }): Promise<ApifyRun> {
  const res = await fetch(`${APIFY_BASE}/actor-runs/${encodeURIComponent(opts.runId)}`, {
    headers: authHeaders(opts.token),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Apify get-run failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data: ApifyRun };
  return json.data;
}

/**
 * Wait for a run to reach a terminal state (SUCCEEDED/FAILED/etc). Polls with
 * exponential backoff, up to `maxWaitMs`. Returns the final run state.
 * Throws only on network/HTTP errors, NOT on FAILED status — caller handles.
 */
export async function waitForRun(opts: {
  token: string;
  runId: string;
  maxWaitMs: number;
}): Promise<ApifyRun> {
  const start = Date.now();
  const terminalStates: ApifyRunStatus[] = ["SUCCEEDED", "FAILED", "TIMED-OUT", "ABORTED"];
  let delay = 1500;
  while (Date.now() - start < opts.maxWaitMs) {
    const run = await getRun(opts);
    if (terminalStates.includes(run.status)) return run;
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 1.5, 8000);
  }
  // Timeout — return last-observed state so caller can persist run_id and
  // let the user poll later
  return getRun(opts);
}

export type ApifyGmapsPlace = {
  title?: string;
  categoryName?: string;
  categories?: string[];
  address?: string;
  neighborhood?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
  website?: string;
  phone?: string;
  phoneUnformatted?: string;
  emails?: string[];              // extracted by actor when includeWebResults
  totalScore?: number;
  reviewsCount?: number;
  url?: string;                   // Google-Maps place URL
  placeId?: string;
};

/**
 * Fetch all items from the run's default dataset. Uses format=json for
 * simplicity; for 500 items this is fine (<1 MB payload).
 */
export async function fetchDataset(opts: {
  token: string;
  datasetId: string;
}): Promise<ApifyGmapsPlace[]> {
  const url = `${APIFY_BASE}/datasets/${encodeURIComponent(opts.datasetId)}/items?format=json&clean=true`;
  const res = await fetch(url, { headers: authHeaders(opts.token) });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Apify dataset fetch failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return (await res.json()) as ApifyGmapsPlace[];
}
