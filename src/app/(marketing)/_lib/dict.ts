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
      showcase: "Live-Funnels",
      login: "Login",
      demo_cta: "Demo buchen",
    },
    sticky_cta: {
      label: "Willst du's live hören?",
      sales: "🎯 Sales-Demo",
      recruiting: "🧑‍💼 Recruiting-Demo",
    },
    home: {
      eyebrow: "AI Funnel Expert",
      headline: "Der KI-Anruf, der in Sekunden geschieht.",
      headline_accent: "Nicht nach dem Wochenende.",
      sub:
        "AI-Funnels für Vertrieb und Recruiting — die deinen Lead oder Kandidaten innerhalb von 30 Sekunden zurückrufen. 24/7. Vollautomatisch. In deiner Stimme, mit deinem Pitch.",
      primary_cta: "Live testen",
      secondary_cta: "Demo buchen",
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
    footer: {
      tagline: "AI-Funnels für Vertrieb und Recruiting",
      links: {
        sales: "Für Vertrieb",
        recruiting: "Fürs Recruiting",
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
      showcase: "Live Funnels",
      login: "Login",
      demo_cta: "Book a demo",
    },
    sticky_cta: {
      label: "Want to hear it live?",
      sales: "🎯 Sales demo",
      recruiting: "🧑‍💼 Recruiting demo",
    },
    home: {
      eyebrow: "AI Funnel Expert",
      headline: "The AI call that happens in seconds.",
      headline_accent: "Not after the weekend.",
      sub:
        "AI funnels for Sales and Recruiting — calling your lead or candidate back within 30 seconds. 24/7. Fully automated. In your voice, with your pitch.",
      primary_cta: "Try it live",
      secondary_cta: "Book a demo",
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
    footer: {
      tagline: "AI funnels for Sales and Recruiting",
      links: {
        sales: "For Sales",
        recruiting: "For Recruiting",
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
