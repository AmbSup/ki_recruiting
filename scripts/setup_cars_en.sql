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
  v_has_calls boolean;
BEGIN
  -- Idempotent cleanup. Special case for live programs: if sales_calls
  -- already reference the existing program, we can NOT cascade-delete it.
  -- In that case we keep program + funnel intact and only refresh the
  -- sales_offers — that's the typical "update car details" re-run path.
  SELECT id INTO v_existing_funnel FROM funnels WHERE slug = 'car-special-offers';
  IF v_existing_funnel IS NOT NULL THEN
    SELECT sales_program_id INTO v_existing_program FROM funnels WHERE id = v_existing_funnel;

    IF v_existing_program IS NOT NULL THEN
      SELECT EXISTS (SELECT 1 FROM sales_calls WHERE sales_program_id = v_existing_program)
        INTO v_has_calls;
    ELSE
      v_has_calls := false;
    END IF;

    IF v_has_calls THEN
      -- Refresh-only path: keep program + funnel + their FKs intact.
      DELETE FROM sales_offers WHERE sales_program_id = v_existing_program;
      v_program_id := v_existing_program;
      v_funnel_id  := v_existing_funnel;
      RAISE NOTICE 'Cars EN refresh: existing program % has calls, only refreshing offers', v_existing_program;
    ELSE
      -- Full reset path: no calls yet, safe to cascade-delete everything.
      DELETE FROM funnel_pages WHERE funnel_id = v_existing_funnel;
      DELETE FROM funnels WHERE id = v_existing_funnel;
      IF v_existing_program IS NOT NULL THEN
        DELETE FROM sales_offers WHERE sales_program_id = v_existing_program;
        DELETE FROM sales_programs WHERE id = v_existing_program;
      END IF;
    END IF;
  END IF;

  -- 1. Sales Program (English, language='en', monthly_with_purchase price-format)
  -- Skipped on refresh-only path (program already exists with active calls).
  IF v_program_id IS NULL THEN
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
  END IF;

  -- 2. Sales Offers — 8 cars covering main tag-combinations
  INSERT INTO sales_offers (
    sales_program_id, name, summary, description, tags,
    price_cents, purchase_price_cents, currency, image_url, detail_url, active
  ) VALUES
    (v_program_id,
     'VW Tiguan 2024 — Family SUV',
     'Spacious 7-seater family SUV with 2.0 TDI engine, panoramic roof, and adaptive cruise control.',
     'The VW Tiguan 2024 is a versatile 7-seat family SUV built for long family trips and daily duty. **Performance:** 2.0 TDI 4-cylinder diesel with 150 hp and 360 Newton metres, 7-speed DSG dual-clutch, optional 4Motion all-wheel drive. 0-100 kilometres per hour in 9.6 seconds, top speed 207 kilometres per hour. **Range & Efficiency:** combined consumption 6.2 litres per 100 kilometres, roughly 900 km of tank range. **Cargo:** 700 L with the third row folded, up to 1,920 L with row 2+3 folded — class-leading for the segment. **Tech & Equipment:** 10-inch digital cockpit, 12-inch Discover Pro infotainment with wireless Apple CarPlay and Android Auto, panoramic sunroof, IQ.Light matrix LED headlights, 3-zone climate control, heated front seats, Travel Assist (adaptive cruise + lane-keep + traffic-jam assist), front + rear parking sensors with rear camera. **Safety:** 5-star Euro NCAP (2022), 9 airbags, Front Assist with autonomous emergency braking. **Warranty & Service:** 4-year manufacturer warranty + 8-year mobility guarantee, service intervals every 30,000 km or 2 years. **Availability:** dealer pickup at any Volkswagen partner nationwide, 4-6 week delivery from stock, 8 exterior colors available. **Sample lease:** from 299 Euros per month over 36 months with 10,000 km/year and 5,000 EUR down payment, all-inclusive service package available as add-on for around 35 Euros per month.',
     '["suv","fuel","family","budget-low","used"]'::jsonb,
     29900, 2400000, 'EUR',
     'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200',
     'https://app.neuronic-automation.ai/cars/vw-tiguan',
     true),

    (v_program_id,
     'BMW M3 Competition 2024',
     'Track-tuned 510hp twin-turbo, carbon trim, adaptive M suspension. Pure performance.',
     'The BMW M3 Competition is a track-tuned high-performance sports sedan, hand-assembled in Garching with motorsport-derived hardware. **Performance:** S58 3.0-litre twin-turbo inline-six, 510 hp and 650 Newton metres, 8-speed M Steptronic. 0-100 kilometres per hour in 3.5 seconds, top speed 290 kilometres per hour with the optional M Driver''s Package. **Range & Efficiency:** combined consumption 9.6 litres per 100 kilometres, around 600 km tank range. **Cargo:** 480 L boot. **Tech & Equipment:** carbon-fibre roof + interior trim, adaptive M suspension with electronically controlled dampers, M Drive Professional package (Drift Analyser, M Laptimer, 10-stage traction control), 12.3-inch BMW Live Cockpit Professional with M-specific layouts, harman/kardon premium sound, M Sport bucket seats in Merino leather, head-up display, gesture control. **Safety:** 4-star Euro NCAP, Driving Assistant Professional available (adaptive cruise, lane-keep, traffic-jam assist), 8 airbags. **Warranty & Service:** 3-year unlimited-mileage manufacturer warranty, 12-year anti-perforation, BMW Service Inclusive packages available up to 10 years / 200,000 km. Condition-based service — no fixed intervals. **Availability:** 6-8 week delivery build-to-order, 6 standard colors including Frozen Brilliant White Metallic, individual program available for bespoke paint. **Sample lease:** from 1,099 Euros per month over 36 months with 15,000 km/year and 20,000 EUR down payment, M Track Days included for new owners.',
     '["sporty","fuel","budget-high","new"]'::jsonb,
     109900, 9200000, 'EUR',
     'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200',
     'https://app.neuronic-automation.ai/cars/bmw-m3',
     true),

    (v_program_id,
     'Tesla Model Y Long Range 2024',
     'Long-range electric family SUV with autopilot, glass roof, and 7-seat option.',
     'The Tesla Model Y Long Range is Tesla''s mid-size electric family SUV — the best-selling EV in Europe and a benchmark for range, software and supercharger network. **Battery & Range:** 75 kilowatt-hours usable battery, around 530 km of WLTP range, peak DC charging at 250 kilowatts gets you from 15 to 80 percent in roughly 27 minutes at any Tesla Supercharger. **Performance:** dual-motor all-wheel drive, 0-100 kilometres per hour in 5.0 seconds, top speed 217 kilometres per hour. **Cargo:** 854 L total including the front trunk, 2,158 L with the rear seats folded — flat loading floor, optional third row for 7-seat family configuration. **Tech & Equipment:** 15-inch landscape touchscreen runs the entire interior, Autopilot included as standard with adaptive cruise and auto-lane-change, optional Full Self-Driving as 99 Euros per month subscription, full-glass panoramic roof, 14-speaker premium audio, heated front and rear seats, HEPA cabin filter with Bioweapon Defence Mode, Sentry Mode and Dog Mode. Over-the-air updates monthly. **Safety:** 5-star Euro NCAP, 8 airbags, structural battery pack contributes to rigidity. **Warranty & Service:** 4-year vehicle warranty, 8-year or 192,000 km battery warranty with 70 percent capacity guarantee, no scheduled servicing — only brake fluid every 2 years and cabin filter. **Availability:** 2-4 week delivery from inventory, 5 exterior colors (Pearl White free, others up to 2,500 EUR), pickup at any Tesla service centre across Europe. **Sample lease:** from 499 Euros per month over 36 months with 10,000 km/year and 10,000 EUR down payment, supercharger credit and home-charger discount available for new orders.',
     '["suv","electric","family","budget-mid","new"]'::jsonb,
     54900, 5400000, 'EUR',
     'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=1200',
     'https://app.neuronic-automation.ai/cars/tesla-model-y',
     true),

    (v_program_id,
     'Audi RS6 Avant Performance 2024',
     'Performance station-wagon with 630hp V8, all-wheel-drive, and luxury interior.',
     'The Audi RS6 Avant Performance is the ultimate sleeper — a 630 hp super-wagon that swallows family duty during the week and laps Nürburgring laps on weekends. **Performance:** 4.0 TFSI twin-turbo V8 with mild-hybrid 48V system, 630 hp and 850 Newton metres, 8-speed Tiptronic automatic, permanent quattro all-wheel drive with rear sport differential. 0-100 kilometres per hour in 3.4 seconds, top speed 305 kilometres per hour with Dynamic Plus package. **Range & Efficiency:** combined consumption 11.5 litres per 100 kilometres with cylinder-on-demand, around 700 km tank range. **Cargo:** 565 L boot, 1,680 L with the rear seats folded — fits a road bike or a full set of skis without effort. **Tech & Equipment:** RS-specific sport exhaust, ceramic brakes optional, adaptive air suspension with dynamic ride control (DRC), Audi virtual cockpit plus + dual MMI touch (10.1" + 8.6") with haptic feedback, Bang & Olufsen 3D Advanced 16-speaker audio (1,820 watts), head-up display, matrix LED headlights with HD-laser high beams, RS Sport seats with diamond-stitched Valcona leather, four-zone climate. **Safety:** Audi Pre Sense, lane-keep assist, adaptive cruise with traffic-jam assist, surround-view camera, 8 airbags. **Warranty & Service:** 2-year unlimited-mileage manufacturer warranty extendable to 5 years via Audi Extended Warranty, 30,000 km service intervals. **Availability:** 8-12 week delivery build-to-order in Neckarsulm, 11 standard colors including Nardo Grey and Daytona Grey Pearl, Audi exclusive program offers any color you can imagine. **Sample lease:** from 1,499 Euros per month over 48 months with 15,000 km/year and 25,000 EUR down payment, RS Performance driving experience day included for new customers.',
     '["sporty","fuel","family","budget-high","new"]'::jsonb,
     89900, 12800000, 'EUR',
     'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200',
     'https://app.neuronic-automation.ai/cars/audi-rs6',
     true),

    (v_program_id,
     'Skoda Octavia Combi 1.5 TSI',
     'Practical family station-wagon. Affordable, reliable, well-equipped.',
     'The Skoda Octavia Combi 1.5 TSI is the pragmatist''s family wagon — the most cargo for the money in its class, with everything you actually need and nothing you don''t. **Performance:** 1.5 TSI 4-cylinder petrol with Active Cylinder Technology (ACT) for fuel savings, 150 hp and 250 Newton metres, 7-speed DSG dual-clutch. 0-100 kilometres per hour in 8.7 seconds, top speed 220 kilometres per hour. **Range & Efficiency:** combined consumption 5.5 litres per 100 kilometres, around 900 km of tank range on the 50-litre tank. **Cargo:** 640 L boot — class-leading — and 1,700 L with the rear seats folded. **Tech & Equipment:** 10-inch Bolero infotainment with wireless SmartLink (CarPlay + Android Auto), Travel Assist (adaptive cruise + lane-keep), LED matrix headlights, dual-zone climate, heated front seats, electric tailgate, plus the "Simply Clever" features Skoda is famous for — an umbrella in the door, an ice scraper in the fuel flap, a ticket holder on the windshield, a removable LED torch in the boot. **Safety:** 5-star Euro NCAP (2022), 9 airbags including a centre airbag, front-assist with autonomous emergency braking, blind-spot monitor. **Warranty & Service:** 2-year manufacturer warranty, 12-year anti-corrosion warranty, service intervals every 30,000 km or 2 years, optional all-inclusive service package from 25 Euros per month. **Availability:** 6-8 week delivery from stock, 9 exterior colors, dealer-network across all of Austria and Germany. **Sample lease:** from 249 Euros per month over 36 months with 10,000 km/year and 3,000 EUR down payment, optional winter wheels package for 999 EUR.',
     '["family","fuel","budget-low","used"]'::jsonb,
     18900, 1800000, 'EUR',
     'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200',
     'https://app.neuronic-automation.ai/cars/skoda-octavia',
     true),

    (v_program_id,
     'VW ID.4 Pro 2023',
     'Electric SUV with 200hp, 530km range, and matrix LED headlights.',
     'The VW ID.4 Pro is Volkswagen''s flagship all-electric SUV — the European Car of the Year 2021 with a focus on space, refinement and a real-world usable range. **Battery & Range:** 77 kilowatt-hours usable battery, around 530 km of WLTP range, peak DC charging at 135 kilowatts (10 to 80 percent in roughly 30 minutes at any CCS fast-charger), 11 kilowatts onboard AC charger. **Performance:** rear-wheel-drive electric motor with 204 hp and 310 Newton metres, 0-100 kilometres per hour in 8.5 seconds, top speed electronically limited to 160 kilometres per hour. **Cargo:** 543 L boot with a flat load floor, 1,575 L with the rear seats folded, 500 kg tow rating with trailer hitch. **Tech & Equipment:** 12-inch Discover Pro infotainment, ID.Light interactive light strip across the dashboard, ID. travel assist with adaptive cruise + lane-keep + automatic lane changes on motorways, IQ.Light matrix LED headlights, augmented-reality head-up display optional, wireless Apple CarPlay and Android Auto, optional heat pump for winter range retention, panoramic glass roof. **Safety:** 5-star Euro NCAP (2021), 7 airbags, Front Assist with autonomous emergency braking, pedestrian + cyclist detection. **Warranty & Service:** 2-year vehicle warranty, 8-year or 160,000 km battery warranty with 70 percent capacity guarantee, no oil changes — service intervals every 30,000 km or 2 years just for brake fluid and cabin filters. **Availability:** 4-6 week delivery from stock, 7 exterior colors, dealer-network nationwide with Volkswagen Charging service for We Charge customers. **Sample lease:** from 399 Euros per month over 36 months with 10,000 km/year and 7,500 EUR down payment, home wallbox installation available as add-on for around 1,200 EUR.',
     '["suv","electric","family","budget-mid","used"]'::jsonb,
     39900, 3800000, 'EUR',
     'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=1200',
     'https://app.neuronic-automation.ai/cars/vw-id4',
     true),

    (v_program_id,
     'Porsche Taycan 4S 2024',
     'Electric sports sedan with 530hp, 0-100 in 4 seconds, and Porsche racing DNA.',
     'The Porsche Taycan 4S delivers an electric sports-sedan experience with proper Porsche DNA — race-car responsiveness, 800-volt architecture borrowed from the 919 hybrid Le Mans car, and the lowest centre of gravity of any production Porsche. **Battery & Range:** 93 kilowatt-hours Performance Battery Plus, around 440 km of WLTP range, peak DC charging at 270 kilowatts (5 to 80 percent in 22 minutes at any 800V or 400V Ionity charger), 11 kilowatts or optional 22 kilowatts onboard AC charger. **Performance:** dual permanent-magnet synchronous motors with all-wheel drive, 530 hp combined with launch control and overboost, 650 Newton metres of torque. 0-100 kilometres per hour in 4.0 seconds, top speed 250 kilometres per hour. **Cargo:** 366 L rear boot + 84 L frunk for 450 L total. **Tech & Equipment:** Porsche InnoDrive predictive adaptive cruise that reads the road ahead, adaptive air suspension with PASM, Sport Chrono package with Track Precision app, four-zone climate, 14-speaker BOSE Surround Sound, matrix LED headlights with Porsche Dynamic Light System Plus, 16.8-inch curved digital cockpit + 10.9-inch central infotainment + optional 10.9-inch passenger display, full-glass panoramic roof optional. **Safety:** equivalent of 5-star Euro NCAP (not officially rated), 8 airbags, lane-change assist, surround-view camera, night-vision optional. **Warranty & Service:** 2-year unlimited-mileage vehicle warranty, 8-year or 160,000 km battery warranty with 70 percent capacity guarantee, service intervals every 30,000 km. **Availability:** 10-14 week delivery build-to-order in Zuffenhausen, 12 standard colors including Frozen Berry Metallic and Gentian Blue Metallic, Porsche Exclusive program offers historic and custom paint. **Sample lease:** from 1,299 Euros per month over 48 months with 15,000 km/year and 20,000 EUR down payment, 3 years of free Ionity high-power charging included for new orders.',
     '["sporty","electric","budget-high","new"]'::jsonb,
     129900, 11000000, 'EUR',
     'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=1200',
     'https://app.neuronic-automation.ai/cars/porsche-taycan',
     true),

    (v_program_id,
     'Hyundai Kona Electric 2024',
     'Compact electric SUV with 484km range, smart safety features, 8-year battery warranty.',
     'The Hyundai Kona Electric (second generation, launched 2023) is a compact all-electric SUV designed EV-first — proper packaging, real cargo space, and the longest manufacturer warranty in its class. **Battery & Range:** 65.4 kilowatt-hours battery, around 484 km of WLTP range, peak DC charging at 102 kilowatts (10 to 80 percent in roughly 41 minutes at any CCS charger), 11 kilowatts onboard AC charger, vehicle-to-load (V2L) lets you power an e-bike, e-scooter or camping equipment from the car. **Performance:** front-wheel-drive electric motor with 204 hp and 255 Newton metres, 0-100 kilometres per hour in 7.9 seconds, top speed 172 kilometres per hour. **Cargo:** 466 L boot plus 27 L frunk — class-leading for a compact EV, 1,300 L with the rear seats folded. **Tech & Equipment:** dual 12.3-inch displays for cockpit + infotainment, wireless Apple CarPlay and Android Auto, full Hyundai SmartSense safety suite (forward collision avoidance + blind-spot collision avoidance + lane-keep + adaptive cruise + smart cruise control with stop-and-go + driver attention warning), heated steering wheel + heated and ventilated front seats, optional head-up display, optional Bose premium audio. **Safety:** 5-star Euro NCAP (2023), 7 airbags. **Warranty & Service:** 5-year vehicle warranty with unlimited mileage — the longest in segment — and 8-year or 160,000 km battery warranty with 70 percent capacity guarantee, service intervals every 15,000 km or 1 year (no oil changes), Hyundai Care included service package available. **Availability:** 6-8 week delivery from stock, 7 exterior colors including Cyber Sage Green and Soultronic Orange Pearl, dealer-network nationwide, demo cars available for test drive at most major Hyundai partners. **Sample lease:** from 349 Euros per month over 36 months with 10,000 km/year and 5,000 EUR down payment, government EV incentive of up to 5,000 EUR may apply depending on registration market.',
     '["suv","electric","budget-low","new"]'::jsonb,
     29900, 3700000, 'EUR',
     'https://images.unsplash.com/photo-1592853625511-ad0fcc3b6cf0?w=1200',
     'https://app.neuronic-automation.ai/cars/hyundai-kona',
     true);

  -- 3. Funnel (English, language='en')
  -- Skipped on refresh-only path (funnel already exists).
  IF v_funnel_id IS NULL THEN
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
  END IF;

  RAISE NOTICE 'Cars EN setup complete: program=% funnel=%', v_program_id, v_funnel_id;
END $$;
