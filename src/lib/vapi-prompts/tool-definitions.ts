/**
 * Vapi-Tool-Definitionen im Vapi-Custom-Tool-Format. Werden vom Webhook
 * als `assistant.model.tools` mitgeliefert. Alle Tools zeigen auf den
 * gleichen n8n-Webhook — dort entscheidet die Route-by-Tool-Node was
 * passieren soll.
 *
 * Vapi-Format: { type: "function", function: { name, description, parameters },
 *                server: { url } }
 */

const TOOLS_WEBHOOK_URL = "https://n8n.neuronic-automation.ai/webhook/vapi-sales-tools";

type VapiTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
  async?: boolean;
  server?: { url: string };
};

const getProgram: VapiTool = {
  type: "function",
  function: {
    name: "get_program",
    description:
      "Ruft Pitch, Value Proposition und Booking-Link für das aktuelle Sales-Program ab. Nutze dieses Tool, wenn du Detail-Fragen zum Angebot nicht aus deinem Kontext beantworten kannst.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  async: false,
  server: { url: TOOLS_WEBHOOK_URL },
};

const getLeadContext: VapiTool = {
  type: "function",
  function: {
    name: "get_lead_context",
    description:
      "Ruft gespeicherte Kontaktinformationen zum Lead ab (Name, Firma, Rolle, Notizen, custom_fields). Rufe dies UMGEHEND am Call-Start auf, damit der Opener personalisiert ist.",
    parameters: { type: "object", properties: {}, required: [] },
  },
  async: false,
  server: { url: TOOLS_WEBHOOK_URL },
};

const bookMeeting: VapiTool = {
  type: "function",
  function: {
    name: "book_meeting",
    description:
      "Reserviert einen Termin im System, sobald der Lead einen Slot zusagt. IMMER sofort aufrufen, nicht nur mündlich bestätigen.",
    parameters: {
      type: "object",
      properties: {
        datetime: {
          type: "string",
          description: "ISO-8601-Zeitpunkt des vereinbarten Termins, IMMER in der Zukunft.",
        },
        notes: {
          type: "string",
          description: "Ein Satz, was im Termin besprochen wird.",
        },
      },
      required: ["datetime"],
    },
  },
  async: false,
  server: { url: TOOLS_WEBHOOK_URL },
};

const logObjection: VapiTool = {
  type: "function",
  function: {
    name: "log_objection",
    description:
      "Loggt einen Einwand des Leads in Echtzeit. Aufrufen bei JEDEM inhaltlichen Einwand (Preis, Zeit, Zuständigkeit, Misstrauen, Datenschutz, etc.).",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["price", "timing", "competitor", "authority", "need", "trust", "data_concern", "other"],
          description: "Kategorie des Einwands.",
        },
        quote: {
          type: "string",
          description: "Wortlaut oder nahe Paraphrase des Einwands.",
        },
      },
      required: ["type", "quote"],
    },
  },
  async: false,
  server: { url: TOOLS_WEBHOOK_URL },
};

const requestFileUpload: VapiTool = {
  type: "function",
  function: {
    name: "request_file_upload",
    description:
      "Schickt dem Lead einen Upload-Link per SMS, damit er ein Foto oder ein Dokument hochladen kann (z.B. Zählerschrank-Foto für Handwerk, Grundbuch-Auszug für Real-Estate). Der Link ist 24h gültig.",
    parameters: {
      type: "object",
      properties: {
        file_type: {
          type: "string",
          enum: ["photo", "document"],
          description: "Photo (Bild) oder document (PDF).",
        },
        context_hint: {
          type: "string",
          description:
            "Kurze Beschreibung, was genau hochgeladen werden soll. Wird in der SMS angezeigt — z.B. 'Foto vom Zählerschrank'.",
        },
      },
      required: ["file_type", "context_hint"],
    },
  },
  async: false,
  server: { url: TOOLS_WEBHOOK_URL },
};

const qualifyLead: VapiTool = {
  type: "function",
  function: {
    name: "qualify_lead",
    description:
      "Markiert den Lead als qualifiziert oder disqualifiziert. Bei disqualifiziert UND Program hat on_disqualify='redirect_to_resource' wird automatisch eine Fallback-SMS mit der Ressource-URL geschickt. Nutze dies zentral im Coaching-Flow, aber auch im Real-Estate-Tire-Kicker-Fall.",
    parameters: {
      type: "object",
      properties: {
        qualified: {
          type: "boolean",
          description: "true = qualifiziert, false = disqualifiziert.",
        },
        disqualification_reason: {
          type: "string",
          description: "Bei qualified=false: kurzer Grund (z.B. 'Budget unter Schwelle').",
        },
        notes: {
          type: "string",
          description: "1-Satz-Summary des Gesprächs für den menschlichen Follow-up.",
        },
      },
      required: ["qualified"],
    },
  },
  async: false,
  server: { url: TOOLS_WEBHOOK_URL },
};

export const salesTools: VapiTool[] = [
  getProgram,
  getLeadContext,
  bookMeeting,
  logObjection,
  requestFileUpload,
  qualifyLead,
];
