-- Recruiting-Recordings: Supabase Storage Mirror analog Sales.
-- Vapi-Storage hat plan-bound Retention (30-90 Tage). Damit voice_calls
-- über die Vapi-Frist hinaus abspielbar/downloadbar bleiben, mirroren wir
-- jedes Recording bei der Call-Analyse in einen privaten Storage-Bucket.
--
-- Pendant zu sales-recordings (Migration 20260423_sales_calls_recording_storage,
-- live in Production). Gleiches Pattern:
--   - voice_calls.recording_storage_path (text, nullable)
--   - Storage-Bucket "recruiting-recordings" (private, 50 MB, audio/*)
--   - RLS: admin/operator/viewer SELECT-Rechte aus storage.objects

-- ── 1. Schema-Spalte ────────────────────────────────────────────────────────
alter table public.voice_calls
  add column if not exists recording_storage_path text;

comment on column public.voice_calls.recording_storage_path is
  'Pfad im Supabase-Storage-Bucket "recruiting-recordings". Wird vom Call-Analyzer beim End-of-Call gesetzt, sobald das Mirror-Upload erfolgreich ist. NULL = nur Vapi-Storage verfügbar (Fallback im Audio-Proxy).';

-- ── 2. Storage-Bucket ───────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recruiting-recordings',
  'recruiting-recordings',
  false,
  52428800, -- 50 MB
  array['audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']
)
on conflict (id) do nothing;

-- ── 3. RLS-Policies für storage.objects ─────────────────────────────────────
-- admin/operator/viewer dürfen Audio aus diesem Bucket lesen.
-- Writes laufen über Service-Role (Admin-Client im Analyzer) — kein eigenes
-- Write-Policy nötig.

drop policy if exists "recruiting_recordings_operator_read" on storage.objects;

create policy "recruiting_recordings_operator_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'recruiting-recordings'
  and get_my_role() = any (array['admin'::user_role, 'operator'::user_role, 'viewer'::user_role])
);
