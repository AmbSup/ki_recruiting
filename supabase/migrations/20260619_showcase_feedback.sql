-- Showcase Feedback: öffentliche Test-Page /showcase mit Audio-Recorder pro
-- Bundle. Besucher nehmen ~10-60s Audio-Feedback auf, wir speichern es im
-- Bucket "showcase-feedback" und tracken Metadata in showcase_feedback.
-- Operator-Sicht: /showcase-feedback (admin/operator/viewer) listet alle
-- Einsendungen mit Audio-Player.

-- ── 1. Tabelle ──────────────────────────────────────────────────────────────
create table if not exists public.showcase_feedback (
  id                  uuid primary key default gen_random_uuid(),
  bundle_slug         text not null,
  audio_storage_path  text not null,
  duration_seconds    int,
  content_type        text,
  size_bytes          int,
  user_agent          text,
  ip_hash             text, -- SHA-256(ip + salt), für Anti-Spam ohne IP-Speicherung
  created_at          timestamptz not null default now()
);

create index if not exists idx_showcase_feedback_bundle
  on public.showcase_feedback(bundle_slug, created_at desc);
create index if not exists idx_showcase_feedback_iphash_time
  on public.showcase_feedback(ip_hash, created_at desc);

comment on table public.showcase_feedback is
  'Audio-Feedback-Einreichungen von der öffentlichen Showcase-Seite. Audio liegt im Storage-Bucket "showcase-feedback".';

-- ── 2. Storage-Bucket ───────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'showcase-feedback',
  'showcase-feedback',
  false,
  5242880, -- 5 MB pro Audio
  array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav']
)
on conflict (id) do nothing;

-- ── 3. RLS auf showcase_feedback ────────────────────────────────────────────
alter table public.showcase_feedback enable row level security;

drop policy if exists "showcase_feedback_operator_read" on public.showcase_feedback;
create policy "showcase_feedback_operator_read"
on public.showcase_feedback for select
to authenticated
using (get_my_role() = any (array['admin'::user_role, 'operator'::user_role, 'viewer'::user_role]));

-- Writes ausschließlich über Admin-Client (Service-Role) aus der API-Route —
-- kein insert-policy für anon, damit Public-Page nichts direkt schreiben kann.

-- ── 4. RLS auf storage.objects für Bucket ───────────────────────────────────
drop policy if exists "showcase_feedback_operator_audio_read" on storage.objects;
create policy "showcase_feedback_operator_audio_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'showcase-feedback'
  and get_my_role() = any (array['admin'::user_role, 'operator'::user_role, 'viewer'::user_role])
);
