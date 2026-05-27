-- DSGVO Art. 17 — Nachweisbarkeit der Löschung.
-- Jede Betroffenenrechts-Löschung (Lead/Bewerber + alle abhängigen Daten +
-- Storage-Objekte) schreibt einen unveränderlichen Audit-Eintrag. Der Eintrag
-- enthält KEINE Personendaten mehr im Klartext außer einem Minimal-Snapshot
-- (Name/Phone-Hinweis) zur Zuordnung bei Rückfragen der Aufsichtsbehörde —
-- bewusst sparsam (Datenminimierung Art. 5).

create table if not exists gdpr_erasure_log (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('sales_lead', 'applicant')),
  -- Minimal-Snapshot zur Zuordnung (z.B. "Max M. / +4367…1234"). Kein voller Datensatz.
  subject_ref text,
  deleted_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz not null default now(),
  -- Zusammenfassung was gelöscht wurde: {calls: 3, analyses: 2, recordings: 3, ...}
  summary jsonb not null default '{}'::jsonb
);

comment on table gdpr_erasure_log is
  'DSGVO-Art.-17-Audit: protokolliert jede Betroffenenrechts-Löschung (wer, wann, was). Kein Personendaten-Klartext außer Minimal-Snapshot.';

alter table gdpr_erasure_log enable row level security;

-- Lesbar für admin/operator/viewer (Nachweis vorzeigen). Schreiben nur über
-- Service-Role (Admin-Client im erase-Endpoint) — daher keine INSERT-Policy
-- für normale Rollen.
drop policy if exists "gdpr_log_select" on gdpr_erasure_log;
create policy "gdpr_log_select" on gdpr_erasure_log
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));
