-- ============================================================
-- Sales Use-Case-Erweiterung (Phase 1 von PR-Serie "Multi-Use-Case")
-- Siehe C:\Users\marti\.claude\plans\now-a-2-nd-valiant-lollipop.md
-- ============================================================

-- 1. Enum für program_type
create type sales_program_type as enum (
  'generic',
  'recruiting',
  'real_estate',
  'coaching',
  'ecommerce_highticket',
  'handwerk'
);

-- 2. sales_programs um Discriminator + Strategy-Config erweitern
alter table sales_programs
  add column program_type sales_program_type not null default 'generic',
  add column call_strategy jsonb not null default '{}'::jsonb,
  add column custom_field_schema jsonb not null default '{}'::jsonb;

create index idx_sales_programs_program_type on sales_programs(program_type);

-- 3. sales_call_analyses um use-case-spezifische Analyse-Felder erweitern
alter table sales_call_analyses
  add column use_case_analysis jsonb;

-- 4. sales_lead_uploads: Foto/PDF-Uploads vom Lead während oder nach Call
create table sales_lead_uploads (
  id uuid primary key default gen_random_uuid(),
  sales_lead_id uuid not null references sales_leads(id) on delete cascade,
  sales_call_id uuid references sales_calls(id) on delete set null,
  file_type text not null,              -- 'photo' | 'document'
  context_hint text,                     -- z.B. "Foto vom Zählerschrank"
  upload_token text unique not null,
  status text not null default 'pending', -- pending | uploaded | expired
  storage_path text,                     -- 'lead-uploads/<token>/<filename>'
  content_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  uploaded_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index idx_sales_lead_uploads_lead_id on sales_lead_uploads(sales_lead_id);
create index idx_sales_lead_uploads_call_id on sales_lead_uploads(sales_call_id);
create index idx_sales_lead_uploads_token   on sales_lead_uploads(upload_token);
create index idx_sales_lead_uploads_status  on sales_lead_uploads(status);

-- RLS: operator/admin/viewer können SELECTen. Insert/Update läuft über
-- Admin-Client (Service-Role bypasst RLS) in unseren API-Routen.
alter table sales_lead_uploads enable row level security;

drop policy if exists "sales_lead_uploads_operator_select" on sales_lead_uploads;
create policy "sales_lead_uploads_operator_select" on sales_lead_uploads
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

-- 5. Storage-Bucket für Lead-Uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lead-uploads',
  'lead-uploads',
  false,
  20971520, -- 20 MB
  array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "lead_uploads_operator_read" on storage.objects;
create policy "lead_uploads_operator_read" on storage.objects
  for select using (
    bucket_id = 'lead-uploads'
    and get_my_role() in ('admin', 'operator', 'viewer')
  );

-- Hinweis: anonyme PUBLIC-Uploads laufen via Signed Upload URL (createSignedUploadUrl)
-- aus der /uploads/[token]-Route heraus — keine separate Policy nötig.
