import { createAdminClient } from "@/lib/supabase/admin";

// Aggregation-Helpers für das Funnel-Analytics-Dashboard.
// Alle Helpers laufen server-side via admin-client. RLS-frei für maximale
// Aggregations-Performance — die Page selbst ist hinter Operator-Auth.

const WINDOW_DAYS = 30;
const SINCE = () => new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

export type AnalyticsEvent = {
  event_type: "view" | "page_view" | "submit";
  page_order: number | null;
  visitor_id: string;
  device_type: string;
  utm_source: string | null;
  created_at: string;
};

// ─── Loader: alle Events einer Funnel im Window holen ────────────────────────

export async function loadFunnelEvents(funnelId: string): Promise<AnalyticsEvent[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("funnel_events")
    .select("event_type, page_order, visitor_id, device_type, utm_source, created_at")
    .eq("funnel_id", funnelId)
    .gte("created_at", SINCE())
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[funnel-analytics] loadFunnelEvents:", error.message);
    return [];
  }
  return (data ?? []) as AnalyticsEvent[];
}

// ─── Top-Level-KPIs ──────────────────────────────────────────────────────────

export type TopKpis = {
  visits: number;          // unique visitors mit 'view'
  conversions: number;     // unique visitors mit 'submit'
  conversionRate: number;  // 0..100
  topSource: string;       // 'utm_source'-Wert mit meisten Visits, fallback "Direkt"
};

export function computeTopKpis(events: AnalyticsEvent[]): TopKpis {
  const visitorsView = new Set<string>();
  const visitorsSubmit = new Set<string>();
  const sourceCounts = new Map<string, number>();
  for (const e of events) {
    if (e.event_type === "view") {
      visitorsView.add(e.visitor_id);
      const src = e.utm_source?.trim() || "Direkt";
      sourceCounts.set(src, (sourceCounts.get(src) ?? 0) + 1);
    } else if (e.event_type === "submit") {
      visitorsSubmit.add(e.visitor_id);
    }
  }
  const visits = visitorsView.size;
  const conversions = visitorsSubmit.size;
  const conversionRate = visits > 0 ? (conversions / visits) * 100 : 0;
  let topSource = "Direkt";
  let topCount = 0;
  for (const [src, count] of sourceCounts.entries()) {
    if (count > topCount) {
      topSource = src;
      topCount = count;
    }
  }
  return { visits, conversions, conversionRate, topSource };
}

// ─── Step-Drop-off ───────────────────────────────────────────────────────────

export type StepDropoff = { page_order: number; visitors: number; pct: number; label: string };

export function computeStepDropoff(
  events: AnalyticsEvent[],
  pageLabels: string[],     // index = page_order - 1
): StepDropoff[] {
  const pageVisitors = new Map<number, Set<string>>();
  for (const e of events) {
    if (e.event_type !== "page_view") continue;
    if (e.page_order == null) continue;
    if (!pageVisitors.has(e.page_order)) pageVisitors.set(e.page_order, new Set());
    pageVisitors.get(e.page_order)!.add(e.visitor_id);
  }
  const orders = [...pageVisitors.keys()].sort((a, b) => a - b);
  if (orders.length === 0) return [];
  const firstCount = pageVisitors.get(orders[0])!.size;
  return orders.map((order) => {
    const count = pageVisitors.get(order)!.size;
    return {
      page_order: order,
      visitors: count,
      pct: firstCount > 0 ? (count / firstCount) * 100 : 0,
      label: pageLabels[order - 1] ?? `Page ${order}`,
    };
  });
}

// ─── Time-Series: pro Tag visits + submits ───────────────────────────────────

export type DayPoint = { date: string; visits: number; submits: number; cr: number };

export function computeTimeSeries(events: AnalyticsEvent[]): DayPoint[] {
  // Pro Tag (UTC-Datum) unique-visitors für view + submit
  const byDay = new Map<string, { v: Set<string>; s: Set<string> }>();
  for (const e of events) {
    const day = e.created_at.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, { v: new Set(), s: new Set() });
    if (e.event_type === "view") byDay.get(day)!.v.add(e.visitor_id);
    if (e.event_type === "submit") byDay.get(day)!.s.add(e.visitor_id);
  }
  // Auch leere Tage füllen (für saubere Linie)
  const result: DayPoint[] = [];
  const today = new Date();
  for (let i = WINDOW_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const iso = d.toISOString().slice(0, 10);
    const e = byDay.get(iso);
    const visits = e?.v.size ?? 0;
    const submits = e?.s.size ?? 0;
    const cr = visits > 0 ? (submits / visits) * 100 : 0;
    result.push({ date: iso, visits, submits, cr });
  }
  return result;
}

// ─── Geräteverteilung ────────────────────────────────────────────────────────

export type DeviceSlice = { type: string; count: number; pct: number };

export function computeDeviceDistribution(events: AnalyticsEvent[]): DeviceSlice[] {
  // Nur 'view'-Events zählen, eine Klassifizierung pro Visitor (erstes view).
  const visitorDevice = new Map<string, string>();
  for (const e of events) {
    if (e.event_type !== "view") continue;
    if (!visitorDevice.has(e.visitor_id)) visitorDevice.set(e.visitor_id, e.device_type);
  }
  const total = visitorDevice.size;
  const counts = new Map<string, number>();
  for (const dev of visitorDevice.values()) {
    counts.set(dev, (counts.get(dev) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count, pct: total > 0 ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
}

// ─── KI-Call-Metriken ────────────────────────────────────────────────────────

export type CallMetrics = {
  side: "recruiting" | "sales";
  callsCompleted: number;
  avgDurationSec: number | null;
  avgRating: number | null;
  meetingsBooked: number;            // Sales nur
  meetingBookingRate: number | null; // Sales nur (% der Calls die zu Meeting führten)
  recommendYesPct: number | null;    // Recruiting nur
};

export async function computeCallMetrics(
  funnelId: string,
  funnel: { job_id: string | null; sales_program_id: string | null },
): Promise<CallMetrics | null> {
  const supabase = createAdminClient();

  if (funnel.job_id) {
    // Recruiting-Side: applications.funnel_id = funnel.id → voice_calls → call_analyses
    const { data: apps } = await supabase
      .from("applications")
      .select("id")
      .eq("funnel_id", funnelId);
    const appIds = (apps ?? []).map((a: { id: string }) => a.id);
    if (appIds.length === 0) {
      return { side: "recruiting", callsCompleted: 0, avgDurationSec: null, avgRating: null, meetingsBooked: 0, meetingBookingRate: null, recommendYesPct: null };
    }
    const { data: calls } = await supabase
      .from("voice_calls")
      .select("id, status, duration_seconds, call_analyses(interview_score, recommendation)")
      .in("application_id", appIds);
    const completed = (calls ?? []).filter((c: { status?: string }) => c.status === "completed");
    const durations = completed.map((c: { duration_seconds: number | null }) => c.duration_seconds).filter((d: number | null): d is number => typeof d === "number" && d > 0);
    const ratings = completed.flatMap((c: { call_analyses: Array<{ interview_score: number | null }> | null }) => (c.call_analyses ?? []).map((a) => a.interview_score)).filter((s): s is number => typeof s === "number");
    const recs = completed.flatMap((c: { call_analyses: Array<{ recommendation: string | null }> | null }) => (c.call_analyses ?? []).map((a) => a.recommendation));
    const recYes = recs.filter((r) => r === "yes" || r === "strong_yes").length;
    return {
      side: "recruiting",
      callsCompleted: completed.length,
      avgDurationSec: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
      avgRating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
      meetingsBooked: 0,
      meetingBookingRate: null,
      recommendYesPct: recs.length ? Math.round((recYes / recs.length) * 100) : null,
    };
  }

  if (funnel.sales_program_id) {
    // Sales-Side: sales_leads.source_ref = funnel.id → sales_calls → sales_call_analyses
    const { data: leads } = await supabase
      .from("sales_leads")
      .select("id")
      .eq("source", "funnel")
      .eq("source_ref", funnelId);
    const leadIds = (leads ?? []).map((l: { id: string }) => l.id);
    if (leadIds.length === 0) {
      return { side: "sales", callsCompleted: 0, avgDurationSec: null, avgRating: null, meetingsBooked: 0, meetingBookingRate: null, recommendYesPct: null };
    }
    const { data: calls } = await supabase
      .from("sales_calls")
      .select("id, status, duration_seconds, analysis:sales_call_analyses(meeting_booked, call_rating)")
      .in("sales_lead_id", leadIds);
    const completed = (calls ?? []).filter((c: { status?: string }) => c.status === "completed");
    const durations = completed.map((c: { duration_seconds: number | null }) => c.duration_seconds).filter((d: number | null): d is number => typeof d === "number" && d > 0);
    const analyses = completed.flatMap((c: { analysis: Array<{ meeting_booked: boolean | null; call_rating: number | null }> | null }) => c.analysis ?? []);
    const ratings = analyses.map((a) => a.call_rating).filter((r): r is number => typeof r === "number");
    const meetingsBooked = analyses.filter((a) => a.meeting_booked === true).length;
    return {
      side: "sales",
      callsCompleted: completed.length,
      avgDurationSec: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
      avgRating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
      meetingsBooked,
      meetingBookingRate: completed.length > 0 ? Math.round((meetingsBooked / completed.length) * 100) : null,
      recommendYesPct: null,
    };
  }

  return null;
}

// ─── Page-Labels aus funnel_pages.blocks extrahieren ─────────────────────────

export async function loadPageLabels(funnelId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("funnel_pages")
    .select("page_order, blocks")
    .eq("funnel_id", funnelId)
    .order("page_order");
  return (data ?? []).map((p: { blocks: unknown }, i: number) => {
    const blocks = Array.isArray(p.blocks) ? (p.blocks as Array<{ type?: string; content?: Record<string, unknown> }>) : [];
    // Nimm die erste headline aus profile_header / text / welcome / loading_screen / thank_you
    for (const b of blocks) {
      const c = b.content ?? {};
      const candidate =
        (typeof c.headline === "string" && c.headline.trim()) ||
        (typeof c.question === "string" && c.question.trim()) ||
        "";
      if (candidate) return candidate.length > 40 ? candidate.slice(0, 40) + "…" : candidate;
    }
    return `Page ${i + 1}`;
  });
}
