-- ============================================================
-- KI Recruiting Tool – Seed Data (Dummy)
-- ============================================================

-- Cleanup
truncate table call_analyses, transcripts, voice_calls, cv_analyses,
  campaigns, applications, funnel_pages, funnels, applicants,
  invoices, jobs, companies cascade;

-- ============================================================
-- COMPANIES  (prefix 10……)
-- ============================================================
insert into companies (id, name, contact_name, contact_email, contact_phone, billing_plan, status, notes, created_at) values
  ('10000000-0000-0000-0000-000000000001', 'TechVision GmbH',      'Stefan Richter',   'stefan@techvision.at',  '+43 1 234 5678',  'monthly', 'active',  'Stammkunde seit 2025',                '2025-09-12 10:00:00+02'),
  ('10000000-0000-0000-0000-000000000002', 'Baugruppe Austria AG', 'Maria Hofer',      'm.hofer@baugruppe.at',  '+43 732 987654',  'per_job', 'active',  'Hochbau & Tiefbau',                   '2025-11-03 08:30:00+01'),
  ('10000000-0000-0000-0000-000000000003', 'Logistik Pro KG',      'Robert Wiesinger', 'r.wiesinger@logpro.at', '+43 662 111222',  'custom',  'active',  'Großes Volumen, 20+ Stellen geplant', '2026-01-18 14:00:00+01'),
  ('10000000-0000-0000-0000-000000000004', 'HealthCare Plus GmbH', 'Sandra Fuchs',     's.fuchs@hcplus.at',     '+43 1 555 9090',  'monthly', 'paused',  'Pause bis Q3 2026',                   '2026-02-05 09:00:00+01'),
  ('10000000-0000-0000-0000-000000000005', 'Retail Solutions OG',  'Klaus Mayr',       'k.mayr@retailsol.at',   '+43 512 334455',  'per_job', 'active',  'Fokus Wien & Innsbruck',              '2026-03-01 11:00:00+01'),
  ('10000000-0000-0000-0000-000000000006', 'FinanzHub Austria',    'Eva Steinbauer',   'eva@finanzhub.at',      '+43 1 777 8888',  'monthly', 'churned', 'Vertrag gekündigt März 2026',          '2025-07-20 16:00:00+02');

-- ============================================================
-- JOBS  (prefix 20……)
-- ============================================================
insert into jobs (id, company_id, title, location, employment_type, status, requirements, daily_budget, created_at) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Senior UX/UI Designer',     'Wien',      'fulltime',  'active',  'Figma, 4+ Jahre, Design Systems',              50.00, '2026-03-10 09:00:00+01'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Backend-Entwickler (Java)', 'Graz',      'fulltime',  'active',  'Spring Boot, 3+ Jahre, REST, Docker',          45.00, '2026-03-14 10:00:00+01'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Bauleiter Hochbau',         'Linz',      'fulltime',  'active',  'Baumeister-Ausbildung, 5+ Jahre',              40.00, '2026-02-28 08:00:00+01'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'Lagerlogistiker',           'Salzburg',  'fulltime',  'active',  'Staplerschein, Schichtbereitschaft',           60.00, '2026-03-05 11:00:00+01'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', 'Projektmanager:in IT',      'Wien',      'fulltime',  'paused',  'PMP/PRINCE2, 5+ Jahre IT-PM, Scrum',           35.00, '2026-01-20 14:00:00+01'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000005', 'Filialleiter Einzelhandel', 'Innsbruck', 'fulltime',  'active',  'Führungserfahrung EH, Umsatzverantwortung',    30.00, '2026-03-18 09:30:00+01'),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'Fullstack Entwickler React','Remote',    'freelance', 'draft',   'React 18+, Node.js, TypeScript, 3+ Jahre',     0.00,  '2026-04-01 10:00:00+02'),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000004', 'Krankenpfleger:in',         'Wien',      'parttime',  'filled',  'Diplomausbildung Gesundheitspflege',           25.00, '2025-12-01 08:00:00+01');

-- ============================================================
-- FUNNELS  (prefix 30……)
-- ============================================================
insert into funnels (id, job_id, name, slug, status, views, submissions, published_at, created_at) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'UX Designer Wien 2026',    'ux-designer-wien-2026',    'active',  1240, 87,  '2026-03-11 10:00:00+01', '2026-03-10 09:00:00+01'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Backend Java Graz',        'backend-java-graz',        'active',  680,  41,  '2026-03-15 08:00:00+01', '2026-03-14 10:00:00+01'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Bauleiter Linz Frühjahr',  'bauleiter-linz-fruehjahr', 'active',  390,  28,  '2026-03-01 08:00:00+01', '2026-02-28 08:00:00+01'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'Lagerlogistik Salzburg',   'lagerlogistik-salzburg',   'active',  2100, 183, '2026-03-06 09:00:00+01', '2026-03-05 11:00:00+01'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'Projektmanager IT (alt)',  'projektmanager-it-alt',    'paused',  520,  34,  '2026-01-22 10:00:00+01', '2026-01-20 14:00:00+01'),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000006', 'Filialleiter Innsbruck',   'filialleiter-innsbruck',   'draft',   0,    0,   null,                     '2026-03-18 09:30:00+01');

-- ============================================================
-- APPLICANTS  (prefix 40……)
-- ============================================================
insert into applicants (id, full_name, email, phone, consent_given_at, created_at) values
  ('40000000-0000-0000-0000-000000000001', 'Julia Maier',     'julia.maier@gmail.com',   '+43 664 1234567', '2026-04-06 07:25:00+02', '2026-04-06 07:30:00+02'),
  ('40000000-0000-0000-0000-000000000002', 'Felix Huber',     'felix.huber@outlook.com', null,              '2026-04-06 08:05:00+02', '2026-04-06 08:10:00+02'),
  ('40000000-0000-0000-0000-000000000003', 'Tanja Wolf',      'tanja.wolf@icloud.com',   '+43 676 9876543', '2026-04-05 16:40:00+02', '2026-04-05 16:45:00+02'),
  ('40000000-0000-0000-0000-000000000004', 'Markus Berger',   'm.berger@web.de',          '+43 650 5551234', '2026-04-04 10:55:00+02', '2026-04-04 11:00:00+02'),
  ('40000000-0000-0000-0000-000000000005', 'Petra Gruber',    'petra.g@gmx.at',           null,              '2026-04-03 09:15:00+02', '2026-04-03 09:20:00+02'),
  ('40000000-0000-0000-0000-000000000006', 'David Schmid',    'd.schmid@gmail.com',       '+43 699 3334455', '2026-04-02 13:55:00+02', '2026-04-02 14:00:00+02'),
  ('40000000-0000-0000-0000-000000000007', 'Laura Steiner',   'l.steiner@htl.at',         '+43 664 7778899', '2026-04-01 10:25:00+02', '2026-04-01 10:30:00+02'),
  ('40000000-0000-0000-0000-000000000008', 'Thomas Klein',    't.klein@outlook.at',       '+43 650 1112233', '2026-03-30 08:55:00+02', '2026-03-30 09:00:00+02'),
  ('40000000-0000-0000-0000-000000000009', 'Sarah Müller',    'sarah.m@gmail.com',        null,              '2026-03-29 12:55:00+02', '2026-03-29 13:00:00+02'),
  ('40000000-0000-0000-0000-00000000000a', 'Anna Schmidt',    'a.schmidt@design.at',      '+43 676 4445566', '2026-03-28 07:55:00+02', '2026-03-28 08:00:00+02'),
  ('40000000-0000-0000-0000-00000000000b', 'Lukas Bauer',     'lukas.bauer@icloud.com',   '+43 699 8887766', '2026-03-27 09:55:00+02', '2026-03-27 10:00:00+02'),
  ('40000000-0000-0000-0000-00000000000c', 'Eva Huber',       'eva.huber@gmail.com',      '+43 664 2223344', '2026-03-25 08:55:00+02', '2026-03-25 09:00:00+02'),
  ('40000000-0000-0000-0000-00000000000d', 'Michael Auer',    'm.auer@hotmail.com',        '+43 650 6667788', '2026-03-20 10:55:00+02', '2026-03-20 11:00:00+02'),
  ('40000000-0000-0000-0000-00000000000e', 'Nina Braun',      'nina.braun@web.de',        null,              '2026-03-18 13:55:00+02', '2026-03-18 14:00:00+02'),
  ('40000000-0000-0000-0000-00000000000f', 'Patrick Reiter',  'p.reiter@gmail.com',       '+43 699 5554433', '2026-03-17 08:55:00+02', '2026-03-17 09:00:00+02');

-- ============================================================
-- APPLICATIONS  (prefix 50……)
-- ============================================================
insert into applications (id, applicant_id, job_id, funnel_id, pipeline_stage, overall_score, customer_decision, source, applied_at) values
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'new',            null,  'pending',   'facebook',  '2026-04-06 07:30:00+02'),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'new',            null,  'pending',   'instagram', '2026-04-06 08:10:00+02'),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'new',            null,  'pending',   'facebook',  '2026-04-05 16:45:00+02'),
  ('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'cv_analyzed',    78.00, 'pending',   'instagram', '2026-04-04 11:00:00+02'),
  ('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'cv_analyzed',    64.00, 'pending',   'facebook',  '2026-04-03 09:20:00+02'),
  ('50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'call_scheduled', 82.00, 'pending',   'linkedin',  '2026-04-02 14:00:00+02'),
  ('50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'call_scheduled', 71.00, 'pending',   'linkedin',  '2026-04-01 10:30:00+02'),
  ('50000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'call_completed', 88.00, 'pending',   'facebook',  '2026-03-30 09:00:00+02'),
  ('50000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', 'call_completed', 55.00, 'pending',   'instagram', '2026-03-29 13:00:00+02'),
  ('50000000-0000-0000-0000-00000000000a', '40000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'evaluated',      91.00, 'pending',   'facebook',  '2026-03-28 08:00:00+02'),
  ('50000000-0000-0000-0000-00000000000b', '40000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'evaluated',      76.00, 'pending',   'instagram', '2026-03-27 10:00:00+02'),
  ('50000000-0000-0000-0000-00000000000c', '40000000-0000-0000-0000-00000000000c', '20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'presented',      85.00, 'interested','direct',    '2026-03-25 09:00:00+02'),
  ('50000000-0000-0000-0000-00000000000d', '40000000-0000-0000-0000-00000000000d', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'accepted',       93.00, 'interested','linkedin',  '2026-03-20 11:00:00+02'),
  ('50000000-0000-0000-0000-00000000000e', '40000000-0000-0000-0000-00000000000e', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'rejected',       42.00, 'rejected',  'facebook',  '2026-03-18 14:00:00+02'),
  ('50000000-0000-0000-0000-00000000000f', '40000000-0000-0000-0000-00000000000f', '20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'rejected',       38.00, 'rejected',  'facebook',  '2026-03-17 09:00:00+02');

-- ============================================================
-- CV ANALYSES  (prefix b0……)
-- ============================================================
insert into cv_analyses (id, application_id, match_score, summary, strengths, gaps, analyzed_at) values
  ('b0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 78.00,
   'Erfahrener Java-Entwickler mit solider Spring-Boot-Basis. Gute REST-API-Kenntnisse, Docker vorhanden.',
   ARRAY['5 Jahre Java-Erfahrung','Spring Boot & Microservices','Docker Grundkenntnisse','Agile Erfahrung'],
   ARRAY['Keine Kotlin-Kenntnisse','Wenig Cloud-Erfahrung'],
   '2026-04-04 11:05:00+02'),
  ('b0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000005', 64.00,
   'UX Designer mit 3 Jahren Erfahrung. Figma-Kenntnisse vorhanden, kein Design-System-Nachweis.',
   ARRAY['Figma & Sketch','User Research Grundlagen','Portfolio vorhanden'],
   ARRAY['Kein Design-System-Nachweis','Wenig B2B-Erfahrung','Lücke 2024'],
   '2026-04-03 09:25:00+02'),
  ('b0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000008', 88.00,
   'Sehr erfahrener Lagerlogistiker mit Staplerschein und SAP-WM-Kenntnissen.',
   ARRAY['Staplerschein Kl. 1-4','8 Jahre Lagererfahrung','Schichtbereitschaft','SAP WM'],
   ARRAY['Keine Führungserfahrung'],
   '2026-03-30 09:10:00+02'),
  ('b0000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-00000000000a', 91.00,
   'Herausragende UX-Designerin mit 6 Jahren Erfahrung bei Top-Agenturen. Portfolio überzeugt.',
   ARRAY['6 Jahre UX/UI Erfahrung','Design Systems bei DAX-Unternehmen','Figma Certified','User Testing'],
   ARRAY['Gehaltsvorstellung leicht über Budget'],
   '2026-03-28 08:10:00+02');

-- ============================================================
-- VOICE CALLS  (prefix 60……)
-- ============================================================
insert into voice_calls (id, application_id, status, scheduled_at, started_at, ended_at, duration_seconds, recording_url, created_at) values
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000008', 'completed', '2026-04-06 09:00:00+02', '2026-04-06 09:01:12+02', '2026-04-06 09:15:19+02', 847,  'https://recordings.vapi.ai/demo-1.mp3', '2026-04-05 18:00:00+02'),
  ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000004', 'completed', '2026-04-06 10:30:00+02', '2026-04-06 10:32:00+02', '2026-04-06 10:42:23+02', 623,  'https://recordings.vapi.ai/demo-2.mp3', '2026-04-05 18:30:00+02'),
  ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000009', 'completed', '2026-04-05 14:00:00+02', '2026-04-05 14:02:30+02', '2026-04-05 14:09:22+02', 412,  'https://recordings.vapi.ai/demo-3.mp3', '2026-04-04 18:00:00+02'),
  ('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003', 'no_answer', '2026-04-05 16:00:00+02', null,                    null,                    null, null,                                    '2026-04-04 18:00:00+02'),
  ('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000006', 'scheduled', '2026-04-07 09:00:00+02', null,                    null,                    null, null,                                    '2026-04-06 10:00:00+02'),
  ('60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000007', 'scheduled', '2026-04-07 11:00:00+02', null,                    null,                    null, null,                                    '2026-04-06 10:30:00+02'),
  ('60000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000005', 'failed',    '2026-04-04 15:00:00+02', '2026-04-04 15:00:00+02', '2026-04-04 15:00:08+02', 8,   null,                                    '2026-04-03 18:00:00+02');

-- ============================================================
-- TRANSCRIPTS  (prefix 70……)
-- ============================================================
insert into transcripts (id, voice_call_id, full_text, language, transcribed_at) values
  ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001',
   'Mia: Hallo Thomas, ich bin Mia von KI Recruit. Hast du kurz Zeit für ein Interview?
Thomas: Ja, gerne!
Mia: Super. Erzähl mir, warum du dich für die Stelle als Lagerlogistiker interessierst.
Thomas: Ich arbeite seit 8 Jahren in der Logistik und suche eine neue Herausforderung. Salzburg ist perfekt für mich.
Mia: Welche Erfahrungen hast du mit Lagerverwaltungssystemen?
Thomas: SAP WM kenne ich sehr gut, auch Infor LN. Staplerschein habe ich natürlich.
Mia: Bist du schichtbereit?
Thomas: Ja, Früh- und Spätschicht kein Problem.',
   'de', '2026-04-06 09:16:00+02'),
  ('70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002',
   'Mia: Hallo Markus, erzähl mir von deiner Java-Erfahrung.
Markus: Ich entwickle seit 5 Jahren mit Java, hauptsächlich Spring Boot und Microservices. Zuletzt bei einem FinTech.
Mia: Hast du Erfahrung mit Docker und Kubernetes?
Markus: Docker täglich, Kubernetes im Selbststudium – produktiv noch wenig eingesetzt.
Mia: Wie arbeitest du in agilen Teams?
Markus: Sehr gerne. Wir haben Scrum gemacht, ich war auch Scrum Master für ein halbes Jahr.',
   'de', '2026-04-06 10:43:00+02'),
  ('70000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003',
   'Mia: Hallo Sarah, was motiviert dich für die Stelle als Filialleiterin?
Sarah: Ich habe 4 Jahre im Einzelhandel gearbeitet und möchte in eine Führungsrolle.
Mia: Hast du bereits Mitarbeiter geführt?
Sarah: Ja, ich war Stellvertretende Filialleiterin bei einem Modekaufhaus in Innsbruck.
Mia: Wie gehst du mit Konflikten im Team um?
Sarah: Ich spreche Probleme direkt an, lieber früh als spät.',
   'de', '2026-04-05 14:10:00+02');

-- ============================================================
-- CALL ANALYSES  (prefix 80……)
-- ============================================================
insert into call_analyses (id, voice_call_id, transcript_id, interview_score, summary, recommendation, key_insights, red_flags, analyzed_at) values
  ('80000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 91.00,
   'Thomas Klein präsentiert sich als sehr erfahrener Lagerlogistiker. Klare Antworten, glaubwürdige Erfahrungen, hohe Schichtbereitschaft.',
   'strong_yes',
   ARRAY['8 Jahre Logistikerfahrung','Staplerschein + SAP WM','Wohnhaft in Salzburg','Schichtbereit ohne Einschränkungen'],
   ARRAY[]::text[],
   '2026-04-06 09:18:00+02'),
  ('80000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000002', 82.00,
   'Markus Berger zeigt solide Java-Kenntnisse und Teamfähigkeit. Kubernetes-Erfahrung ausbaufähig, Lernbereitschaft vorhanden.',
   'yes',
   ARRAY['5 Jahre Java/Spring Boot','FinTech-Erfahrung','Scrum Master Erfahrung','Proaktive Lernhaltung'],
   ARRAY['Kubernetes nur Selbststudium, nicht produktiv eingesetzt'],
   '2026-04-06 10:45:00+02'),
  ('80000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000003', 58.00,
   'Sarah Müller hat Grundpotenzial, aber Führungserfahrung noch begrenzt.',
   'maybe',
   ARRAY['Stellvertretungs-Erfahrung','Direkte Kommunikation','Motivation erkennbar'],
   ARRAY['Keine eigenständige Filialleitung bisher','Umsatzverantwortung unklar'],
   '2026-04-05 14:12:00+02');

-- ============================================================
-- CAMPAIGNS  (prefix 90……)
-- ============================================================
insert into campaigns (id, job_id, funnel_id, platform, name, status, daily_budget, total_spent, impressions, clicks, conversions, cpl, started_at, created_at) values
  ('90000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'facebook',  'UX Designer Wien — Spring', 'active',  45.00, 1237.50, 84200,  1423, 87,  14.22, '2026-03-11 00:00:00+01', '2026-03-10 09:00:00+01'),
  ('90000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'instagram', 'Backend Java — Instagram',  'active',  30.00, 620.00,  42100,  684,  41,  15.12, '2026-03-15 00:00:00+01', '2026-03-14 10:00:00+01'),
  ('90000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'facebook',  'Lager Salzburg — Breit',    'active',  60.00, 2154.00, 163800, 3100, 183, 11.77, '2026-03-06 00:00:00+01', '2026-03-05 11:00:00+01'),
  ('90000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'linkedin',  'Bauleiter LinkedIn',        'paused',  50.00, 820.00,  18400,  312,  28,  29.29, '2026-03-01 00:00:00+01', '2026-02-28 08:00:00+01'),
  ('90000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006', null,                                   'instagram', 'Filialleiter INN — Draft',  'draft',   25.00, 0.00,    0,      0,    0,   null,  null,                   '2026-03-18 09:30:00+01');

-- ============================================================
-- INVOICES  (prefix a0……)
-- ============================================================
insert into invoices (id, company_id, invoice_number, period_start, period_end, line_items, subtotal, vat_rate, vat_amount, total, status, sent_at, paid_at, created_at) values
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'INV-2026-013', '2026-03-01', '2026-03-31',
   '[{"description":"Recruiting-Service März 2026","quantity":1,"unit_price":2000.00}]',
   2000.00, 0.20, 400.00, 2400.00, 'sent', '2026-04-01 10:00:00+02', null, '2026-04-01 09:00:00+02'),

  ('a0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'INV-2026-012', '2026-02-01', '2026-02-28',
   '[{"description":"Recruiting-Service Februar 2026","quantity":1,"unit_price":1500.00}]',
   1500.00, 0.20, 300.00, 1800.00, 'paid', '2026-03-01 10:00:00+01', '2026-03-28 14:00:00+01', '2026-03-01 09:00:00+01'),

  ('a0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'INV-2026-011', '2026-02-01', '2026-02-28',
   '[{"description":"Recruiting-Service Februar 2026","quantity":1,"unit_price":2000.00}]',
   2000.00, 0.20, 400.00, 2400.00, 'overdue', '2026-02-28 10:00:00+01', null, '2026-02-28 09:00:00+01'),

  ('a0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'INV-2026-010', '2026-01-01', '2026-01-31',
   '[{"description":"Job-Paket Standard","quantity":2,"unit_price":400.00}]',
   800.00, 0.20, 160.00, 960.00, 'paid', '2026-02-01 10:00:00+01', '2026-02-25 09:00:00+01', '2026-02-01 09:00:00+01'),

  ('a0000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'INV-2026-014', '2026-04-01', '2026-04-30',
   '[{"description":"Recruiting-Service April 2026","quantity":1,"unit_price":1500.00}]',
   1500.00, 0.20, 300.00, 1800.00, 'draft', null, null, '2026-04-06 09:00:00+02');
