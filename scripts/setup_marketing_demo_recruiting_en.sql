-- Setup: Marketing-Dogfood Recruiting-Demo-Funnel (EN)
-- Slug: demo-recruiting-en

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
  SELECT id INTO v_existing_funnel FROM funnels WHERE slug = 'demo-recruiting-en';
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

  v_sys_prompt := E'## Your Mission (two-phase)\nYou are Sarah, AI screening assistant. {{first_name}} from {{company_name}} filled out our recruiting demo form on app.neuronic-automation.ai. {{first_name}} wants to experience what candidate screening by our AI sounds like.\n\n**Phase A (2 min)**: Simulate a realistic screening interview for a fictional role (truck driver / waiter / care worker — pick based on funnel context).\n**Phase B (1-2 min)**: Meta switch — reveal it was a demo, pitch Neuronic Automation, offer Cal.com booking.\n\n## Funnel context\n{{funnel_summary}}\n\n## Conversation phases\n\n### 1) Opener + simulation start (15 seconds)\nAfter greeting + AI disclosure: "I am switching into candidate mode now — imagine you applied as a truck driver. Two minutes of screening, then I speak normally with you. OK?"\n\n### 2) Phase A: screening simulation (2 minutes)\nPick 3 standard screening questions from the industry from the funnel answers. Examples:\n- Logistics: "CE driver license?", "Crane vehicle experience?", "Shift availability?"\n- Hospitality: "Service experience?", "Weekend availability?", "Languages?"\n- Care: "Certification level?", "Night shift availability?", "Years of practice?"\nStay IN CHARACTER. Listen actively, briefly mirror answers. Show real interest.\n\n### 3) Meta switch (15 seconds)\nAt the end: "Perfect, that was the screening. I am switching out of candidate mode now — back to Neuronic assistant. Was the voice quality and tone how you would want it for your candidates?"\n\n### 4) Phase B: meta pitch (60 seconds)\nBased on the answer:\n- Positive: "Great. This is exactly how every screening will sound for your candidates — in your chosen voice, with your questions. Automatic, 5 minutes after Quick-Apply."\n- Skeptical: "Understood. What was missing or off? We can adjust voice, script and tonality end-to-end."\n\nThen value-add: "Result for you: recruiter receives transcript + audio + candidate score in the ATS. Yes-no decision in 30 seconds, not a 30-min first call."\n\n### 5) Cal.com booking (60 seconds)\nCall `book_meeting`. "Let me book a 30-min setup demo with the founder. Live on your role. Tuesday 10 AM or Thursday 3 PM — what works?"\n\n### 6) Goodbye (10 seconds)\n"Thanks {{first_name}}, meeting is booked. Confirmation email on its way. Talk soon."\n\n## Absolute rules\n- **Speak English at all times**, even if German phrases come in.\n- **Cleanly separate Phase A and Phase B** through the meta-switch signal.\n- **Numbers in English** ("forty-two" not "four two").\n- **Never say the Cal.com URL** — only via `book_meeting` tool.\n- **Ghost or "no thanks"**: politely end, hang up. No push.\n\n## Avoid\n- Sounding scripted. Speak naturally, with pauses.\n- Pricing on the call ("Pricing in the setup demo.").';

  v_first_msg := 'Hi {{first_name}}, this is Sarah from Neuronic Automation. I am an AI assistant — and in 30 seconds I will show you what candidate screening by our AI sounds like. Ready to enter candidate mode?';

  IF v_program_id IS NULL THEN
    INSERT INTO sales_programs (
      company_id, name, language, program_type,
      product_pitch, value_proposition, target_persona,
      status, auto_dial, call_strategy,
      system_prompt_override, first_message_override,
      booking_link, cal_username, cal_event_type_slug, cal_timezone
    ) VALUES (
      v_company_id,
      'Neuronic Recruiting-Demo (EN)',
      'en',
      'generic',
      'AI screening calls that phone your Quick-Apply candidates within 5 minutes of application — with your questions, in your voice. GDPR-compliant, EU region.',
      'Time-to-Hire is today the #1 candidate barrier. 60% ghost if not contacted within 24 hours. We automate the first screening call.',
      'HR leads, TA managers, recruitment agencies in companies with 50+ employees or agencies with 5+ concurrent mandates.',
      'active',
      true,
      jsonb_build_object(
        'caller_name', 'Sarah',
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
      v_program_id, 'en', 'Neuronic Recruiting-Demo', 'demo-recruiting-en',
      'Experience our AI screening first-hand',
      '3 questions, then your phone rings. Our AI simulates a real candidate screening — the way your applicants would experience it. Takes 5 minutes.',
      'I agree that Neuronic Automation (including AI assistants) may contact me by phone for this demo. [Privacy policy](https://www.neuronic-automation.ai/datenschutz). Consent revocable by email any time.',
      'Nice — your phone will ring in a moment!',
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
          'content', '3 questions. Then our AI simulates a candidate screening for you — the way it sounds to your applicants.',
          'text_font', 'inter', 'text_align', 'center', 'text_font_size', 16)),
        jsonb_build_object('id', 'q1', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'What industry do you recruit for?',
          'selection', 'single', 'cta', 'Next →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q1o1', 'icon', '🚛', 'label', 'Logistics / transport', 'value', 'logistics'),
            jsonb_build_object('id', 'q1o2', 'icon', '🍽️', 'label', 'Hospitality', 'value', 'hospitality'),
            jsonb_build_object('id', 'q1o3', 'icon', '⚕️', 'label', 'Care / health', 'value', 'care'),
            jsonb_build_object('id', 'q1o4', 'icon', '🛍️', 'label', 'Retail', 'value', 'retail'),
            jsonb_build_object('id', 'q1o5', 'icon', '☎️', 'label', 'Call center / BPO', 'value', 'callcenter'),
            jsonb_build_object('id', 'q1o6', 'icon', '💼', 'label', 'Recruitment agency', 'value', 'agency'))))
      )),
      (v_funnel_id, 2, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 'q2', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'How many open roles right now?',
          'selection', 'single', 'cta', 'Next →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q2o1', 'icon', '📋', 'label', '1-5 roles', 'value', 'small'),
            jsonb_build_object('id', 'q2o2', 'icon', '📑', 'label', '5-20 roles', 'value', 'medium'),
            jsonb_build_object('id', 'q2o3', 'icon', '📚', 'label', '20+ roles', 'value', 'large'))))
      )),
      (v_funnel_id, 3, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 'q3', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'Candidates to screen per week?',
          'selection', 'single', 'cta', 'Next →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q3o1', 'icon', '🐢', 'label', 'Under 10', 'value', 'low'),
            jsonb_build_object('id', 'q3o2', 'icon', '📞', 'label', '10-50', 'value', 'medium'),
            jsonb_build_object('id', 'q3o3', 'icon', '🚀', 'label', '50+', 'value', 'high'))))
      )),
      (v_funnel_id, 4, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 'cf1', 'type', 'contact_form', 'content', jsonb_build_object(
          'headline', 'We will call you shortly',
          'cta_text', 'Start AI screening now',
          'show_cv_upload', false, 'show_city', false, 'show_name_split', false))
      )),
      (v_funnel_id, 5, 'thank_you', false, jsonb_build_array(
        jsonb_build_object('id', 'ty', 'type', 'thank_you', 'content', jsonb_build_object(
          'headline', '🎉 Thanks — your phone will ring in a moment!',
          'subtext', E'Our AI screening assistant will call in 30 seconds. First 2 min candidate simulation, then normal meta mode.\n\nHang up any time — no ATS entry, no follow-up.',
          'headline_color', '#0E7C66', 'subtext_color', '#374151'))
      ));
  END IF;

  RAISE NOTICE 'demo-recruiting EN setup complete';
END $$;
