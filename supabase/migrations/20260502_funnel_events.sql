-- ============================================================
-- Funnel-Events — Visitor-Tracking pro Funnel + Page (V1)
-- Plan: C:\Users\marti\.claude\plans\now-a-2-nd-valiant-lollipop.md
-- ============================================================

-- Strukturiertes Tracking für das Analytics-Dashboard. Drei Event-Types:
--   'view'      → Funnel-Mount (page_order = NULL)
--   'page_view' → User landet auf Page N (page_order gesetzt)
--   'submit'    → Erfolgreiche Funnel-Submission (page_order = letzte Page)
--
-- visitor_id ist ein Server-side gesetztes SHA-256-Cookie. Keine PII, keine IPs,
-- keine User-Agents — nur grobe device_type-Klasse für Mobile/Tablet/Desktop-
-- Aggregation. DSGVO-leicht.

create table funnel_events (
  id bigserial primary key,
  funnel_id uuid not null references funnels(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'page_view', 'submit')),
  page_order integer,
  visitor_id text not null,
  device_type text not null default 'unknown',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  created_at timestamptz not null default now()
);

create index idx_funnel_events_funnel_time on funnel_events(funnel_id, created_at desc);
create index idx_funnel_events_visitor on funnel_events(funnel_id, visitor_id);
create index idx_funnel_events_type on funnel_events(funnel_id, event_type);

-- RLS: alle authenticated lesen, Writes via Service-Role aus /api/funnels/track
alter table funnel_events enable row level security;

create policy "funnel_events_operator_read" on funnel_events
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));
