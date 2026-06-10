-- Sales-Offer-Knowledge: PDF-Upload pro Offer für tiefere AI-Call-Kenntnisse.
-- Operator lädt im Program-Detail ein PDF pro Offer hoch (Datenblatt,
-- Aktions-Brief, Sommer-Special-Preise). Backend extrahiert den Text mit
-- pdf-parse (gleiche Pipeline wie CV-Analyzer) und cached ihn in
-- sales_offers.knowledge_text. Beim Vapi-Call-Trigger wird der gecachte Text
-- als matched_offer_knowledge-Variable in den System-Prompt gemerged.
--
-- Pattern parallel zu 20260602_recruiting_recordings_storage (Bucket + RLS
-- via get_my_role()).

-- ── 1. Schema-Spalten auf sales_offers ──────────────────────────────────────
alter table public.sales_offers
  add column if not exists knowledge_storage_path text,
  add column if not exists knowledge_text         text,
  add column if not exists knowledge_updated_at   timestamptz;

comment on column public.sales_offers.knowledge_storage_path is
  'Pfad im Bucket "sales-offer-knowledge" (z.B. "<offer_id>.pdf"). NULL = kein Knowledge-PDF hochgeladen.';
comment on column public.sales_offers.knowledge_text is
  'Per pdf-parse extrahierter Volltext des hochgeladenen Knowledge-PDFs, hart bei 50.000 Zeichen abgeschnitten. NULL wenn kein PDF.';
comment on column public.sales_offers.knowledge_updated_at is
  'Zeitstempel des letzten erfolgreichen Knowledge-Uploads/Extraktionsdurchgangs.';

-- ── 2. Storage-Bucket ───────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sales-offer-knowledge',
  'sales-offer-knowledge',
  false,
  20971520, -- 20 MB
  array['application/pdf']
)
on conflict (id) do nothing;

-- ── 3. RLS-Policies für storage.objects ─────────────────────────────────────
-- admin/operator/viewer dürfen die PDFs lesen (Preview/Download via signed URL
-- aus dem GET der API-Route). Writes laufen ausschließlich über Admin-Client
-- in der API-Route — kein eigenes Insert/Update-Policy nötig.

drop policy if exists "sales_offer_knowledge_operator_read" on storage.objects;

create policy "sales_offer_knowledge_operator_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'sales-offer-knowledge'
  and get_my_role() = any (array['admin'::user_role, 'operator'::user_role, 'viewer'::user_role])
);
