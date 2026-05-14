-- CVs sind GDPR-Sondergeschützt (Lebenslauf, Foto, Werdegang, Adresse).
-- Bucket wird auf privat umgestellt und nur über den signed-URL-Proxy
-- /api/cvs/[...path] abrufbar gemacht. Bestehende public-URLs werden in das
-- Proxy-URL-Format migriert, damit ältere Bewerber-Rows weiter klickbar sind.

-- 1. Bucket privat machen
update storage.buckets
set public = false,
    file_size_limit = 10485760,                                 -- 10 MB
    allowed_mime_types = array['application/pdf',
                               'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                               'image/jpeg', 'image/png']
where id = 'cvs';

-- 2. Storage-RLS: admin/operator/viewer dürfen lesen.
-- Schreibzugriff bleibt nur über Service-Role (= /api/upload-cv via Admin-Client).
drop policy if exists "CVs Operator-Lesezugriff" on storage.objects;
create policy "CVs Operator-Lesezugriff"
  on storage.objects
  for select
  using (
    bucket_id = 'cvs'
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin', 'operator', 'viewer')
    )
  );

-- 3. Existierende cv_file_url-Werte migrieren.
-- Vorher: https://<ref>.supabase.co/storage/v1/object/public/cvs/<path>
-- Nachher: /api/cvs/<path>
update applicants
set cv_file_url = '/api/cvs/' || split_part(cv_file_url, '/storage/v1/object/public/cvs/', 2)
where cv_file_url ilike '%/storage/v1/object/public/cvs/%';

comment on column applicants.cv_file_url is
  'Same-origin Proxy-URL im Format /api/cvs/<path>. Der Endpoint authentifiziert + redirect 307 auf eine signed Storage-URL. Storage-Pfad selbst (ohne Proxy-Prefix) lässt sich via right(cv_file_url, length(cv_file_url) - length(''/api/cvs/'')) extrahieren.';
