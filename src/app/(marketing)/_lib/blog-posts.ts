// Blog-Content-Dictionary. Ein Post = ein Objekt mit typisiertem Content-
// Block-Array (gleiches Idiom wie funnel_pages.blocks in der DB, siehe
// [slug]/funnel-player.tsx) statt Markdown/MDX — kein neuer Dependency,
// volle Kontrolle über semantisches HTML (h2/h3-Hierarchie zählt für SEO).
//
// Pilot: 4 Artikel, DE-only (analog zu /kmu und /wissen — EN ist Backlog).
// Jeder Artikel zielt auf ein Long-Tail-Keyword und verlinkt intern auf die
// passende Pillar-Page (Topical-Authority-Aufbau: Blog → Produktseite).

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string; cite?: string };

export type BlogPost = {
  slug: string;
  title: string;
  metaDescription: string;
  excerpt: string;
  publishedAt: string;
  keywords: string[];
  accentColor: string;
  heroEyebrow: string;
  ctaHref: string;
  ctaLabel: string;
  ctaHeadline: string;
  ctaSub: string;
  body: BlogBlock[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "ki-recruiting-software-oesterreich",
    title: "KI Recruiting Software in Österreich: Was 2026 wirklich den Unterschied macht",
    metaDescription:
      "KI Recruiting Software in Österreich: Wie KI-Screening-Calls Time-to-Hire von Tagen auf Minuten senken — DSGVO-konform, EU-Region.",
    excerpt:
      "Fachkräftemangel trifft Österreich in Logistik, Pflege und Gastronomie besonders hart. Warum Time-to-Hire heute der Engpass ist — und wie KI-Screening-Calls ihn auflösen.",
    publishedAt: "2026-07-20",
    keywords: ["KI Recruiting Software Österreich", "KI Recruiting", "Time-to-Hire", "Recruiting Software Österreich"],
    accentColor: "#0E7C66",
    heroEyebrow: "Recruiting · Österreich",
    ctaHref: "/recruiting",
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
  {
    slug: "speed-to-lead-vertrieb",
    title: "Speed-to-Lead im Vertrieb: Warum die ersten 30 Sekunden über den Deal entscheiden",
    metaDescription:
      "Speed-to-Lead im Vertrieb: Warum Reaktionszeit die #1-Kennzahl ist und wie KI-Voice-Agents Leads in 30 Sekunden statt 24 Stunden zurückrufen.",
    excerpt:
      "Bei einer Kontaktaufnahme innerhalb der ersten 5 Minuten ist die Qualifikationsrate 21× höher als nach 30 Minuten. Warum Speed-to-Lead über den Deal entscheidet — und wie man es automatisiert.",
    publishedAt: "2026-07-20",
    keywords: ["Speed-to-Lead Vertrieb", "Speed to Lead", "Lead-Reaktionszeit", "KI Anruf Vertrieb"],
    accentColor: "#1A3A6E",
    heroEyebrow: "Vertrieb · Lead-Reaktionszeit",
    ctaHref: "/sales",
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
  {
    slug: "ki-wissensmanagement-rag-graphrag",
    title: "KI-Wissensmanagement mit RAG und GraphRAG: So findet Ihr Team jede Information in Sekunden",
    metaDescription:
      "KI-Wissensmanagement mit RAG und GraphRAG erklärt: Wie HR-Berater, Interim-Agenturen und KMUs Profile und Dokumente in Sekunden statt Stunden finden.",
    excerpt:
      "Volltextsuche findet nur Wörter, keine Bedeutung. RAG und GraphRAG verstehen Kontext und Beziehungen zwischen euren Daten — hier der Unterschied, einfach erklärt.",
    publishedAt: "2026-07-20",
    keywords: ["KI Wissensmanagement", "RAG", "GraphRAG", "Wissensmanagement Software"],
    accentColor: "#4F46E5",
    heroEyebrow: "Wissensmanagement · RAG & GraphRAG",
    ctaHref: "/wissen",
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
  {
    slug: "ki-loesungen-fuer-kmus",
    title: "KI-Lösungen für KMUs: 21 Bausteine, die euch die Bürokratie abnehmen",
    metaDescription:
      "KI-Lösungen für KMUs im Überblick: 21 einzeln einsetzbare Bausteine für Anfragen, Angebote, Rapporte und Mahnwesen — Pilot live in 5-10 Tagen.",
    excerpt:
      "Nicht als große Suite, sondern als 21 einzeln einsetzbare Bausteine: Wie KMUs mit Voice- und KI-Automatisierung Anfragen, Angebote und Mahnwesen abgeben.",
    publishedAt: "2026-07-20",
    keywords: ["KI Lösungen für KMUs", "KI für kleine und mittlere Unternehmen", "KMU Automatisierung"],
    accentColor: "#B45309",
    heroEyebrow: "KMU · Automatisierung",
    ctaHref: "/kmu",
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
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
