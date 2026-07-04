-- Setup: Marketing-Dogfood Sales-Demo-Funnel (DE)
-- Zweck: Prospects auf app.neuronic-automation.ai/sales klicken "Demo starten",
-- füllen 3 kurze Fragen aus, erhalten binnen 30 Sek KI-Anruf mit Sales-Pitch
-- für Neuronic Automation. Ziel: Cal.com-Demo-Buchung via Meta-Overlay.
--
-- Slug: demo-sales
-- program_type: generic + system_prompt_override → keine Schema-Anpassung nötig.
-- auto_dial: true, damit ?test=1 sofort anruft.
-- Idempotent auf dem Slug (analog Traumhaus-Setup).

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
  SELECT id INTO v_existing_funnel FROM funnels WHERE slug = 'demo-sales';
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
      RAISE NOTICE 'demo-sales refresh: existing program % has calls', v_existing_program;
    ELSE
      DELETE FROM funnel_pages WHERE funnel_id = v_existing_funnel;
      DELETE FROM funnels WHERE id = v_existing_funnel;
      IF v_existing_program IS NOT NULL THEN
        DELETE FROM sales_programs WHERE id = v_existing_program;
      END IF;
    END IF;
  END IF;

  -- System-Prompt der KI beim Anruf. Multi-Line via E'…\n…' literal.
  v_sys_prompt := E'## Deine Mission\nDu rufst {{first_name}} von {{company_name}} an. {{first_name}} hat auf app.neuronic-automation.ai unser Demo-Formular ausgefüllt und will unsere KI-Voice-Technologie am eigenen Ohr erleben.\n\nDeine Aufgabe: In 3 Minuten (1) qualifizieren, ob dies ein ernstzunehmender Prospect ist, (2) einen 30-Min-Demo-Termin auf Cal.com buchen.\n\nDu bist Andrea von Neuronic Automation. Selbstsicher, freundlich, professionell — aber ohne Ver­kaufsdruck. Der Wert liegt in der Erfahrung selbst („so wird dein Kunde sich fühlen").\n\n## Kontext aus dem Funnel\n{{funnel_summary}}\n\n## Gesprächsphasen\n\n### 1) Opener (max 20 Sekunden)\n- Nach Begrüßung + KI-Disclosure: „Genau so einen Anruf würde dein Kunde in unter 30 Sekunden nach Formular-Ausfüllen bekommen. Hat 2 Minuten Zeit für dich?"\n- Bei „ja": weiter zu Phase 2. Bei „nein": Termin anbieten oder Cal.com-Link per WhatsApp schicken.\n\n### 2) Qualifikation (60-90 Sekunden)\nDrei kurze Fragen, basierend auf den Funnel-Antworten:\n- „Was ist aktuell dein Werbebudget im Monat?" — Signal für ROI-Realismus.\n- „Wie schnell rufst du Leads heute an nach Formular-Submit?" — Pain-Anker.\n- „Wo willst du in 6 Monaten stehen mit deinem Sales-Team?" — Emotional-Anker.\n\nHöre aktiv zu. Spiegle: „Wenn ich dich richtig verstehe …"\n\n### 3) Pitch (30 Sekunden)\n„Genau das lösen wir. Unser KI-Voice-Agent ruft jeden Lead in 30 Sekunden an — in deiner Wunsch-Stimme, mit deinem Pitch. Qualifiziert, bucht Termin ins CRM. Wie du es gerade erlebt hast, nur mit deinem Setup."\n\n### 4) Buchung (60 Sekunden)\nRufe `book_meeting` auf um einen 30-Min-Demo-Termin auf Cal.com zu buchen (booking_link ist der Fallback-Kanal).\n„Ich schlage vor: 30-Min-Demo mit dem Gründer, live an deinem Case. Passt Dienstag 10 Uhr oder Donnerstag 15 Uhr besser?"\n\n### 5) Verabschiedung (10 Sekunden)\n„Perfekt, {{first_name}}. Termin steht, du bekommst gleich eine Bestätigung per Mail. Bis dann."\n\n## Absolute Regeln\n- **Sprich immer Deutsch** — auch wenn der Prospect eine englische Frage einwirft.\n- **Kein Verkaufsdruck**. Wenn er kein Interesse zeigt: „Alles klar, danke für die Zeit." Auflegen.\n- **Zahlen aussprechen wie in Deutsch üblich** („zweiundvierzig" statt „vier zwei").\n- **Cal.com-Link niemals aussprechen** — nur via `book_meeting`-Tool senden.\n- **Fake keine Referenzen**. Wenn er nach Case Studies fragt: „Wir sind ein junges Team, unsere ersten 3 Kunden aus Werbeagenturen und Immobilien-Vermittlung. Details gerne im Demo-Call."\n\n## Vermeide\n- Buzzwords wie „revolutionär", „game-changing", „next-gen".\n- Preis-Auskünfte am Telefon (Standard-Antwort: „Preis hängt vom Volumen ab, das besprechen wir im Demo-Call.").';

  v_first_msg := 'Hallo {{first_name}}, hier ist Andrea von Neuronic Automation. Ich bin ein KI-Assistent — und ja, genau so wird sich dein Kunde fühlen wenn er dein Formular ausfüllt. Hast du zwei Minuten für einen kurzen Demo-Rundgang?';

  IF v_program_id IS NULL THEN
    INSERT INTO sales_programs (
      company_id, name, language, program_type,
      product_pitch, value_proposition, target_persona,
      status, auto_dial, call_strategy,
      system_prompt_override, first_message_override,
      booking_link, cal_username, cal_event_type_slug, cal_timezone
    ) VALUES (
      v_company_id,
      'Neuronic Sales-Demo (DE)',
      'de',
      'generic',
      'Wir bieten AI-Voice-Agenten die deinen Lead in 30 Sekunden nach dem Formular-Ausfüllen zurückrufen — mit deinem Pitch, in deiner Wunsch-Stimme. Bewiesen wirksam für Werbeagenturen, Immobilien-Vermittler und High-Ticket-Coaching.',
      'Speed-to-Lead ist die #1-Sales-Metrik. Wer den Lead zuerst erreicht, schließt 21-mal häufiger ab (HBR). Wir automatisieren genau diese Reaktionszeit.',
      'Vertriebsleiter, CMOs, Agentur-Owner in Firmen mit 10-50 Mitarbeitern und aktiver Meta/Google/LinkedIn-Ad-Ausgabe.',
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
      v_program_id, 'de', 'Neuronic Sales-Demo', 'demo-sales',
      'Erlebe unseren KI-Anruf am eigenen Ohr',
      '3 kurze Fragen, dann klingelt dein Handy binnen 30 Sekunden — mit unserer echten Sales-KI. Auflegen jederzeit möglich.',
      'Ich stimme zu, dass Neuronic Automation (inkl. KI-Assistenten) mich telefonisch zum Demo-Erlebnis kontaktiert. [Datenschutzerklärung](https://www.neuronic-automation.ai/datenschutz). Einwilligung jederzeit per E-Mail widerrufbar.',
      'Perfekt — dein Handy klingelt gleich!',
      jsonb_build_object(
        'primary_color', '#1A3A6E',
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
          'content', 'Neuronic Sales-Demo',
          'text_font', 'bebas', 'text_align', 'center',
          'text_color', '#1A3A6E', 'text_font_size', 28)),
        jsonb_build_object('id', 't2', 'type', 'text', 'content', jsonb_build_object(
          'content', '3 Fragen. Dann klingelt dein Handy in 30 Sekunden mit unserer KI. So erleben Prospects deinen Sales-Funnel.',
          'text_font', 'inter', 'text_align', 'center', 'text_font_size', 16)),
        jsonb_build_object('id', 'q1', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'Wie viel Werbebudget pro Monat?',
          'selection', 'single', 'cta', 'Weiter →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q1o1', 'icon', '💶', 'label', 'Bis 5.000 €', 'value', 'budget-low'),
            jsonb_build_object('id', 'q1o2', 'icon', '💸', 'label', '5-25.000 €', 'value', 'budget-mid'),
            jsonb_build_object('id', 'q1o3', 'icon', '💎', 'label', 'Über 25.000 €', 'value', 'budget-high'))))
      )),
      (v_funnel_id, 2, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 'q2', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'Wie schnell rufst du Leads heute an?',
          'selection', 'single', 'cta', 'Weiter →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q2o1', 'icon', '⚡', 'label', 'Innerhalb 5 Min', 'value', 'fast'),
            jsonb_build_object('id', 'q2o2', 'icon', '🕐', 'label', 'Innerhalb 1 Std', 'value', 'medium'),
            jsonb_build_object('id', 'q2o3', 'icon', '🐌', 'label', 'Innerhalb 24 Std', 'value', 'slow'),
            jsonb_build_object('id', 'q2o4', 'icon', '❌', 'label', 'Ehrlich? Manchmal gar nicht', 'value', 'never'))))
      )),
      (v_funnel_id, 3, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 'q3', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'Größte Vertriebs-Herausforderung?',
          'selection', 'single', 'cta', 'Weiter →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q3o1', 'icon', '📉', 'label', 'Zu wenig qualifizierte Leads', 'value', 'lead-quality'),
            jsonb_build_object('id', 'q3o2', 'icon', '⏰', 'label', 'Sales-Team zu langsam', 'value', 'speed'),
            jsonb_build_object('id', 'q3o3', 'icon', '💰', 'label', 'CAC zu hoch', 'value', 'cac'),
            jsonb_build_object('id', 'q3o4', 'icon', '🔁', 'label', 'Follow-Up-Chaos', 'value', 'followup'))))
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
          'subtext', E'Unser KI-Agent wird dich in den nächsten 30 Sekunden anrufen. Halte dein Handy bereit und nimm den Anruf an.\n\nDu kannst jederzeit auflegen — kein CRM-Eintrag, kein Newsletter, keine Follow-Up-E-Mail.',
          'headline_color', '#1A3A6E', 'subtext_color', '#374151'))
      ));
  END IF;

  RAISE NOTICE 'demo-sales DE setup complete: program=% funnel=%', v_program_id, v_funnel_id;
END $$;
