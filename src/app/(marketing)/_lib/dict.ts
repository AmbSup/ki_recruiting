// Marketing-Site Copy-Dictionary. Verschachtelt nach Page → Section → Key.
// Zugriff via t(lang, "sales.hero.headline") aus t.ts.
//
// Copy-Änderungen kommen HIER rein, nicht in die Component-Files. Wenn eine
// neue Section hinzukommt: parallel in beiden Sprachen + Component nutzt t().

export type Lang = "de" | "en";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Dict = any;

export const dict: Record<Lang, Dict> = {
  de: {
    nav: {
      sales: "Für Vertrieb",
      recruiting: "Fürs Recruiting",
      kmu: "Für KMUs",
      wissen: "Wissensmanagement",
      aria: "ARIA",
      blog: "Blog",
      pricing: "Preise",
      showcase: "Live-Funnels",
      login: "Login",
      demo_cta: "Demo buchen",
    },
    sticky_cta: {
      label: "Willst du's live hören?",
      sales: "🎯 Sales-Demo",
      recruiting: "🧑‍💼 Recruiting-Demo",
    },
    shared: {
      clients: {
        eyebrow: "Meine zufriedenen Kunden",
        logos: [
          { src: "/marketing/logos/clients/wien-it.png", alt: "Wien IT" },
          { src: "/marketing/logos/clients/bmw.png", alt: "BMW" },
          { src: "/marketing/logos/clients/boge-rubber-plastics.png", alt: "BOGE Rubber & Plastics" },
          { src: "/marketing/logos/clients/bt-group.png", alt: "BT Group" },
          { src: "/marketing/logos/clients/dhl-consulting.webp", alt: "DHL Consulting" },
          { src: "/marketing/logos/clients/smia.png", alt: "SMIA" },
          { src: "/marketing/logos/clients/gfp-prozessmanagement.jpg", alt: "Gesellschaft für Prozessmanagement" },
          { src: "/marketing/logos/clients/kardex.png", alt: "Kardex" },
          { src: "/marketing/logos/clients/rewe-group.png", alt: "REWE Group" },
          { src: "/marketing/logos/clients/siemens-advanta-consulting.webp", alt: "Siemens Advanta Consulting" },
          { src: "/marketing/logos/clients/synergie.png", alt: "Synergie" },
        ],
      },
      competence: {
        eyebrow: "Kompetenz",
        logos: [
          { src: "/marketing/logos/competence/wu.jpg", alt: "WU Executive Academy" },
          { src: "/marketing/logos/competence/prozessmanagement.jpg", alt: "Gesellschaft für Prozessmanagement" },
          { src: "/marketing/logos/competence/scrum.jpg", alt: "Scrum Master Certified" },
          { src: "/marketing/logos/competence/digital-consulting.png", alt: "Digital Consulting" },
        ],
      },
    },
    home: {
      eyebrow: "AI Funnel Expert",
      headline: "Der KI-Anruf, der in Sekunden geschieht.",
      headline_accent: "Nicht nach dem Wochenende.",
      sub:
        "AI-Funnels für Vertrieb und Recruiting — die deinen Lead oder Kandidaten innerhalb von 30 Sekunden zurückrufen. 24/7. Vollautomatisch. In deiner Stimme, mit deinem Pitch.",
      primary_cta: "Live testen",
      secondary_cta: "Demo buchen",
      hero_photo_slogan: "Dein Handy klingelt in 30 Sekunden. Nicht erst am Montag.",
      split_eyebrow: "Zwei Welten, eine Technologie",
      split_intro:
        "Vertrieb und Recruiting sind unterschiedliche Welten. Aber beide leiden am gleichen Problem: Wer zuerst antwortet, gewinnt. Wähle deine Welt.",
      sales_card: {
        badge: "Vertrieb",
        headline: "Speed-to-Lead entscheidet den Deal",
        sub:
          "Ruf jeden Lead in 30 Sekunden an — statt in 24 Stunden. Bevor die Konkurrenz ihn erreicht.",
        metric_label: "Reaktionszeit",
        metric_value: "30 Sek",
        metric_after: "statt 24 Std",
        bullets: [
          "Vollautomatisch, 24/7, auch am Wochenende",
          "Qualifizieren + Demo-Termin buchen im selben Call",
          "CRM-Integration (HubSpot, Pipedrive, Salesforce)",
        ],
        cta: "Zum Vertriebs-Setup →",
      },
      recruiting_card: {
        badge: "Recruiting",
        headline: "Time-to-Hire schlägt Time-to-Post",
        sub:
          "Screene Kandidaten in 5 Minuten nach der Bewerbung — statt in 5 Tagen. Bevor sie beim Wettbewerb unterschreiben.",
        metric_label: "Screening-Zeit",
        metric_value: "5 Min",
        metric_after: "statt 5 Tage",
        bullets: [
          "KI-Erstinterview direkt nach dem Quick-Apply",
          "Automatische Vorqualifizierung + Score im ATS",
          "DSGVO-konform, EU-Region (Azure Sweden Central)",
        ],
        cta: "Zum Recruiting-Setup →",
      },
      how_it_works: {
        eyebrow: "So funktioniert's",
        headline: "Drei Schritte, kein Setup-Wochenende",
        steps: [
          {
            title: "Funnel bauen",
            body:
              "Erstelle einen Quick-Apply- oder Lead-Funnel mit deiner Marke, deinen Fragen, deiner Landing-Page. Kein Code, kein Design-Zoom-Call.",
          },
          {
            title: "KI-Agent trainieren",
            body:
              "Lade dein Pitch-Deck, deine FAQ, deine Wunsch-Persona hoch. Der Agent kennt dein Produkt und deine Sprache innerhalb weniger Minuten.",
          },
          {
            title: "Anrufen lassen",
            body:
              "Sobald sich jemand einträgt: KI ruft in 30 Sekunden an. Deutsch oder Englisch, in deiner Wunsch-Stimme, mit deinem Skript.",
          },
        ],
      },
      dogfood: {
        eyebrow: "Erlebe es",
        headline: "Ruf dich in 30 Sekunden selbst an.",
        sub:
          "Kein Marketing-Bullshit, kein Video-Demo. Trag deine Nummer in einen unserer Demo-Funnels ein — dein Handy klingelt in unter einer Minute mit unserer echten KI. Du entscheidest, ob's konvertiert.",
        sales_link: "Als potenzieller Kunde testen →",
        recruiting_link: "Als Kandidat testen →",
        note:
          "Hinweis: Die Anrufe sind echt, dein Handy wird tatsächlich klingeln. Du kannst jederzeit auflegen. Kein CRM-Eintrag, kein Newsletter, kein Follow-Up.",
      },
      final_cta: {
        eyebrow: "Der letzte Schritt",
        headline: "30-Min-Demo mit dem Gründer",
        sub:
          "Zeig mir deinen Case, ich zeig dir wie's mit deinem Pitch aussieht. Live-Setup während des Calls möglich.",
        cta: "Demo buchen →",
      },
      showcase_teaser: {
        eyebrow: "Live-Referenzen",
        headline: "Oder schau dir echte Kunden-Funnels an",
        sub:
          "Immobilien-Käufer, Auto-Konfigurator, Reise-Angebote. Klick auf einen — dein Handy klingelt binnen 30 Sekunden mit dem entsprechenden Pitch. Kostenloser Ausprobier-Modus, jederzeit.",
        cta: "Alle Funnels ansehen →",
      },
    },
    sales: {
      eyebrow: "Für Vertriebsleiter, CMOs, Agentur-Owner",
      headline: "Schließe mehr Deals ab —",
      headline_accent: "indem du jeden Lead in 30 Sekunden anrufst.",
      sub:
        "Du zahlst pro Klick für heiße Leads. Aber wenn dein Sales-Team am Wochenende schläft, ist der Lead am Montag kalt. Wir lassen ihn nicht kalt werden. Nie.",
      primary_cta: "Als Kunde testen",
      secondary_cta: "Demo buchen",
      hero_photo_slogan: "Du rufst den Lead zuerst an. Automatisch, in 30 Sekunden.",
      pain: {
        eyebrow: "Das kostet dich Umsatz",
        headline: "Speed-to-Lead ist die #1-Kennzahl im Vertrieb",
        items: [
          {
            title: "Leads werden nach 5 Minuten 80 % kälter",
            body:
              "Harvard Business Review: Bei einer Kontaktaufnahme innerhalb der ersten 5 Minuten ist die Qualifikationsrate 21× höher als nach 30 Minuten. 24 Stunden später ist der Lead praktisch tot.",
          },
          {
            title: "Werbebudget versickert im Timing-Loch",
            body:
              "Du zahlst 50-200 € pro qualifiziertem Lead. Wenn du erst am Montag anrufst, hat der Wettbewerber am Sonntag um 22:47 Uhr schon Kontakt aufgenommen. Dein Budget bezahlt seinen Deal.",
          },
          {
            title: "Sales-Team ertrinkt in Dead-Leads",
            body:
              "40 % der Formularausfüller sind Lookie-Loos ohne Kaufabsicht. Deine SDRs verbrennen Stunden mit Falschnummern statt heiße Termine zu buchen.",
          },
        ],
      },
      metric: {
        label: "Speed-to-Lead",
        value: "30 Sek",
        after: "statt 24 Std",
        note:
          "Zeit vom Formular-Absenden bis zum Klingeln des Prospect-Telefons. Vollautomatisch, auch nachts, auch Sonntag.",
      },
      how: {
        eyebrow: "So funktioniert der Sales-Flow",
        headline: "Lead-in bis Meeting-buchen in 5 Minuten",
        steps: [
          {
            title: "Lead trägt sich ein",
            body:
              "Egal ob Landing-Page, Meta-Ad-Formular, LinkedIn-Retargeting. Sobald das Formular abgeschickt ist, feuert unser Webhook.",
          },
          {
            title: "KI ruft in 30 Sek an",
            body:
              "Mit deiner Wunsch-Stimme, deinem Pitch. Führt Discovery-Fragen, qualifiziert Budget/Authority/Need/Timeline.",
          },
          {
            title: "Termin gebucht ins CRM",
            body:
              "Qualifiziert? KI bucht direkt in deinen Cal.com/Calendly-Slot. Lead + Zusammenfassung + Recording landen in HubSpot/Pipedrive.",
          },
        ],
      },
      dogfood: {
        eyebrow: "Erlebe unser Sales-Setup",
        headline: "Fülle unser Demo-Formular aus — bekomme unseren Sales-Pitch",
        sub:
          "So sieht's für deinen Kunden aus: Formular auf einer Landing-Page, 3 Fragen, Handynummer. Nach dem Klick klingelt dein Handy binnen 30 Sekunden mit unserer KI. Sie qualifiziert dich, pitcht Neuronic Automation, und versucht einen Demo-Termin zu buchen. Auflegen jederzeit möglich.",
        cta: "Sales-Demo starten →",
      },
      icp: {
        eyebrow: "Für wen wir bauen",
        headline: "Sales-Teams mit teurem Traffic + langsamer Reaktion",
        industries: [
          { name: "Werbeagenturen", pain: "Retainer-Kunden erwarten schnellere Ergebnisse" },
          { name: "Kanzleien / Berater", pain: "Erstgespräch ist der Engpass" },
          { name: "SaaS mit High-Touch-Sales", pain: "SDR-Team teuer + langsam" },
          { name: "Finanzdienstleister", pain: "Compliance verlangsamt Zykluszeit" },
          { name: "Immobilienmakler", pain: "Käufer haben 5 Objekte gleichzeitig im Auge" },
          { name: "Coaching / High-Ticket", pain: "Warme Leads werden schnell kalt" },
        ],
        size: "10-50 Mitarbeiter",
        stack: "HubSpot, Pipedrive, Salesforce, Meta Ads, Google Ads, LinkedIn Ads",
      },
      final_cta: {
        eyebrow: "Nächster Schritt",
        headline: "Zeig mir deinen Case in 30 Minuten",
        sub:
          "Live-Setup, echte Nummer, echte Anrufe. Am Ende des Calls hast du entweder eine Demo-Nummer die klingelt — oder du weißt exakt was fehlt.",
        cta: "30-Min-Demo buchen →",
      },
    },
    recruiting: {
      eyebrow: "Für HR-Leiter, Talent Acquisition, Personalvermittler",
      headline: "Gewinne die besten Talente —",
      headline_accent: "bevor die Konkurrenz sie erreicht.",
      sub:
        "Kandidaten bewerben sich bei 10 Firmen gleichzeitig. Wer zuerst mit einem echten Menschen oder einer klugen KI spricht, bekommt den Zuschlag. Bei allen anderen entstehen Karteileichen.",
      primary_cta: "Als Kandidat testen",
      secondary_cta: "Demo buchen",
      hero_photo_slogan: "KI analysiert Profile und ruft Kandidaten automatisch an.",
      pain: {
        eyebrow: "Der versteckte Kandidaten-Kollaps",
        headline: "Time-to-Hire ist heute die #1-Kandidaten-Barriere",
        items: [
          {
            title: "Bewerber springen nach 24 h ab",
            body:
              "60 % der Quick-Apply-Bewerber ghosten HR wenn nicht innerhalb eines Tages Kontakt aufgenommen wird. Auf deiner Karriereseite = Bewerbung, in deinem ATS = tote Zeile.",
          },
          {
            title: "Unbesetzte Stellen kosten täglich Geld",
            body:
              "Ein unbesetzter LKW-Fahrer = 800 € Deckungsbeitrag pro Tag. Ein unbesetzter Pflegeplatz = überstundenerschöpftes Bestandspersonal. Jede Woche zählt.",
          },
          {
            title: "HR ertrinkt in Screening-Anrufen",
            body:
              "Erstgespräche sind zu 70 % Standard-Fragen: 'Passt der Führerschein? Verfügbar wann? Schichtbereitschaft?'. Zeit die für echte Recruiter-Arbeit fehlt.",
          },
        ],
      },
      metric: {
        label: "Time-to-First-Screen",
        value: "5 Min",
        after: "statt 5 Tage",
        note:
          "Zeit von der Quick-Apply-Bewerbung bis zum ersten Screening-Call. Auch nachts, auch am Wochenende, in DE oder EN.",
      },
      how: {
        eyebrow: "So funktioniert der Recruiting-Flow",
        headline: "Bewerbung bis Screening-Report in 10 Minuten",
        steps: [
          {
            title: "Quick-Apply-Funnel",
            body:
              "3-4 Fragen (Rolle, Verfügbarkeit, Region), Telefonnummer, Consent — fertig. Kein LinkedIn-Login, kein CV-Upload-Zwang.",
          },
          {
            title: "KI-Screening-Call",
            body:
              "In deiner Wunsch-Stimme, mit deinen Kriterien. 5 Minuten Discovery: Verfügbarkeit, Erfahrung, Deal-Breaker.",
          },
          {
            title: "Score + Zusammenfassung ins ATS",
            body:
              "Recruiter bekommt Ranking, Transkript, Audio-Recording und Handlungsempfehlung. Rein oder raus, in 30 Sekunden entscheidbar.",
          },
        ],
      },
      dogfood: {
        eyebrow: "Erlebe unser Recruiting-Setup",
        headline: "Fülle unser Demo-Formular aus — erlebe ein Screening am eigenen Ohr",
        sub:
          "So erleben deine Kandidaten das Screening: Formular, 3 Fragen, Nummer. Nach dem Klick klingelt dein Handy — unsere KI führt ein kurzes fiktives Screening-Interview durch. Dauert 5 Minuten. Danach kannst du beurteilen ob die Aufnahme für dein Karriere-Portal funktioniert.",
        cta: "Recruiting-Demo starten →",
      },
      icp: {
        eyebrow: "Für wen wir bauen",
        headline: "Recruiting-Teams mit hohem Volumen + Fachkräfte-Mangel",
        industries: [
          { name: "Logistik & Transport", pain: "Fahrer-Mangel, hoher Turnover" },
          { name: "Gastronomie & Hotellerie", pain: "Saisonale Peaks + Ghosting" },
          { name: "Pflege & Gesundheit", pain: "Akut-Engpässe + hohe Compliance" },
          { name: "Call Center / BPO", pain: "Hohe Bewerber-Volumen, niedrige Show-Up-Rate" },
          { name: "Einzelhandel", pain: "Verkäufer-Mangel + Filial-Zeitdruck" },
          { name: "Recruiting-Agenturen", pain: "Multi-Mandat, wenig Zeit pro Bewerber" },
        ],
        size: "50+ Mitarbeiter, oder Personalberater mit 5+ Mandaten parallel",
        stack: "Personio, SAP SuccessFactors, Workday, Recruitee, join.com, softgarden",
      },
      compliance: {
        eyebrow: "DSGVO-konform",
        headline: "EU-Region, klare Consent-Kette, Audit-Log",
        bullets: [
          "LLM-Inferenz in Sweden Central (Azure OpenAI EU)",
          "Voice-Aufnahmen in Supabase Storage (Frankfurt)",
          "Zwei-Stufen-Consent im Funnel (Datenschutz + KI-Anruf-Einwilligung)",
          "Löschung + Auskunft in unter 30 Tagen nach Anfrage",
        ],
      },
      final_cta: {
        eyebrow: "Nächster Schritt",
        headline: "30-Min-Demo — deine Rolle, dein Screening-Skript",
        sub:
          "Bring deinen härtesten Skill-Test mit. Wir bauen live einen Screening-Prompt und lassen ihn dich anrufen. Am Ende hast du eine Blaupause für deine erste Stelle.",
        cta: "30-Min-Demo buchen →",
      },
    },
    kmu: {
      eyebrow: "Softwarelösungen für KMUs",
      headline: "Dein Betrieb läuft.",
      headline_accent: "Der Rest darum kostet Zeit.",
      sub:
        "Angebote, Materialbestellungen, Baustellenberichte, Recruiting, Mahnwesen — die Arbeit rundum zieht KMUs Zeit, Geld und Nerven. KI-Automation für die Prozesse, die dich nicht weiterbringen. Voice + Claude + Supabase.",
      hero_photo_slogan: "Die Bürokratie erledigt die KI. Du kümmerst dich ums Geschäft.",
      dogfood: {
        eyebrow: "Erlebe unseren KI-Agent",
        headline: "Fülle 3 Fragen aus — dein Handy klingelt in 30 Sekunden",
        sub:
          "Unsere KI ruft dich an, fragt nach deinem größten Zeitfresser und matcht den passenden KI-Baustein. So erleben deine Kunden oder Bewerber unseren Voice-Agent am eigenen Ohr. Auflegen jederzeit möglich.",
        cta: "KMU-Demo starten →",
      },
      primary_cta: "30-Min-Demo buchen",
      secondary_cta: "Live-Beispiele sehen",
      problems: {
        eyebrow: "Was KMUs am meisten kostet",
        headline: "Die 10 ungelösten Zeitfresser",
        items: [
          "Kundenanfragen die nicht beantwortet werden",
          "Angebotserstellung aus Fotos, Sprachmemos und Notizen",
          "Materialbestellung ohne Systembruch",
          "Liefertermine überwachen, Verzögerungen erkennen",
          "Personal-Recruiting und Bewerber-Screening",
          "Baustellenplanung und Monteur-Disposition",
          "Nachtragsverwaltung und Freigaben",
          "Rechnungserstellung aus Rapporten",
          "Mahnwesen ohne Cashflow-Löcher",
          "Zentrale Kommunikation über Telefon, WhatsApp und E-Mail",
        ],
      },
      solutions: {
        eyebrow: "21 KI-Bausteine",
        headline: "Für jedes Problem ein sofort einsetzbarer Baustein",
        sub:
          "Nicht als Suite verkauft — sondern einzeln implementiert. Du wählst was zuerst Schmerz macht, wir bauen es in 3-14 Tagen live.",
        categories: [
          {
            label: "Anfragen, Angebote & Material",
            items: [
          {
            problem: "Kundenanfragen unbeantwortet",
            solution:
              "KI übernimmt Anrufe die du nicht abnimmst, sammelt Projekt-Infos vom Kunden und schlägt automatisch Termine vor. Kein Lead geht mehr verloren, Reaktionszeit sinkt von Tagen auf Minuten.",
            stack: ["Vapi", "n8n", "Supabase"],
          },
          {
            problem: "Rückrufmanagement",
            solution:
              "Vapi ruft neue Interessenten binnen weniger Minuten nach der Anfrage zurück, qualifiziert Budget + Kaufbereitschaft und legt Aufgaben oder Termine an.",
            stack: ["Vapi", "n8n", "Supabase"],
          },
          {
            problem: "Angebotserstellung",
            solution:
              "Mitarbeiter sprechen die Baustellenbesichtigung als Sprachmemo — Claude schreibt Angebotsentwurf inklusive Leistungsbeschreibung. Sachbearbeiter prüft nur noch die finale Version.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Angebotsnachverfolgung",
            solution:
              "n8n überwacht Fristen nach Angebotsversand. Vapi ruft nach ein paar Tagen an, fragt nach Entscheidung und offenen Punkten. Antworten landen sauber in der Datenbank.",
            stack: ["Vapi", "n8n", "Supabase"],
          },
          {
            problem: "Materialbestellung",
            solution:
              "Monteure melden Bedarf per Sprache oder WhatsApp. Claude extrahiert Artikel, Mengen und Prioritäten, n8n erstellt Bestellungen beim Lieferanten. Alles dokumentiert in Supabase.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Lieferterminüberwachung",
            solution:
              "Bestellungen werden automatisch überwacht, n8n prüft Status und erkennt Verzögerungen. Projektleiter + Monteure werden bei Problemen sofort informiert.",
            stack: ["n8n", "Supabase"],
          },
          {
            problem: "Lagerverwaltung",
            solution:
              "Materialentnahmen per Sprache melden — Claude erkennt Artikel + Menge, aktualisiert Bestand. Nachbestellung startet automatisch bei Unterschreitung des Mindestbestandes.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          ],
          },
          {
            label: "Baustelle, Team & Termine",
            items: [
          {
            problem: "Baustellenplanung",
            solution:
              "Claude analysiert Kapazitäten, Qualifikationen und Ressourcen. n8n erstellt Tages- und Wochenpläne. Änderungen werden per SMS, WhatsApp oder Anruf kommuniziert.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Monteur-Disposition",
            solution:
              "Bei kurzfristigem Ausfall schlägt das System qualifizierten Ersatz vor (Qualifikation, Entfernung, Verfügbarkeit). Vapi ruft an und bestätigt Termine.",
            stack: ["Vapi", "Claude", "n8n"],
          },
          {
            problem: "Baustellenberichte",
            solution:
              "Monteur spricht Tagesbericht ins Handy. Claude baut daraus einen strukturierten Rapport mit Arbeitszeit, Material und Problemen. Zero Tippen, alles in Supabase.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Nachtragsmanagement",
            solution:
              "Zusatzarbeiten während der Baustelle werden automatisch erkannt. Claude erstellt Nachtragsvorschlag inklusive Beschreibung + Aufwandsschätzung. Kundenfreigabe wird revisionssicher dokumentiert.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Bewerber-Screening",
            solution:
              "Vapi ruft Bewerber sofort nach Bewerbungseingang an, stellt Recruiter-Fragen und bewertet Antworten. Kandidatenprofile landen in Supabase. Spart bis zu 90 % Screening-Aufwand.",
            stack: ["Vapi", "Claude", "n8n", "Supabase"],
          },
          {
            problem: "Mitarbeiter-Onboarding",
            solution:
              "Neue Mitarbeiter werden per Telefon-Assistent eingewiesen — Prozesse, Werkzeuge, Sicherheit. n8n steuert Onboarding-Schritte, Fortschritt wird dokumentiert.",
            stack: ["Vapi", "Claude", "n8n"],
          },
          {
            problem: "Terminvereinbarung",
            solution:
              "Kunden buchen 24/7 telefonisch. Vapi prüft freie Kapazitäten, schlägt passende Termine vor und synchronisiert mit ERP + Kalender.",
            stack: ["Vapi", "n8n", "Supabase"],
          },
          ],
          },
          {
            label: "Rechnungen, Service & Reporting",
            items: [
          {
            problem: "Rechnungsstellung",
            solution:
              "Rapportberichte, Material und Arbeitszeiten fließen zu Rechnungsentwurf zusammen. Claude erstellt PDF, n8n versendet automatisch. Alle Rechnungen zentral in Supabase.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Mahnwesen",
            solution:
              "Offene Rechnungen werden überwacht, Zahlungsüberschreitungen erkannt, Mahnprozesse gestartet. Vapi erinnert Kunden telefonisch freundlich an offene Rechnungen.",
            stack: ["Vapi", "n8n", "Supabase"],
          },
          {
            problem: "Kundenservice",
            solution:
              "Servicehotline nimmt Standardfragen und Störungsmeldungen entgegen. Claude analysiert Anliegen und priorisiert Fälle. n8n erstellt Tickets in Supabase.",
            stack: ["Vapi", "Claude", "n8n", "Supabase"],
          },
          {
            problem: "Qualitätsmanagement",
            solution:
              "Nach Projektabschluss ruft KI Kunden für Feedback an. Ergebnisse werden strukturiert erfasst. Claude erkennt wiederkehrende Probleme und Verbesserungspotenziale.",
            stack: ["Vapi", "Claude", "Supabase"],
          },
          {
            problem: "Projektstatus-Kommunikation",
            solution:
              "Kunden erhalten automatische Updates zu Baustart, Lieferung, Fertigstellung. Claude formuliert Statusmeldungen, n8n versendet per E-Mail, SMS oder Anruf.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Geschäftsführung-Cockpit",
            solution:
              "Alle Daten aus Leads, Projekten, Personal, Rechnungen zentral in Supabase. Claude erstellt Management-Reports und Prognosen. Tägliche oder wöchentliche Reports automatisch.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Zentrale Kommunikation",
            solution:
              "Telefon, WhatsApp und E-Mail landen in einem gemeinsamen Kanal. Claude erkennt Sender, Absicht und Priorität. Automatische Weiterleitung an zuständige Person.",
            stack: ["Vapi", "Claude", "n8n", "Supabase"],
          },
            ],
          },
        ],
      },
      final_cta: {
        eyebrow: "Wo möchtest du anfangen?",
        headline: "Zeig mir 3 deiner größten Zeitfresser in 30 Minuten",
        sub:
          "Wir schauen gemeinsam welche 1-2 Bausteine bei dir zuerst weh tun. Ich baue dir einen Piloten in 5-10 Tagen — du zahlst nur wenn er funktioniert.",
        cta: "Demo buchen →",
      },
    },
    wissen: {
      eyebrow: "KI-Wissensmanagement",
      headline: "Finde, was du suchst —",
      headline_accent: "auch wenn du nicht mehr weißt, wie es heißt.",
      sub:
        "Profile, Verträge, Angebote, Protokolle, E-Mails — irgendwo liegt die Antwort schon in deinen Daten. Unser KI-Wissensmanagement mit RAG und GraphRAG versteht Bedeutung und Zusammenhänge, nicht nur Stichwörter, und liefert dir die richtige Antwort in Sekunden.",
      primary_cta: "30-Min-Demo buchen",
      hero_photo_slogan: "Nie wieder suchen. Die KI kennt die Antwort — in Sekunden.",
      universal_claim: "KI-Wissensmanagement ist für jede Firma wertvoll.",
      pullquote: {
        eyebrow: "GraphRAG in der Praxis",
        text: "Du stellst eine Frage in normaler Sprache. Die KI kennt die Antwort — und woher sie stammt.",
      },
      pain: {
        eyebrow: "Was dich heute Zeit kostet",
        headline: "Stichwortsuche findet nicht, was du meinst",
        items: [
          {
            title: "Volltextsuche versteht keine Sprache",
            body:
              "Du suchst 'erfahrene Pflegekraft mit Nachtschicht-Erfahrung' und bekommst 40 Treffer für 'Pflege' — sortiert nach Upload-Datum, nicht nach Relevanz.",
          },
          {
            title: "Wissen liegt verstreut in 10 Systemen",
            body:
              "CVs im ATS, Verträge im Drive, Protokolle in E-Mails, Notizen in Slack. Niemand hat den Überblick, wo die Antwort wirklich steckt.",
          },
          {
            title: "Zusammenhänge gehen verloren",
            body:
              "Welches Profil passt zu welchem Mandat aus der Vergangenheit? Welcher Kunde hängt mit welchem Projekt zusammen? Klassische Suche kennt nur Wörter, keine Beziehungen.",
          },
        ],
      },
      metric: {
        label: "Zeit bis zur richtigen Antwort",
        value: "Sekunden",
        after: "statt Stunden",
        note:
          "Statt CVs, Dokumente und E-Mails einzeln zu durchsuchen, stellst du eine Frage in normaler Sprache — die KI kennt Kontext und Beziehungen zwischen all deinen Daten.",
      },
      benefits: {
        eyebrow: "Der Unterschied",
        headline: "Was sich für dich ändert",
        sub: "Kein Umlernen für dein Team — du fragst, die KI antwortet.",
        items: [
          {
            title: "Versteht Bedeutung, nicht nur Wörter",
            body:
              "Sucht nach Sinn und Kontext statt nach exakten Keyword-Treffern. 'Erfahrene Pflegekraft' findet auch Profile mit '10 Jahre Krankenhaus, Nachtdienst' im Lebenslauf.",
          },
          {
            title: "Erkennt Zusammenhänge über Dokumente hinweg",
            body:
              "Verknüpft Personen, Projekte, Firmen und Themen automatisch — auch wenn sie nie im selben Dokument nebeneinander stehen.",
          },
          {
            title: "Bleibt immer aktuell",
            body:
              "Jedes neue Dokument, jedes neue Profil wird sofort eingeordnet. Keine manuelle Pflege, keine veralteten Ordnerstrukturen.",
          },
          {
            title: "Antwortet, statt nur zu verlinken",
            body:
              "Du bekommst eine konkrete Antwort mit Quellenangabe — nicht eine Liste von 50 Treffern, die du selbst durchsuchen musst.",
          },
        ],
      },
      icp: {
        eyebrow: "Für wen wir bauen",
        headline: "Wer heute in Profilen und Dokumenten ertrinkt",
        industries: [
          {
            name: "HR-Berater & Personalvermittler",
            pain:
              "Findet in Sekunden das passende Kandidatenprofil aus tausenden CVs — auch wenn die Anforderung nirgends wörtlich vorkommt.",
          },
          {
            name: "Interim-Agenturen",
            pain:
              "Matcht Mandate mit den richtigen Interim-Managern aus dem gesamten Netzwerk — inklusive Branchenerfahrung aus früheren Projekten.",
          },
          {
            name: "KMU & Mittelstand",
            pain:
              "Findet Verträge, Angebote und Rapporte sofort wieder — ganz ohne dass noch jemand weiß, wie die Datei damals benannt wurde.",
          },
        ],
        size: "Ab 5 Mitarbeitenden mit wachsendem Dokumenten-Chaos",
        stack: "Google Drive, SharePoint, E-Mail, ATS, CRM — wo dein Wissen heute auch liegt",
      },
      final_cta: {
        eyebrow: "Nächster Schritt",
        headline: "Zeig mir deine unauffindbaren Dokumente",
        sub:
          "Bring 2-3 Beispiele mit, die heute schwer zu finden sind. Wir zeigen dir live, wie schnell die Antwort mit KI-Wissensmanagement da ist.",
        cta: "30-Min-Demo buchen →",
      },
    },
    aria: {
      eyebrow: "Neue Unternehmensintelligenz",
      headline: "Jede Frage. Die richtige Antwort.",
      headline_accent: "Aus der richtigen Quelle. Zur richtigen Zeit.",
      sub:
        "ARIA verbindet euer verteiltes Unternehmenswissen zu einer permission-aware Intelligenz. Jede Mitarbeiterin bekommt genau die Information, die sie braucht — nicht mehr, nicht weniger, und immer mit Quellenangabe.",
      primary_cta: "Demo ansehen →",
      universal_claim: "Neue KI-Intelligenz statt zentrales Datenchaos.",
      pullquote: {
        eyebrow: "Die Idee dahinter",
        text: "KI Betriebssysteme und verteilte Intelligenz sind die klare Zukunft.",
      },
      pain: {
        eyebrow: "Der Status quo",
        headline: "Wissen ist da. Nur nicht dort, wo es gebraucht wird.",
        items: [
          {
            title: "Wissen sitzt in Silos",
            body:
              "Dokumente, Tickets, Protokolle, Postfächer — jedes System kennt nur seinen eigenen Ausschnitt der Wahrheit.",
          },
          {
            title: "Suche kostet Zeit, die niemand hat",
            body:
              "Mitarbeiter verbringen Stunden pro Woche damit, die richtige Datei im falschen System zu suchen.",
          },
          {
            title: "Zugriffsrechte sind ein Blackbox-Problem",
            body:
              "Wer was sehen darf, wird oft grob statt granular geregelt — zu offen oder zu restriktiv.",
          },
          {
            title: "Entscheidungen basieren auf veralteten Ständen",
            body:
              "Bis die richtige Information gefunden ist, hat sich die Grundlage der Entscheidung oft schon wieder geändert.",
          },
        ],
      },
      benefits: {
        eyebrow: "Was ARIA anders macht",
        headline: "Verteiltes Wissen, zentral nutzbar.",
        sub: "Kein weiteres Dashboard — eine Intelligenz-Schicht über eurem bestehenden Wissen.",
        items: [
          {
            title: "Permission-aware Zugriff",
            body: "Jede Antwort respektiert automatisch, wer was sehen darf — bis auf Dokumenten-Ebene.",
          },
          {
            title: "Antworten mit Quellenangabe",
            body: "Jede Aussage lässt sich bis zum Ursprungsdokument zurückverfolgen — keine Blackbox.",
          },
          {
            title: "Verknüpfung über Systeme hinweg",
            body: "ARIA verbindet Dokumente, Tickets und Gespräche zu einem gemeinsamen Wissensgraphen.",
          },
          {
            title: "Immer aktuell",
            body: "Neue Quellen werden laufend eingebunden — keine veralteten Exporte, keine Insellösungen.",
          },
        ],
      },
      icp: {
        eyebrow: "Für wen",
        headline: "Für Teams, bei denen Wissen der Engpass ist.",
        industries: [
          {
            name: "Legal & Compliance",
            pain: "Verträge, Richtlinien und Präzedenzfälle über Jahre verteilt in verschiedenen Ablagen.",
          },
          {
            name: "HR & People",
            pain: "Richtlinien, Verträge, Fallhistorie — verstreut über Systeme, die selten miteinander sprechen.",
          },
          {
            name: "Vertrieb & Customer Success",
            pain: "Produktwissen, Preislisten, Kundenhistorie: nie da, wo gerade das Kundengespräch läuft.",
          },
          {
            name: "Support",
            pain: "Neue Mitarbeiter brauchen Monate, bis sie wissen, wo welche Antwort liegt.",
          },
          {
            name: "Konzern-IT & Compliance",
            pain: "Zugriff auf Wissen muss nachvollziehbar und auditierbar bleiben — nicht nur schnell.",
          },
          {
            name: "Wissensintensive Beratung",
            pain: "Jedes Projekt startet wieder bei null, obwohl die Antwort meist schon irgendwo im Haus existiert.",
          },
        ],
      },
      final_cta: {
        eyebrow: "Sieh es dir live an",
        headline: "Probier ARIA in der Live-Demo aus",
        sub: "Keine Anmeldung nötig — stell deine erste Frage direkt in der Demo-Umgebung.",
        cta: "Zur Demo →",
      },
    },
    pricing: {
      eyebrow: "Preise",
      headline: "Setup + Base-Fee + Minuten. Zahl was du sprichst.",
      sub:
        "Setup-Fee für Prompt-Design + Voice + Integration in deine Systeme. Danach €99/Monat Base-Fee für Dashboard, Support und Transkripte. Plus Per-Minute-Abrechnung — je mehr du sprichst, desto günstiger die Minute.",
      billing_note: "Alle Preise netto, zzgl. USt. Abrechnung monatlich per Rechnung oder SEPA-Lastschrift.",
      setup_label: "Setup",
      setup_note: "einmalig",
      base_label: "Base",
      base_note: "pro Monat",
      per_min_label: "pro Minute",
      per_min_from: "ab",
      rate_step_prefix: "ab",
      rate_step_min_suffix: "Min",
      recommended: "Empfohlen",
      cta_primary: "Demo buchen",
      cta_secondary: "Fragen? Schreib uns",
      example_prefix: "Beispiel:",
      example_suffix: "pro Monat",
      tiers: [
        {
          key: "starter",
          name: "Starter",
          tagline: "Für Solo-Berater, kleine Makler, Ein-Personen-Agentur",
          setup: "€790",
          base_monthly: "€99",
          entry_rate: "€0.55",
          rate_tiers: [
            { label: "0 – 500 Min", rate: "€0.55" },
            { label: "500 – 2.000 Min", rate: "€0.50" },
            { label: "ab 2.000 Min", rate: "€0.45" },
          ],
          example: "500 Min = €99 Base + 500 × €0.55 = €374",
          highlight: false,
          bullets: [
            "1 Funnel-Landingpage",
            "Deutsch ODER Englisch",
            "Cal.com-Buchung im Call",
            "E-Mail-Support (48h)",
            "Whisper-Transkripte im Dashboard",
            "Sekunden-genaue Abrechnung",
          ],
        },
        {
          key: "pro",
          name: "Pro",
          tagline: "Für Mittelstand 10-50 MA und Agenturen mit Retainer-Kunden",
          setup: "€1.490",
          base_monthly: "€99",
          entry_rate: "€0.50",
          rate_tiers: [
            { label: "0 – 1.000 Min", rate: "€0.50" },
            { label: "1.000 – 3.000 Min", rate: "€0.45" },
            { label: "ab 3.000 Min", rate: "€0.40" },
          ],
          example: "1.500 Min = €99 + 1.000 × €0.50 + 500 × €0.45 = €824",
          highlight: true,
          bullets: [
            "3 Funnel-Landingpages",
            "Deutsch + Englisch parallel",
            "CRM-Sync (HubSpot / Pipedrive / Salesforce)",
            "WhatsApp-Follow-Up nach Call",
            "Priority-E-Mail-Support (24h)",
            "Custom-Voice als Add-On (+€149/Mo)",
            "Sekunden-genaue Abrechnung",
          ],
        },
        {
          key: "agency",
          name: "Agency",
          tagline: "Für HR-Personalvermittler und Marketing-Agenturen mit 5+ Kunden",
          setup: "€2.990",
          base_monthly: "€99",
          entry_rate: "€0.45",
          rate_tiers: [
            { label: "0 – 2.000 Min", rate: "€0.45" },
            { label: "ab 2.000 Min", rate: "€0.40" },
          ],
          example: "3.500 Min = €99 + 2.000 × €0.45 + 1.500 × €0.40 = €1.599",
          highlight: false,
          bullets: [
            "Unlimited Funnel-Landingpages",
            "White-Label mit Sub-Accounts pro Kunde",
            "Priority-Slack-Kanal (2h)",
            "Custom-Voice + Custom-Prompts pro Sub-Account",
            "Alle Pro-Features inkludiert",
            "Onboarding-Call für dein Team",
            "Sekunden-genaue Abrechnung",
          ],
        },
      ],
      faq: {
        heading: "Häufige Fragen",
        items: [
          {
            q: "Wie funktioniert die Abrechnung?",
            a: "Drei Komponenten: (1) Setup einmalig zu Beginn. (2) €99 Base-Fee monatlich für Dashboard, Support, Transkripte, Recording-Storage. (3) Per-Minute-Kosten für die tatsächlich telefonierte Zeit — gestaffelt: je mehr du im Monat sprichst, desto günstiger die Minute. Abrechnung sekunden-genau, monatlich per Rechnung.",
          },
          {
            q: "Warum ein Setup-Preis?",
            a: "Der Setup deckt Prompt-Design, Voice-Auswahl, Cal.com-Integration und die Anbindung an dein CRM. Wir bauen dein System einmal richtig, damit es danach dauerhaft läuft. Kein Selbst-Bau-Zwang, keine 10 Zoom-Calls für Config-Fragen.",
          },
          {
            q: "Was ist die €99 Base-Fee für?",
            a: "Dashboard-Zugang, E-Mail-Support, Whisper-Transkripte, Recording-Storage in Supabase Frankfurt, Monitoring und Vercel-Hosting. Deckt unsere Fix-Kosten damit die Per-Minute-Preise fair kalkuliert sind. Bei Zero-Use-Monaten (Urlaub, Feiertage) zahlst du nur die €99 Base.",
          },
          {
            q: "Wann greifen die günstigeren Minuten-Preise?",
            a: "Innerhalb eines Kalendermonats. Beim Starter-Tier: erste 500 Min à €0.55, dann 500-2.000 à €0.50, ab 2.001 à €0.45. Wenn du dauerhaft die höchste Staffel triffst, empfehlen wir Upgrade auf Pro — dort startest du schon bei €0.50.",
          },
          {
            q: "Gibt es eine Mindestlaufzeit?",
            a: "Monatlich kündbar. Optional: 12-Monats-Commitment gegen €10 Rabatt auf die Base-Fee (€89 statt €99). Der Setup-Preis ist einmalig und nicht rückerstattbar sobald wir dein Setup gebaut haben.",
          },
          {
            q: "Wie sieht Custom-Voice aus?",
            a: "Cartesia Pro-Voice-Cloning oder ElevenLabs-Voice-ID als Add-On für +€149/Mo (Pro-Tier) bzw. inkludiert im Agency-Tier. Kompensiert die höheren TTS-Kosten und garantiert die Voice-ID auch bei Provider-Preiserhöhung.",
          },
          {
            q: "Was ist mit DSGVO / EU-Datenresidenz?",
            a: "LLM-Inferenz läuft auf Azure OpenAI Sweden Central. Voice-Aufnahmen liegen in Supabase-Storage Frankfurt. Vapi + Twilio sind aktuell noch US-Region — vollständige EU-Voice-Migration ist Backlog.",
          },
          {
            q: "Kann ich Sales UND Recruiting parallel abwickeln?",
            a: "Ja. Pro-Tier deckt beide Verticals ab (3 Funnels = 1 Sales + 1 Recruiting + 1 frei). Agency-Tier hat unlimited Funnels — beliebig mischen.",
          },
          {
            q: "Wie schnell bin ich live?",
            a: "3 Werktage nach Kickoff-Call. Tag 1: Prompt + Voice-Setup. Tag 2: Funnel-Bau + CRM-Anbindung. Tag 3: End-to-End-Test-Anrufe und Go-Live. Kein Wochenende-Setup nötig.",
          },
        ],
      },
      pilot: {
        eyebrow: "Für die ersten Kunden",
        headline: "Pilot-Partner-Deal: Setup halbiert gegen Case-Study-Rechte",
        sub:
          "Aktuell suchen wir 3-5 Pilot-Partner die bereit sind, uns nach 30 Tagen eine kurze Case-Study zu geben (Zahlen + LinkedIn-Post). Als Gegenleistung: Setup-Preis halbiert. €395 statt €790 im Starter-Tier, €745 statt €1.490 im Pro-Tier. Base + Per-Minute bleiben regulär.",
        cta: "Als Pilot-Partner bewerben →",
      },
    },
    footer: {
      tagline: "AI-Funnels für Vertrieb und Recruiting",
      links: {
        sales: "Für Vertrieb",
        recruiting: "Fürs Recruiting",
        kmu: "Für KMUs",
        wissen: "KI-Wissensmanagement",
        aria: "ARIA",
        blog: "Blog",
        pricing: "Preise",
        demo: "Demo buchen",
        showcase: "Alle Live-Funnels ansehen",
        login: "Operator-Login",
      },
      legal: {
        heading: "Rechtliches",
        privacy: "Datenschutz",
        imprint: "Impressum",
      },
      contact: {
        heading: "Kontakt",
        email_label: "E-Mail",
        email: "office@neuronic-automation.ai",
        linkedin: "LinkedIn",
      },
      copyright: "Neuronic Automation — Wien, Österreich",
    },
  },
  en: {
    nav: {
      sales: "For Sales",
      recruiting: "For Recruiting",
      kmu: "For SMBs",
      wissen: "Knowledge Management",
      aria: "ARIA",
      blog: "Blog",
      pricing: "Pricing",
      showcase: "Live Funnels",
      login: "Login",
      demo_cta: "Book a demo",
    },
    sticky_cta: {
      label: "Want to hear it live?",
      sales: "🎯 Sales demo",
      recruiting: "🧑‍💼 Recruiting demo",
    },
    shared: {
      clients: {
        eyebrow: "Clients who trust us",
        logos: [
          { src: "/marketing/logos/clients/wien-it.png", alt: "Wien IT" },
          { src: "/marketing/logos/clients/bmw.png", alt: "BMW" },
          { src: "/marketing/logos/clients/boge-rubber-plastics.png", alt: "BOGE Rubber & Plastics" },
          { src: "/marketing/logos/clients/bt-group.png", alt: "BT Group" },
          { src: "/marketing/logos/clients/dhl-consulting.webp", alt: "DHL Consulting" },
          { src: "/marketing/logos/clients/smia.png", alt: "SMIA" },
          { src: "/marketing/logos/clients/gfp-prozessmanagement.jpg", alt: "Gesellschaft für Prozessmanagement" },
          { src: "/marketing/logos/clients/kardex.png", alt: "Kardex" },
          { src: "/marketing/logos/clients/rewe-group.png", alt: "REWE Group" },
          { src: "/marketing/logos/clients/siemens-advanta-consulting.webp", alt: "Siemens Advanta Consulting" },
          { src: "/marketing/logos/clients/synergie.png", alt: "Synergie" },
        ],
      },
      competence: {
        eyebrow: "Expertise",
        logos: [
          { src: "/marketing/logos/competence/wu.jpg", alt: "WU Executive Academy" },
          { src: "/marketing/logos/competence/prozessmanagement.jpg", alt: "Gesellschaft für Prozessmanagement" },
          { src: "/marketing/logos/competence/scrum.jpg", alt: "Scrum Master Certified" },
          { src: "/marketing/logos/competence/digital-consulting.png", alt: "Digital Consulting" },
        ],
      },
    },
    home: {
      eyebrow: "AI Funnel Expert",
      headline: "The AI call that happens in seconds.",
      headline_accent: "Not after the weekend.",
      sub:
        "AI funnels for Sales and Recruiting — calling your lead or candidate back within 30 seconds. 24/7. Fully automated. In your voice, with your pitch.",
      primary_cta: "Try it live",
      secondary_cta: "Book a demo",
      hero_photo_slogan: "Your phone rings in 30 seconds. Not just on Monday.",
      split_eyebrow: "Two worlds, one technology",
      split_intro:
        "Sales and Recruiting are different worlds. But both suffer from the same problem: whoever answers first, wins. Pick your world.",
      sales_card: {
        badge: "Sales",
        headline: "Speed-to-Lead decides the deal",
        sub:
          "Call every lead in 30 seconds — instead of 24 hours. Before your competitor gets to them.",
        metric_label: "Response time",
        metric_value: "30 sec",
        metric_after: "instead of 24 hrs",
        bullets: [
          "Fully automated, 24/7, weekends included",
          "Qualify + book a demo meeting in the same call",
          "CRM integration (HubSpot, Pipedrive, Salesforce)",
        ],
        cta: "Sales setup →",
      },
      recruiting_card: {
        badge: "Recruiting",
        headline: "Time-to-Hire beats Time-to-Post",
        sub:
          "Screen candidates within 5 minutes of application — not 5 days. Before they sign somewhere else.",
        metric_label: "Screening time",
        metric_value: "5 min",
        metric_after: "instead of 5 days",
        bullets: [
          "AI-led first-round interview right after Quick-Apply",
          "Automatic pre-qualification + score in your ATS",
          "GDPR-compliant, EU region (Azure Sweden Central)",
        ],
        cta: "Recruiting setup →",
      },
      how_it_works: {
        eyebrow: "How it works",
        headline: "Three steps, no setup weekend",
        steps: [
          {
            title: "Build the funnel",
            body:
              "Quick-Apply or Lead-Gen funnel with your brand, your questions, your landing page. No code, no design zoom-call.",
          },
          {
            title: "Train the AI",
            body:
              "Upload your pitch deck, FAQ, ideal persona. The agent learns your product and voice within minutes.",
          },
          {
            title: "Let it call",
            body:
              "As soon as someone signs up: AI calls back in 30 seconds. German or English, in your chosen voice, with your script.",
          },
        ],
      },
      dogfood: {
        eyebrow: "Experience it",
        headline: "Have us call you in 30 seconds.",
        sub:
          "No marketing BS, no video demo. Drop your number into one of our demo funnels — your phone rings within a minute with our actual AI. You decide if it converts.",
        sales_link: "Try as a prospect →",
        recruiting_link: "Try as a candidate →",
        note:
          "Note: the calls are real, your phone will actually ring. Hang up any time. No CRM entry, no newsletter, no follow-up.",
      },
      final_cta: {
        eyebrow: "Last step",
        headline: "30-min demo with the founder",
        sub:
          "Show me your case, I'll show you how it looks with your pitch. Live setup during the call is possible.",
        cta: "Book a demo →",
      },
      showcase_teaser: {
        eyebrow: "Live references",
        headline: "Or see real customer funnels in action",
        sub:
          "Real estate buyers, car configurator, travel deals. Click one — your phone rings within 30 seconds with the matching pitch. Try-mode is free, any time.",
        cta: "See all funnels →",
      },
    },
    sales: {
      eyebrow: "For heads of sales, CMOs, agency owners",
      headline: "Close more deals —",
      headline_accent: "by calling every lead in 30 seconds.",
      sub:
        "You pay per click for hot leads. But if your sales team is asleep on weekends, the lead is cold by Monday. We don't let it get cold. Ever.",
      primary_cta: "Try as a prospect",
      secondary_cta: "Book a demo",
      hero_photo_slogan: "You call the lead first. Automatically, in 30 seconds.",
      pain: {
        eyebrow: "This is costing you revenue",
        headline: "Speed-to-Lead is the #1 sales metric",
        items: [
          {
            title: "Leads go 80% colder after 5 minutes",
            body:
              "Harvard Business Review: qualification rate is 21× higher when contact happens within 5 minutes vs. 30 minutes. After 24 hours the lead is basically dead.",
          },
          {
            title: "Ad spend leaks through the timing gap",
            body:
              "You pay 50-200 EUR per qualified lead. If you only call on Monday, the competitor already reached out at 10:47 PM on Sunday. Your budget paid for their deal.",
          },
          {
            title: "Sales team drowning in dead leads",
            body:
              "40% of form submitters are lookie-loos with zero purchase intent. Your SDRs burn hours on wrong numbers instead of booking hot meetings.",
          },
        ],
      },
      metric: {
        label: "Speed-to-Lead",
        value: "30 sec",
        after: "instead of 24 hrs",
        note:
          "Time from form submit to prospect phone ringing. Fully automated, nights and weekends included.",
      },
      how: {
        eyebrow: "How the sales flow works",
        headline: "Lead-in to meeting-booked in 5 minutes",
        steps: [
          {
            title: "Lead signs up",
            body:
              "Landing page, Meta ad form, LinkedIn retargeting — doesn't matter. As soon as the form is submitted, our webhook fires.",
          },
          {
            title: "AI calls in 30 sec",
            body:
              "In your chosen voice, with your pitch. Runs discovery questions, qualifies budget/authority/need/timeline.",
          },
          {
            title: "Meeting booked, CRM updated",
            body:
              "Qualified? AI books straight into your Cal.com/Calendly slot. Lead + summary + recording land in HubSpot/Pipedrive.",
          },
        ],
      },
      dogfood: {
        eyebrow: "Experience our sales setup",
        headline: "Fill in our demo form — receive our sales pitch",
        sub:
          "This is what it looks like for your customer: form on a landing page, 3 questions, phone number. Click — your phone rings within 30 seconds with our AI. It qualifies you, pitches Neuronic Automation, tries to book a demo. Hang up any time.",
        cta: "Start sales demo →",
      },
      icp: {
        eyebrow: "Who we build for",
        headline: "Sales teams with expensive traffic + slow reaction",
        industries: [
          { name: "Ad agencies", pain: "Retainer clients expect faster results" },
          { name: "Law firms / consultants", pain: "First meeting is the bottleneck" },
          { name: "High-touch SaaS", pain: "SDR team is expensive and slow" },
          { name: "Financial services", pain: "Compliance slows the cycle" },
          { name: "Real estate", pain: "Buyers eye 5 properties at once" },
          { name: "High-ticket coaching", pain: "Warm leads go cold quickly" },
        ],
        size: "10-50 employees",
        stack: "HubSpot, Pipedrive, Salesforce, Meta Ads, Google Ads, LinkedIn Ads",
      },
      final_cta: {
        eyebrow: "Next step",
        headline: "Show me your case in 30 minutes",
        sub:
          "Live setup, real number, real calls. By the end of the call you either have a demo number that rings — or you know exactly what's missing.",
        cta: "Book a 30-min demo →",
      },
    },
    recruiting: {
      eyebrow: "For HR leads, talent acquisition, recruitment agencies",
      headline: "Win the best talent —",
      headline_accent: "before the competition reaches them.",
      sub:
        "Candidates apply to 10 companies at once. Whoever speaks to them first with a real human or a smart AI wins. Everyone else gets ghosted rows in an ATS.",
      primary_cta: "Try as a candidate",
      secondary_cta: "Book a demo",
      hero_photo_slogan: "AI analyzes profiles and calls candidates automatically.",
      pain: {
        eyebrow: "The hidden candidate collapse",
        headline: "Time-to-Hire is today's #1 candidate barrier",
        items: [
          {
            title: "Applicants ghost after 24 hours",
            body:
              "60% of Quick-Apply candidates ghost HR if there's no contact within a day. On your career site: an application. In your ATS: a dead row.",
          },
          {
            title: "Open roles cost money every day",
            body:
              "An empty truck driver seat = 800 EUR of daily contribution margin gone. An empty care role = overtime-exhausted staff. Every week counts.",
          },
          {
            title: "HR drowning in screening calls",
            body:
              "First-call screenings are 70% standard questions: 'Driver's license? Availability? Shift-work?'. Time your recruiters could spend on actual recruiting.",
          },
        ],
      },
      metric: {
        label: "Time-to-First-Screen",
        value: "5 min",
        after: "instead of 5 days",
        note:
          "Time from Quick-Apply submit to first screening call. Nights and weekends included, in DE or EN.",
      },
      how: {
        eyebrow: "How the recruiting flow works",
        headline: "From application to screening report in 10 minutes",
        steps: [
          {
            title: "Quick-Apply funnel",
            body:
              "3-4 questions (role, availability, region), phone number, consent — done. No LinkedIn login, no forced CV upload.",
          },
          {
            title: "AI screening call",
            body:
              "In your chosen voice, with your criteria. 5-minute discovery: availability, experience, deal-breakers.",
          },
          {
            title: "Score + summary in your ATS",
            body:
              "Recruiter receives ranking, transcript, audio recording, and next-step recommendation. Yes-or-no decision in 30 seconds.",
          },
        ],
      },
      dogfood: {
        eyebrow: "Experience our recruiting setup",
        headline: "Fill in our demo form — experience a screening in your own ear",
        sub:
          "This is what your candidates get: form, 3 questions, phone number. Click — your phone rings and our AI runs a short fictional screening interview. Takes 5 minutes. Afterwards you can judge if the audio quality works for your careers page.",
        cta: "Start recruiting demo →",
      },
      icp: {
        eyebrow: "Who we build for",
        headline: "Recruiting teams with high volume + labor shortage",
        industries: [
          { name: "Logistics & transport", pain: "Driver shortage, high turnover" },
          { name: "Hospitality", pain: "Seasonal peaks and ghosting" },
          { name: "Care & health", pain: "Acute shortages + heavy compliance" },
          { name: "Call centers / BPO", pain: "High applicant volume, low show-up rate" },
          { name: "Retail", pain: "Sales-associate shortage + store-level urgency" },
          { name: "Recruitment agencies", pain: "Multi-mandate, little time per candidate" },
        ],
        size: "50+ employees, or agencies with 5+ concurrent mandates",
        stack: "Personio, SAP SuccessFactors, Workday, Recruitee, join.com, softgarden",
      },
      compliance: {
        eyebrow: "GDPR-compliant",
        headline: "EU region, clear consent chain, audit log",
        bullets: [
          "LLM inference in Sweden Central (Azure OpenAI EU)",
          "Voice recordings in Supabase Storage (Frankfurt)",
          "Two-step consent in the funnel (privacy + AI-call opt-in)",
          "Deletion + subject-access within 30 days of request",
        ],
      },
      final_cta: {
        eyebrow: "Next step",
        headline: "30-min demo — your role, your screening script",
        sub:
          "Bring your hardest skill test. We build a live screening prompt together and let it call you. By the end you have a blueprint for your first role.",
        cta: "Book a 30-min demo →",
      },
    },
    kmu: {
      eyebrow: "Software solutions for SMBs",
      headline: "Your business runs.",
      headline_accent: "Everything around it costs time.",
      sub:
        "Quotes, material orders, site reports, recruiting, dunning — the work around the work is what drains SMBs of time, money, and nerves. AI automation for the processes that don't move you forward. Voice + Claude + Supabase.",
      hero_photo_slogan: "The AI handles the paperwork. You handle the business.",
      dogfood: {
        eyebrow: "Experience our AI agent",
        headline: "Answer 3 questions — your phone rings in 30 seconds",
        sub:
          "Our AI calls you, asks about your biggest time sink, and matches the right AI building block. This is exactly how your customers or applicants experience our voice agent firsthand. Hang up any time.",
        cta: "Start SMB demo →",
      },
      primary_cta: "Book a 30-min demo",
      secondary_cta: "See live examples",
      problems: {
        eyebrow: "What costs SMBs the most",
        headline: "The 10 unsolved time sinks",
        items: [
          "Customer inquiries that go unanswered",
          "Building quotes from photos, voice memos, and notes",
          "Material ordering without a system break",
          "Tracking delivery dates, spotting delays",
          "Staff recruiting and applicant screening",
          "Site scheduling and technician dispatch",
          "Change-order management and approvals",
          "Invoicing from field reports",
          "Dunning without cash-flow gaps",
          "Central communication across phone, WhatsApp, and email",
        ],
      },
      solutions: {
        eyebrow: "21 AI building blocks",
        headline: "A ready-to-deploy block for every problem",
        sub:
          "Not sold as a suite — implemented one at a time. You pick what hurts most right now, we build it live in 3-14 days.",
        categories: [
          {
            label: "Inquiries, quotes & material",
            items: [
          {
            problem: "Customer inquiries unanswered",
            solution:
              "AI picks up calls you can't get to, gathers project info from the customer, and automatically proposes appointments. No lead gets lost, response time drops from days to minutes.",
            stack: ["Vapi", "n8n", "Supabase"],
          },
          {
            problem: "Callback management",
            solution:
              "Vapi calls new prospects back within minutes of their inquiry, qualifies budget + buying readiness, and creates tasks or appointments.",
            stack: ["Vapi", "n8n", "Supabase"],
          },
          {
            problem: "Quote creation",
            solution:
              "Staff record the site visit as a voice memo — Claude drafts a quote including scope of work. The office only reviews the final version.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Quote follow-up",
            solution:
              "n8n tracks deadlines after a quote is sent. Vapi calls a few days later, asks about the decision and open questions. Answers land cleanly in the database.",
            stack: ["Vapi", "n8n", "Supabase"],
          },
          {
            problem: "Material ordering",
            solution:
              "Technicians report needs by voice or WhatsApp. Claude extracts items, quantities, and priorities; n8n places the order with the supplier. Everything logged in Supabase.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Delivery-date monitoring",
            solution:
              "Orders are tracked automatically, n8n checks status and detects delays. Project leads + technicians are notified immediately when there's a problem.",
            stack: ["n8n", "Supabase"],
          },
          {
            problem: "Inventory management",
            solution:
              "Report material withdrawals by voice — Claude recognizes item + quantity, updates stock. Reordering starts automatically once minimum stock is reached.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          ],
          },
          {
            label: "Site, team & scheduling",
            items: [
          {
            problem: "Site scheduling",
            solution:
              "Claude analyzes capacity, qualifications, and resources. n8n builds daily and weekly schedules. Changes are communicated by SMS, WhatsApp, or call.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Technician dispatch",
            solution:
              "On short-notice absence, the system suggests qualified replacements (skills, distance, availability). Vapi calls and confirms appointments.",
            stack: ["Vapi", "Claude", "n8n"],
          },
          {
            problem: "Site reports",
            solution:
              "Technician speaks the daily report into their phone. Claude turns it into a structured report with hours, material, and issues. Zero typing, everything in Supabase.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Change-order management",
            solution:
              "Extra work discovered on site is detected automatically. Claude drafts a change order including description + cost estimate. Customer approval is logged in an audit-proof way.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Applicant screening",
            solution:
              "Vapi calls applicants right after they apply, asks recruiter questions, and scores the answers. Candidate profiles land in Supabase. Saves up to 90% of screening effort.",
            stack: ["Vapi", "Claude", "n8n", "Supabase"],
          },
          {
            problem: "Employee onboarding",
            solution:
              "New hires are walked through processes, tools, and safety by a phone assistant. n8n drives the onboarding steps, progress is logged.",
            stack: ["Vapi", "Claude", "n8n"],
          },
          {
            problem: "Appointment scheduling",
            solution:
              "Customers book by phone, 24/7. Vapi checks open capacity, proposes matching slots, and syncs with your ERP + calendar.",
            stack: ["Vapi", "n8n", "Supabase"],
          },
          ],
          },
          {
            label: "Invoicing, service & reporting",
            items: [
          {
            problem: "Invoicing",
            solution:
              "Field reports, material, and hours flow together into a draft invoice. Claude generates the PDF, n8n sends it automatically. All invoices live centrally in Supabase.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Dunning",
            solution:
              "Open invoices are monitored, overdue payments detected, dunning processes triggered. Vapi calls customers with a friendly reminder about outstanding invoices.",
            stack: ["Vapi", "n8n", "Supabase"],
          },
          {
            problem: "Customer service",
            solution:
              "Service hotline takes standard questions and fault reports. Claude analyzes the request and prioritizes cases. n8n creates tickets in Supabase.",
            stack: ["Vapi", "Claude", "n8n", "Supabase"],
          },
          {
            problem: "Quality management",
            solution:
              "After project completion, AI calls customers for feedback. Results are captured in a structured way. Claude spots recurring issues and improvement opportunities.",
            stack: ["Vapi", "Claude", "Supabase"],
          },
          {
            problem: "Project-status communication",
            solution:
              "Customers get automatic updates on start, delivery, and completion. Claude drafts the status messages, n8n sends them by email, SMS, or call.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Management cockpit",
            solution:
              "All data from leads, projects, staff, and invoices lives centrally in Supabase. Claude generates management reports and forecasts. Daily or weekly reports, automatically.",
            stack: ["Claude", "n8n", "Supabase"],
          },
          {
            problem: "Central communication",
            solution:
              "Phone, WhatsApp, and email land in one shared channel. Claude detects sender, intent, and priority. Automatic routing to the right person.",
            stack: ["Vapi", "Claude", "n8n", "Supabase"],
          },
            ],
          },
        ],
      },
      final_cta: {
        eyebrow: "Where do you want to start?",
        headline: "Show me 3 of your biggest time sinks in 30 minutes",
        sub:
          "We'll look together at which 1-2 building blocks hurt most for you right now. I'll build you a pilot in 5-10 days — you only pay if it works.",
        cta: "Book a demo →",
      },
    },
    wissen: {
      eyebrow: "AI knowledge management",
      headline: "Find what you're looking for —",
      headline_accent: "even if you can't remember what it's called.",
      sub:
        "Profiles, contracts, quotes, meeting notes, emails — the answer is usually already sitting somewhere in your data. Our AI knowledge management with RAG and GraphRAG understands meaning and relationships, not just keywords, and gets you the right answer in seconds.",
      primary_cta: "Book a 30-min demo",
      hero_photo_slogan: "Never search again. The AI knows the answer — in seconds.",
      universal_claim: "AI knowledge management is valuable for every company.",
      pullquote: {
        eyebrow: "GraphRAG in practice",
        text: "You ask a question in plain language. The AI knows the answer — and where it came from.",
      },
      pain: {
        eyebrow: "What's costing you time today",
        headline: "Keyword search doesn't find what you mean",
        items: [
          {
            title: "Full-text search doesn't understand language",
            body:
              "You search for 'experienced caregiver with night-shift experience' and get 40 hits for 'care' — sorted by upload date, not relevance.",
          },
          {
            title: "Knowledge is scattered across 10 systems",
            body:
              "CVs in the ATS, contracts in Drive, notes in emails, memos in Slack. Nobody has an overview of where the answer actually lives.",
          },
          {
            title: "Connections get lost",
            body:
              "Which profile fits which past mandate? Which customer connects to which project? Classic search only knows words, not relationships.",
          },
        ],
      },
      metric: {
        label: "Time to the right answer",
        value: "Seconds",
        after: "instead of hours",
        note:
          "Instead of searching CVs, documents, and emails one by one, you ask a question in plain language — the AI knows the context and relationships across all your data.",
      },
      benefits: {
        eyebrow: "The difference",
        headline: "What changes for you",
        sub: "No retraining for your team — you ask, the AI answers.",
        items: [
          {
            title: "Understands meaning, not just words",
            body:
              "Searches for sense and context instead of exact keyword matches. 'Experienced caregiver' also finds profiles with '10 years hospital, night shift' in the CV.",
          },
          {
            title: "Spots connections across documents",
            body:
              "Links people, projects, companies, and topics automatically — even when they never appear side by side in the same document.",
          },
          {
            title: "Always stays current",
            body:
              "Every new document, every new profile is indexed instantly. No manual upkeep, no stale folder structures.",
          },
          {
            title: "Answers, instead of just linking",
            body:
              "You get a concrete answer with a source — not a list of 50 results you have to sift through yourself.",
          },
        ],
      },
      icp: {
        eyebrow: "Who we build for",
        headline: "Anyone drowning in profiles and documents today",
        industries: [
          {
            name: "HR consultants & recruiters",
            pain:
              "Finds the right candidate profile in seconds out of thousands of CVs — even if the requirement never appears verbatim.",
          },
          {
            name: "Interim agencies",
            pain:
              "Matches mandates to the right interim managers across the whole network — including industry experience from past projects.",
          },
          {
            name: "SMBs & mid-market",
            pain:
              "Finds contracts, quotes, and reports instantly again — without anyone still knowing what the file was named back then.",
          },
        ],
        size: "5+ employees with growing document chaos",
        stack: "Google Drive, SharePoint, email, ATS, CRM — wherever your knowledge lives today",
      },
      final_cta: {
        eyebrow: "Next step",
        headline: "Show me your unfindable documents",
        sub:
          "Bring 2-3 examples that are hard to find today. We'll show you live how fast the answer arrives with AI knowledge management.",
        cta: "Book a 30-min demo →",
      },
    },
    aria: {
      eyebrow: "The new enterprise intelligence",
      headline: "Every question. The right answer.",
      headline_accent: "From the right source. At the right time.",
      sub:
        "ARIA connects your company's scattered knowledge into one permission-aware intelligence. Every employee gets exactly the information they need — no more, no less, always with a source.",
      primary_cta: "Watch the demo →",
      universal_claim: "New AI intelligence instead of centralized data chaos.",
      pullquote: {
        eyebrow: "The idea behind it",
        text: "AI operating systems and distributed intelligence are the clear future.",
      },
      pain: {
        eyebrow: "The status quo",
        headline: "The knowledge exists. Just not where it's needed.",
        items: [
          {
            title: "Knowledge sits in silos",
            body:
              "Documents, tickets, meeting notes, inboxes — every system only knows its own slice of the truth.",
          },
          {
            title: "Search costs time nobody has",
            body:
              "Employees spend hours a week hunting for the right file in the wrong system.",
          },
          {
            title: "Access rights are a black box",
            body:
              "Who's allowed to see what is often set coarsely instead of granularly — too open or too restrictive.",
          },
          {
            title: "Decisions run on stale information",
            body:
              "By the time the right information surfaces, the basis for the decision has often already changed.",
          },
        ],
      },
      benefits: {
        eyebrow: "What ARIA does differently",
        headline: "Distributed knowledge, usable centrally.",
        sub: "Not another dashboard — an intelligence layer over your existing knowledge.",
        items: [
          {
            title: "Permission-aware access",
            body: "Every answer automatically respects who's allowed to see what, down to the document level.",
          },
          {
            title: "Answers with sources",
            body: "Every statement traces back to its source document — no black box.",
          },
          {
            title: "Cross-system linking",
            body: "ARIA connects documents, tickets, and conversations into one shared knowledge graph.",
          },
          {
            title: "Always current",
            body: "New sources are continuously ingested — no stale exports, no data silos.",
          },
        ],
      },
      icp: {
        eyebrow: "Who it's for",
        headline: "For teams where knowledge is the bottleneck.",
        industries: [
          {
            name: "Legal & Compliance",
            pain: "Contracts, policies, and precedents scattered across different archives for years.",
          },
          {
            name: "HR & People",
            pain: "Policies, contracts, case history — spread across systems that rarely talk to each other.",
          },
          {
            name: "Sales & Customer Success",
            pain: "Product knowledge, price lists, customer history: never where the customer conversation is actually happening.",
          },
          {
            name: "Support",
            pain: "New hires need months before they know where which answer lives.",
          },
          {
            name: "Enterprise IT & Compliance",
            pain: "Access to knowledge has to stay traceable and auditable — not just fast.",
          },
          {
            name: "Knowledge-intensive consulting",
            pain: "Every project starts from zero, even though the answer usually already exists somewhere in the company.",
          },
        ],
      },
      final_cta: {
        eyebrow: "See it live",
        headline: "Try ARIA in the live demo",
        sub: "No sign-up required — ask your first question directly in the demo environment.",
        cta: "Go to the demo →",
      },
    },
    pricing: {
      eyebrow: "Pricing",
      headline: "Setup + base fee + per-minute. Pay for what you talk.",
      sub:
        "Setup fee for prompt design, voice, and system integration. Then €99/month base fee for dashboard, support, and transcripts. Plus per-minute pricing — the more you talk, the cheaper each minute gets.",
      billing_note: "All prices exclude VAT. Billed monthly by invoice or SEPA direct debit.",
      setup_label: "Setup",
      setup_note: "one-time",
      base_label: "Base",
      base_note: "per month",
      per_min_label: "per minute",
      per_min_from: "from",
      rate_step_prefix: "from",
      rate_step_min_suffix: "min",
      recommended: "Most popular",
      cta_primary: "Book a demo",
      cta_secondary: "Questions? Email us",
      example_prefix: "Example:",
      example_suffix: "per month",
      tiers: [
        {
          key: "starter",
          name: "Starter",
          tagline: "For solo consultants, small brokers, one-person agencies",
          setup: "€790",
          base_monthly: "€99",
          entry_rate: "€0.55",
          rate_tiers: [
            { label: "0 – 500 min", rate: "€0.55" },
            { label: "500 – 2,000 min", rate: "€0.50" },
            { label: "2,000+ min", rate: "€0.45" },
          ],
          example: "500 min = €99 base + 500 × €0.55 = €374",
          highlight: false,
          bullets: [
            "1 funnel landing page",
            "German OR English",
            "Cal.com booking during the call",
            "Email support (48h)",
            "Whisper transcripts in the dashboard",
            "Second-level billing precision",
          ],
        },
        {
          key: "pro",
          name: "Pro",
          tagline: "For 10-50 employee businesses and agencies with retainer clients",
          setup: "€1,490",
          base_monthly: "€99",
          entry_rate: "€0.50",
          rate_tiers: [
            { label: "0 – 1,000 min", rate: "€0.50" },
            { label: "1,000 – 3,000 min", rate: "€0.45" },
            { label: "3,000+ min", rate: "€0.40" },
          ],
          example: "1,500 min = €99 + 1,000 × €0.50 + 500 × €0.45 = €824",
          highlight: true,
          bullets: [
            "3 funnel landing pages",
            "German + English in parallel",
            "CRM sync (HubSpot / Pipedrive / Salesforce)",
            "WhatsApp follow-up after the call",
            "Priority email support (24h)",
            "Custom voice as add-on (+€149/mo)",
            "Second-level billing precision",
          ],
        },
        {
          key: "agency",
          name: "Agency",
          tagline: "For HR firms and marketing agencies with 5+ clients",
          setup: "€2,990",
          base_monthly: "€99",
          entry_rate: "€0.45",
          rate_tiers: [
            { label: "0 – 2,000 min", rate: "€0.45" },
            { label: "2,000+ min", rate: "€0.40" },
          ],
          example: "3,500 min = €99 + 2,000 × €0.45 + 1,500 × €0.40 = €1,599",
          highlight: false,
          bullets: [
            "Unlimited funnel landing pages",
            "White-label with sub-accounts per client",
            "Priority Slack channel (2h)",
            "Custom voice + custom prompts per sub-account",
            "All Pro features included",
            "Onboarding call for your team",
            "Second-level billing precision",
          ],
        },
      ],
      faq: {
        heading: "Frequently asked",
        items: [
          {
            q: "How does billing work?",
            a: "Three components: (1) Setup fee one-time at kickoff. (2) €99 base fee monthly for dashboard, support, transcripts, and recording storage. (3) Per-minute billing on actual talk time — tiered: the more you use, the cheaper each minute becomes. Billed to the second, monthly by invoice.",
          },
          {
            q: "Why a setup fee?",
            a: "The setup covers prompt design, voice selection, Cal.com integration, and connecting to your CRM. We build your system right once so it runs afterwards. No forced DIY, no ten zoom calls for config questions.",
          },
          {
            q: "What does the €99 base fee cover?",
            a: "Dashboard access, email support, Whisper transcripts, recording storage in Supabase Frankfurt, monitoring, and Vercel hosting. Covers our fixed costs so per-minute prices stay fair. During zero-use months (vacations, holidays) you only pay the €99 base.",
          },
          {
            q: "When do the cheaper minute rates kick in?",
            a: "Within a calendar month. Starter: first 500 min at €0.55, then 500-2,000 at €0.50, above 2,000 at €0.45. If you consistently hit the top tier, we recommend upgrading to Pro — where you start at €0.50.",
          },
          {
            q: "Any minimum commitment?",
            a: "Month-to-month. Optional: 12-month commitment for €10 off the base fee (€89 instead of €99). Setup fee is one-time and non-refundable once we've built your system.",
          },
          {
            q: "What about custom voice?",
            a: "Cartesia Pro voice-cloning or ElevenLabs voice-ID as an add-on for +€149/mo (Pro tier), included in Agency tier. Compensates the higher TTS costs and secures your voice-ID against provider price hikes.",
          },
          {
            q: "GDPR / EU data residency?",
            a: "LLM inference runs on Azure OpenAI Sweden Central. Voice recordings live in Supabase Storage Frankfurt. Vapi + Twilio are still US regions today — full EU voice migration is on the backlog.",
          },
          {
            q: "Can I run Sales AND Recruiting in parallel?",
            a: "Yes. Pro tier covers both verticals (3 funnels = 1 sales + 1 recruiting + 1 flexible). Agency tier has unlimited funnels — mix as you like.",
          },
          {
            q: "How fast can I go live?",
            a: "3 business days after the kickoff call. Day 1: prompt + voice setup. Day 2: funnel build + CRM wiring. Day 3: end-to-end test calls and go-live. No weekend setup required.",
          },
        ],
      },
      pilot: {
        eyebrow: "For our first customers",
        headline: "Pilot partner deal: setup fee halved for case-study rights",
        sub:
          "We're currently looking for 3-5 pilot partners who'll give us a short case study after 30 days (numbers + LinkedIn post). In return: setup fee cut in half. €395 instead of €790 on Starter, €745 instead of €1,490 on Pro. Base fee + per-minute stay at list price.",
        cta: "Apply as a pilot partner →",
      },
    },
    footer: {
      tagline: "AI funnels for Sales and Recruiting",
      links: {
        sales: "For Sales",
        recruiting: "For Recruiting",
        kmu: "For SMBs",
        wissen: "AI Knowledge Management",
        aria: "ARIA",
        blog: "Blog",
        pricing: "Pricing",
        demo: "Book a demo",
        showcase: "See all live funnels",
        login: "Operator login",
      },
      legal: {
        heading: "Legal",
        privacy: "Privacy",
        imprint: "Imprint",
      },
      contact: {
        heading: "Contact",
        email_label: "Email",
        email: "office@neuronic-automation.ai",
        linkedin: "LinkedIn",
      },
      copyright: "Neuronic Automation — Vienna, Austria",
    },
  },
};
