-- Per-Program-Offer-Katalog für Product-Finder-Sales-Calls.
-- Lead füllt Funnel-Fragen aus → /api/apply mappt Antworten zu Tags →
-- /api/sales/trigger-call pre-matched Top-Offer via Tag-Overlap und injiziert
-- es als variableValues in den Vapi-Call. Assistant präsentiert mündlich,
-- Tool send_offer_link verschickt detail_url per SMS + WhatsApp.

create table sales_offers (
  id uuid primary key default gen_random_uuid(),
  sales_program_id uuid not null references sales_programs(id) on delete cascade,
  name text not null,
  summary text,                              -- 1-2 Sätze, vom Assistant gesprochen
  description text,                          -- Long-form für Web / E-Mail
  tags jsonb not null default '[]'::jsonb,   -- z.B. ["asia","active","2-5k"]
  image_url text,
  detail_url text not null,                  -- Deep-Link für SMS/WhatsApp
  price_cents integer,
  currency text default 'EUR',
  metadata jsonb default '{}'::jsonb,        -- domain-spezifische Extras
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sales_offers_program_active_idx
  on sales_offers(sales_program_id, active);

-- GIN für Tag-Overlap-Queries (tags ?| array['asia','active'])
create index sales_offers_tags_gin
  on sales_offers using gin(tags);

comment on column sales_offers.tags is
  'JSON-Array von Tag-Strings. Wird per ?| Operator gegen preference_tags vom Lead gematcht. Score = intersection-cardinality.';
comment on column sales_offers.detail_url is
  'Absolute URL zum Produkt-/Funnel-Detail. Wird per SMS und WhatsApp ans Lead-Phone verschickt.';

alter table sales_offers enable row level security;

create policy "sales_offers_read"
  on sales_offers for select
  using (get_my_role() in ('admin','operator','viewer'));

create policy "sales_offers_write_insert"
  on sales_offers for insert
  with check (get_my_role() in ('admin','operator'));

create policy "sales_offers_write_update"
  on sales_offers for update
  using (get_my_role() in ('admin','operator'))
  with check (get_my_role() in ('admin','operator'));

create policy "sales_offers_write_delete"
  on sales_offers for delete
  using (get_my_role() in ('admin','operator'));
