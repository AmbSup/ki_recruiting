-- Meta-Leadgen-Webhook empfängt nur die leadgen_id + form_id; ad_campaign_id ist
-- zum Insert-Zeitpunkt noch nicht bekannt und wird vom n8n-Matcher
-- nachträglich gesetzt (form_id → sales_programs.meta_form_ids → ad_campaigns).
-- Daher muss die Spalte nullable sein, sonst scheitern alle Webhook-Inserts.
alter table ad_leads
  alter column ad_campaign_id drop not null;

comment on column ad_leads.ad_campaign_id is
  'Nullable: Meta-Webhook persistiert die Lead-Daten ohne Kampagnen-Match; n8n-Matcher setzt diese FK nachträglich via form_id-Lookup.';
