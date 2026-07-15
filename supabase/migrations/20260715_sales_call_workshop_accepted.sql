alter table public.sales_call_analyses
  add column if not exists workshop_accepted boolean;

comment on column public.sales_call_analyses.workshop_accepted is
  'Explicit answer to workshop/callback offer: true=yes, false=no, null=not asked or unclear.';
