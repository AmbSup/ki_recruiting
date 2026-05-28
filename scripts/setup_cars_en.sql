-- Setup: Car Special Offers (English Product-Finder) — English duplicate of
-- the German Reise-Special-Aktionen Setup. Target: dealership/B2C dealers.
-- Funnel: 4 discovery questions (type / drivetrain / budget / age) → contact
-- form → AI-Call with monthly + cash dual-price pitch.
--
-- This script is idempotent on the slug (deletes any prior 'car-special-offers'
-- funnel + program before re-inserting). Safe to re-run during seed/demo.

DO $$
DECLARE
  v_company_id uuid := 'a523fa80-138b-45db-95c7-d8289aa0360e';  -- Neuronic Automation
  v_program_id uuid;
  v_funnel_id  uuid;
  v_existing_funnel uuid;
  v_existing_program uuid;
BEGIN
  -- Idempotent cleanup
  SELECT id INTO v_existing_funnel FROM funnels WHERE slug = 'car-special-offers';
  IF v_existing_funnel IS NOT NULL THEN
    SELECT sales_program_id INTO v_existing_program FROM funnels WHERE id = v_existing_funnel;
    DELETE FROM funnel_pages WHERE funnel_id = v_existing_funnel;
    DELETE FROM funnels WHERE id = v_existing_funnel;
    IF v_existing_program IS NOT NULL THEN
      DELETE FROM sales_offers WHERE sales_program_id = v_existing_program;
      DELETE FROM sales_programs WHERE id = v_existing_program;
    END IF;
  END IF;

  -- 1. Sales Program (English, language='en', monthly_with_purchase price-format)
  INSERT INTO sales_programs (
    company_id, name, language, program_type,
    product_pitch, value_proposition, target_persona,
    status, auto_dial, call_strategy
  ) VALUES (
    v_company_id,
    'Car Special Offers',
    'en',
    'product_finder',
    'We curate fresh top-deal car offers weekly — matched to your preferences, ready for test drive.',
    'AI car-assistant matches you with the perfect vehicle in 2 minutes — no need to browse hundreds of dealerships.',
    'Car-shoppers who want a curated top match instead of long search.',
    'active',
    true,
    jsonb_build_object(
      'caller_name', 'Andrew',
      'require_consent', false,
      'matching', jsonb_build_object(
        'min_match_score', 1,
        'fallback_message', 'Our specialist team will reach out with personalized options matching your budget and needs.',
        'price_format', 'monthly_with_purchase',
        'funnel_tag_map', jsonb_build_object(
          'Which type of car fits you best?', jsonb_build_object(
            'suv', 'suv',
            'sporty', 'sporty',
            'family', 'family'
          ),
          'Electric or fuel?', jsonb_build_object(
            'electric', 'electric',
            'fuel', 'fuel'
          ),
          'What''s your monthly budget?', jsonb_build_object(
            'budget-low', 'budget-low',
            'budget-mid', 'budget-mid',
            'budget-high', 'budget-high'
          ),
          'New or used?', jsonb_build_object(
            'new', 'new',
            'used', 'used'
          )
        )
      )
    )
  ) RETURNING id INTO v_program_id;

  -- 2. Sales Offers — 8 cars covering main tag-combinations
  INSERT INTO sales_offers (
    sales_program_id, name, summary, description, tags,
    price_cents, purchase_price_cents, currency, image_url, detail_url, active
  ) VALUES
    (v_program_id,
     'VW Tiguan 2024 — Family SUV',
     'Spacious 7-seater family SUV with 2.0 TDI engine, panoramic roof, and adaptive cruise control.',
     'The VW Tiguan 2024 is a versatile family SUV with three rows of seating, a 2.0 TDI diesel engine, and Volkswagen''s full driver-assistance suite. Includes panoramic sunroof, heated seats, and a 10-inch infotainment system. Available with all-wheel drive. 4-year manufacturer warranty plus 8-year mobility guarantee. Dealer pickup at any Volkswagen partner across the country.',
     '["suv","fuel","family","budget-low","used"]'::jsonb,
     29900, 2400000, 'EUR',
     'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200',
     'https://app.neuronic-automation.ai/cars/vw-tiguan',
     true),

    (v_program_id,
     'BMW M3 Competition 2024',
     'Track-tuned 510hp twin-turbo, carbon trim, adaptive M suspension. Pure performance.',
     'The BMW M3 Competition is a high-performance sports sedan with a 510hp twin-turbo inline-six, carbon-fibre roof and trim, adaptive M suspension, and the latest M-specific drive modes. 0-100 km/h in 3.5 seconds. Includes BMW Live Cockpit Professional, M Sport seats, and the M Drive Professional package. 3-year manufacturer warranty, dealer-network nationwide.',
     '["sporty","fuel","budget-high","new"]'::jsonb,
     109900, 9200000, 'EUR',
     'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200',
     'https://app.neuronic-automation.ai/cars/bmw-m3',
     true),

    (v_program_id,
     'Tesla Model Y Long Range 2024',
     'Long-range electric family SUV with autopilot, glass roof, and 7-seat option.',
     'The Tesla Model Y Long Range offers approximately 530 km of WLTP range, dual-motor all-wheel drive, autopilot with auto-lane-change, and a panoramic glass roof. Optional third-row seating for a 7-seat family configuration. 8-year battery warranty, supercharger access included. Pickup from any Tesla service centre.',
     '["suv","electric","family","budget-mid","new"]'::jsonb,
     54900, 5400000, 'EUR',
     'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200',
     'https://app.neuronic-automation.ai/cars/tesla-model-y',
     true),

    (v_program_id,
     'Audi RS6 Avant Performance 2024',
     'Performance station-wagon with 630hp V8, all-wheel-drive, and luxury interior.',
     'The Audi RS6 Avant Performance combines a 630hp twin-turbo V8 with quattro all-wheel drive and a fully-equipped luxury station-wagon body. 0-100 km/h in 3.4 seconds. Includes RS sports exhaust, ceramic brakes, Bang & Olufsen 3D audio, and the full virtual cockpit. 2-year manufacturer warranty extendable up to 5 years.',
     '["sporty","fuel","family","budget-high","new"]'::jsonb,
     89900, 12800000, 'EUR',
     'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200',
     'https://app.neuronic-automation.ai/cars/audi-rs6',
     true),

    (v_program_id,
     'Skoda Octavia Combi 1.5 TSI',
     'Practical family station-wagon. Affordable, reliable, well-equipped.',
     'The Skoda Octavia Combi 1.5 TSI is a practical family wagon with one of the largest cargo capacities in its class. Includes adaptive cruise, lane-keep assist, LED matrix headlights, and an 8-speed automatic. Fuel consumption around 5.5 L/100km. Reliable 1.5 TSI engine, full Skoda warranty included.',
     '["family","fuel","budget-low","used"]'::jsonb,
     18900, 1800000, 'EUR',
     'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200',
     'https://app.neuronic-automation.ai/cars/skoda-octavia',
     true),

    (v_program_id,
     'VW ID.4 Pro 2023',
     'Electric SUV with 200hp, 530km range, and matrix LED headlights.',
     'The VW ID.4 Pro is an all-electric family SUV with approximately 530 km of WLTP range, 200hp rear-wheel-drive setup, and Volkswagen IQ.Light matrix LED headlights. Includes ID. travel assist, 12-inch infotainment, and rapid-charging up to 135 kW. 8-year battery warranty, dealer-network nationwide.',
     '["suv","electric","family","budget-mid","used"]'::jsonb,
     39900, 3800000, 'EUR',
     'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=1200',
     'https://app.neuronic-automation.ai/cars/vw-id4',
     true),

    (v_program_id,
     'Porsche Taycan 4S 2024',
     'Electric sports sedan with 530hp, 0-100 in 4 seconds, and Porsche racing DNA.',
     'The Porsche Taycan 4S delivers 530hp from dual electric motors, 0-100 km/h in 4 seconds, and approximately 440 km of WLTP range. Includes Porsche InnoDrive, adaptive air suspension, and the latest Porsche Communication Management. Sport Chrono package and 800-volt fast-charging architecture standard.',
     '["sporty","electric","budget-high","new"]'::jsonb,
     129900, 11000000, 'EUR',
     'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=1200',
     'https://app.neuronic-automation.ai/cars/porsche-taycan',
     true),

    (v_program_id,
     'Hyundai Kona Electric 2024',
     'Compact electric SUV with 484km range, smart safety features, 8-year battery warranty.',
     'The Hyundai Kona Electric is a compact all-electric SUV with approximately 484 km of WLTP range, 204hp front-wheel-drive, and Hyundai SmartSense safety suite. Includes 10.25-inch dual-screen cockpit, wireless Apple CarPlay/Android Auto, and 100 kW DC fast-charging. 8-year battery warranty plus 5-year vehicle warranty.',
     '["suv","electric","budget-low","new"]'::jsonb,
     29900, 3700000, 'EUR',
     'https://images.unsplash.com/photo-1592853625511-ad0fcc3b6cf0?w=1200',
     'https://app.neuronic-automation.ai/cars/hyundai-kona',
     true);

  -- 3. Funnel (English, language='en')
  INSERT INTO funnels (
    sales_program_id, language, name, slug,
    intro_headline, intro_subtext, consent_text, thank_you_text,
    branding, funnel_type, status
  ) VALUES (
    v_program_id, 'en', 'Car Special Offers', 'car-special-offers',
    'Find your dream car in 2 minutes',
    'Answer 4 quick questions and our AI car-assistant will call you with curated top-deal offers.',
    'I agree that Neuronic Automation (including AI assistants) may contact me by phone about my car request. I can revoke this consent anytime via email.',
    'Thanks! Your car-assistant will call you shortly.',
    jsonb_build_object(
      'primary_color', '#1E3A8A',
      'button_text_color', '#FFFFFF',
      'bg_color', '#FFFFFF',
      'logo_url', ''
    ),
    'sales',
    'active'
  ) RETURNING id INTO v_funnel_id;

  -- 4. Funnel Pages — 4 question pages + contact_form + thank_you
  INSERT INTO funnel_pages (funnel_id, page_order, page_type, is_required, blocks) VALUES
    -- Page 1: car type
    (v_funnel_id, 1, 'intro', true, jsonb_build_array(
      jsonb_build_object(
        'id', 'c1t1', 'type', 'text',
        'content', jsonb_build_object(
          'content', 'Car Special Offers',
          'text_font', 'bebas',
          'text_align', 'center',
          'text_color', '#1E3A8A',
          'text_font_size', 28
        )
      ),
      jsonb_build_object(
        'id', 'c1t2', 'type', 'text',
        'content', jsonb_build_object(
          'content', 'Let''s find your dream car in 2 minutes — based on the freshest top-deal offers.',
          'text_font', 'inter',
          'text_align', 'center',
          'text_font_size', 16
        )
      ),
      jsonb_build_object(
        'id', 'c1q1', 'type', 'multiple_choice',
        'content', jsonb_build_object(
          'question', 'Which type of car fits you best?',
          'selection', 'single',
          'cta', 'Next →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'c1o1', 'icon', '🚙', 'label', 'SUV', 'value', 'suv'),
            jsonb_build_object('id', 'c1o2', 'icon', '🏎️', 'label', 'Sporty', 'value', 'sporty'),
            jsonb_build_object('id', 'c1o3', 'icon', '👨‍👩‍👧', 'label', 'Family', 'value', 'family')
          )
        )
      )
    )),
    -- Page 2: drivetrain
    (v_funnel_id, 2, 'intro', true, jsonb_build_array(
      jsonb_build_object(
        'id', 'c2q1', 'type', 'multiple_choice',
        'content', jsonb_build_object(
          'question', 'Electric or fuel?',
          'selection', 'single',
          'cta', 'Next →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'c2o1', 'icon', '⚡', 'label', 'Electric', 'value', 'electric'),
            jsonb_build_object('id', 'c2o2', 'icon', '⛽', 'label', 'Fuel', 'value', 'fuel')
          )
        )
      )
    )),
    -- Page 3: budget
    (v_funnel_id, 3, 'intro', true, jsonb_build_array(
      jsonb_build_object(
        'id', 'c3q1', 'type', 'multiple_choice',
        'content', jsonb_build_object(
          'question', 'What''s your monthly budget?',
          'selection', 'single',
          'cta', 'Next →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'c3o1', 'icon', '💶', 'label', '< 500 €',  'value', 'budget-low'),
            jsonb_build_object('id', 'c3o2', 'icon', '💸', 'label', '500–1000 €', 'value', 'budget-mid'),
            jsonb_build_object('id', 'c3o3', 'icon', '💎', 'label', '> 1000 €', 'value', 'budget-high')
          )
        )
      )
    )),
    -- Page 4: new vs used
    (v_funnel_id, 4, 'intro', true, jsonb_build_array(
      jsonb_build_object(
        'id', 'c4q1', 'type', 'multiple_choice',
        'content', jsonb_build_object(
          'question', 'New or used?',
          'selection', 'single',
          'cta', 'Next →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'c4o1', 'icon', '✨', 'label', 'New',  'value', 'new'),
            jsonb_build_object('id', 'c4o2', 'icon', '🚗', 'label', 'Used', 'value', 'used')
          )
        )
      )
    )),
    -- Page 5: contact form
    (v_funnel_id, 5, 'intro', true, jsonb_build_array(
      jsonb_build_object(
        'id', 'c5cf1', 'type', 'contact_form',
        'content', jsonb_build_object(
          'headline', 'Get your matched offer',
          'cta_text', 'Call me back',
          'show_cv_upload', false,
          'show_city', false,
          'show_name_split', false
        )
      )
    )),
    -- Page 6: thank-you
    (v_funnel_id, 6, 'thank_you', false, jsonb_build_array(
      jsonb_build_object(
        'id', 'c6ty', 'type', 'thank_you',
        'content', jsonb_build_object(
          'headline', '🎉 Done! Your car-assistant is calling you now.',
          'subtext', 'We received your preferences and selected the best matching car for you. Within the next 30 seconds your phone will ring — our AI-assistant will present your personal top match and can send you the full offer details via SMS.\n\nPlease keep your phone ready and accept the call.',
          'headline_color', '#1E3A8A',
          'subtext_color', '#374151'
        )
      )
    ));

  RAISE NOTICE 'Cars EN setup complete: program=% funnel=%', v_program_id, v_funnel_id;
END $$;
