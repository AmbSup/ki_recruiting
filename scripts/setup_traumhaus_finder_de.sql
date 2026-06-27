-- Setup: Traumhaus-Finder (DE Käufer-Funnel) — product_finder-Variante für
-- Immobilien-Käufer. Analog zum English Car-Special-Offers-Setup, aber DE
-- mit purchase-only Preisformat (kein Leasing). Lead beantwortet 4 schnelle
-- Fragen → server-side Pre-Match auf sales_offers (Tag-Overlap) → AI-Call
-- mit Top-Match-Pitch + send_offer_link via WhatsApp.
--
-- Script ist idempotent auf dem Slug. Wenn schon sales_calls gegen das
-- Program existieren (Live-Updates), refresh-only Pfad → nur Offers neu,
-- Program+Funnel bleiben mit FKs intakt.

DO $$
DECLARE
  v_company_id uuid := 'a523fa80-138b-45db-95c7-d8289aa0360e';  -- Neuronic Automation
  v_program_id uuid;
  v_funnel_id  uuid;
  v_existing_funnel uuid;
  v_existing_program uuid;
  v_has_calls boolean;
BEGIN
  SELECT id INTO v_existing_funnel FROM funnels WHERE slug = 'traumhaus-finder';
  IF v_existing_funnel IS NOT NULL THEN
    SELECT sales_program_id INTO v_existing_program FROM funnels WHERE id = v_existing_funnel;

    IF v_existing_program IS NOT NULL THEN
      SELECT EXISTS (SELECT 1 FROM sales_calls WHERE sales_program_id = v_existing_program)
        INTO v_has_calls;
    ELSE
      v_has_calls := false;
    END IF;

    IF v_has_calls THEN
      DELETE FROM sales_offers WHERE sales_program_id = v_existing_program;
      v_program_id := v_existing_program;
      v_funnel_id  := v_existing_funnel;
      RAISE NOTICE 'Traumhaus refresh: existing program % has calls, only refreshing offers', v_existing_program;
    ELSE
      DELETE FROM funnel_pages WHERE funnel_id = v_existing_funnel;
      DELETE FROM funnels WHERE id = v_existing_funnel;
      IF v_existing_program IS NOT NULL THEN
        DELETE FROM sales_offers WHERE sales_program_id = v_existing_program;
        DELETE FROM sales_programs WHERE id = v_existing_program;
      END IF;
    END IF;
  END IF;

  -- 1. Sales-Program (DE, product_finder, purchase-only Preis-Format)
  IF v_program_id IS NULL THEN
  INSERT INTO sales_programs (
    company_id, name, language, program_type,
    product_pitch, value_proposition, target_persona,
    status, auto_dial, call_strategy
  ) VALUES (
    v_company_id,
    'Traumhaus-Finder',
    'de',
    'product_finder',
    'Wir matchen dich in 2 Minuten mit deinem Top-Objekt — schneller als die Konkurrenz "interessiert" sagen kann.',
    'KI-Assistent ruft binnen 30 Sekunden zurück und zeigt dir SOFORT, welche Immobilien gerade zu dir passen. Kein "wir setzen Sie mal auf die Liste".',
    'Käufer auf Immobiliensuche — wollen schnelle Antworten statt wochenlanger Inserate-Recherche.',
    'active',
    true,
    jsonb_build_object(
      'caller_name', 'Andrea',
      'require_consent', false,
      'matching', jsonb_build_object(
        'min_match_score', 1,
        'fallback_message', 'Wir kuratieren dir individuelle Optionen — unser Team meldet sich mit passenden Objekten.',
        'price_format', 'purchase',
        'funnel_tag_map', jsonb_build_object(
          'Was suchst du?', jsonb_build_object(
            'haus', 'house',
            'wohnung', 'apartment',
            'loft', 'loft',
            'reihenhaus', 'townhouse'
          ),
          'Wo soll''s hingehen?', jsonb_build_object(
            'stadt', 'city',
            'stadtrand', 'suburb',
            'land', 'countryside'
          ),
          'Wie viele Zimmer brauchst du?', jsonb_build_object(
            'small', 'small',
            'medium', 'medium',
            'large', 'large'
          ),
          'Dein Budget?', jsonb_build_object(
            'budget-low', 'budget-low',
            'budget-mid', 'budget-mid',
            'budget-high', 'budget-high'
          )
        )
      )
    )
  ) RETURNING id INTO v_program_id;
  END IF;

  -- 2. Sales-Offers — 8 Demo-Objekte (Wien + Umland) die alle Tag-Kombinationen abdecken
  INSERT INTO sales_offers (
    sales_program_id, name, summary, description, tags,
    price_cents, purchase_price_cents, currency, image_url, detail_url, active
  ) VALUES
    (v_program_id,
     'DG-Loft Wien 1010 Innere Stadt',
     'Exklusives Dachgeschoss-Loft im Goldenen Wiener Herzen — 95 Quadratmeter, Designerstandard, kleine Terrasse mit Stephansdom-Blick.',
     'Das DG-Loft in 1010 Wien ist ein 95 Quadratmeter großes Designer-Loft im Dachgeschoss eines komplett sanierten Altbaus (Bj. 1890, Sanierung 2023). **Lage:** Innere Stadt, 3 Min zum Stephansdom, U-Bahn Stephansplatz direkt vor der Haustür. **Aufteilung:** 2 Zimmer + offene Wohnküche, 1 Bad, separates WC. **Highlights:** kleine Terrasse mit Blick auf Stephansdom, Stuck-Detail vom Altbau erhalten, Fischgrät-Parkett, hochwertige Bulthaup-Küche, Smart-Home-Steuerung für Licht und Klima. **Heizung:** Fußbodenheizung mit Wärmepumpe (Energieklasse A). **Stellplatz:** 1 Tiefgaragenplatz in einer Tiefgarage 200m entfernt (Miete optional 280 €/Monat). **Verfügbar ab:** sofort. **Kaufpreis:** 1.450.000 € zzgl. Nebenkosten (Grunderwerbsteuer 3,5%, Notar ~1,5%, Maklerprovision 3% + USt).',
     '["loft","city","small","budget-high"]'::jsonb,
     0, 145000000, 'EUR',
     'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
     'https://app.neuronic-automation.ai/immobilien/dg-loft-wien-1010',
     true),

    (v_program_id,
     'Altbau-Wohnung Wien 1050 Margareten',
     'Charmante 92 Quadratmeter Altbau-Wohnung mit klassischem Wienerwerk-Parkett, 3,2m Raumhöhe — perfekt für Liebhaber des klassischen Wiener Stils.',
     'Die Altbau-Wohnung in 1050 Wien Margareten ist eine 92 Quadratmeter große, klassisch geschnittene Familienwohnung im 2. Stock eines Gründerzeit-Hauses (Bj. 1908, Fassadensanierung 2021). **Lage:** Margaretengürtel-Nähe, 5 Min U4 Pilgramgasse, ruhige Seitengasse mit Innenhof-Lage. **Aufteilung:** 3 Zimmer (Wohnzimmer ~30 Quadratmeter, 2 Schlafzimmer ~18 + 14 Quadratmeter), Wohnküche, Bad mit Fenster, separates WC. **Highlights:** 3,2 m Raumhöhe, originale Holzkastenfenster (denkmalgeschützt, energetisch saniert), Wienerwerk-Parkett im Wohnzimmer, hoher Designwert. **Heizung:** Etagen-Gasthermen-Heizung (kürzlich auf neuere Brennwerttherme getauscht — Energieklasse C). **Stellplatz:** Keiner inkludiert, Anrainerparken-Zone möglich. **Verfügbar ab:** frei nach Vereinbarung, voraussichtlich 1. Februar 2026. **Kaufpreis:** 580.000 €.',
     '["apartment","city","medium","budget-mid"]'::jsonb,
     0, 58000000, 'EUR',
     'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200',
     'https://app.neuronic-automation.ai/immobilien/altbau-wien-1050',
     true),

    (v_program_id,
     'Studio-Wohnung Wien 1070 Neubau',
     'Modernes 42 Quadratmeter Studio mit French-Balkon — frisch saniert, perfekt für Studenten oder Anlage.',
     'Das Studio-Apartment in 1070 Wien Neubau ist eine 42 Quadratmeter großes, modernes Single-/Anlageobjekt im 3. Stock mit Aufzug (Bj. 1958, kernsaniert 2024). **Lage:** Zwischen MariahilferStraße und Burggasse, 5 Min U3 Volkstheater, Top-Lage für Innenstadt-Anbindung. **Aufteilung:** offener Wohn-/Schlafraum 28 Quadratmeter, Wohnküche, Duschbad mit Tageslicht. **Highlights:** komplett kernsaniert 2024 (neue Elektrik, neue Sanitär, neue Heizung), Französischer Balkon mit Innenhof-Blick, hochwertiger Eichenboden, hochwertige Einbauküche inkludiert. **Heizung:** Gasetagentherme (neu 2024 — Energieklasse B). **Stellplatz:** Keiner, dafür Anrainerparken-Zone. **Anlage-Potenzial:** Mietpreis aktuell ca. 950 €/Monat netto möglich — Rendite ~3,5% brutto. **Verfügbar ab:** sofort. **Kaufpreis:** 320.000 €.',
     '["apartment","city","small","budget-low"]'::jsonb,
     0, 32000000, 'EUR',
     'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200',
     'https://app.neuronic-automation.ai/immobilien/studio-wien-1070',
     true),

    (v_program_id,
     'Einfamilienhaus Klosterneuburg',
     '165 Quadratmeter Einfamilienhaus mit Wintergarten + 800 Quadratmeter Garten — perfekt für Familien, 20 Min nach Wien.',
     'Das Einfamilienhaus in Klosterneuburg ist ein 165 Quadratmeter großes Familienhaus auf einem 800 Quadratmeter Eckgrundstück (Bj. 1997, neue Heizung 2020, neues Dach 2022). **Lage:** Klosterneuburg-Weidling, 20 Auto-Min ins Wiener Zentrum, S40 in 8 Min, Schule + Kindergarten in Gehweite. **Aufteilung:** 4 Zimmer (Wohnzimmer 35 Quadratmeter, 3 Schlafzimmer 12-18 Quadratmeter), Wohnküche, Wintergarten 12 Quadratmeter, 2 Bäder, separates WC, Keller (90 Quadratmeter). **Highlights:** Doppelgarage mit Direktzugang ins Haus, 800 Quadratmeter Süd-West-Garten mit Terrasse + Naturpool, Wintergarten als zweiter Wohnraum nutzbar, neue Glasfaser-Anbindung. **Heizung:** Wärmepumpe Luft-Wasser (Bj. 2020 — Energieklasse B), optional PV-Anlage am Dach nachrüstbar (5 Kilowatt-Peak ~ 8.500 €). **Verfügbar ab:** 1. April 2026 (Vorbesitzer zieht ins Pflegeheim). **Kaufpreis:** 650.000 €.',
     '["house","suburb","medium","budget-mid"]'::jsonb,
     0, 65000000, 'EUR',
     'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200',
     'https://app.neuronic-automation.ai/immobilien/efh-klosterneuburg',
     true),

    (v_program_id,
     'Villa Pressbaum Wienerwald',
     '380 Quadratmeter Premium-Villa mit Pool, Sauna, Smart-Home auf 1.800 Quadratmeter Wienerwald-Lage — Wohnen wie in Anlage.',
     'Die Villa in Pressbaum am Wienerwald ist eine 380 Quadratmeter Premium-Architekten-Villa auf einem 1.800 Quadratmeter Hanggrundstück mit Süd-Hang (Bj. 2018, Architekt: Studio Wien). **Lage:** Pressbaum-Ort, 25 Auto-Min ins Wiener Zentrum, S50 in 6 Min, naturnahe Hochlage mit Blick auf den Wienerwald. **Aufteilung:** 7 Zimmer auf 2 Ebenen (Wohnzimmer 65 Quadratmeter, 5 Schlafzimmer 14-22 Quadratmeter, Heimkino 18 Quadratmeter), Wohnküche 35 Quadratmeter, 4 Bäder + Wellness-Bereich. **Premium-Highlights:** beheizter Pool 6x12 m (ganzjahres-nutzbar), Sauna + Dampfbad, KNX-Smart-Home (Licht, Klima, Jalousien, Audio per App), 360°-Sicherheitssystem mit Videoüberwachung, Eichenparkett überall, 4 m hohe Fensterfronten, Designerküche bulthaup b3, Weinkeller. **Heizung:** Erdwärmesonden-Heizung mit PV-Unterstützung (8 Kilowatt-Peak am Dach, Energieklasse A+), KWL-Kontrollierte Wohnraumlüftung. **Stellplätze:** Doppelgarage + 2 Carport. **Verfügbar ab:** sofort. **Kaufpreis:** 1.890.000 €.',
     '["house","countryside","large","budget-high"]'::jsonb,
     0, 189000000, 'EUR',
     'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200',
     'https://app.neuronic-automation.ai/immobilien/villa-pressbaum',
     true),

    (v_program_id,
     'Reihenhaus Mödling',
     '145 Quadratmeter modernes Reihenhaus mit Doppelgarage + Carport — perfekt für junge Familien, 15 Min nach Wien.',
     'Das Reihenhaus in Mödling ist ein 145 Quadratmeter großes Familien-Reihenhaus in einer ruhigen Anliegerstraße (Bj. 2009, einwandfrei gepflegt). **Lage:** Mödling-Süd, 15 Auto-Min nach Wien (A2 oder Südstrecke), Bahn in 12 Min am Wien Hbf, Schule + Kindergarten + Park in 3 Min Gehweite. **Aufteilung:** 4 Zimmer auf 3 Ebenen (EG: Wohnzimmer + Wohnküche + WC; OG: 3 Schlafzimmer + Bad; DG: ausgebauter Hobby-/Büroraum 28 Quadratmeter), Keller mit Heizraum + Lager. **Highlights:** Doppelgarage mit Direktzugang + überdachter Carport für 2. Auto, 250 Quadratmeter Süd-West-Garten mit Terrasse + Sandkiste, Glasfaser-Internet, Smart-Thermostat-Heizungssystem. **Heizung:** Gasbrennwerttherme (Bj. 2009, Wartung jährlich, Energieklasse C), Solarthermie für Warmwasser am Dach (Bj. 2015). **Verfügbar ab:** 1. März 2026 (Verkäufer zieht ins Burgenland-Landhaus). **Kaufpreis:** 720.000 €.',
     '["townhouse","suburb","medium","budget-mid"]'::jsonb,
     0, 72000000, 'EUR',
     'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200',
     'https://app.neuronic-automation.ai/immobilien/reihenhaus-moedling',
     true),

    (v_program_id,
     'Landhaus Burgenland Eisenstadt-Umgebung',
     'Charmanter ehemaliger Bauernhof mit Stadl + 2.500 Quadratmeter Grund — Sanierungs-Schmuckstück für Liebhaber.',
     'Das Landhaus im Burgenland (Eisenstadt-Umgebung) ist ein 220 Quadratmeter ehemaliger Bauernhof aus dem 19. Jahrhundert (Bj. 1880, Teilsanierung 1995) mit Hof, Stadl und 2.500 Quadratmeter Grundstück. **Lage:** kleines Dorf 15 Min südlich von Eisenstadt, 50 Auto-Min ins Wiener Zentrum, herrliche Hügellandschaft mit Weingärten ringsum. **Aufteilung:** Wohnhaus mit 6 Zimmern auf 2 Ebenen (Wohnzimmer mit offenem Kamin 40 Quadratmeter, 4 Schlafzimmer 14-20 Quadratmeter, Wohnküche 30 Quadratmeter, 2 Bäder), Stadl mit 120 Quadratmeter Nutzfläche (Lager, Werkstatt, Garage), gepflasterter Innenhof. **Charakter:** denkmalgeschützte Fassade mit Holzbalkendecken, Naturstein-Mauerwerk, hohe Raumhöhen, charmanter Mix aus Original und 1995er-Sanierung. **Sanierungs-Potenzial:** Stadl könnte zu zusätzlichem Wohnraum / Office / Atelier umgebaut werden (Genehmigung wahrscheinlich, ca. 80.000-120.000 € Invest). **Heizung:** Holzofen + Pellets-Zentralheizung (Bj. 1995, Energieklasse E — sanierungsbedürftig). **Verfügbar ab:** sofort. **Kaufpreis:** 380.000 €.',
     '["house","countryside","large","budget-low"]'::jsonb,
     0, 38000000, 'EUR',
     'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=1200',
     'https://app.neuronic-automation.ai/immobilien/landhaus-burgenland',
     true),

    (v_program_id,
     'Penthouse Wien 1030 Landstraße',
     '210 Quadratmeter Penthouse mit 80 Quadratmeter Dach-Terrasse + Donau-Blick — Premium-Wohnen über den Dächern von Wien.',
     'Das Penthouse in 1030 Wien Landstraße ist eine 210 Quadratmeter große Top-Etage in einem brandneuen Premium-Objekt (Bj. 2021, Erstbezug-Charakter, Vorbesitzer nur 6 Monate genutzt). **Lage:** Landstraße in Mitte 3. Bezirk, 8 Min U-Bahn zur Innenstadt, S-Bahn-Anbindung direkt, Donaupark in 5 Min Gehweite. **Aufteilung:** 5 Zimmer auf einer Ebene (Wohnzimmer 55 Quadratmeter mit Donau-Blick, 3 Schlafzimmer 16-22 Quadratmeter, Arbeitszimmer 18 Quadratmeter), offene Designerküche 30 Quadratmeter, 3 Bäder. **Premium-Highlights:** 80 Quadratmeter umlaufende Dach-Terrasse mit Donau- und Stephansdom-Blick, Outdoor-Küche, Wärmepumpe für Pool-Pad (optional), bodentiefe Verglasung, Smart-Home, edler Steinboden im Wohnbereich, 3 m Raumhöhe, Concierge-Service im Haus. **Stellplätze:** 2 Tiefgaragenplätze inkludiert. **Heizung:** Fernwärme + Wärmepumpe (Energieklasse A+), KWL-Lüftung. **Verfügbar ab:** sofort. **Kaufpreis:** 2.300.000 €.',
     '["loft","city","large","budget-high"]'::jsonb,
     0, 230000000, 'EUR',
     'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
     'https://app.neuronic-automation.ai/immobilien/penthouse-wien-1030',
     true);

  -- 3. Funnel (DE, language='de', dunkles Blau als Primärfarbe)
  IF v_funnel_id IS NULL THEN
  INSERT INTO funnels (
    sales_program_id, language, name, slug,
    intro_headline, intro_subtext, consent_text, thank_you_text,
    branding, funnel_type, status
  ) VALUES (
    v_program_id, 'de', 'Traumhaus-Finder', 'traumhaus-finder',
    'Dein Traumhaus in 2 Minuten finden',
    '4 schnelle Fragen — dann ruft dich unser KI-Assistent zurück und zeigt dir SOFORT, welche Objekte gerade zu dir passen. Schneller als die Konkurrenz „interessiert" sagen kann.',
    'Ich stimme zu, dass Neuronic Automation (inkl. KI-Assistenten) mich telefonisch zu meiner Immobiliensuche kontaktiert. [Datenschutzerklärung](https://www.neuronic-automation.ai/datenschutz). Einwilligung jederzeit per E-Mail widerrufbar.',
    'Wir haben dein Traum-Profil — der KI-Assistent ruft dich gleich zurück!',
    jsonb_build_object(
      'primary_color', '#1A3A6E',
      'button_text_color', '#FFFFFF',
      'bg_color', '#FFFFFF',
      'logo_url', ''
    ),
    'sales',
    'active'
  ) RETURNING id INTO v_funnel_id;

  -- 4. Funnel-Pages — 4 Präferenz-Fragen + Kontakt-Form + Thank-You
  INSERT INTO funnel_pages (funnel_id, page_order, page_type, is_required, blocks) VALUES
    -- Page 1: Intro + Objekt-Typ
    (v_funnel_id, 1, 'intro', true, jsonb_build_array(
      jsonb_build_object(
        'id', 't1', 'type', 'text',
        'content', jsonb_build_object(
          'content', 'Traumhaus-Finder',
          'text_font', 'bebas',
          'text_align', 'center',
          'text_color', '#1A3A6E',
          'text_font_size', 28
        )
      ),
      jsonb_build_object(
        'id', 't2', 'type', 'text',
        'content', jsonb_build_object(
          'content', 'Finde dein Traumzuhause in 2 Minuten — schneller, als die Konkurrenz „interessiert" sagen kann.',
          'text_font', 'inter',
          'text_align', 'center',
          'text_font_size', 16
        )
      ),
      jsonb_build_object(
        'id', 'q1', 'type', 'multiple_choice',
        'content', jsonb_build_object(
          'question', 'Was suchst du?',
          'selection', 'single',
          'cta', 'Weiter →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q1o1', 'icon', '🏠', 'label', 'Haus', 'value', 'haus'),
            jsonb_build_object('id', 'q1o2', 'icon', '🏢', 'label', 'Wohnung', 'value', 'wohnung'),
            jsonb_build_object('id', 'q1o3', 'icon', '🏙️', 'label', 'Penthouse / Loft', 'value', 'loft'),
            jsonb_build_object('id', 'q1o4', 'icon', '🏘️', 'label', 'Reihenhaus', 'value', 'reihenhaus')
          )
        )
      )
    )),
    -- Page 2: Lage
    (v_funnel_id, 2, 'intro', true, jsonb_build_array(
      jsonb_build_object(
        'id', 'q2', 'type', 'multiple_choice',
        'content', jsonb_build_object(
          'question', 'Wo soll''s hingehen?',
          'selection', 'single',
          'cta', 'Weiter →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q2o1', 'icon', '🏙️', 'label', 'Stadt-Zentrum', 'value', 'stadt'),
            jsonb_build_object('id', 'q2o2', 'icon', '🌳', 'label', 'Stadtrand / Speckgürtel', 'value', 'stadtrand'),
            jsonb_build_object('id', 'q2o3', 'icon', '🌲', 'label', 'Land / im Grünen', 'value', 'land')
          )
        )
      )
    )),
    -- Page 3: Größe
    (v_funnel_id, 3, 'intro', true, jsonb_build_array(
      jsonb_build_object(
        'id', 'q3', 'type', 'multiple_choice',
        'content', jsonb_build_object(
          'question', 'Wie viele Zimmer brauchst du?',
          'selection', 'single',
          'cta', 'Weiter →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q3o1', 'icon', '👤', 'label', '1-2 Zimmer', 'value', 'small'),
            jsonb_build_object('id', 'q3o2', 'icon', '👨‍👩‍👧', 'label', '3-4 Zimmer', 'value', 'medium'),
            jsonb_build_object('id', 'q3o3', 'icon', '🏡', 'label', '5+ Zimmer', 'value', 'large')
          )
        )
      )
    )),
    -- Page 4: Budget
    (v_funnel_id, 4, 'intro', true, jsonb_build_array(
      jsonb_build_object(
        'id', 'q4', 'type', 'multiple_choice',
        'content', jsonb_build_object(
          'question', 'Dein Budget?',
          'selection', 'single',
          'cta', 'Weiter →',
          'items', jsonb_build_array(
            jsonb_build_object('id', 'q4o1', 'icon', '💶', 'label', 'Bis 400.000 €', 'value', 'budget-low'),
            jsonb_build_object('id', 'q4o2', 'icon', '💸', 'label', '400.000 – 800.000 €', 'value', 'budget-mid'),
            jsonb_build_object('id', 'q4o3', 'icon', '💎', 'label', 'Über 800.000 €', 'value', 'budget-high')
          )
        )
      )
    )),
    -- Page 5: Kontakt-Form
    (v_funnel_id, 5, 'intro', true, jsonb_build_array(
      jsonb_build_object(
        'id', 'cf1', 'type', 'contact_form',
        'content', jsonb_build_object(
          'headline', 'Dein Match wartet schon',
          'cta_text', 'KI-Assistent ruft mich an',
          'show_cv_upload', false,
          'show_city', false,
          'show_name_split', false
        )
      )
    )),
    -- Page 6: Thank-You
    (v_funnel_id, 6, 'thank_you', false, jsonb_build_array(
      jsonb_build_object(
        'id', 'ty', 'type', 'thank_you',
        'content', jsonb_build_object(
          'headline', '🎉 Wir haben dein Traum-Profil!',
          'subtext', 'Innerhalb der nächsten 30 Sekunden klingelt dein Telefon — unser KI-Assistent stellt dir dein Top-Match vor und kann dir die Detail-Seite direkt per WhatsApp schicken.\n\nBitte halte dein Handy bereit und nimm den Anruf an.',
          'headline_color', '#1A3A6E',
          'subtext_color', '#374151'
        )
      )
    ));
  END IF;

  RAISE NOTICE 'Traumhaus-Finder setup complete: program=% funnel=%', v_program_id, v_funnel_id;
END $$;
