-- DSGVO: Applicants-Consent auf das gleiche 3-Feld-Schema wie sales_leads heben.
-- Bisher nur consent_given_at (Timestamp). Jetzt zusätzlich:
--   consent_given   boolean  — explizites Ja/Nein-Flag
--   consent_source  text     — woher die Einwilligung kam (funnel_checkbox etc.)
-- consent_given_at bleibt als Timestamp (= consent_timestamp-Äquivalent).

alter table applicants
  add column if not exists consent_given boolean not null default false;

alter table applicants
  add column if not exists consent_source text;

-- Backfill: bestehende Bewerber mit gesetztem consent_given_at hatten den
-- Funnel-Checkbox-Consent → consent_given=true, source='funnel_checkbox'.
update applicants
  set consent_given = true,
      consent_source = coalesce(consent_source, 'funnel_checkbox')
  where consent_given_at is not null
    and consent_given = false;

comment on column applicants.consent_given is
  'DSGVO-Einwilligung erteilt (Datenschutz-Checkbox im Funnel). Spiegelt sales_leads.consent_given.';
comment on column applicants.consent_source is
  'Quelle der Einwilligung: funnel_checkbox | involveme | manual_import. Spiegelt sales_leads.consent_source.';
