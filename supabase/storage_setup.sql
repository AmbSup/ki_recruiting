-- Public bucket for funnel media (images, logos, profile photos)
insert into storage.buckets (id, name, public)
values ('funnel-media', 'funnel-media', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload
create policy "Authenticated upload funnel-media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'funnel-media');

-- Allow authenticated users to update/delete their own files
create policy "Authenticated manage funnel-media" on storage.objects
  for all to authenticated
  using (bucket_id = 'funnel-media');

-- Public read access
create policy "Public read funnel-media" on storage.objects
  for select to public
  using (bucket_id = 'funnel-media');
