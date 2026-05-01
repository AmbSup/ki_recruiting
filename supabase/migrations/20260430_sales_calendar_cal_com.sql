-- ============================================================
-- Sales Calendar — Cal.com Hybrid-Booking-Integration
-- Plan: C:\Users\marti\.claude\plans\now-a-2-nd-valiant-lollipop.md
-- ============================================================

-- 1. sales_programs erweitern um Cal.com-Konfiguration
alter table sales_programs
  add column cal_username text,                              -- z.B. "martinamon"
  add column cal_event_type_slug text,                       -- z.B. "30min"
  add column cal_timezone text not null default 'Europe/Vienna';

comment on column sales_programs.cal_username is 'Cal.com username (z.B. martinamon). Default-Override aus CAL_COM_DEFAULT_USERNAME env.';
comment on column sales_programs.cal_event_type_slug is 'Cal.com event-type slug (z.B. 30min). Default-Override aus CAL_COM_DEFAULT_EVENT_TYPE_SLUG env.';

-- 2. Neue Tabelle sales_meetings — Source-of-Truth für gebuchte Termine.
--    Idempotency-Key ist cal_booking_uid (UNIQUE) → API-Booking + Webhook
--    treffen denselben Record, upsert schluckt Dupes.
create table sales_meetings (
  id uuid primary key default gen_random_uuid(),
  sales_program_id uuid not null references sales_programs(id) on delete cascade,
  sales_lead_id uuid references sales_leads(id) on delete set null,
  sales_call_id uuid references sales_calls(id) on delete set null,
  cal_booking_uid text unique not null,
  cal_event_type_slug text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'confirmed',                  -- confirmed | cancelled | rescheduled | no_show
  source text not null,                                       -- 'ai_call' | 'public_page' | 'manual'
  attendee_name text,
  attendee_email text,
  attendee_phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sales_meetings_program on sales_meetings(sales_program_id, start_at);
create index idx_sales_meetings_lead on sales_meetings(sales_lead_id);
create index idx_sales_meetings_start on sales_meetings(start_at);

-- updated_at trigger (Standard-Pattern)
create or replace function set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

create trigger sales_meetings_updated_at
before update on sales_meetings
for each row execute function set_updated_at();

-- 3. RLS — operator/admin/viewer SELECT, writes via admin-client (Pattern aus
--    20260424_sales_use_cases.sql, nutzt get_my_role()-Helper)
alter table sales_meetings enable row level security;

create policy "sales_meetings_operator_select" on sales_meetings
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));
