-- ============================================================
-- Page-Events — Visitor-Tracking für einzelne Marketing-Seiten (V1)
-- ============================================================

-- Analog zu funnel_events, aber ohne FK auf funnels — für Marketing-Seiten
-- wie /wissen und /kmu, die keine Funnel-Landingpages sind.
-- visitor_id nutzt denselben _fv-Cookie wie funnel_events (gleiche Visitor-
-- Identität), aber separate Tabelle — keine Vermischung der Kennzahlen.

create table page_events (
  id bigserial primary key,
  page_slug text not null,
  event_type text not null default 'view' check (event_type = 'view'),
  visitor_id text not null,
  device_type text not null default 'unknown',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  created_at timestamptz not null default now()
);

create index idx_page_events_slug_time on page_events(page_slug, created_at desc);

-- RLS: alle authenticated lesen, Writes via Service-Role aus /api/pages/track
alter table page_events enable row level security;

create policy "page_events_operator_read" on page_events
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

-- Unterstützt die neue funnel-übergreifende Aggregation (Website-Analytics-
-- Dashboard, loadAllFunnelViewEvents in page-analytics.ts): Query filtert
-- nach event_type + created_at OHNE funnel_id — die bestehenden Indizes auf
-- funnel_events sind alle mit funnel_id als leading column, daher hier ohne
-- Nutzen. Neuer Index deckt genau dieses Zugriffsmuster ab.
create index idx_funnel_events_type_time on funnel_events(event_type, created_at desc);
