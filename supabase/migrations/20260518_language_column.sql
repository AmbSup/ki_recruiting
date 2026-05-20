-- Language-Skalierungs-Migration für Sales-Pipeline.
-- Bisher waren alle Use-Case-Prompts + Funnel-Player-Strings hardcoded
-- deutsch. Jetzt: language-Column auf sales_programs + funnels, default 'de'
-- → keine Verhaltens-Änderung für existing rows, neue 'en'-Programs werden
-- vom Builder + Funnel-Player als Englisch behandelt.
--
-- Plus: purchase_price_cents auf sales_offers für Cars-Use-Case (dual-Preis
-- "499 Euro per month, or 25,000 Euro purchase price"). Optional, null für
-- Reise-Offers (die nur einen Preis haben).

alter table sales_programs
  add column language text not null default 'de'
  check (language in ('de', 'en'));

alter table funnels
  add column language text not null default 'de'
  check (language in ('de', 'en'));

alter table sales_offers
  add column purchase_price_cents integer
  check (purchase_price_cents is null or purchase_price_cents > 0);

comment on column sales_programs.language is
  'ISO-639-1 Sprach-Code (de|en). Bestimmt den AI-Prompt (use-cases/<type>_<lang>.ts) + Localized Currency-Words im Pitch.';
comment on column funnels.language is
  'ISO-639-1 (de|en). Funnel-Player nutzt das für i18n von hardcoded Strings (Submit-Button, Validation-Errors, Thank-You-Fallback).';
comment on column sales_offers.purchase_price_cents is
  'Optionaler Cash-Kaufpreis (in Cents). Nutzbar wenn call_strategy.matching.price_format = monthly_with_purchase oder purchase. price_cents bleibt der primäre Preis (monatlich für Cars, total für Reise).';
