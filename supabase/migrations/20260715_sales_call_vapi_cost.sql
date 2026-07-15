alter table public.sales_calls
  add column if not exists vapi_cost_usd numeric(12, 6),
  add column if not exists vapi_cost_breakdown jsonb;

comment on column public.sales_calls.vapi_cost_usd is
  'Total call cost reported by Vapi, in USD.';

comment on column public.sales_calls.vapi_cost_breakdown is
  'Provider/component cost breakdown reported by Vapi.';
