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
        "Nicht verwechseln mit simplem Entfernen eines störenden/schlechten Teils (das ist nur eine Rezeptur-Änderung, keine echte Subtraktion). Es muss eine wirklich essenzielle Komponente sein, und der Vorschlag muss einen NEUEN Nutzen beschreiben, keine bloße Verbesserung oder billigere Variante (das wäre nur Unbundling).",
      example: {
        name: "Self-Service-Tankstelle ohne Kassierer",
        rows: [["Gestrichen", "Der Kassierer – galt als essenziell für den Verkauf"]],
      },
      fields: [
        { key: "removed", label: "Welche Komponente streichst du?", type: "input" },
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
        "Don't confuse this with simply removing a troublesome or bad part (that's just changing the recipe, not real Subtraction). It must be a genuinely essential component, and the suggestion must describe a NEW benefit, not just an improvement or a cheaper stripped-down variant (that would be unbundling).",
      example: {
        name: "Self-service gas station without a cashier",
        rows: [["Removed", "The cashier — considered essential to making a sale"]],
      },
      fields: [
        { key: "removed", label: "Which component do you remove?", type: "input" },
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
