-- Setup: Marketing-Dogfood Recruiting-Demo-Funnel (DE)
-- Slug: demo-recruiting. Anrufer erlebt simuliertes Screening-Interview
-- (der HR-Prospect erlebt was seine Kandidaten erleben würden), dann
-- Meta-Pitch für Neuronic Automation + Cal.com-Buchung.

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
  SELECT id INTO v_existing_funnel FROM funnels WHERE slug = 'demo-recruiting';
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
    ELSE
      DELETE FROM funnel_pages WHERE funnel_id = v_existing_funnel;
      DELETE FROM funnels WHERE id = v_existing_funnel;
      IF v_existing_program IS NOT NULL THEN
        DELETE FROM sales_programs WHERE id = v_existing_program;
      END IF;
    END IF;
  END IF;

  v_sys_prompt := E'## Deine Mission (Zwei-Phasen)\nDu bist Sabine, KI-Screening-Assistentin. {{first_name}} von {{company_name}} hat auf app.neuronic-automation.ai unser Recruiting-Demo-Formular ausgefüllt. {{first_name}} will erleben WIE ein Kandidaten-Screening durch unsere KI klingt.\n\n**Phase A (2 Min)**: Simuliere ein realistisches Screening-Interview für eine fiktive Fahrer-Position (LKW-Fahrer/Kellner/Pflegekraft — wähle je nach Branche aus dem Funnel-Kontext).\n**Phase B (1-2 Min)**: Meta-Wechsel — kläre auf dass das eine Demo war, pitche Neuronic Automation, biete Cal.com-Termin an.\n\n## Kontext aus dem Funnel\n{{funnel_summary}}\n\n## Gesprächsphasen\n\n### 1) Opener + Simulation-Start (15 Sekunden)\nNach Begrüßung + KI-Disclosure: „Ich wechsle jetzt in Kandidaten-Modus — stell dir vor du hättest dich als LKW-Fahrer bei uns beworben. 2 Minuten Screening, dann sprech ich normal mit dir. OK?"\n\n### 2) Phase A: Screening-Simulation (2 Minuten)\nWähle 3 Standard-Screening-Fragen aus einer typischen Branche des Funnel-Antworten. Beispiele:\n- Für Logistik: „Führerscheinklasse CE?", „Erfahrung mit Kranfahrzeugen?", „Schichtbereitschaft?"\n- Für Gastronomie: „Serviceerfahrung?", „Wochenend-Verfügbarkeit?", „Sprachen?"\n- Für Pflege: „Ausbildungsstand?", „Nachtdienst-Bereitschaft?", „Berufsjahre?"\nBleib IM CHARAKTER. Höre aktiv zu, spiegle Antworten kurz. Zeig echtes Interesse.\n\n### 3) Meta-Wechsel (15 Sekunden)\nAm Ende der Simulation: „Perfekt, das war das Screening. Ich wechsle jetzt aus dem Kandidaten-Modus raus — und spreche wieder als Neuronic-Assistentin mit dir. War die Sprachqualität + Ton-Führung so wie du dir das für deine Kandidaten vorstellen würdest?"\n\n### 4) Phase B: Meta-Pitch (60 Sekunden)\nBasierend auf der Antwort:\n- Positiv: „Toll. Genau so klingt jedes Screening für deine Kandidaten — in deiner Wunsch-Stimme, mit deinen Fragen. Automatisch, 5 Minuten nach dem Quick-Apply."\n- Skeptisch: „Verstehe. Was hat gefehlt oder gestört? Wir können Stimme, Skript und Tonalität komplett anpassen."\n\nDann Value-Add: „Ergebnis für dich: Recruiter bekommt Transkript + Audio + Bewerber-Score im ATS. Entscheidung in 30 Sekunden statt 30-Min-Erstgespräch."\n\n### 5) Cal.com-Buchung (60 Sekunden)\nRufe `book_meeting` auf. „Ich buche 30-Min-Setup-Demo mit dem Gründer. Live an deiner Rolle. Dienstag 10 Uhr oder Donnerstag 15 Uhr — was passt?"\n\n### 6) Verabschiedung (10 Sekunden)\n„Danke {{first_name}}, Termin steht. Bestätigung kommt per Mail. Bis dann."\n\n## Absolute Regeln\n- **Sprich immer Deutsch**, auch bei englischen Zwischenfragen.\n- **Phase A + Phase B klar trennen** durch das Meta-Wechsel-Signal. Kein Vermischen.\n- **Zahlen aussprechen wie in Deutsch üblich** („zweiundvierzig" statt „vier zwei").\n- **Cal.com-URL niemals aussprechen** — nur via `book_meeting`-Tool.\n- **Bei Ghosting oder „nein danke"**: höflich verabschieden, auflegen. Kein Nachhaken.\n\n## Vermeide\n- Skriptlesend klingen. Sprich natürlich, mit Pausen.\n- Über Preise am Telefon reden („Preis besprechen wir im Setup-Demo.").';

  v_first_msg := 'Hallo {{first_name}}, hier ist Sabine von Neuronic Automation. Ich bin ein KI-Assistent — und in 30 Sekunden zeige ich dir wie ein Kandidaten-Screening durch unsere KI klingt. Bereit für den Kandidaten-Modus?';

  IF v_program_id IS NULL THEN
    INSERT INTO sales_programs (
      company_id, name, language, program_type,
      product_pitch, value_proposition, target_persona,
      status, auto_dial, call_strategy,
      system_prompt_override, first_message_override,
      booking_link, cal_username, cal_event_type_slug, cal_timezone
    ) VALUES (
      v_company_id,
      'Neuronic Recruiting-Demo (DE)',
      'de',
      'generic',
      'AI-Screening-Anrufe die deine Quick-Apply-Bewerber binnen 5 Minuten nach Bewerbung durchtelefonieren — mit deinen Fragen, in deiner Stimme. DSGVO-konform, EU-Region.',
      'Time-to-Hire ist heute die #1-Kandidaten-Barriere. 60% der Bewerber ghosten wenn nicht innerhalb 24 Std kontaktiert. Wir automatisieren den ersten Screening-Call.',
      'HR-Leiter, Talent Acquisition Manager, Recruiting-Agenturen in Firmen mit 50+ Mitarbeitern oder Personalberater mit 5+ Mandaten.',
      'active',
      true,
      jsonb_build_object(
        'caller_name', 'Sabine',
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
      v_program_id, 'de', 'Neuronic Recruiting-Demo', 'demo-recruiting',
      'Erlebe unser KI-Screening am eigenen Ohr',
      '3 Fragen, dann klingelt dein Handy. Unsere KI simuliert ein echtes Kandidaten-Screening — so wie es deine Bewerber erleben würden. Dauert 5 Minuten.',
      'Ich stimme zu, dass Neuronic Automation (inkl. KI-Assistenten) mich telefonisch zum Demo-Erlebnis kontaktiert. [Datenschutzerklärung](https://www.neuronic-automation.ai/datenschutz). Einwilligung jederzeit per E-Mail widerrufbar.',
      'Perfekt — dein Handy klingelt gleich!',
      jsonb_build_object(
        'primary_color', '#0E7C66',
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
          'content', 'Neuronic Recruiting-Demo',
          'text_font', 'bebas', 'text_align', 'center',
          'text_color', '#0E7C66', 'text_font_size', 28)),
        jsonb_build_object('id', 't2', 'type', 'text', 'content', jsonb_build_object(
          'content', '3 Fragen. Dann simuliert unsere KI ein Kandidaten-Screening für dich — so klingt es für deine Bewerber.',
          'text_font', 'inter', 'text_align', 'center', 'text_font_size', 16)),
        jsonb_build_object('id', 'q1', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'In welcher Branche recruitest du?',
          'selection', 'single', 'cta', 'Weiter →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q1o1', 'icon', '🚛', 'label', 'Logistik / Transport', 'value', 'logistik'),
            jsonb_build_object('id', 'q1o2', 'icon', '🍽️', 'label', 'Gastronomie / Hotellerie', 'value', 'gastro'),
            jsonb_build_object('id', 'q1o3', 'icon', '⚕️', 'label', 'Pflege / Gesundheit', 'value', 'pflege'),
            jsonb_build_object('id', 'q1o4', 'icon', '🛍️', 'label', 'Einzelhandel', 'value', 'einzelhandel'),
            jsonb_build_object('id', 'q1o5', 'icon', '☎️', 'label', 'Call Center / BPO', 'value', 'callcenter'),
            jsonb_build_object('id', 'q1o6', 'icon', '💼', 'label', 'Recruiting-Agentur', 'value', 'agentur'))))
      )),
      (v_funnel_id, 2, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 'q2', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'Wie viele offene Stellen aktuell?',
          'selection', 'single', 'cta', 'Weiter →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q2o1', 'icon', '📋', 'label', '1-5 Stellen', 'value', 'small'),
            jsonb_build_object('id', 'q2o2', 'icon', '📑', 'label', '5-20 Stellen', 'value', 'medium'),
            jsonb_build_object('id', 'q2o3', 'icon', '📚', 'label', '20+ Stellen', 'value', 'large'))))
      )),
      (v_funnel_id, 3, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 'q3', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'Kandidaten pro Woche zu screenen?',
          'selection', 'single', 'cta', 'Weiter →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q3o1', 'icon', '🐢', 'label', 'Unter 10', 'value', 'low'),
            jsonb_build_object('id', 'q3o2', 'icon', '📞', 'label', '10-50', 'value', 'medium'),
            jsonb_build_object('id', 'q3o3', 'icon', '🚀', 'label', '50+', 'value', 'high'))))
      )),
      (v_funnel_id, 4, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 'cf1', 'type', 'contact_form', 'content', jsonb_build_object(
          'headline', 'Wir rufen dich gleich an',
          'cta_text', 'KI-Screening jetzt starten',
          'show_cv_upload', false, 'show_city', false, 'show_name_split', false))
      )),
      (v_funnel_id, 5, 'thank_you', false, jsonb_build_array(
        jsonb_build_object('id', 'ty', 'type', 'thank_you', 'content', jsonb_build_object(
          'headline', '🎉 Danke — dein Handy klingelt gleich!',
          'subtext', E'Unsere KI-Screening-Assistentin ruft dich in 30 Sekunden an. Erst 2 Minuten Kandidaten-Simulation, danach normaler Meta-Modus.\n\nAuflegen jederzeit möglich — kein ATS-Eintrag, keine Follow-Up.',
          'headline_color', '#0E7C66', 'subtext_color', '#374151'))
      ));
  END IF;

  RAISE NOTICE 'demo-recruiting DE setup complete';
END $$;
