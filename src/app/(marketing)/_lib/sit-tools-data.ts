// Inhalte für das "5 Werkzeuge für systematisch innovatives Denken"-Tool
// (Systematic Inventive Thinking). Getrennt von dict.ts, weil die Struktur
// (Felder pro Werkzeug, Beispiel-Zeilen) nicht ins flache t()-Key-Schema
// passt — SitTool liest hier direkt statt über t().

export type Lang = "de" | "en";

// aiGenerated=true: das Feld ist die eigentliche Anwendung der Methode
// (z.B. "welche Komponente streichst du") — wird NICHT als leeres
// Eingabefeld gezeigt, sondern ausschließlich über "KI-Vorschläge
// generieren" befüllt (danach frei editierbar). Alle anderen Felder sind
// Kontext (Produkt, Komponentenliste, ...), den der Nutzer manuell einträgt
// und der 1:1 an die KI weitergegeben wird — nie als "von der KI zu
// erfindendes" Feld behandelt.
export type SitField = { key: string; label: string; type: "input" | "textarea"; aiGenerated?: boolean };
export type SitTool = {
  id: string;
  num: string;
  name: string;
  def: string;
  example: { name: string; rows: [string, string][] };
  fields: SitField[];
};

export type SitUi = {
  eyebrowTag: string;
  eyebrowLabel: string;
  title: string;
  lede: string;
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
  aiLoadingLabel: string;
  aiErrorLabel: string;
  aiRateLimitLabel: string;
  aiRequireProductLabel: string;
  aiApplyLabel: string;
  aiWhyLabel: string;
  aiSuggestionsHeading: string;
  aiSuggestionLabel: (n: number) => string;
  aiFieldsHint: string;
};

export const SIT_TOOLS: Record<Lang, SitTool[]> = {
  de: [
    {
      id: "subtraction",
      num: "T-01",
      name: "Subtraktion",
      def: "Man streicht eine Kernkomponente eines Produktes oder Services – etwas, das zuvor als essenziell galt.",
      example: {
        name: "Self-Service-Tankstelle ohne Kassierer",
        rows: [["Gestrichen", "Der Kassierer – galt als essenziell für den Verkauf"]],
      },
      fields: [
        { key: "product", label: "Dein Produkt oder Service", type: "input" },
        { key: "core", label: "Kernkomponenten (was gilt heute als essenziell?)", type: "textarea" },
        { key: "removed", label: "Welche Komponente streichst du?", type: "input", aiGenerated: true },
        { key: "effect", label: "Was passiert dadurch — für wen wird es besser oder anders?", type: "textarea", aiGenerated: true },
      ],
    },
    {
      id: "division",
      num: "T-02",
      name: "Division",
      def: "Du nimmst eine Komponente und teilst sie entlang einer physischen oder funktionalen Linie. Anschließend reorganisierst du sie zurück in das Produkt.",
      example: {
        name: "Elektrische Zahnbürste mit Wechselkopf",
        rows: [
          ["Geteilt", "Bürste → Griff + Kopf"],
          ["Neu organisiert", "Nur der Kopf ist austauschbar"],
        ],
      },
      fields: [
        { key: "product", label: "Dein Produkt oder Service", type: "input" },
        { key: "parts", label: "Woraus besteht es? (Komponenten)", type: "textarea" },
        { key: "line", label: "Entlang welcher Linie teilst du eine Komponente?", type: "input", aiGenerated: true },
        { key: "reorg", label: "Wie ordnest du die Teile neu an?", type: "textarea", aiGenerated: true },
      ],
    },
    {
      id: "multiplication",
      num: "T-03",
      name: "Multiplikation",
      def: "Viele innovative Produkte nehmen eine Komponente, kopieren sie und verändern sie auf eine nicht erwartungsgemäße Art.",
      example: {
        name: "Mehrklingen-Rasierer",
        rows: [
          ["Multipliziert", "Eine Klinge → mehrere leicht versetzte Klingen"],
          ["Variation", "Unterschiedliche Winkel"],
        ],
      },
      fields: [
        { key: "product", label: "Dein Produkt oder Service", type: "input" },
        { key: "component", label: "Welche Komponente vervielfachst du?", type: "input", aiGenerated: true },
        { key: "variation", label: "Wie unterscheiden sich die Kopien voneinander?", type: "textarea", aiGenerated: true },
      ],
    },
    {
      id: "unification",
      num: "T-04",
      name: "Aufgabenvereinigung",
      def: "Eine Komponente bekommt einen zusätzlichen Job zugewiesen, der zuvor nicht vorgesehen war.",
      example: {
        name: "Smartphone als Taschenlampe",
        rows: [["Zusatzjob", "Kamera-LED übernimmt die Beleuchtungsfunktion"]],
      },
      fields: [
        { key: "product", label: "Dein Produkt oder Service", type: "input" },
        { key: "component", label: "Welche vorhandene Komponente wählst du aus?", type: "input", aiGenerated: true },
        { key: "job", label: "Welchen zusätzlichen Job übernimmt sie?", type: "textarea", aiGenerated: true },
      ],
    },
    {
      id: "dependency",
      num: "T-05",
      name: "Eigenschaftsabhängigkeit",
      def: "Ein Produkt weist eine Korrelation zwischen zwei Produkteigenschaften oder zwischen einer Produkteigenschaft und der Umgebung auf. Während sich eine Sache verändert, verändert sich auch eine andere.",
      example: {
        name: "Scheibenwischer passen ihre Geschwindigkeit an den Regen an",
        rows: [["Abhängigkeit", "Regenmenge ↔ Wischtempo"]],
      },
      fields: [
        { key: "product", label: "Dein Produkt oder Service", type: "input" },
        { key: "attrA", label: "Eigenschaft A (oder Umgebungsfaktor)", type: "input", aiGenerated: true },
        { key: "attrB", label: "Eigenschaft B, die sich mitverändern soll", type: "input", aiGenerated: true },
        { key: "rule", label: "Wie genau hängen sie zusammen? (z. B. „steigt A, steigt B“)", type: "textarea", aiGenerated: true },
      ],
    },
  ],
  en: [
    {
      id: "subtraction",
      num: "T-01",
      name: "Subtraction",
      def: "You remove a core component of a product or service — something that previously seemed essential.",
      example: {
        name: "Self-service gas station without a cashier",
        rows: [["Removed", "The cashier — considered essential to making a sale"]],
      },
      fields: [
        { key: "product", label: "Your product or service", type: "input" },
        { key: "core", label: "Core components (what counts as essential today?)", type: "textarea" },
        { key: "removed", label: "Which component do you remove?", type: "input", aiGenerated: true },
        { key: "effect", label: "What happens as a result — who benefits, or what changes?", type: "textarea", aiGenerated: true },
      ],
    },
    {
      id: "division",
      num: "T-02",
      name: "Division",
      def: "You take a component and split it along a physical or functional line. Then you reorganize it back into the product.",
      example: {
        name: "Electric toothbrush with a replaceable head",
        rows: [
          ["Split", "Brush → handle + head"],
          ["Reorganized", "Only the head is replaceable"],
        ],
      },
      fields: [
        { key: "product", label: "Your product or service", type: "input" },
        { key: "parts", label: "What is it made of? (components)", type: "textarea" },
        { key: "line", label: "Along what line do you split a component?", type: "input", aiGenerated: true },
        { key: "reorg", label: "How do you reorganize the parts?", type: "textarea", aiGenerated: true },
      ],
    },
    {
      id: "multiplication",
      num: "T-03",
      name: "Multiplication",
      def: "Many innovative products take a component, copy it, and change the copy in an unexpected way.",
      example: {
        name: "Multi-blade razor",
        rows: [
          ["Multiplied", "One blade → several slightly offset blades"],
          ["Variation", "Different angles"],
        ],
      },
      fields: [
        { key: "product", label: "Your product or service", type: "input" },
        { key: "component", label: "Which component do you multiply?", type: "input", aiGenerated: true },
        { key: "variation", label: "How do the copies differ from each other?", type: "textarea", aiGenerated: true },
      ],
    },
    {
      id: "unification",
      num: "T-04",
      name: "Task Unification",
      def: "A component is assigned an additional job it wasn't originally meant to do.",
      example: {
        name: "Smartphone as a flashlight",
        rows: [["Extra job", "Camera LED takes over the lighting function"]],
      },
      fields: [
        { key: "product", label: "Your product or service", type: "input" },
        { key: "component", label: "Which existing component do you pick?", type: "input", aiGenerated: true },
        { key: "job", label: "What additional job does it take on?", type: "textarea", aiGenerated: true },
      ],
    },
    {
      id: "dependency",
      num: "T-05",
      name: "Attribute Dependency",
      def: "A product shows a correlation between two product attributes, or between a product attribute and its environment. As one thing changes, another changes with it.",
      example: {
        name: "Windshield wipers adjust their speed to the rain",
        rows: [["Dependency", "Rainfall ↔ wiper speed"]],
      },
      fields: [
        { key: "product", label: "Your product or service", type: "input" },
        { key: "attrA", label: "Attribute A (or environmental factor)", type: "input", aiGenerated: true },
        { key: "attrB", label: "Attribute B that should change along with it", type: "input", aiGenerated: true },
        { key: "rule", label: 'How exactly are they linked? (e.g. "as A increases, B increases")', type: "textarea", aiGenerated: true },
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
      "Innovation ist kein Zufallstreffer. Diese fünf Denkoperationen zerlegen ein bestehendes Produkt in seine Komponenten und wenden eine feste Regel darauf an — subtrahieren, teilen, vervielfachen, verschmelzen, verknüpfen. Werkzeug wählen, Definition & Beispiel lesen, auf die eigene Idee anwenden.",
    exampleLabel: "Beispiel",
    summaryTitle: "Deine Innovations-Skizze",
    countLabel: (filled, total) => `${filled} von ${total} Werkzeugen ausgefüllt`,
    resetLabel: "Zurücksetzen",
    copyLabel: "Skizze kopieren",
    copiedLabel: "Kopiert ✓",
    emptyText: "Noch keine Einträge — fülle ein Werkzeug oben aus, dann erscheint hier deine Skizze.",
    footerNote: "Lokal gespeichert in diesem Browser — verlässt dieses Gerät nicht.",
    stampText: "✓ erfasst",
    confirmResetText: "Alle Einträge in allen 5 Werkzeugen löschen?",
    exportHeader: "INNOVATIONS-SKIZZE — Systematic Inventive Thinking",
    savedPrefix: "gespeichert ·",
    aiButtonLabel: "KI-Vorschläge generieren",
    aiLoadingLabel: "KI denkt nach …",
    aiErrorLabel: "Vorschläge konnten nicht generiert werden — nochmal versuchen.",
    aiRateLimitLabel: "Zu viele Anfragen — bitte kurz warten und nochmal versuchen.",
    aiRequireProductLabel: "Trage zuerst dein Produkt oder deinen Service ein.",
    aiApplyLabel: "Übernehmen →",
    aiWhyLabel: "Warum wertvoll",
    aiSuggestionsHeading: "KI-Vorschläge",
    aiSuggestionLabel: (n) => `Vorschlag ${n}`,
    aiFieldsHint: "Die restlichen Felder füllt die KI aus — Vorschläge generieren und übernehmen.",
  },
  en: {
    eyebrowTag: "T-01–T-05",
    eyebrowLabel: "Systematic Inventive Thinking",
    title: "5 Tools for Systematically Innovative Thinking",
    lede:
      "Innovation isn't a lucky break. These five thinking operations break an existing product down into its components and apply one fixed rule — subtract, split, multiply, merge, link. Pick a tool, read the definition & example, apply it to your own idea.",
    exampleLabel: "Example",
    summaryTitle: "Your Innovation Sketch",
    countLabel: (filled, total) => `${filled} of ${total} tools filled in`,
    resetLabel: "Reset",
    copyLabel: "Copy sketch",
    copiedLabel: "Copied ✓",
    emptyText: "No entries yet — fill in a tool above and your sketch will appear here.",
    footerNote: "Saved locally in this browser — never leaves your device.",
    stampText: "✓ captured",
    confirmResetText: "Clear all entries in all 5 tools?",
    exportHeader: "INNOVATION SKETCH — Systematic Inventive Thinking",
    savedPrefix: "saved ·",
    aiButtonLabel: "Generate AI suggestions",
    aiLoadingLabel: "AI is thinking …",
    aiErrorLabel: "Couldn't generate suggestions — try again.",
    aiRateLimitLabel: "Too many requests — please wait a moment and try again.",
    aiRequireProductLabel: "Enter your product or service first.",
    aiApplyLabel: "Apply →",
    aiWhyLabel: "Why it could be valuable",
    aiSuggestionsHeading: "AI suggestions",
    aiSuggestionLabel: (n) => `Suggestion ${n}`,
    aiFieldsHint: "The AI fills in the rest — generate suggestions and apply one.",
  },
};
