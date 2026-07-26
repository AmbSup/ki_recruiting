// Blog-Content-Dictionary. Ein Post = ein Objekt mit typisiertem Content-
// Block-Array (gleiches Idiom wie funnel_pages.blocks in der DB, siehe
// [slug]/funnel-player.tsx) statt Markdown/MDX — kein neuer Dependency,
// volle Kontrolle über semantisches HTML (h2/h3-Hierarchie zählt für SEO).
//
// Sprachfähig analog zu dict.ts: alle übersetzbaren Felder liegen unter
// `de` / `en` mit identischem Slug (URL bekommt nur den /en-Präfix, siehe
// lang-switcher.tsx). Slug, Datum, Farbe und CTA-Ziel-Pfad sind sprach-
// unabhängig und bleiben auf Top-Level.

import type { Lang } from "./t";

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string; cite?: string };

export type BlogContent = {
  title: string;
  metaDescription: string;
  excerpt: string;
  keywords: string[];
  heroEyebrow: string;
  ctaLabel: string;
  ctaHeadline: string;
  ctaSub: string;
  body: BlogBlock[];
};

export type BlogPost = {
  slug: string;
  publishedAt: string;
  accentColor: string;
  ctaHref: string;
  de: BlogContent;
  en: BlogContent;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "ki-recruiting-software-oesterreich",
    publishedAt: "2026-07-20",
    accentColor: "#0E7C66",
    ctaHref: "/recruiting",
    de: {
      title: "KI Recruiting Software in Österreich: Was 2026 wirklich den Unterschied macht",
      metaDescription:
        "KI Recruiting Software in Österreich: Wie KI-Screening-Calls Time-to-Hire von Tagen auf Minuten senken — DSGVO-konform, EU-Region.",
      excerpt:
        "Fachkräftemangel trifft Österreich in Logistik, Pflege und Gastronomie besonders hart. Warum Time-to-Hire heute der Engpass ist — und wie KI-Screening-Calls ihn auflösen.",
      keywords: ["KI Recruiting Software Österreich", "KI Recruiting", "Time-to-Hire", "Recruiting Software Österreich"],
      heroEyebrow: "Recruiting · Österreich",
      ctaLabel: "Recruiting-Setup ansehen →",
      ctaHeadline: "30-Min-Demo — deine Rolle, dein Screening-Skript",
      ctaSub:
        "Bring deinen härtesten Skill-Test mit. Wir bauen live einen Screening-Prompt und lassen ihn dich anrufen.",
      body: [
        {
          type: "p",
          text: "Fachkräftemangel ist in Österreich kein abstraktes Problem mehr, sondern eine tägliche Rechnung: unbesetzte Schichten in der Pflege, Fahrer-Engpässe in der Logistik, Saisonlücken in Gastronomie und Hotellerie. Und während Unternehmen um dieselben Kandidaten konkurrieren, entscheidet immer öfter nicht das bessere Angebot — sondern wer zuerst antwortet.",
        },
        {
          type: "h2",
          text: "Der Fachkräftemangel trifft Österreich hart — und Zeit ist der Engpass",
        },
        {
          type: "p",
          text: "60 % der Quick-Apply-Bewerber ghosten den Recruiting-Prozess, wenn nicht innerhalb eines Tages Kontakt aufgenommen wird. Auf der Karriereseite steht die Bewerbung, im ATS eine tote Zeile — der Kandidat hat längst bei der Konkurrenz unterschrieben. Für Branchen mit hohem Bewerbervolumen und chronischem Personalmangel ist das kein Rand-, sondern ein Kernproblem.",
        },
        {
          type: "h2",
          text: "Was \"KI Recruiting Software\" 2026 eigentlich bedeutet",
        },
        {
          type: "p",
          text: "Der Begriff wird oft für ganz unterschiedliche Dinge verwendet — vom simplen Bewerber-Tracking-System bis zum CV-Parser. Der eigentliche Hebel liegt aber woanders: in der Zeit zwischen Bewerbungseingang und erstem echten Gespräch. Ein KI-Voice-Agent führt dieses erste Screening-Gespräch automatisch, in natürlicher Sprache, direkt nach der Bewerbung — nicht Tage später, wenn der Kandidat längst weitergezogen ist.",
        },
        {
          type: "h2",
          text: "So funktioniert ein KI-Screening-Call in der Praxis",
        },
        {
          type: "ul",
          items: [
            "Quick-Apply-Funnel: 3-4 Fragen (Rolle, Verfügbarkeit, Region), Telefonnummer, Consent — kein LinkedIn-Login, kein CV-Upload-Zwang.",
            "KI-Screening-Call: Innerhalb von Minuten klingelt das Telefon. Discovery-Fragen zu Verfügbarkeit, Erfahrung und Deal-Breakern, in der Stimme und mit den Kriterien des Unternehmens.",
            "Score + Zusammenfassung ins ATS: Recruiter bekommen Ranking, Transkript und Audio-Recording — Rein-oder-raus-Entscheidung in 30 Sekunden statt einem 20-minütigen Telefonat.",
          ],
        },
        {
          type: "p",
          text: "70 % der klassischen Erstgespräche bestehen aus Standardfragen: Passt der Führerschein? Ab wann verfügbar? Schichtbereitschaft? Genau diese Fragen übernimmt die KI — und gibt Recruitern die Zeit zurück für die Gespräche, die wirklich Urteilsvermögen brauchen.",
        },
        {
          type: "h2",
          text: "Warum der Standort der KI-Infrastruktur zählt",
        },
        {
          type: "p",
          text: "Für den österreichischen und breiteren DACH-Markt ist DSGVO-Konformität keine Nebensache. Entscheidend ist, wo die KI tatsächlich rechnet und wo Sprachaufnahmen gespeichert werden — nicht nur, was im Impressum steht. EU-Region-Verarbeitung (etwa Azure Sweden Central für die KI-Inferenz, Frankfurt für Voice-Storage), eine klare Zwei-Stufen-Consent-Kette im Bewerbungsfunnel und Löschung binnen 30 Tagen nach Anfrage sind die Kriterien, an denen sich seriöse Anbieter messen lassen sollten.",
        },
        {
          type: "h2",
          text: "Für welche Branchen sich das in Österreich besonders lohnt",
        },
        {
          type: "ul",
          items: [
            "Logistik & Transport — Fahrer-Mangel, hoher Turnover",
            "Gastronomie & Hotellerie — saisonale Peaks kombiniert mit Ghosting",
            "Pflege & Gesundheit — akute Engpässe, hohe Compliance-Anforderungen",
            "Call Center / BPO — hohes Bewerbervolumen, niedrige Show-up-Rate",
            "Einzelhandel — Verkäufer-Mangel unter Filial-Zeitdruck",
            "Recruiting-Agenturen — mehrere Mandate parallel, wenig Zeit pro Bewerber",
          ],
        },
        {
          type: "p",
          text: "Der gemeinsame Nenner: hohes Bewerbervolumen trifft auf zu wenig Recruiter-Kapazität. Genau dort verschiebt ein automatisiertes Erstscreening die Zeit von der Bewerbung bis zum ersten Kontakt von Tagen auf Minuten.",
        },
      ],
    },
    en: {
      title: "AI Recruiting Software in Austria: What Actually Makes the Difference in 2026",
      metaDescription:
        "AI recruiting software in Austria: how AI screening calls cut time-to-hire from days to minutes — GDPR-compliant, EU region.",
      excerpt:
        "The skilled-labor shortage is hitting Austria especially hard in logistics, care, and hospitality. Why time-to-hire is the real bottleneck today — and how AI screening calls solve it.",
      keywords: ["AI recruiting software Austria", "AI recruiting", "time-to-hire", "recruiting software Austria"],
      heroEyebrow: "Recruiting · Austria",
      ctaLabel: "See the recruiting setup →",
      ctaHeadline: "30-min demo — your role, your screening script",
      ctaSub:
        "Bring your hardest skill test. We build a live screening prompt together and let it call you.",
      body: [
        {
          type: "p",
          text: "The skilled-labor shortage is no longer an abstract problem in Austria — it's a daily bill: unfilled shifts in care, driver shortages in logistics, seasonal gaps in hospitality and hotels. And while companies compete for the same candidates, it's increasingly not the better offer that wins — it's whoever responds first.",
        },
        {
          type: "h2",
          text: "The labor shortage is hitting Austria hard — and time is the bottleneck",
        },
        {
          type: "p",
          text: "60% of Quick-Apply candidates ghost the recruiting process if there's no contact within a day. On the careers page: an application. In the ATS: a dead row — the candidate has long since signed with a competitor. For industries with high applicant volume and chronic staff shortages, this isn't a side issue, it's the core problem.",
        },
        {
          type: "h2",
          text: "What \"AI recruiting software\" actually means in 2026",
        },
        {
          type: "p",
          text: "The term gets used for wildly different things — from simple applicant-tracking systems to CV parsers. But the real lever sits elsewhere: in the time between application and first real conversation. An AI voice agent runs that first screening conversation automatically, in natural language, right after the application — not days later, once the candidate has already moved on.",
        },
        {
          type: "h2",
          text: "How an AI screening call works in practice",
        },
        {
          type: "ul",
          items: [
            "Quick-Apply funnel: 3-4 questions (role, availability, region), phone number, consent — no LinkedIn login, no forced CV upload.",
            "AI screening call: the phone rings within minutes. Discovery questions on availability, experience, and deal-breakers, in the company's voice and with its criteria.",
            "Score + summary into the ATS: recruiters get a ranking, transcript, and audio recording — a yes-or-no decision in 30 seconds instead of a 20-minute phone call.",
          ],
        },
        {
          type: "p",
          text: "70% of classic first-round conversations are standard questions: right license? Available from when? Willing to work shifts? The AI takes over exactly these questions — and gives recruiters back time for the conversations that actually require judgment.",
        },
        {
          type: "h2",
          text: "Why the location of the AI infrastructure matters",
        },
        {
          type: "p",
          text: "For the Austrian and wider DACH market, GDPR compliance isn't a footnote. What matters is where the AI actually computes and where voice recordings are stored — not just what the imprint says. EU-region processing (e.g. Azure Sweden Central for AI inference, Frankfurt for voice storage), a clear two-step consent chain in the application funnel, and deletion within 30 days of request are the criteria serious providers should be measured against.",
        },
        {
          type: "h2",
          text: "Which industries in Austria benefit the most",
        },
        {
          type: "ul",
          items: [
            "Logistics & transport — driver shortage, high turnover",
            "Hospitality & hotels — seasonal peaks combined with ghosting",
            "Care & health — acute shortages, heavy compliance requirements",
            "Call centers / BPO — high applicant volume, low show-up rate",
            "Retail — sales-associate shortage under store-level time pressure",
            "Recruitment agencies — multiple mandates in parallel, little time per candidate",
          ],
        },
        {
          type: "p",
          text: "The common denominator: high applicant volume meets too little recruiter capacity. That's exactly where automated first-round screening shifts the time from application to first contact — from days to minutes.",
        },
      ],
    },
  },
  {
    slug: "speed-to-lead-vertrieb",
    publishedAt: "2026-07-20",
    accentColor: "#1A3A6E",
    ctaHref: "/sales",
    de: {
      title: "Speed-to-Lead im Vertrieb: Warum die ersten 30 Sekunden über den Deal entscheiden",
      metaDescription:
        "Speed-to-Lead im Vertrieb: Warum Reaktionszeit die #1-Kennzahl ist und wie KI-Voice-Agents Leads in 30 Sekunden statt 24 Stunden zurückrufen.",
      excerpt:
        "Bei einer Kontaktaufnahme innerhalb der ersten 5 Minuten ist die Qualifikationsrate 21× höher als nach 30 Minuten. Warum Speed-to-Lead über den Deal entscheidet — und wie man es automatisiert.",
      keywords: ["Speed-to-Lead Vertrieb", "Speed to Lead", "Lead-Reaktionszeit", "KI Anruf Vertrieb"],
      heroEyebrow: "Vertrieb · Lead-Reaktionszeit",
      ctaLabel: "Sales-Setup ansehen →",
      ctaHeadline: "Zeig mir deinen Case in 30 Minuten",
      ctaSub:
        "Live-Setup, echte Nummer, echte Anrufe. Am Ende des Calls hast du entweder eine Demo-Nummer die klingelt — oder du weißt exakt was fehlt.",
      body: [
        {
          type: "p",
          text: "Vertriebsleiter optimieren Landingpages, A/B-testen Anzeigentexte und verhandeln CRM-Lizenzen — und übersehen dabei oft die eine Kennzahl, die stärker mit Abschlussrate korreliert als fast alles andere: wie schnell ein neuer Lead das erste Mal kontaktiert wird.",
        },
        {
          type: "h2",
          text: "Die Zahl, die jeder Vertriebsleiter kennen sollte",
        },
        {
          type: "quote",
          text: "Bei einer Kontaktaufnahme innerhalb der ersten 5 Minuten ist die Qualifikationsrate 21× höher als nach 30 Minuten.",
          cite: "Harvard Business Review",
        },
        {
          type: "p",
          text: "Nach 5 Minuten sind Leads bereits um rund 80 % kälter. Nach 24 Stunden ist ein Formular-Lead in den meisten Branchen praktisch tot — nicht weil das Interesse verschwunden ist, sondern weil der Interessent inzwischen mit drei Wettbewerbern gesprochen hat.",
        },
        {
          type: "h2",
          text: "Was \"Speed-to-Lead\" konkret bedeutet",
        },
        {
          type: "p",
          text: "Speed-to-Lead misst die Zeit vom Formular-Absenden bis zum ersten echten Kontaktversuch — nicht bis zur automatischen Bestätigungs-E-Mail. Die meisten Teams glauben, sie reagieren schnell, weil ihr CRM sofort eine Aufgabe erstellt. Das Problem: Zwischen Aufgabe und tatsächlichem Anruf liegen in der Praxis oft Stunden, weil SDRs Listen abarbeiten statt Leads in Echtzeit zu bedienen.",
        },
        {
          type: "h2",
          text: "Warum klassische Prozesse hier verlieren",
        },
        {
          type: "ul",
          items: [
            "Leads werden nach 5 Minuten 80 % kälter — jede Minute Verzögerung kostet messbar Conversion.",
            "Werbebudget versickert im Timing-Loch: Wer 50-200 € pro qualifiziertem Lead zahlt, aber erst am Montag anruft, finanziert oft den Deal des Wettbewerbers, der am Sonntagabend schon reagiert hat.",
            "Sales-Teams ertrinken in Dead-Leads: Rund 40 % der Formularausfüller haben keine echte Kaufabsicht. SDR-Zeit für Falschnummern fehlt bei den Leads, die wirklich reif sind.",
          ],
        },
        {
          type: "h2",
          text: "Wie ein KI-Voice-Agent Speed-to-Lead auf 30 Sekunden bringt",
        },
        {
          type: "ul",
          items: [
            "Lead trägt sich ein — Landing-Page, Meta-Ad-Formular oder LinkedIn-Retargeting, egal welcher Kanal. Sobald das Formular abgeschickt ist, feuert der Webhook.",
            "KI ruft binnen 30 Sekunden an — mit der gewünschten Stimme und dem hinterlegten Pitch, führt Discovery-Fragen und qualifiziert Budget, Entscheidungsbefugnis, Bedarf und Timing.",
            "Termin landet direkt im CRM — bei Qualifikation bucht die KI den Slot im Kalender, Zusammenfassung und Recording werden an HubSpot, Pipedrive oder Salesforce übergeben.",
          ],
        },
        {
          type: "p",
          text: "Der entscheidende Unterschied: Das funktioniert vollautomatisch, auch nachts, auch am Sonntag — genau dann, wenn menschliche Vertriebsteams schlafen und Wettbewerber es nicht tun.",
        },
        {
          type: "h2",
          text: "Für wen sich das rechnet",
        },
        {
          type: "ul",
          items: [
            "Werbeagenturen mit Retainer-Kunden, die schnellere Ergebnisse erwarten",
            "Kanzleien & Berater, bei denen das Erstgespräch der Engpass ist",
            "SaaS mit High-Touch-Sales und teurem, langsamem SDR-Team",
            "Finanzdienstleister, bei denen Compliance die Zykluszeit verlangsamt",
            "Immobilienmakler, deren Interessenten parallel fünf Objekte im Blick haben",
            "Coaching / High-Ticket-Anbieter, bei denen warme Leads besonders schnell kalt werden",
          ],
        },
      ],
    },
    en: {
      title: "Speed-to-Lead in Sales: Why the First 30 Seconds Decide the Deal",
      metaDescription:
        "Speed-to-Lead in sales: why response time is the #1 metric and how AI voice agents call leads back in 30 seconds instead of 24 hours.",
      excerpt:
        "Contacting a lead within the first 5 minutes makes the qualification rate 21× higher than after 30 minutes. Why speed-to-lead decides the deal — and how to automate it.",
      keywords: ["speed-to-lead sales", "speed to lead", "lead response time", "AI call sales"],
      heroEyebrow: "Sales · Lead response time",
      ctaLabel: "See the sales setup →",
      ctaHeadline: "Show me your case in 30 minutes",
      ctaSub:
        "Live setup, real number, real calls. By the end of the call you either have a demo number that rings — or you know exactly what's missing.",
      body: [
        {
          type: "p",
          text: "Sales leaders optimize landing pages, A/B-test ad copy, and negotiate CRM licenses — and often overlook the one metric that correlates with close rate more strongly than almost anything else: how fast a new lead gets contacted the first time.",
        },
        {
          type: "h2",
          text: "The number every sales leader should know",
        },
        {
          type: "quote",
          text: "Qualification rate is 21× higher when contact happens within the first 5 minutes compared to 30 minutes.",
          cite: "Harvard Business Review",
        },
        {
          type: "p",
          text: "After 5 minutes, leads are already roughly 80% colder. After 24 hours, a form lead is practically dead in most industries — not because the interest disappeared, but because the prospect has since talked to three competitors.",
        },
        {
          type: "h2",
          text: "What \"speed-to-lead\" actually means",
        },
        {
          type: "p",
          text: "Speed-to-lead measures the time from form submission to the first real contact attempt — not to the automatic confirmation email. Most teams believe they respond fast because their CRM creates a task instantly. The problem: between task and actual call there are often hours in practice, because SDRs work through lists instead of serving leads in real time.",
        },
        {
          type: "h2",
          text: "Why classic processes lose here",
        },
        {
          type: "ul",
          items: [
            "Leads go 80% colder after 5 minutes — every minute of delay costs measurable conversion.",
            "Ad spend leaks through the timing gap: if you pay 50-200 EUR per qualified lead but only call on Monday, you're often financing the deal of the competitor who already reached out Sunday evening.",
            "Sales teams drown in dead leads: around 40% of form submitters have no real purchase intent. SDR time spent on wrong numbers is time missing from the leads that are actually ready.",
          ],
        },
        {
          type: "h2",
          text: "How an AI voice agent brings speed-to-lead down to 30 seconds",
        },
        {
          type: "ul",
          items: [
            "Lead signs up — landing page, Meta ad form, or LinkedIn retargeting, doesn't matter which channel. As soon as the form is submitted, the webhook fires.",
            "AI calls within 30 seconds — in the chosen voice with the stored pitch, runs discovery questions, and qualifies budget, authority, need, and timing.",
            "Meeting lands directly in the CRM — if qualified, the AI books the calendar slot; summary and recording get handed to HubSpot, Pipedrive, or Salesforce.",
          ],
        },
        {
          type: "p",
          text: "The decisive difference: this runs fully automated, at night, on Sundays too — exactly when human sales teams are asleep and competitors aren't.",
        },
        {
          type: "h2",
          text: "Who this pays off for",
        },
        {
          type: "ul",
          items: [
            "Ad agencies with retainer clients that expect faster results",
            "Law firms & consultants where the first meeting is the bottleneck",
            "High-touch SaaS with an expensive, slow SDR team",
            "Financial services where compliance slows the cycle time",
            "Real estate agents whose prospects are eyeing five properties in parallel",
            "Coaching / high-ticket providers where warm leads go cold especially fast",
          ],
        },
      ],
    },
  },
  {
    slug: "ki-wissensmanagement-rag-graphrag",
    publishedAt: "2026-07-20",
    accentColor: "#4F46E5",
    ctaHref: "/wissen",
    de: {
      title: "KI-Wissensmanagement mit RAG und GraphRAG: So findet Ihr Team jede Information in Sekunden",
      metaDescription:
        "KI-Wissensmanagement mit RAG und GraphRAG erklärt: Wie HR-Berater, Interim-Agenturen und KMUs Profile und Dokumente in Sekunden statt Stunden finden.",
      excerpt:
        "Volltextsuche findet nur Wörter, keine Bedeutung. RAG und GraphRAG verstehen Kontext und Beziehungen zwischen euren Daten — hier der Unterschied, einfach erklärt.",
      keywords: ["KI Wissensmanagement", "RAG", "GraphRAG", "Wissensmanagement Software"],
      heroEyebrow: "Wissensmanagement · RAG & GraphRAG",
      ctaLabel: "Wissensmanagement ansehen →",
      ctaHeadline: "Zeig mir deine unauffindbaren Dokumente",
      ctaSub:
        "Bring 2-3 Beispiele mit, die heute schwer zu finden sind. Wir zeigen dir live, wie schnell die Antwort mit KI-Wissensmanagement da ist.",
      body: [
        {
          type: "p",
          text: "Die meisten Unternehmen haben kein Wissensproblem — sie haben ein Auffindbarkeits-Problem. Die Antwort liegt fast immer schon irgendwo in den eigenen Daten: in einem CV, einem alten Angebot, einem Protokoll, einer E-Mail von vor zwei Jahren. Das Problem ist, sie wiederzufinden, ohne zu wissen, wie die Datei heißt oder wo sie liegt.",
        },
        {
          type: "h2",
          text: "Das Problem ist nicht zu wenig Wissen — sondern zu viel verstreutes Wissen",
        },
        {
          type: "ul",
          items: [
            "Volltextsuche versteht keine Sprache: Wer nach \"erfahrene Pflegekraft mit Nachtschicht-Erfahrung\" sucht, bekommt 40 Treffer für \"Pflege\" — sortiert nach Upload-Datum, nicht nach Relevanz.",
            "Wissen liegt verstreut in zehn Systemen: CVs im ATS, Verträge im Drive, Protokolle in E-Mails, Notizen in Slack. Niemand hat den vollständigen Überblick.",
            "Zusammenhänge gehen verloren: Welches Profil passt zu welchem früheren Mandat? Welcher Kunde hängt mit welchem Projekt zusammen? Klassische Suche kennt Wörter, keine Beziehungen.",
          ],
        },
        {
          type: "h2",
          text: "Was RAG und GraphRAG unterscheidet",
        },
        {
          type: "p",
          text: "RAG (Retrieval-Augmented Generation) sucht bei jeder Frage zunächst die tatsächlich relevanten Dokumente aus dem gesamten Bestand — basierend auf Bedeutung, nicht auf exakten Keyword-Treffern — und lässt eine KI daraus eine konkrete Antwort formulieren, inklusive Quellenangabe. Statt einer Trefferliste zum Selbst-Durchsuchen bekommt man eine direkte Antwort.",
        },
        {
          type: "p",
          text: "GraphRAG geht einen Schritt weiter: Zusätzlich zur reinen Textsuche wird ein Beziehungsgraph aus den Daten aufgebaut — wer mit wem, welches Profil zu welchem Mandat, welcher Kunde zu welchem Projekt gehört. Dadurch beantwortet das System auch Fragen, deren Antwort über mehrere Dokumente verteilt ist und nie wörtlich nebeneinander stand.",
        },
        {
          type: "h2",
          text: "Was sich für dein Team konkret ändert",
        },
        {
          type: "ul",
          items: [
            "Versteht Bedeutung, nicht nur Wörter — \"erfahrene Pflegekraft\" findet auch Profile mit \"10 Jahre Krankenhaus, Nachtdienst\" im Lebenslauf.",
            "Erkennt Zusammenhänge über Dokumente hinweg — verknüpft Personen, Projekte, Firmen und Themen automatisch, auch ohne gemeinsames Dokument.",
            "Bleibt immer aktuell — jedes neue Dokument wird sofort eingeordnet, ohne manuelle Pflege oder Ordnerstruktur-Disziplin.",
            "Antwortet, statt nur zu verlinken — eine konkrete Antwort mit Quellenangabe statt einer Liste von 50 Treffern.",
          ],
        },
        {
          type: "h2",
          text: "Für wen KI-Wissensmanagement besonders wertvoll ist",
        },
        {
          type: "ul",
          items: [
            "HR-Berater & Personalvermittler — finden in Sekunden das passende Kandidatenprofil aus tausenden CVs, auch wenn die Anforderung nirgends wörtlich vorkommt.",
            "Interim-Agenturen — matchen Mandate mit den passenden Interim-Managern aus dem gesamten Netzwerk, inklusive Branchenerfahrung aus früheren Projekten.",
            "KMU & Mittelstand — finden Verträge, Angebote und Rapporte sofort wieder, ganz ohne dass noch jemand weiß, wie die Datei damals benannt wurde.",
          ],
        },
        {
          type: "p",
          text: "Ab etwa fünf Mitarbeitenden mit wachsendem Dokumenten-Chaos in Google Drive, SharePoint, E-Mail, ATS oder CRM zahlt sich der Aufbau eines KI-Wissensmanagements typischerweise aus — unabhängig davon, wo das Wissen heute konkret liegt.",
        },
      ],
    },
    en: {
      title: "AI Knowledge Management with RAG and GraphRAG: How Your Team Finds Any Information in Seconds",
      metaDescription:
        "AI knowledge management with RAG and GraphRAG explained: how HR consultants, interim agencies, and SMBs find profiles and documents in seconds instead of hours.",
      excerpt:
        "Full-text search only finds words, not meaning. RAG and GraphRAG understand context and relationships across your data — here's the difference, explained simply.",
      keywords: ["AI knowledge management", "RAG", "GraphRAG", "knowledge management software"],
      heroEyebrow: "Knowledge management · RAG & GraphRAG",
      ctaLabel: "See knowledge management →",
      ctaHeadline: "Show me your unfindable documents",
      ctaSub:
        "Bring 2-3 examples that are hard to find today. We'll show you live how fast the answer arrives with AI knowledge management.",
      body: [
        {
          type: "p",
          text: "Most companies don't have a knowledge problem — they have a findability problem. The answer almost always already sits somewhere in their own data: in a CV, an old quote, a meeting note, an email from two years ago. The problem is finding it again without knowing what the file is called or where it lives.",
        },
        {
          type: "h2",
          text: "The problem isn't too little knowledge — it's too much scattered knowledge",
        },
        {
          type: "ul",
          items: [
            "Full-text search doesn't understand language: search for \"experienced caregiver with night-shift experience\" and you get 40 hits for \"care\" — sorted by upload date, not relevance.",
            "Knowledge is scattered across ten systems: CVs in the ATS, contracts in Drive, notes in emails, memos in Slack. Nobody has the full picture.",
            "Connections get lost: which profile fits which past mandate? Which customer connects to which project? Classic search knows words, not relationships.",
          ],
        },
        {
          type: "h2",
          text: "What sets RAG and GraphRAG apart",
        },
        {
          type: "p",
          text: "RAG (Retrieval-Augmented Generation) first retrieves the genuinely relevant documents from the entire corpus for each question — based on meaning, not exact keyword matches — and has an AI turn them into a concrete answer, including sources. Instead of a results list to sift through yourself, you get a direct answer.",
        },
        {
          type: "p",
          text: "GraphRAG goes a step further: alongside pure text search, it builds a relationship graph from the data — who works with whom, which profile fits which mandate, which customer belongs to which project. That lets the system answer questions whose answer is spread across multiple documents and never appeared side by side verbatim.",
        },
        {
          type: "h2",
          text: "What actually changes for your team",
        },
        {
          type: "ul",
          items: [
            "Understands meaning, not just words — \"experienced caregiver\" also finds profiles with \"10 years hospital, night shift\" in the CV.",
            "Spots connections across documents — links people, projects, companies, and topics automatically, even without a shared document.",
            "Always stays current — every new document is indexed instantly, no manual upkeep or folder-structure discipline required.",
            "Answers, instead of just linking — a concrete answer with a source instead of a list of 50 results.",
          ],
        },
        {
          type: "h2",
          text: "Who AI knowledge management is especially valuable for",
        },
        {
          type: "ul",
          items: [
            "HR consultants & recruiters — find the right candidate profile out of thousands of CVs in seconds, even if the requirement never appears verbatim.",
            "Interim agencies — match mandates to the right interim managers across the whole network, including industry experience from past projects.",
            "SMBs & mid-market — find contracts, quotes, and reports instantly again, without anyone still knowing what the file was named back then.",
          ],
        },
        {
          type: "p",
          text: "From around five employees onward with growing document chaos in Google Drive, SharePoint, email, ATS, or CRM, building AI knowledge management typically pays off — regardless of where the knowledge concretely lives today.",
        },
      ],
    },
  },
  {
    slug: "ki-loesungen-fuer-kmus",
    publishedAt: "2026-07-20",
    accentColor: "#B45309",
    ctaHref: "/kmu",
    de: {
      title: "KI-Lösungen für KMUs: 21 Bausteine, die euch die Bürokratie abnehmen",
      metaDescription:
        "KI-Lösungen für KMUs im Überblick: 21 einzeln einsetzbare Bausteine für Anfragen, Angebote, Rapporte und Mahnwesen — Pilot live in 5-10 Tagen.",
      excerpt:
        "Nicht als große Suite, sondern als 21 einzeln einsetzbare Bausteine: Wie KMUs mit Voice- und KI-Automatisierung Anfragen, Angebote und Mahnwesen abgeben.",
      keywords: ["KI Lösungen für KMUs", "KI für kleine und mittlere Unternehmen", "KMU Automatisierung"],
      heroEyebrow: "KMU · Automatisierung",
      ctaLabel: "Alle 21 Bausteine ansehen →",
      ctaHeadline: "Zeig mir 3 deiner größten Zeitfresser in 30 Minuten",
      ctaSub:
        "Wir schauen gemeinsam, welche 1-2 Bausteine bei dir zuerst weh tun. Pilot live in 5-10 Tagen — bezahlt wird nur, wenn er funktioniert.",
      body: [
        {
          type: "p",
          text: "Der Betrieb läuft. Das Handwerk, die Beratung, der Verkauf funktionieren. Was KMUs Zeit, Geld und Nerven kostet, ist fast nie das Kerngeschäft — sondern alles drumherum: Angebote aus Fotos und Sprachmemos zusammenbauen, Material nachbestellen, Rapporte tippen, Mahnungen verschicken.",
        },
        {
          type: "h2",
          text: "Die zehn ungelösten Zeitfresser",
        },
        {
          type: "ul",
          items: [
            "Kundenanfragen, die nicht beantwortet werden",
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
        {
          type: "h2",
          text: "Warum \"eine KI-Suite\" der falsche Ansatz ist",
        },
        {
          type: "p",
          text: "Die meisten KI-Angebote am Markt verkaufen ein großes Gesamtpaket — Monate an Implementierung, ein Tool für alles, Umstellung des kompletten Prozesses auf einmal. Für KMUs mit knappen Ressourcen ist das der falsche Einstieg. Sinnvoller: 21 einzeln einsetzbare Bausteine, aus denen man den einen aussucht, der aktuell am meisten wehtut — und ihn in 3 bis 14 Tagen live schaltet, bevor man über den nächsten nachdenkt.",
        },
        {
          type: "h2",
          text: "Drei Bausteine, die typischerweise sofort Wirkung zeigen",
        },
        {
          type: "h3",
          text: "1. Kundenanfragen, die niemand abnimmt",
        },
        {
          type: "p",
          text: "Eine KI übernimmt Anrufe, die sonst unbeantwortet bleiben, sammelt die Projekt-Infos vom Kunden und schlägt automatisch Termine vor. Kein Lead geht mehr verloren, die Reaktionszeit sinkt von Tagen auf Minuten.",
        },
        {
          type: "h3",
          text: "2. Angebotserstellung aus der Baustellenbesichtigung",
        },
        {
          type: "p",
          text: "Mitarbeiter sprechen die Besichtigung als Sprachmemo — die KI schreibt daraus einen Angebotsentwurf inklusive Leistungsbeschreibung. Der Sachbearbeiter prüft nur noch die finale Version, statt sie von Grund auf zu tippen.",
        },
        {
          type: "h3",
          text: "3. Mahnwesen ohne Cashflow-Löcher",
        },
        {
          type: "p",
          text: "Offene Rechnungen werden automatisch überwacht, Zahlungsüberschreitungen erkannt und der Mahnprozess ausgelöst. Ein KI-Anruf erinnert Kunden telefonisch und freundlich an offene Posten, bevor daraus ein echtes Liquiditätsproblem wird.",
        },
        {
          type: "p",
          text: "Alle Bausteine laufen auf derselben Basis: Voice-Agent (Vapi) für Telefon und Sprache, Claude für Textverständnis und -erstellung, n8n für die Prozess-Orchestrierung, Supabase als zentrale, revisionssichere Datenbasis.",
        },
        {
          type: "h2",
          text: "So läuft ein Pilot ab",
        },
        {
          type: "p",
          text: "Der Einstieg beginnt nicht mit einer Bedarfsanalyse über mehrere Wochen, sondern mit einem konkreten Gespräch: Welche 1-2 Bausteine tun aktuell am meisten weh? Der Pilot ist danach in 5-10 Tagen live — bezahlt wird erst, wenn er tatsächlich funktioniert.",
        },
      ],
    },
    en: {
      title: "AI Solutions for SMBs: 21 Building Blocks That Take the Paperwork Off Your Hands",
      metaDescription:
        "AI solutions for SMBs at a glance: 21 individually deployable building blocks for inquiries, quotes, field reports, and dunning — pilot live in 5-10 days.",
      excerpt:
        "Not a big suite, but 21 individually deployable building blocks: how SMBs offload inquiries, quotes, and dunning with voice and AI automation.",
      keywords: ["AI solutions for SMBs", "AI for small and medium businesses", "SMB automation"],
      heroEyebrow: "SMB · Automation",
      ctaLabel: "See all 21 building blocks →",
      ctaHeadline: "Show me 3 of your biggest time sinks in 30 minutes",
      ctaSub:
        "We'll look together at which 1-2 building blocks hurt most for you right now. Pilot live in 5-10 days — you only pay if it works.",
      body: [
        {
          type: "p",
          text: "The business runs. The trade, the consulting, the sales all work. What costs SMBs time, money, and nerves is almost never the core business — it's everything around it: assembling quotes from photos and voice memos, reordering material, typing up reports, sending dunning letters.",
        },
        {
          type: "h2",
          text: "The ten unsolved time sinks",
        },
        {
          type: "ul",
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
        {
          type: "h2",
          text: "Why \"one AI suite\" is the wrong approach",
        },
        {
          type: "p",
          text: "Most AI offerings on the market sell one big overall package — months of implementation, one tool for everything, overhauling the entire process at once. For SMBs with limited resources, that's the wrong way in. The better approach: 21 individually deployable building blocks, where you pick the one that hurts most right now — and put it live in 3 to 14 days, before even thinking about the next one.",
        },
        {
          type: "h2",
          text: "Three building blocks that typically show impact immediately",
        },
        {
          type: "h3",
          text: "1. Customer inquiries nobody picks up",
        },
        {
          type: "p",
          text: "An AI takes calls that would otherwise go unanswered, gathers project info from the customer, and automatically proposes appointments. No lead gets lost anymore, response time drops from days to minutes.",
        },
        {
          type: "h3",
          text: "2. Quote creation from the site visit",
        },
        {
          type: "p",
          text: "Staff speak the site visit into a voice memo — the AI turns it into a draft quote including scope of work. The office only needs to review the final version instead of typing it from scratch.",
        },
        {
          type: "h3",
          text: "3. Dunning without cash-flow gaps",
        },
        {
          type: "p",
          text: "Open invoices are monitored automatically, overdue payments detected, and the dunning process triggered. An AI call gives customers a friendly phone reminder about outstanding items before it turns into a real liquidity problem.",
        },
        {
          type: "p",
          text: "All building blocks run on the same foundation: a voice agent (Vapi) for phone and speech, Claude for text understanding and generation, n8n for process orchestration, Supabase as the central, audit-proof data layer.",
        },
        {
          type: "h2",
          text: "How a pilot runs",
        },
        {
          type: "p",
          text: "The starting point isn't a multi-week needs assessment — it's one concrete conversation: which 1-2 building blocks hurt most right now? The pilot is live 5-10 days later — you only pay once it actually works.",
        },
      ],
    },
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogContent(post: BlogPost, lang: Lang): BlogContent {
  return post[lang];
}
