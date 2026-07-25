import { createAdminClient } from "@/lib/supabase/admin";

// Aggregation-Helpers für das Website-Analytics-Dashboard (Marketing-Seiten
// + funnel-übergreifende Sicht). RLS-frei via admin-client — die Page selbst
// ist hinter Operator-Auth.

const WINDOW_DAYS = 30;
const SINCE = () => new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();

export type VisitRow = { created_at: string; visitor_id: string };

// ─── Loader: page_events für einen Slug im Window ────────────────────────────

export async function loadPageEvents(slug: string): Promise<VisitRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("page_events")
    .select("created_at, visitor_id")
    .eq("page_slug", slug)
    .gte("created_at", SINCE())
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[page-analytics] loadPageEvents:", error.message);
    return [];
  }
  return (data ?? []) as VisitRow[];
}

// ─── Loader: funnel_events 'view'-Events über ALLE Funnels im Window ─────────

export async function loadAllFunnelViewEvents(): Promise<VisitRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("funnel_events")
    .select("created_at, visitor_id")
    .eq("event_type", "view")
    .gte("created_at", SINCE())
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[page-analytics] loadAllFunnelViewEvents:", error.message);
    return [];
  }
  return (data ?? []) as VisitRow[];
}

// ─── Time-Series: eindeutige Besucher pro Tag ────────────────────────────────

export type DailyVisitPoint = { date: string; visits: number; submits: number; cr: number };

export function computeDailyVisits(rows: VisitRow[]): DailyVisitPoint[] {
  const byDay = new Map<string, Set<string>>();
  for (const r of rows) {
    const day = r.created_at.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, new Set());
    byDay.get(day)!.add(r.visitor_id);
  }
  // Auch leere Tage füllen (für saubere Linie)
  const result: DailyVisitPoint[] = [];
  const today = new Date();
  for (let i = WINDOW_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const iso = d.toISOString().slice(0, 10);
    const visits = byDay.get(iso)?.size ?? 0;
    result.push({ date: iso, visits, submits: 0, cr: 0 });
  }
  return result;
}

export function countUniqueVisitors(rows: VisitRow[]): number {
  return new Set(rows.map((r) => r.visitor_id)).size;
}
