-- Whisper-Transkription pro Showcase-Feedback. transcript_at zeigt wann
-- die Transkription erzeugt wurde (NULL = noch nicht transkribiert).

alter table public.showcase_feedback
  add column if not exists transcript    text,
  add column if not exists transcript_at timestamptz;

comment on column public.showcase_feedback.transcript is
  'Whisper-Transkription des Audios. Wird On-Demand vom Operator über /api/showcase/feedback/[id]/transcribe getriggert.';
comment on column public.showcase_feedback.transcript_at is
  'Zeitstempel der letzten erfolgreichen Transkription. NULL = noch nicht transkribiert.';
