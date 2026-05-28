-- Fix: n8n schreibt call_sessions.resume_url mit internem Docker-Port :5678
-- (z.B. https://n8n.neuronic-automation.ai:5678/webhook-waiting/...). Dieser
-- Port ist von außen NICHT erreichbar — Vapi kann den Wait-Node nicht resumen
-- → voice_calls-Row wird nie erstellt → Recruiting-Calls landen seit Wochen
-- nicht in der DB. Bug-Window: seit 11.04.2026 (älteste betroffene Row).
--
-- Saubere Lösung wäre WEBHOOK_URL=https://n8n.neuronic-automation.ai (ohne
-- Port) im n8n Docker-Compose. Bis das gesetzt ist (operator-Aktion), fängt
-- dieser Trigger den Port-Eintrag defensiv ab und strippt ihn auf Schreibseite.

create or replace function strip_internal_port_from_resume_url()
returns trigger
language plpgsql
as $$
begin
  if new.resume_url is not null then
    new.resume_url := replace(new.resume_url, ':5678/', '/');
  end if;
  return new;
end;
$$;

drop trigger if exists call_sessions_strip_port on call_sessions;
create trigger call_sessions_strip_port
  before insert or update of resume_url on call_sessions
  for each row execute function strip_internal_port_from_resume_url();

-- Backfill: bestehende Rows korrigieren (kosmetisch — die alten Calls sind
-- längst beendet, ein neuer Resume hilft nicht mehr). Falls neue n8n-
-- Workflows alte Rows lesen, sind sie immerhin syntaktisch korrekt.
update call_sessions
  set resume_url = replace(resume_url, ':5678/', '/')
  where resume_url like '%:5678/%';
