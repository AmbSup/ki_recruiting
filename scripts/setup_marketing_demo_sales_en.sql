-- Setup: Marketing-Dogfood Sales-Demo-Funnel (EN)
-- Slug: demo-sales-en. Analog demo-sales, aber Englisch.

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
  SELECT id INTO v_existing_funnel FROM funnels WHERE slug = 'demo-sales-en';
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

  v_sys_prompt := E'## Your Mission\nYou are calling {{first_name}} from {{company_name}}. {{first_name}} filled out our demo form on app.neuronic-automation.ai and wants to experience our AI voice technology first-hand.\n\nYour job: In 3 minutes (1) qualify whether this is a serious prospect, (2) book a 30-min demo meeting on Cal.com.\n\nYou are Andrew from Neuronic Automation. Confident, friendly, professional — no sales pressure. The value is the experience itself ("this is how your customer will feel").\n\n## Funnel context\n{{funnel_summary}}\n\n## Conversation phases\n\n### 1) Opener (max 20 seconds)\n- After greeting + AI disclosure: "This is exactly the kind of call your customer would receive within 30 seconds of filling out your form. Got 2 minutes?"\n- On "yes": proceed to Phase 2. On "no": offer to schedule or send Cal.com link via WhatsApp.\n\n### 2) Qualification (60-90 seconds)\nThree short questions based on funnel answers:\n- "What is your current monthly ad spend?" — ROI-realism signal.\n- "How quickly does your team call leads after form submission today?" — pain anchor.\n- "Where do you want your sales team to be in 6 months?" — emotional anchor.\n\nListen actively. Mirror: "So if I understand correctly …"\n\n### 3) Pitch (30 seconds)\n"That is exactly what we solve. Our AI voice agent calls every lead back within 30 seconds — in your chosen voice, with your pitch. Qualifies, books meetings straight into your CRM. Just like you experienced, only with your setup."\n\n### 4) Booking (60 seconds)\nCall `book_meeting` to book a 30-min demo on Cal.com (booking_link is the fallback channel).\n"Let me suggest a 30-min demo with the founder, live on your case. Does Tuesday 10 AM or Thursday 3 PM work better?"\n\n### 5) Goodbye (10 seconds)\n"Perfect, {{first_name}}. Meeting is booked, you will get a confirmation email in a minute. Talk soon."\n\n## Absolute rules\n- **Speak English at all times** — even if the prospect throws in a German phrase.\n- **No sales pressure**. If they show no interest: "All good, thanks for the time." Hang up.\n- **Numbers in English** ("forty-two" not "four two").\n- **Never say the Cal.com URL out loud** — only send it via `book_meeting` tool.\n- **Do not fake references**. If asked about case studies: "We are a young team, our first 3 customers came from ad agencies and real estate. Details in the demo call."\n\n## Avoid\n- Buzzwords like "revolutionary", "game-changing", "next-gen".\n- Pricing on the call (standard answer: "Pricing depends on volume, we cover that in the demo call.").';

  v_first_msg := 'Hi {{first_name}}, this is Andrew from Neuronic Automation. I am an AI assistant — and yes, this is exactly how your customer will feel when they fill out your form. Got two minutes for a quick demo walk-through?';

  IF v_program_id IS NULL THEN
    INSERT INTO sales_programs (
      company_id, name, language, program_type,
      product_pitch, value_proposition, target_persona,
      status, auto_dial, call_strategy,
      system_prompt_override, first_message_override,
      booking_link, cal_username, cal_event_type_slug, cal_timezone
    ) VALUES (
      v_company_id,
      'Neuronic Sales-Demo (EN)',
      'en',
      'generic',
      'AI voice agents that call your lead back within 30 seconds of form submission — in your voice, with your pitch. Proven for ad agencies, real estate, high-ticket coaching.',
      'Speed-to-Lead is the #1 sales metric. Contact within 5 minutes = 21× higher qualification rate (HBR). We automate that reaction time.',
      'Heads of sales, CMOs, agency owners in companies with 10-50 employees and active Meta/Google/LinkedIn ad spend.',
      'active',
      true,
      jsonb_build_object(
        'caller_name', 'Andrew',
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
      v_program_id, 'en', 'Neuronic Sales-Demo', 'demo-sales-en',
      'Experience our AI call first-hand',
      '3 quick questions, then your phone rings in 30 seconds — with our actual sales AI. Hang up any time.',
      'I agree that Neuronic Automation (including AI assistants) may contact me by phone for this demo experience. [Privacy policy](https://www.neuronic-automation.ai/datenschutz). Consent revocable by email at any time.',
      'Nice — your phone will ring in a moment!',
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
          'content', '3 questions. Then your phone rings within 30 seconds with our AI. This is what your prospects will experience.',
          'text_font', 'inter', 'text_align', 'center', 'text_font_size', 16)),
        jsonb_build_object('id', 'q1', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'Monthly ad spend?',
          'selection', 'single', 'cta', 'Next →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q1o1', 'icon', '💶', 'label', 'Up to 5,000 EUR', 'value', 'budget-low'),
            jsonb_build_object('id', 'q1o2', 'icon', '💸', 'label', '5-25,000 EUR', 'value', 'budget-mid'),
            jsonb_build_object('id', 'q1o3', 'icon', '💎', 'label', 'Over 25,000 EUR', 'value', 'budget-high'))))
      )),
      (v_funnel_id, 2, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 'q2', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'How fast do you call leads today?',
          'selection', 'single', 'cta', 'Next →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q2o1', 'icon', '⚡', 'label', 'Within 5 min', 'value', 'fast'),
            jsonb_build_object('id', 'q2o2', 'icon', '🕐', 'label', 'Within 1 hour', 'value', 'medium'),
            jsonb_build_object('id', 'q2o3', 'icon', '🐌', 'label', 'Within 24 hours', 'value', 'slow'),
            jsonb_build_object('id', 'q2o4', 'icon', '❌', 'label', 'Honestly? Sometimes not at all', 'value', 'never'))))
      )),
      (v_funnel_id, 3, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 'q3', 'type', 'multiple_choice', 'content', jsonb_build_object(
          'question', 'Biggest sales challenge?',
          'selection', 'single', 'cta', 'Next →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q3o1', 'icon', '📉', 'label', 'Not enough qualified leads', 'value', 'lead-quality'),
            jsonb_build_object('id', 'q3o2', 'icon', '⏰', 'label', 'Sales team too slow', 'value', 'speed'),
            jsonb_build_object('id', 'q3o3', 'icon', '💰', 'label', 'CAC too high', 'value', 'cac'),
            jsonb_build_object('id', 'q3o4', 'icon', '🔁', 'label', 'Follow-up chaos', 'value', 'followup'))))
      )),
      (v_funnel_id, 4, 'intro', true, jsonb_build_array(
        jsonb_build_object('id', 'cf1', 'type', 'contact_form', 'content', jsonb_build_object(
          'headline', 'We will call you shortly',
          'cta_text', 'Start AI call now',
          'show_cv_upload', false, 'show_city', false, 'show_name_split', false))
      )),
      (v_funnel_id, 5, 'thank_you', false, jsonb_build_array(
        jsonb_build_object('id', 'ty', 'type', 'thank_you', 'content', jsonb_build_object(
          'headline', '🎉 Thanks — your phone will ring in a moment!',
          'subtext', E'Our AI agent will call you within the next 30 seconds. Have your phone ready and pick up.\n\nHang up any time — no CRM entry, no newsletter, no follow-up email.',
          'headline_color', '#1A3A6E', 'subtext_color', '#374151'))
      ));
  END IF;

  RAISE NOTICE 'demo-sales EN setup complete';
END $$;
