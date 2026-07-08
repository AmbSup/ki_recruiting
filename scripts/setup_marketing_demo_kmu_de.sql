-- Setup: Marketing-Dogfood KMU-Demo-Funnel (DE)
-- Zweck: Prospects auf app.neuronic-automation.ai/kmu klicken "Demo starten",
-- füllen 3 kurze Fragen aus (Branche / Team-Größe / größter Zeitfresser),
-- erhalten binnen 30 Sek KI-Anruf mit KMU-Pitch. Ziel: 30-Min-Demo-Buchung.
--
-- Slug: demo-kmu
-- program_type: generic + system_prompt_override → keine Schema-Änderung nötig.
-- auto_dial: true, damit ?test=1 sofort anruft.
-- Idempotent auf dem Slug (analog demo-sales, demo-recruiting).

DO $$
DECLARE
  v_company_id uuid := 'a523fa80-138b-45db-95c7-d8289aa0360e';
  v_program_id uuid;
  v_funnel_id  uuid;
  v_existing_funnel uuid;
  v_existing_program uuid;
  v_has_calls boolean;
  v_sys_prompt text;
  v_first_msg  text;
BEGIN
  SELECT id INTO v_existing_funnel FROM funnels WHERE slug = 'demo-kmu';
  IF v_existing_funnel IS NOT NULL THEN
    SELECT sales_program_id INTO v_existing_program FROM funnels WHERE id = v_existing_funnel;
    IF v_existing_program IS NOT NULL THEN
      SELECT EXISTS (SELECT 1 FROM sales_calls WHERE sales_program_id = v_existing_program) INTO v_has_calls;
    ELSE
      v_has_calls := false;
    END IF;

    IF v_has_calls THEN
      v_program_id := v_existing_program;
      v_funnel_id  := v_existing_funnel;
      RAISE NOTICE 'demo-kmu refresh: existing program % has calls', v_existing_program;
    ELSE
      DELETE FROM funnel_pages WHERE funnel_id = v_existing_funnel;
      DELETE FROM funnels WHERE id = v_existing_funnel;
      IF v_existing_program IS NOT NULL THEN
        DELETE FROM sales_programs WHERE id = v_existing_program;
      END IF;
    END IF;
  END IF;

  -- KMU-fokussierter System-Prompt: Andrea qualifiziert den Prospect, ordnet
  -- seinen Zeitfresser einem der 21 KI-Bausteine zu, bucht Demo-Termin.
  v_sys_prompt := E'## Deine Mission\nDu rufst {{first_name}} von {{company_name}} an. {{first_name}} hat auf app.neuronic-automation.ai/kmu unser Demo-Formular ausgefüllt — will unsere KI-Voice-Technologie am eigenen Ohr erleben und wissen, ob wir für seinen KMU-Betrieb passen.\n\nDeine Aufgabe in 3 Minuten: (1) verstehen was ihn wirklich Zeit kostet, (2) 1-2 unserer KI-Bausteine matchen, (3) 30-Min-Demo-Termin auf Cal.com buchen.\n\nDu bist Andrea von Neuronic Automation. Selbstsicher, empathisch, professionell. Kein Verkaufsdruck — das ist ein Kennenlerngespräch mit einem Betriebsinhaber, der wissen will ob KI seinem Alltag hilft.\n\n## Kontext aus dem Funnel\n{{funnel_summary}}\n\n## Unser Angebot (kurz auf Nachfrage)\nWir bauen KI-Bausteine für KMUs: Anfragen-Annahme, Angebotserstellung aus Sprachmemos, Materialbestellungen per WhatsApp, Baustellenberichte, Recruiting-Screening, Rechnungsstellung, Mahnwesen. Jeder Baustein einzeln buchbar, in 3-14 Tagen live. Preis richtet sich nach Nutzung — Setup + Base-Fee + Minuten. Details im Demo-Call.\n\n## Gesprächsphasen\n\n### 1) Opener (max 20 Sekunden)\nNach Begrüßung + KI-Disclosure: „Genau so einen Anruf könnte ein KI-Assistent in deinem Betrieb übernehmen — für Kundenanfragen, Bewerber oder Serviceanrufe. Hast du 2 Minuten für einen Rundgang?"\nBei „ja": Phase 2. Bei „nein": Termin per Cal.com anbieten und höflich verabschieden.\n\n### 2) Kontext (60-90 Sekunden)\nDrei Fragen, ruhig, ohne Interview-Feeling:\n- „Was macht ihr genau — welcher Betrieb?" (kurz zuhören)\n- „Was ist bei dir gerade der größte Zeitfresser rund um das eigentliche Handwerk?" — Kernfrage. Höre auf: Anfragen, Angebote, Material, Berichte, Rechnungen, Bewerber, Mahnwesen. Notiere mental.\n- „Wie viele Mitarbeiter seid ihr aktuell?" (Team-Größe, für Baustein-Empfehlung).\n\nSpiegle: „Wenn ich dich richtig höre …" oder „das kenne ich von anderen Betrieben in der Größe."\n\n### 3) Match & Pitch (30-45 Sekunden)\nOrdne den größten Zeitfresser einem KI-Baustein zu und beschreibe konkret:\n\n- **Anfragen unbeantwortet** → „Unser KI-Agent übernimmt eingehende Anrufe wenn niemand abhebt, sammelt Projekt-Infos, schlägt Termine vor. Kein Lead geht mehr verloren."\n- **Angebote schreiben** → „Deine Monteure sprechen die Baustellenbesichtigung als Sprachmemo — unsere KI schreibt den Angebotsentwurf. Aus 2 Stunden werden 5 Minuten."\n- **Materialbestellungen** → „Monteure melden Bedarf per WhatsApp oder Sprache — die KI erkennt Artikel, Menge, Priorität und erstellt Bestellungen beim Lieferanten."\n- **Baustellenberichte** → „Monteur spricht den Tagesbericht ins Handy, KI baut strukturierten Rapport mit Arbeitszeit, Material, Problemen. Zero Tippen."\n- **Bewerber-Screening** → „Bewerber bekommen sofort einen KI-Anruf — dieselben Fragen wie beim Recruiter, Kandidatenprofil landet in der Datenbank. 90 % Screening-Aufwand weg."\n- **Rechnungen** → „Berichte, Material und Zeiten fließen zu Rechnungsentwurf zusammen, PDF wird automatisch versendet."\n- **Mahnwesen** → „KI erinnert Kunden freundlich per Anruf oder SMS an offene Rechnungen — verbessert Cashflow ohne Bürokratie."\n\nWähle 1 (max 2) Bausteine passend zur Antwort. NICHT die ganze Liste aufsagen.\n\n### 4) Buchung (60 Sekunden)\nRufe `book_meeting` auf um einen 30-Min-Demo-Termin zu buchen.\n„Ich schlage vor: 30 Minuten mit Martin, dem Gründer. Er zeigt dir live wie der [Baustein] bei einem vergleichbaren Betrieb läuft. Passt Dienstag 10 Uhr oder Donnerstag 15 Uhr besser?"\n\n### 5) Verabschiedung (10 Sekunden)\n„Perfekt, {{first_name}}. Termin steht, du bekommst gleich eine Bestätigung per Mail. Bis dann."\n\n## Absolute Regeln\n- **Sprich immer Deutsch** — auch bei englischer Zwischenfrage.\n- **Kein Verkaufsdruck**. Bei kein-Interesse: „Alles klar, danke für die Zeit." Auflegen.\n- **Zahlen aussprechen wie in Deutsch üblich** („dreißig" statt „drei null").\n- **Cal.com-Link niemals aussprechen** — nur via `book_meeting`-Tool senden.\n- **Fake keine Referenzen**. Bei Nachfragen: „Wir sind ein junges Team, bauen für die ersten 3-5 KMU-Pilot-Partner. Details gerne im Demo-Call."\n- **Preise am Telefon**: „Setup ab 790 Euro, monatlich ab 99 Euro Base plus Nutzung. Details im Demo-Call abhängig von deinem konkreten Baustein."\n\n## Vermeide\n- Buzzwords wie „revolutionär", „game-changing", „next-gen", „disruptiv".\n- Alle 21 Bausteine aufzählen — max 2.\n- Über den Betrieb dozieren. Fragen, zuhören, spiegeln.';

  v_first_msg := 'Hallo {{first_name}}, hier ist Andrea von Neuronic Automation. Ich bin ein KI-Assistent — und ja, genau so einen Anruf könnte ein Assistent in deinem Betrieb übernehmen. Hast du zwei Minuten für einen kurzen Rundgang?';

  IF v_program_id IS NULL THEN
    INSERT INTO sales_programs (
      company_id, name, language, program_type,
      product_pitch, value_proposition, target_persona,
      status, auto_dial, call_strategy,
      system_prompt_override, first_message_override,
      booking_link, cal_username, cal_event_type_slug, cal_timezone
    ) VALUES (
      v_company_id,
      'Neuronic KMU-Demo (DE)',
      'de',
      'generic',
      'KI-Bausteine für KMUs: Anfragen-Annahme, Angebote aus Sprachmemos, Materialbestellungen per WhatsApp, Baustellenberichte, Recruiting-Screening, Rechnungen, Mahnwesen. Jeder Baustein einzeln buchbar, Live-Betrieb in 3-14 Tagen.',
      'KMU-Betriebe verlieren pro Woche 8-15 Stunden mit Administration statt Handwerk. Wir automatisieren die 21 häufigsten Zeitfresser mit Voice + Claude + n8n + Supabase — modular und pay-as-you-use.',
      'Betriebsinhaber und Geschäftsführer von KMUs (Handwerk, Dienstleistung, Fachhandel) mit 5-50 Mitarbeitern, die zu viel Zeit mit Bürokratie verlieren und einzelne Prozesse automatisieren wollen.',
      'active',
      true,
      jsonb_build_object(
        'caller_name', 'Andrea',
        'require_consent', false,
        'llm_provider', 'azure-openai',
        'llm_model', 'gpt-5.4'
      ),
      v_sys_prompt,
      v_first_msg,
      'https://cal.com/martin-amon-l2hybo/30min',
      'martin-amon-l2hybo',
      '30min',
      'Europe/Vienna'
    ) RETURNING id INTO v_program_id;
  END IF;

  IF v_funnel_id IS NULL THEN
    INSERT INTO funnels (
      sales_program_id, language, name, slug,
      intro_headline, intro_subtext, consent_text, thank_you_text,
      branding, funnel_type, status
    ) VALUES (
      v_program_id, 'de', 'Neuronic KMU-Demo', 'demo-kmu',
      'KI-Baustein für deinen Betrieb — live testen',
      '3 kurze Fragen, dann klingelt dein Handy binnen 30 Sekunden. Unsere KI stellt dir Fragen wie ein Berater und matcht deinen größten Zeitfresser mit einem passenden Baustein.',
      'Ich stimme zu, dass Neuronic Automation (inkl. KI-Assistenten) mich telefonisch zum Demo-Erlebnis kontaktiert. [Datenschutzerklärung](https://www.neuronic-automation.ai/datenschutz). Einwilligung jederzeit per E-Mail widerrufbar.',
      'Perfekt — dein Handy klingelt gleich!',
      jsonb_build_object(
        'primary_color', '#B45309',
        'button_text_color', '#FFFFFF',
        'bg_color', '#FFFFFF',
        'logo_url', ''
      ),
      'sales',
      'active'
    ) RETURNING id INTO v_funnel_id;

    INSERT INTO funnel_pages (funnel_id, page_order, page_type, is_required, blocks) VALUES
      (v_funnel_id, 1, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 't1', 'type', 'text', 'content', jsonb_build_object(
          'content', 'KI für deinen Betrieb',
          'text_font', 'bebas', 'text_align', 'center',
          'text_color', '#B45309', 'text_font_size', 28)),
        jsonb_build_object('id', 't2', 'type', 'text', 'content', jsonb_build_object(
          'content', '3 Fragen. Dann klingelt dein Handy in 30 Sekunden mit unserer KI. Sie fragt was dir Zeit kostet und schlägt den passenden Baustein vor.',
          'text_font', 'inter', 'text_align', 'center', 'text_font_size', 16)),
        jsonb_build_object('id', 'q1', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'Welche Branche?',
          'selection', 'single', 'cta', 'Weiter →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q1o1', 'icon', '🔧', 'label', 'Handwerk / Bau', 'value', 'handwerk'),
            jsonb_build_object('id', 'q1o2', 'icon', '🏢', 'label', 'Dienstleistung / Beratung', 'value', 'service'),
            jsonb_build_object('id', 'q1o3', 'icon', '🛒', 'label', 'Fachhandel / Retail', 'value', 'retail'),
            jsonb_build_object('id', 'q1o4', 'icon', '🏥', 'label', 'Pflege / Gesundheit', 'value', 'care'),
            jsonb_build_object('id', 'q1o5', 'icon', '📦', 'label', 'Andere', 'value', 'other'))))
      )),
      (v_funnel_id, 2, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 'q2', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'Wie groß ist dein Team?',
          'selection', 'single', 'cta', 'Weiter →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q2o1', 'icon', '👤', 'label', '1-4 Mitarbeiter', 'value', 'micro'),
            jsonb_build_object('id', 'q2o2', 'icon', '👥', 'label', '5-15 Mitarbeiter', 'value', 'small'),
            jsonb_build_object('id', 'q2o3', 'icon', '👨‍👩‍👧', 'label', '16-50 Mitarbeiter', 'value', 'medium'),
            jsonb_build_object('id', 'q2o4', 'icon', '🏢', 'label', 'Über 50', 'value', 'large'))))
      )),
      (v_funnel_id, 3, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 'q3', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'Was kostet dich am meisten Zeit?',
          'selection', 'single', 'cta', 'Weiter →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q3o1', 'icon', '📞', 'label', 'Anfragen / Rückrufe', 'value', 'anfragen'),
            jsonb_build_object('id', 'q3o2', 'icon', '📝', 'label', 'Angebote schreiben', 'value', 'angebote'),
            jsonb_build_object('id', 'q3o3', 'icon', '📦', 'label', 'Material / Bestellungen', 'value', 'material'),
            jsonb_build_object('id', 'q3o4', 'icon', '📋', 'label', 'Baustellenberichte', 'value', 'berichte'),
            jsonb_build_object('id', 'q3o5', 'icon', '👥', 'label', 'Recruiting / Bewerber', 'value', 'recruiting'),
            jsonb_build_object('id', 'q3o6', 'icon', '💰', 'label', 'Rechnungen / Mahnwesen', 'value', 'rechnungen'),
            jsonb_build_object('id', 'q3o7', 'icon', '❓', 'label', 'Etwas anderes', 'value', 'other'))))
      )),
      (v_funnel_id, 4, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 'cf1', 'type', 'contact_form', 'content', jsonb_build_object(
          'headline', 'Wir rufen dich gleich an',
          'cta_text', 'KI-Anruf jetzt starten',
          'show_cv_upload', false, 'show_city', false, 'show_name_split', false))
      )),
      (v_funnel_id, 5, 'thank_you', false, jsonb_build_array(
        jsonb_build_object('id', 'ty', 'type', 'thank_you', 'content', jsonb_build_object(
          'headline', '🎉 Danke — dein Handy klingelt gleich!',
          'subtext', E'Unser KI-Agent Andrea wird dich in den nächsten 30 Sekunden anrufen. Halte dein Handy bereit und nimm den Anruf an.\n\nDu kannst jederzeit auflegen — kein CRM-Eintrag, kein Newsletter, keine Follow-Up-E-Mail.',
          'headline_color', '#B45309', 'subtext_color', '#374151'))
      ));
  END IF;

  RAISE NOTICE 'demo-kmu DE setup complete: program=% funnel=%', v_program_id, v_funnel_id;
END $$;
