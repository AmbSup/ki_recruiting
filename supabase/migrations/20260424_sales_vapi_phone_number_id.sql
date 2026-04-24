-- Sales-Calls wechseln von Twilio-Studio-SIP-Bridge zu Vapi-API-Direct.
-- Vapi importiert die Twilio-Nummer und gibt eine eigene UUID zurück
-- (phoneNumberId), die wir pro Program speichern. Fällt auf die Env-Variable
-- VAPI_SALES_PHONE_NUMBER_ID zurück, wenn null.
alter table sales_programs
  add column vapi_phone_number_id text;

comment on column sales_programs.vapi_phone_number_id is
  'Vapi phoneNumberId der importierten Twilio-Nummer. Outbound-Calls via POST /call nutzen dies als phoneNumberId. Fallback: process.env.VAPI_SALES_PHONE_NUMBER_ID.';
