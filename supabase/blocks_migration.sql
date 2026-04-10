alter table funnel_pages add column if not exists blocks jsonb default '[]'::jsonb;
