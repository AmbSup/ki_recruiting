-- Add external funnel support to funnels table
alter table funnels
  add column if not exists funnel_type text not null default 'internal',
  add column if not exists external_url text;
