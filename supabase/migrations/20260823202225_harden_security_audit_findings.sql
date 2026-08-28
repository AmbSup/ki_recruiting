-- Security audit remediation (2026-08-23).
revoke update on table public.profiles from authenticated;
grant update (name) on table public.profiles to authenticated;

drop policy if exists profiles_own_update on public.profiles;
create policy profiles_own_update on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create table if not exists public.pending_cv_uploads (
  id uuid primary key,
  funnel_id uuid not null references public.funnels(id) on delete cascade,
  storage_path text not null unique,
  ip_hash text not null,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);
create index if not exists pending_cv_uploads_ip_created_idx on public.pending_cv_uploads(ip_hash, created_at desc);
create index if not exists pending_cv_uploads_unclaimed_idx on public.pending_cv_uploads(created_at) where claimed_at is null;
alter table public.pending_cv_uploads enable row level security;
revoke all on table public.pending_cv_uploads from anon, authenticated;

create or replace function public.reserve_cv_upload(
  p_id uuid, p_funnel_id uuid, p_storage_path text, p_ip_hash text, p_limit integer default 10
) returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));
  if not exists (select 1 from public.funnels where id = p_funnel_id and status = 'active') then return false; end if;
  if (select count(*) from public.pending_cv_uploads where ip_hash = p_ip_hash and created_at >= now() - interval '1 hour') >= p_limit then return false; end if;
  insert into public.pending_cv_uploads (id, funnel_id, storage_path, ip_hash) values (p_id, p_funnel_id, p_storage_path, p_ip_hash);
  return true;
end;
$$;
revoke all on function public.reserve_cv_upload(uuid, uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.reserve_cv_upload(uuid, uuid, text, text, integer) to service_role;

create or replace function public.reserve_showcase_feedback(
  p_id uuid, p_bundle_slug text, p_audio_storage_path text, p_duration_seconds integer,
  p_content_type text, p_size_bytes integer, p_user_agent text, p_ip_hash text,
  p_limit integer default 3
) returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_ip_hash, 0));
  if not exists (select 1 from public.funnels where slug = p_bundle_slug and status = 'active') then return false; end if;
  if (select count(*) from public.showcase_feedback where ip_hash = p_ip_hash and created_at >= now() - interval '1 hour') >= p_limit then return false; end if;
  insert into public.showcase_feedback (id, bundle_slug, audio_storage_path, duration_seconds, content_type, size_bytes, user_agent, ip_hash)
  values (p_id, p_bundle_slug, p_audio_storage_path, p_duration_seconds, p_content_type, p_size_bytes, p_user_agent, p_ip_hash);
  return true;
end;
$$;
revoke all on function public.reserve_showcase_feedback(uuid, text, text, integer, text, integer, text, text, integer) from public, anon, authenticated;
grant execute on function public.reserve_showcase_feedback(uuid, text, text, integer, text, integer, text, text, integer) to service_role;
