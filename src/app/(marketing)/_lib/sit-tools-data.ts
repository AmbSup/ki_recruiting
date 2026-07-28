// Inhalte für das "5 Werkzeuge für systematisch innovatives Denken"-Tool
// (Systematic Inventive Thinking). Getrennt von dict.ts, weil die Struktur
// (Felder pro Werkzeug, Beispiel-Zeilen) nicht ins flache t()-Key-Schema
// passt — SitTool liest hier direkt statt über t().
//
// Produkt + Komponenten werden EINMAL oben eingegeben (nicht mehr pro
// Werkzeug) und für alle 5 Generierungen als Kontext mitgeschickt. Jedes
// Tool-Objekt listet daher nur noch seine eigenen KI-Output-Felder (z.B.
// "welche Komponente streichst du") — alles davon ist KI-generiert, nichts
// manuell vorausgefüllt.

export type Lang = "de" | "en";

export type SitField = { key: string; label: string; type: "input" | "textarea" };
export type SitTool = {
  id: string;
  num: string;
  name: string;
  def: string;
  // Nicht in der UI sichtbar — geht nur in den AI-System-Prompt (sit-suggest
  // route), um den häufigsten Fehlanwendungs-Fallstrick pro Methode zu
  // vermeiden (z.B. Subtraktion mit simplem Rezeptur-Ändern verwechseln).
  pitfall: string;
  // 2 echte Fälle aus der Praxis (Buch), NUR für den AI-Prompt (few-shot) —
  // nicht in der UI sichtbar. Zeigen der KI, wie konkret/spezifisch eine
  // echte historische Lösung war (welche Komponente ersetzt was), statt
  // generischer Plattitüden.
  fewShotExamples: string[];
  example: { name: string; rows: [string, string][] };
  fields: SitField[];
};

export type SitUi = {
  eyebrowTag: string;
  eyebrowLabel: string;
  title: string;
  lede: string;
  sharedProductLabel: string;
  sharedComponentsLabel: string;
  generateAllLabel: string;
  generateAllLoadingLabel: string;
  exampleLabel: string;
  summaryTitle: string;
  countLabel: (filled: number, total: number) => string;
  resetLabel: string;
  copyLabel: string;
  copiedLabel: string;
  emptyText: string;
  footerNote: string;
  stampText: string;
  confirmResetText: string;
  exportHeader: string;
  savedPrefix: string;
  aiButtonLabel: string;
  regenerateLabel: string;
  aiLoadingLabel: string;
  aiErrorLabel: string;
  aiRateLimitLabel: string;
  aiRequireProductLabel: string;
  aiApplyLabel: string;
  aiAppliedLabel: string;
  aiWhyLabel: string;
  aiSuggestionsHeading: string;
  aiSuggestionLabel: (n: number) => string;
  yourPickHeading: string;
};

export const SIT_TOOLS: Record<Lang, SitTool[]> = {
  de: [
    {
      id: "subtraction",
      num: "T-01",
      name: "Subtraktion",
      def: "Man streicht eine Kernkomponente eines Produktes oder Services – etwas, das zuvor als essenziell galt.",
      pitfall:
        "Nicht verwechseln mit simplem Entfernen eines störenden/schlechten Teils (das ist nur eine Rezeptur-Änderung, keine echte Subtraktion). Es muss eine wirklich essenzielle Komponente sein, und der Vorschlag muss einen NEUEN Nutzen beschreiben, keine bloße Verbesserung oder billigere Variante (das wäre nur Unbundling). WICHTIG: Nachdem du die Komponente entfernt hast, prüfe die mitgegebene Komponentenliste (intern UND extern) danach, ob eine davon die freiwerdende Funktion übernehmen kann — intern ODER extern, je nachdem was inhaltlich passt (keine pauschale Präferenz für extern), aber niemals die gestrichene Komponente selbst. Genau dieser Replacement-Schritt liefert oft den eigentlichen Wert der Lösung. Generiere die 3 Vorschläge so, dass sie unterschiedliche Komponenten aus der Liste als Ersatz nutzen (nicht immer dieselbe).",
      fewShotExamples: [
        `Fall: SEDASYS-Anästhesiesystem
Ausgangslage: Ein nahezu fertiges Sedierungsgerät war komplex, schwer und teuer; Backup-Batterie und Bildschirm galten als unverzichtbar.
Komponenten intern: Gerät, Bildschirm, Tastatur, Gehäuse, CPU, Stromversorgung, Backup-Batterie, Dosiersteuerung, Sensorik, Kopfhörer, Handball/Taster.
Komponenten extern (Closed World): Patient, Arzt, OP-Team, Hauptmonitor des OPs, Defibrillator, Krankenhausstromnetz, gesetzliche Anforderungen.
SIT-Eingriff: Backup-Batterie und Bildschirm gedanklich entfernen; deren Funktionen durch bereits vorhandene Ressourcen im OP übernehmen lassen.
Tatsächliche Lösung: Notstromversorgung über die Backup-Batterie des vorhandenen Defibrillators; Patientendaten auf dem zentralen OP-Monitor. Ergebnis: leichteres, günstigeres, weniger komplexes, potenziell intelligenter wirkendes System.`,
        `Fall: Philips Slimline DVD-Player
Ausgangslage: Frühe DVD-Player übernahmen die große, komplizierte Form von Videorekordern mit zahlreichen Fronttasten und großer LCD-Anzeige.
Komponenten intern: Gehäuse, Fronttasten, LCD-Anzeige, Disc-Laufwerk, Elektronik, Anschlüsse, Stromversorgung, Fernbedienung.
Komponenten extern (Closed World): Fernseher, Fernsehbildschirm, Nutzer, Wohnzimmer, Regal, Stromnetz.
SIT-Eingriff: Fronttasten und LCD-Anzeige entfernen; Bedienfunktionen auf die (bereits vorhandene, aber interne) Fernbedienung und die Informationsanzeige auf den (externen) Fernseher verlagern.
Tatsächliche Lösung: Die Fernbedienung übernahm die Bedienung, der Fernseher zeigte Status-/Steuerinfos. Ergebnis: ein besonders dünner, weniger einschüchternder, einfacher wirkender DVD-Player ("Slimline"), mit Designauszeichnung ausgezeichnet.`,
      ],
      example: {
        name: "Self-Service-Tankstelle ohne Kassierer",
        rows: [["Gestrichen", "Der Kassierer – galt als essenziell für den Verkauf"]],
      },
      fields: [
        { key: "removed", label: "Welche Komponente streichst du?", type: "input" },
        {
          key: "replacement",
          label: "Welche vorhandene Komponente aus der Closed World (intern oder extern) übernimmt die freigewordene Funktion?",
          type: "input",
        },
        { key: "effect", label: "Was passiert dadurch — für wen wird es besser oder anders?", type: "textarea" },
      ],
    },
    {
      id: "division",
      num: "T-02",
      name: "Division",
      def: "Du nimmst eine Komponente und teilst sie entlang einer physischen oder funktionalen Linie. Anschließend reorganisierst du sie zurück in das Produkt.",
      pitfall:
        "Die geteilten Teile müssen wirklich neu angeordnet werden — in Raum (an einen anderen Ort verlegt) oder in Zeit (erscheint nur zeitweise statt durchgehend). Reines gedankliches Trennen ohne Neuanordnung zählt nicht.",
      fewShotExamples: [
        `Fall: Les Paul – Mehrspuraufnahme
Ausgangslage: Bei traditionellen Musikaufnahmen mussten alle Musiker gleichzeitig möglichst fehlerfrei spielen. Ein einzelner Fehler machte die gesamte Aufnahme unbrauchbar.
Komponenten intern: Magnetband, Aufnahmegerät, Aufnahme-/Wiedergabekopf, Instrumentalspur, Gesangsspur, Mischprozess, Lautstärkeregelung.
Komponenten extern (Closed World): Musiker, Sänger, Produzent, Tonstudio, Instrumente, Publikum.
SIT-Eingriff: Die gemeinsame Gesamtaufnahme funktional und physisch in mehrere kleinere Tonspuren teilen; Teile zu unterschiedlichen Zeitpunkten aufnehmen (Division in der Zeit) und anschließend zusammenführen.
Tatsächliche Lösung: Ein zusätzlicher Aufnahmekopf nahm Instrumente und Gesang schrittweise übereinander auf. Einzelne Teile konnten unabhängig wiederholt, korrigiert, gemischt und mit Effekten versehen werden. Grundlage der modernen Mehrspurproduktion.`,
        `Fall: AXA-Versicherungsantrag
Ausgangslage: Versicherungsanträge wurden in starrer, historisch gewachsener Reihenfolge ausgefüllt. Viele Formulare waren unvollständig oder fehlerhaft und mussten nachbearbeitet werden.
Komponenten intern: Formular, Seiten, einzelne Datenfelder, Kundendaten, Produktdaten, Gesundheitsfragen, Unterschriften, Prüfschritte, Formularreihenfolge.
Komponenten extern (Closed World): Kunde, Versicherungsberater, Backoffice, Regulierungsbehörden, bereits vorhandene Datenquellen.
SIT-Eingriff: Das Formular funktional in einzelne Felder/Blöcke teilen; Blöcke nach Gesprächsablauf, Datenquelle, zuständiger Person und geeignetem Zeitpunkt neu anordnen (Division nach Ort/Verantwortlichkeit UND Zeit).
Tatsächliche Lösung: Bestimmte Felder wurden vorbefüllt, andere vom jeweils am besten geeigneten Beteiligten bearbeitet; farbige Overlays zeigten dem Berater nur die relevanten Formularbereiche. Ergebnis: rund 20% weniger fehlerhafte/unvollständige Anträge.`,
      ],
      example: {
        name: "Elektrische Zahnbürste mit Wechselkopf",
        rows: [
          ["Geteilt", "Bürste → Griff + Kopf"],
          ["Neu organisiert", "Nur der Kopf ist austauschbar"],
        ],
      },
      fields: [
        { key: "line", label: "Entlang welcher Linie teilst du eine Komponente?", type: "input" },
        { key: "reorg", label: "Wie ordnest du die Teile neu an?", type: "textarea" },
      ],
    },
    {
      id: "multiplication",
      num: "T-03",
      name: "Multiplikation",
      def: "Viele innovative Produkte nehmen eine Komponente, kopieren sie und verändern sie auf eine nicht erwartungsgemäße Art.",
      pitfall:
        "Eine unveränderte Kopie ist keine Multiplikation, nur mehr vom Gleichen (z.B. 10 Klingen an einem Rasierer ohne Veränderung bringt nichts). Die Kopie muss in mindestens einem Attribut (Farbe, Ort, Stärke, Zeitpunkt, ...) anders sein als das Original. Auch kein simples Hinzufügen eines neuen, unabhängigen Features.",
      fewShotExamples: [
        `Fall: Sears/Willis Tower – gebündelte Röhren
Ausgangslage: Ein sehr hoher Wolkenkratzer benötigte eine tragfähige, windstabile Konstruktion. Eine einzelne große Gebäuderöhre hätte Grundriss und mögliche Höhe eingeschränkt.
Komponenten intern: Tragende Gebäuderöhre, Stahlrahmen, Geschosse, Fassade, Fundament, horizontale/vertikale Verbindungen.
Komponenten extern (Closed World): Wind, Baugrund, Grundstücksfläche, Stadtstruktur, Nutzer und Mieter.
SIT-Eingriff: Die zentrale Gebäuderöhre mehrfach kopieren; die Kopien in Höhe und Position verändern (Attribut-Variation: unterschiedliche Röhrenhöhen).
Tatsächliche Lösung: Neun miteinander verbundene Röhren unterschiedlicher Höhe. Verbesserte Stabilität gegen Windkräfte, abgestufte unterschiedlich große Nutzflächen. Beeinflusste spätere Hochhäuser.`,
        `Fall: Febreze NOTICEables
Ausgangslage: Bei konstantem Raumduft gewöhnt sich der Geruchssinn nach kurzer Zeit; Nutzer nehmen das Produkt kaum noch wahr.
Komponenten intern: Duftflüssigkeit, Duftbehälter, Gehäuse, Stecker, elektrisches Heizelement, Auslass.
Komponenten extern (Closed World): Nase/Geruchssinn, Gehirn, Raumluft, Nutzer, Steckdose, vorhandene Gerüche.
SIT-Eingriff: Den Duftbehälter kopieren; die Kopie verändern (anderer Duft oder Geruchsneutralisierer); beide Behälter abwechselnd aktivieren (Attribut-Variation: Duftart + Zeitpunkt der Abgabe).
Tatsächliche Lösung: Zwei getrennte Tanks, Gerät wechselte in festen Intervallen zwischen zwei Düften. Der Wechsel unterbrach die Geruchsgewöhnung. Half laut Buch, P&Gs Marktanteil in der Kategorie annähernd zu verdoppeln.`,
      ],
      example: {
        name: "Mehrklingen-Rasierer",
        rows: [
          ["Multipliziert", "Eine Klinge → mehrere leicht versetzte Klingen"],
          ["Variation", "Unterschiedliche Winkel"],
        ],
      },
      fields: [
        { key: "component", label: "Welche Komponente vervielfachst du?", type: "input" },
        { key: "variation", label: "Wie unterscheiden sich die Kopien voneinander?", type: "textarea" },
      ],
    },
    {
      id: "unification",
      num: "T-04",
      name: "Aufgabenvereinigung",
      def: "Eine Komponente bekommt einen zusätzlichen Job zugewiesen, der zuvor nicht vorgesehen war.",
      pitfall:
        "Nicht verwechseln mit reinem Bündeln mehrerer Funktionen nebeneinander wie bei einem Schweizer Taschenmesser oder einer Multifunktionsuhr (jede Funktion bleibt dort für sich allein). Die gewählte Komponente muss eine ECHTE zusätzliche Aufgabe übernehmen. Es gibt 3 Varianten: (a) eine externe Komponente (Kunde, Partner, Umgebung) übernimmt eine Aufgabe, die dein Produkt sonst selbst erledigt; (b) eine interne Komponente bekommt eine komplett neue Zusatzaufgabe; (c) eine interne Komponente übernimmt die Funktion einer externen Komponente (\"stiehlt\" ihr die Aufgabe). Wechsle zwischen allen 3 Varianten, nicht nur der naheliegendsten.",
      fewShotExamples: [
        `Fall: Conscious Pain Mapping
Ausgangslage: Bei chronischen Beckenschmerzen war das schmerzverursachende Gewebe während einer üblichen Laparoskopie oft nicht sichtbar. Unter Vollnarkose konnte die Patientin nicht mitteilen, welcher Bereich Schmerzen auslöste.
Komponenten intern: Patientin, Laparoskop, Kamera, chirurgisches Instrument, Arzt, Schmerzkarte, Laser/Behandlungsinstrument.
Komponenten extern (Closed World): OP-Team, Anästhesie, Krankenhaus, Gewebe, vorhandene medizinische Geräte.
SIT-Eingriff: Der Patientin zusätzlich zu ihrer bisherigen Rolle die Aufgabe eines diagnostischen Sensors zuweisen (Variante b: interne Komponente bekommt neue Zusatzaufgabe).
Tatsächliche Lösung: Untersuchung bei wacher, ansprechbarer Patientin. Durch ihre unmittelbare Rückmeldung erkannte der Arzt, welches Gewebe bei Berührung Schmerzen verursachte — präzisere Behandlung. Die Patientin war gleichzeitig Patientin und Diagnoseinstrument.`,
        `Fall: reCAPTCHA – Digitalisierung alter Bücher
Ausgangslage: Websites brauchten Schutz gegen automatisierte Zugriffe. Gleichzeitig konnten OCR-Systeme viele Wörter aus alten/schlecht gedruckten Büchern nicht zuverlässig erkennen.
Komponenten intern: CAPTCHA-Wort, unbekanntes OCR-Wort, Eingabefeld, Website, Validierungslogik, Datenbank, Antwortvergleich.
Komponenten extern (Closed World): Webnutzer, Websitebetreiber, Scanner, OCR-Systeme, Bucharchive, digitalisierte Dokumente.
SIT-Eingriff: Den Webnutzern (externe Komponente) beim ohnehin nötigen CAPTCHA-Test zusätzlich die Aufgabe geben, von OCR nicht erkannte Buchwörter zu transkribieren (Variante a: externe Komponente übernimmt eine sonst intern/anderswo zu lösende Aufgabe).
Tatsächliche Lösung: Eine Nutzeraktion erfüllte zwei Aufgaben zugleich — Bot-Schutz UND Buch-Digitalisierung. Half u.a. bei der Digitalisierung historischer Zeitungsarchive (New York Times).`,
      ],
      example: {
        name: "Smartphone als Taschenlampe",
        rows: [["Zusatzjob", "Kamera-LED übernimmt die Beleuchtungsfunktion"]],
      },
      fields: [
        { key: "origin", label: "Ist die Komponente intern (Teil deines Produkts) oder extern (Kunde, Partner, Umgebung)?", type: "input" },
        { key: "component", label: "Welche vorhandene Komponente wählst du aus?", type: "input" },
        { key: "job", label: "Welchen zusätzlichen Job übernimmt sie?", type: "textarea" },
      ],
    },
    {
      id: "dependency",
      num: "T-05",
      name: "Eigenschaftsabhängigkeit",
      def: "Ein Produkt weist eine Korrelation zwischen zwei Produkteigenschaften oder zwischen einer Produkteigenschaft und der Umgebung auf. Während sich eine Sache verändert, verändert sich auch eine andere.",
      pitfall:
        "Mindestens eine der beiden Eigenschaften muss unter Kontrolle des Produkts/Herstellers stehen (z.B. eine Produkteigenschaft). Eine Abhängigkeit zwischen zwei rein externen, unkontrollierbaren Faktoren (z.B. Wetter und Tageszeit) ist nicht herstellbar und daher ungültig.",
      fewShotExamples: [
        `Fall: Púr-Babyflasche
Ausgangslage: Zu heiße Milch kann den Mund eines Babys verbrennen. Besonders nachts können müde Eltern die Temperatur einer in der Mikrowelle erwärmten Flasche schwer beurteilen.
Komponenten intern: Flasche, thermochromes Material, Milch, Sauger, Flaschenwand.
Komponenten extern (Closed World): Baby, Eltern, Betreuungsperson, Mikrowelle, Umgebungstemperatur.
SIT-Eingriff: Neue Abhängigkeit zwischen Temperatur der Flüssigkeit (Umgebungsfaktor) und Farbe der Flasche (Produkteigenschaft, kontrollierbar) herstellen.
Tatsächliche Lösung: Die Flasche verändert ihre Farbe, sobald die Flüssigkeit eine festgelegte Temperatur erreicht — unmittelbar sichtbare Warn-/Temperaturanzeige ohne separates Messgerät.`,
        `Fall: Tropffreie Kerze
Ausgangslage: Bei normalen Kerzen schmilzt das Wachs gleichmäßig; flüssiges Wachs tropft außen herunter und beschädigt Oberflächen. Wind kann die frei stehende Flamme leicht löschen.
Komponenten intern: Innerer Wachskern, äußere Wachsschicht, Docht, Flamme, flüssiges Wachs, Sauerstoff.
Komponenten extern (Closed World): Wind, Tisch, Tischdecke, Geburtstagstorte, Nutzer, Umgebungstemperatur.
SIT-Eingriff: Die Schmelztemperatur des Wachses (Produkteigenschaft) von der Position im Kerzenquerschnitt (andere Produkteigenschaft) abhängig machen: außen höherer Schmelzpunkt, innen niedrigerer.
Tatsächliche Lösung: Inneres Wachs schmilzt schneller und bildet eine Vertiefung, äußere Schicht bleibt stabil — weniger Tropfen, besserer Windschutz für die Flamme, geringerer Wachsverbrauch.`,
      ],
      example: {
        name: "Scheibenwischer passen ihre Geschwindigkeit an den Regen an",
        rows: [["Abhängigkeit", "Regenmenge ↔ Wischtempo"]],
      },
      fields: [
        { key: "attrA", label: "Eigenschaft A (oder Umgebungsfaktor)", type: "input" },
        { key: "attrB", label: "Eigenschaft B, die sich mitverändern soll", type: "input" },
        { key: "rule", label: "Wie genau hängen sie zusammen? (z. B. „steigt A, steigt B“)", type: "textarea" },
      ],
    },
  ],
  en: [
    {
      id: "subtraction",
      num: "T-01",
      name: "Subtraction",
      def: "You remove a core component of a product or service — something that previously seemed essential.",
      pitfall:
        "Don't confuse this with simply removing a troublesome or bad part (that's just changing the recipe, not real Subtraction). It must be a genuinely essential component, and the suggestion must describe a NEW benefit, not just an improvement or a cheaper stripped-down variant (that would be unbundling). IMPORTANT: after removing the component, check the given component list (internal AND external) for one that could take over the freed-up function — internal OR external, whichever fits the case (no blanket preference for external), but never the removed component itself. This replacement step is often where the real value of the solution comes from. Generate the 3 suggestions so they use different components from the list as the replacement (not always the same one).",
      fewShotExamples: [
        `Case: SEDASYS anesthesia system
Situation: A nearly finished sedation device was complex, heavy and expensive; the backup battery and screen were considered indispensable.
Internal components: device, screen, keyboard, housing, CPU, power supply, backup battery, dosage control, sensors, headphones, hand-trigger/button.
External components (Closed World): patient, doctor, OR team, main OR monitor, defibrillator, hospital power grid, regulatory requirements.
SIT move: mentally remove the backup battery and screen; let already-present OR resources take over their functions.
Actual solution: emergency power came from the existing defibrillator's backup battery; patient data was shown on the central OR monitor. Result: a lighter, cheaper, less complex, potentially smarter-seeming system.`,
        `Case: Philips Slimline DVD player
Situation: Early DVD players copied the bulky, complicated shape of VCRs, with lots of front buttons and a large LCD display.
Internal components: housing, front buttons, LCD display, disc drive, electronics, connectors, power supply, remote control.
External components (Closed World): TV, TV screen, user, living room, shelf, power outlet.
SIT move: remove the front buttons and LCD display; shift control functions to the (already-present but internal) remote control and status display to the (external) TV.
Actual solution: the remote took over the controls, the TV showed status/control info. Result: a remarkably thin, less intimidating, simpler-looking DVD player ("Slimline"), which won a design award.`,
      ],
      example: {
        name: "Self-service gas station without a cashier",
        rows: [["Removed", "The cashier — considered essential to making a sale"]],
      },
      fields: [
        { key: "removed", label: "Which component do you remove?", type: "input" },
        {
          key: "replacement",
          label: "Which existing component from the Closed World (internal or external) takes over the freed-up function?",
          type: "input",
        },
        { key: "effect", label: "What happens as a result — who benefits, or what changes?", type: "textarea" },
      ],
    },
    {
      id: "division",
      num: "T-02",
      name: "Division",
      def: "You take a component and split it along a physical or functional line. Then you reorganize it back into the product.",
      pitfall:
        "The split parts must actually be rearranged — in space (moved to a different location) or in time (only appears at certain times instead of continuously). Splitting something apart conceptually without an actual rearrangement doesn't count.",
      fewShotExamples: [
        `Case: Les Paul — multitrack recording
Situation: In traditional music recording, all musicians had to play together, ideally without mistakes. One error could ruin the entire take.
Internal components: magnetic tape, recording device, record/playback head, instrumental track, vocal track, mixing process, volume control.
External components (Closed World): musicians, singer, producer, recording studio, instruments, audience.
SIT move: split the single combined recording functionally and physically into several smaller tracks; record the parts at different times (division in time) and merge them afterward.
Actual solution: an extra recording head let Les Paul record instruments and vocals layered on top of each other over time. Individual parts could be redone, corrected, mixed and processed with effects independently. Became the foundation of modern multitrack production.`,
        `Case: AXA insurance application form
Situation: Insurance applications were filled out in a rigid, historically grown order. Many forms were incomplete or wrong and needed rework.
Internal components: form, pages, individual data fields, customer data, product data, health questions, signatures, review steps, form ordering.
External components (Closed World): customer, insurance advisor, back office, regulators, existing data sources.
SIT move: split the form functionally into individual fields/blocks; rearrange the blocks by conversation flow, data source, responsible person, and the best moment to fill them in (division by place/responsibility AND time).
Actual solution: some fields were pre-filled, others handled by whoever was best suited; colored overlays showed the advisor only the form sections relevant to that product. Result: roughly 20% fewer incomplete/incorrect applications.`,
      ],
      example: {
        name: "Electric toothbrush with a replaceable head",
        rows: [
          ["Split", "Brush → handle + head"],
          ["Reorganized", "Only the head is replaceable"],
        ],
      },
      fields: [
        { key: "line", label: "Along what line do you split a component?", type: "input" },
        { key: "reorg", label: "How do you reorganize the parts?", type: "textarea" },
      ],
    },
    {
      id: "multiplication",
      num: "T-03",
      name: "Multiplication",
      def: "Many innovative products take a component, copy it, and change the copy in an unexpected way.",
      pitfall:
        "An unchanged copy is not Multiplication, just more of the same (e.g. 10 blades on a razor with no change accomplishes nothing). The copy must differ from the original in at least one attribute (color, location, strength, timing, ...). Also not simply adding a new, unrelated feature.",
      fewShotExamples: [
        `Case: Sears/Willis Tower — bundled tubes
Situation: A very tall skyscraper needed a structure that could carry loads and resist wind forces. A single large building tube would have limited floor-plan design and achievable height.
Internal components: load-bearing building tube, steel frame, floors, facade, foundation, horizontal/vertical connections.
External components (Closed World): wind, ground conditions, lot size, city structure, users and tenants.
SIT move: copy the central building tube multiple times; vary the copies in height and position (attribute variation: different tube heights).
Actual solution: the building was built from nine interconnected tubes of different heights. The bundled structure improved wind stability and created stepped, differently sized usable floor areas. The construction principle influenced later high-rises.`,
        `Case: Febreze NOTICEables
Situation: With a constant room scent, the human sense of smell adapts within a short time — users barely notice the product anymore.
Internal components: scent liquid, scent cartridge, housing, plug, electric heating element, outlet.
External components (Closed World): nose/sense of smell, brain, room air, user, power outlet, existing odors.
SIT move: copy the existing scent cartridge; change the copy (a different scent, or an odor neutralizer); activate both cartridges alternately (attribute variation: scent type + timing of release).
Actual solution: the plug-in air freshener got two separate tanks. The device alternated between two scents (or room scent and Febreze odor control) at fixed intervals. The switching interrupted scent-adaptation. The book credits the product with roughly doubling P&G's market share in the category.`,
      ],
      example: {
        name: "Multi-blade razor",
        rows: [
          ["Multiplied", "One blade → several slightly offset blades"],
          ["Variation", "Different angles"],
        ],
      },
      fields: [
        { key: "component", label: "Which component do you multiply?", type: "input" },
        { key: "variation", label: "How do the copies differ from each other?", type: "textarea" },
      ],
    },
    {
      id: "unification",
      num: "T-04",
      name: "Task Unification",
      def: "A component is assigned an additional job it wasn't originally meant to do.",
      pitfall:
        "Don't confuse this with simply bundling several functions side by side, like a Swiss Army knife or a multi-function watch (each function still only does its own original job there). The chosen component must take on a REAL additional job. There are 3 variants: (a) an external component (customer, partner, environment) takes over a task your product would otherwise do itself; (b) an internal component gets a completely new extra job; (c) an internal component takes over the function of an external component (\"steals\" its job). Alternate between all 3 variants, not just the most obvious one.",
      fewShotExamples: [
        `Case: Conscious Pain Mapping
Situation: In chronic pelvic pain, the pain-causing tissue was often not visible during a standard laparoscopy. Under general anesthesia the patient couldn't report which examined area actually hurt.
Internal components: patient, laparoscope, camera, surgical instrument, doctor, pain map, laser/treatment instrument.
External components (Closed World): OR team, anesthesia, hospital, tissue, existing medical equipment.
SIT move: assign the patient, in addition to her existing role, the task of a diagnostic sensor (variant b: internal component gets a completely new extra job).
Actual solution: the exam was done with the patient awake and responsive. Her immediate feedback let the doctor identify which tissue caused pain when touched, enabling more precise treatment. The patient was simultaneously patient and diagnostic instrument.`,
        `Case: reCAPTCHA — digitizing old books
Situation: Websites needed protection against automated access. At the same time, OCR systems couldn't reliably recognize many words from old or poorly printed books.
Internal components: CAPTCHA word, unknown OCR word, input field, website, validation logic, database, answer comparison.
External components (Closed World): web users, site operators, scanners, OCR systems, book archives, digitized documents.
SIT move: give web users (an external component), during the CAPTCHA check they already have to pass, the extra task of transcribing book words OCR couldn't recognize (variant a: external component takes over a task otherwise solved internally/elsewhere).
Actual solution: one user action fulfilled two jobs at once — bot protection AND book digitization. Helped digitize historical archives, including the New York Times.`,
      ],
      example: {
        name: "Smartphone as a flashlight",
        rows: [["Extra job", "Camera LED takes over the lighting function"]],
      },
      fields: [
        { key: "origin", label: "Is the component internal (part of your product) or external (customer, partner, environment)?", type: "input" },
        { key: "component", label: "Which existing component do you pick?", type: "input" },
        { key: "job", label: "What additional job does it take on?", type: "textarea" },
      ],
    },
    {
      id: "dependency",
      num: "T-05",
      name: "Attribute Dependency",
      def: "A product shows a correlation between two product attributes, or between a product attribute and its environment. As one thing changes, another changes with it.",
      pitfall:
        "At least one of the two attributes must be under the product's/maker's control (e.g. a product attribute). A dependency between two purely external, uncontrollable factors (e.g. weather and time of day) can't actually be built and is therefore invalid.",
      fewShotExamples: [
        `Case: Púr baby bottle
Situation: Milk that's too hot can burn a baby's mouth. Especially at night, tired parents struggle to judge the temperature of a bottle warmed in the microwave.
Internal components: bottle, thermochromic material, milk, nipple, bottle wall.
External components (Closed World): baby, parents, caregiver, microwave, ambient temperature.
SIT move: create a new dependency between the liquid's temperature (environmental factor) and the bottle's color (product attribute, controllable).
Actual solution: the bottle changes color once the liquid reaches a defined temperature — an immediately visible warning/temperature indicator without a separate thermometer.`,
        `Case: Drip-free candle
Situation: In ordinary candles the wax melts evenly; liquid wax drips down the outside and damages surfaces. Wind can easily blow out the exposed flame.
Internal components: inner wax core, outer wax layer, wick, flame, liquid wax, oxygen.
External components (Closed World): wind, table, tablecloth, birthday cake, user, ambient temperature.
SIT move: make the wax's melting point (product attribute) depend on its position within the candle's cross-section (another product attribute): higher melting point on the outside, lower on the inside.
Actual solution: the inner wax melts faster and forms a well, while the outer shell stays solid — less dripping, better wind protection for the flame, lower wax consumption.`,
      ],
      example: {
        name: "Windshield wipers adjust their speed to the rain",
        rows: [["Dependency", "Rainfall ↔ wiper speed"]],
      },
      fields: [
        { key: "attrA", label: "Attribute A (or environmental factor)", type: "input" },
        { key: "attrB", label: "Attribute B that should change along with it", type: "input" },
        { key: "rule", label: 'How exactly are they linked? (e.g. "as A increases, B increases")', type: "textarea" },
      ],
    },
  ],
};

export const SIT_UI: Record<Lang, SitUi> = {
  de: {
    eyebrowTag: "T-01–T-05",
    eyebrowLabel: "Systematic Inventive Thinking",
    title: "5 Werkzeuge für systematisch innovatives Denken",
    lede:
      "Innovation ist kein Zufallstreffer. Diese fünf Denkoperationen zerlegen ein bestehendes Produkt in seine Komponenten und wenden eine feste Regel darauf an — subtrahieren, teilen, vervielfachen, verschmelzen, verknüpfen. Produkt einmal eintragen, alle 5 Werkzeuge generieren lassen.",
    sharedProductLabel: "Dein Produkt oder Service",
    sharedComponentsLabel: "Woraus besteht es? (Komponenten)",
    generateAllLabel: "Alle 5 Vorschläge generieren",
    generateAllLoadingLabel: "KI generiert alle 5 Werkzeuge …",
    exampleLabel: "Beispiel",
    summaryTitle: "Deine Innovations-Skizze",
    countLabel: (filled, total) => `${filled} von ${total} Werkzeugen ausgefüllt`,
    resetLabel: "Zurücksetzen",
    copyLabel: "Skizze kopieren",
    copiedLabel: "Kopiert ✓",
    emptyText: "Noch keine Einträge — trag oben dein Produkt ein und generiere Vorschläge.",
    footerNote: "Lokal gespeichert in diesem Browser — verlässt dieses Gerät nicht.",
    stampText: "✓ erfasst",
    confirmResetText: "Alle Einträge in allen 5 Werkzeugen löschen?",
    exportHeader: "INNOVATIONS-SKIZZE — Systematic Inventive Thinking",
    savedPrefix: "gespeichert ·",
    aiButtonLabel: "Vorschläge generieren",
    regenerateLabel: "Neu generieren",
    aiLoadingLabel: "KI denkt nach …",
    aiErrorLabel: "Vorschläge konnten nicht generiert werden — nochmal versuchen.",
    aiRateLimitLabel: "Zu viele Anfragen — bitte kurz warten und nochmal versuchen.",
    aiRequireProductLabel: "Trage oben zuerst dein Produkt oder deinen Service ein.",
    aiApplyLabel: "Übernehmen →",
    aiAppliedLabel: "✓ Übernommen",
    aiWhyLabel: "Warum wertvoll",
    aiSuggestionsHeading: "KI-Vorschläge",
    aiSuggestionLabel: (n) => `Vorschlag ${n}`,
    yourPickHeading: "Deine Auswahl",
  },
  en: {
    eyebrowTag: "T-01–T-05",
    eyebrowLabel: "Systematic Inventive Thinking",
    title: "5 Tools for Systematically Innovative Thinking",
    lede:
      "Innovation isn't a lucky break. These five thinking operations break an existing product down into its components and apply one fixed rule — subtract, split, multiply, merge, link. Enter your product once, generate all 5 tools.",
    sharedProductLabel: "Your product or service",
    sharedComponentsLabel: "What is it made of? (components)",
    generateAllLabel: "Generate all 5 suggestions",
    generateAllLoadingLabel: "AI is generating all 5 tools …",
    exampleLabel: "Example",
    summaryTitle: "Your Innovation Sketch",
    countLabel: (filled, total) => `${filled} of ${total} tools filled in`,
    resetLabel: "Reset",
    copyLabel: "Copy sketch",
    copiedLabel: "Copied ✓",
    emptyText: "No entries yet — enter your product above and generate suggestions.",
    footerNote: "Saved locally in this browser — never leaves your device.",
    stampText: "✓ captured",
    confirmResetText: "Clear all entries in all 5 tools?",
    exportHeader: "INNOVATION SKETCH — Systematic Inventive Thinking",
    savedPrefix: "saved ·",
    aiButtonLabel: "Generate suggestions",
    regenerateLabel: "Regenerate",
    aiLoadingLabel: "AI is thinking …",
    aiErrorLabel: "Couldn't generate suggestions — try again.",
    aiRateLimitLabel: "Too many requests — please wait a moment and try again.",
    aiRequireProductLabel: "Enter your product or service above first.",
    aiApplyLabel: "Apply →",
    aiAppliedLabel: "✓ Applied",
    aiWhyLabel: "Why it could be valuable",
    aiSuggestionsHeading: "AI suggestions",
    aiSuggestionLabel: (n) => `Suggestion ${n}`,
    yourPickHeading: "Your pick",
  },
};
