-- ============================================================
-- Funnel-Templates — built-in Niche-Templates (Bäckerei, Pflege, etc.)
-- Plan: C:\Users\marti\.claude\plans\now-a-2-nd-valiant-lollipop.md
-- A1+A2: Funnel-Duplizieren + Niche-Templates (V1)
-- ============================================================

-- Eigene Tabelle, NICHT Spalte auf `funnels`. Grund: funnels hat strikten
-- XOR-Constraint (job_id <> sales_program_id). Templates haben keinen Anchor
-- → würden Constraint brechen. Saubere Trennung.

create table funnel_templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,                            -- 'baeckerei-recruiting'
  name text not null,                                    -- 'Bäckerei Recruiting'
  description text,                                      -- 1-Satz Pitch für Browse-UI
  category text not null check (category in ('recruiting', 'sales')),
  niche text not null,                                   -- 'baeckerei', 'pflege', 'pv', etc.
  preview_image_url text,                                -- optional Hero-Card-Bild
  intro_headline text,                                   -- Default für funnel.intro_headline
  intro_subtext text,
  consent_text text,
  pages jsonb not null,                                  -- [{page_order: int, blocks: Block[]}]
  default_branding jsonb not null default '{}'::jsonb,
  is_built_in boolean not null default true,             -- v2: User-Templates → false
  created_at timestamptz not null default now()
);

create index idx_funnel_templates_category on funnel_templates(category);
create index idx_funnel_templates_niche on funnel_templates(niche);

-- RLS: alle authenticated lesen, Writes via Service-Role-Client
alter table funnel_templates enable row level security;

create policy "funnel_templates_operator_read" on funnel_templates
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));
