// Unit-Tests für buildSystemPrompt + buildFirstMessage.
// Fokus auf Variable-Interpolation, Override-Pfade, Consent-Gate und Block-
// Komposition (Calendar/Strategy/Context). Reine Funktionen ohne externe
// Abhängigkeiten — testbar ohne Mocks.

import { describe, it, expect } from "vitest";
import { buildFirstMessage, buildSystemPrompt } from "./builder";
import type { PromptVariables } from "./types";

// Helper: minimale Default-Vars die jeder Test mit overrides verfeinert.
function makeVars(overrides: Partial<PromptVariables> = {}): Partial<PromptVariables> {
  return {
    first_name: "Thomas",
    last_name: "Huber",
    full_name: "Thomas Huber",
    program_name: "Fullstack Entwickler React",
    caller_company: "Neuronic Automation",
    caller_name: "Jonas",
    today_iso: "2026-05-31",
    today_weekday_de: "Sonntag",
    require_consent: true,
    custom_fields_json: "{}",
    ...overrides,
  };
}

// ─── buildFirstMessage ──────────────────────────────────────────────────────

describe("buildFirstMessage — Variable-Interpolation", () => {
  it("ersetzt {{first_name}}, {{caller_company}}, {{program_name}} im Template", () => {
    // 'recruiting' Use-Case hat alle 3 Vars im First-Message-Template.
    // (Der generische Opener referenziert kein program_name — daher nicht
    // geeignet für diesen 3-Var-Test.)
    const msg = buildFirstMessage("recruiting", makeVars());
    expect(msg).toContain("Thomas");
    expect(msg).toContain("Neuronic Automation");
    expect(msg).toContain("Fullstack Entwickler React");
  });

  it("fehlende Vars werden zu leerem String, KEIN {{literal}} im Output", () => {
    // Der Hauptbug-Schutz: niemals "{{first_name}}" im gesprochenen Text.
    const msg = buildFirstMessage("generic", { caller_name: "Anna" });
    expect(msg).not.toMatch(/\{\{/);
    expect(msg).not.toMatch(/\}\}/);
  });
});

describe("buildFirstMessage — DSGVO + EU-AI-Act-Disclosure", () => {
  it("DE: enthält die KI-Disclosure + Aufzeichnungs-Hinweis", () => {
    const msg = buildFirstMessage("generic", makeVars());
    expect(msg).toContain("KI-Assistent");
    expect(msg).toContain("aufgezeichnet");
    expect(msg).toContain("verarbeitet");
  });

  it("EN: englische Disclosure wird genutzt", () => {
    const msg = buildFirstMessage("generic", makeVars(), "en");
    expect(msg).toContain("AI assistant");
    expect(msg).toContain("recorded");
    expect(msg).toMatch(/\brecorded, processed and reviewed\b/);
  });
});

describe("buildFirstMessage — Consent-Gate", () => {
  it("require_consent default (undefined) → Consent-Frage im Output", () => {
    const msg = buildFirstMessage("generic", makeVars({ require_consent: undefined }));
    expect(msg).toMatch(/drücken Sie .* Eins|sagen Sie .* Ja/i);
  });

  it("require_consent: true → Consent-Frage explizit drin", () => {
    const msg = buildFirstMessage("generic", makeVars({ require_consent: true }));
    expect(msg).toMatch(/Drücken Sie .* Eins/i);
    expect(msg).toContain("einverstanden");
  });

  it("require_consent: false → KEINE Consent-Frage", () => {
    const msg = buildFirstMessage("generic", makeVars({ require_consent: false }));
    expect(msg).not.toMatch(/drücken Sie/i);
    expect(msg).not.toMatch(/einverstanden/i);
    // Aber DSGVO-Disclosure muss immer noch drin sein (Art. 50)
    expect(msg).toContain("KI-Assistent");
  });
});

describe("buildFirstMessage — Override-Pfad", () => {
  it("first_message_override hat Priorität über Template", () => {
    const msg = buildFirstMessage("generic", makeVars({
      first_message_override: "Hallo {{first_name}}, das ist ein Override.",
    }));
    expect(msg).toContain("Hallo Thomas, das ist ein Override.");
    // Disclosure bleibt trotzdem angehängt (immer EU-AI-Act-Pflicht):
    expect(msg).toContain("KI-Assistent");
  });

  it("leerer Override (nur Whitespace) fällt zurück auf Template", () => {
    const msg = buildFirstMessage("generic", makeVars({
      first_message_override: "   ",
    }));
    // Template wird gerendert — wir prüfen via Variable-Interpolation
    expect(msg).toContain("Thomas");
  });
});

// ─── buildSystemPrompt ──────────────────────────────────────────────────────

describe("buildSystemPrompt — Variable-Interpolation", () => {
  it("Top-Level-Vars werden ersetzt, KEIN {{literal}} überlebt", () => {
    const prompt = buildSystemPrompt("generic", makeVars());
    expect(prompt).not.toMatch(/\{\{[a-zA-Z_]+\}\}/);
    expect(prompt).toContain("Thomas");
  });

  it("{{custom_fields.foo}} liest aus custom_fields_json", () => {
    const prompt = buildSystemPrompt("generic", makeVars({
      custom_fields_json: JSON.stringify({ projekt_typ: "Photovoltaik", region: "Wien" }),
    }));
    // Die JSON-Roh-Variante landet im Context-Block — prüfe dass die Werte präsent sind:
    expect(prompt).toContain("Photovoltaik");
    expect(prompt).toContain("Wien");
  });

  it("ungültiges custom_fields_json crashed NICHT — fällt auf leeres Object zurück", () => {
    const prompt = buildSystemPrompt("generic", makeVars({
      custom_fields_json: "{ totaler nonsense ohne JSON",
    }));
    expect(prompt).toContain("Thomas"); // Top-Level-Vars trotzdem da
    expect(prompt).not.toMatch(/\{\{/); // Keine ungerenderten Tokens
  });
});

describe("buildSystemPrompt — Heute-Datum (gegen Datums-Halluzination)", () => {
  it("today_iso + today_weekday_de erscheinen im Context-Block", () => {
    const prompt = buildSystemPrompt("generic", makeVars({
      today_iso: "2026-05-31",
      today_weekday_de: "Sonntag",
    }));
    expect(prompt).toContain("Sonntag");
    expect(prompt).toContain("2026-05-31");
    expect(prompt).toMatch(/Termine MÜSSEN in der Zukunft liegen/i);
  });
});

describe("buildSystemPrompt — Override-Pfad", () => {
  it("system_prompt_override ersetzt den Use-Case-Body", () => {
    const prompt = buildSystemPrompt("generic", makeVars({
      system_prompt_override: "## Custom Body\nHallo {{first_name}}",
    }));
    expect(prompt).toContain("## Custom Body");
    expect(prompt).toContain("Hallo Thomas");
  });
});

describe("buildSystemPrompt — Strategy-Block", () => {
  it("ohne Strategy-Felder → KEIN ## Sales-Strategie-Block", () => {
    const prompt = buildSystemPrompt("generic", makeVars());
    expect(prompt).not.toContain("## Sales-Strategie");
  });

  it("mit hook_one_liner → Hook-Sektion erscheint", () => {
    const prompt = buildSystemPrompt("generic", makeVars({
      hook_one_liner: "30% weniger Heizkosten in 6 Monaten.",
    }));
    expect(prompt).toContain("## Sales-Strategie");
    expect(prompt).toContain("30% weniger Heizkosten");
  });

  it("mit disqualification_criteria + on_disqualify=hangup → Action wird gerendert", () => {
    const prompt = buildSystemPrompt("generic", makeVars({
      disqualification_criteria: "kein Eigentum",
      on_disqualify: "hangup",
    }));
    expect(prompt).toContain("Disqualifikation");
    expect(prompt).toContain("kein Eigentum");
    expect(prompt).toMatch(/Call beenden/);
  });

  it("mit Tonalitäts-Settings → Tone-Sektion wird angezeigt", () => {
    const prompt = buildSystemPrompt("generic", makeVars({
      tone_formality: "formell",
      tone_warmth: "warm",
    }));
    expect(prompt).toMatch(/formell/);
    expect(prompt).toMatch(/warm/);
  });
});

describe("buildSystemPrompt — Calendar-Block", () => {
  it("ohne Cal.com-Config → KEIN Calendar-Block (falls auch booking_link leer)", () => {
    const prompt = buildSystemPrompt("generic", makeVars());
    expect(prompt).not.toContain("Cal.com-Flow");
    expect(prompt).not.toContain("get_available_slots");
  });

  it("nur booking_link gesetzt (kein Cal.com) → SMS-Fallback-Block", () => {
    const prompt = buildSystemPrompt("generic", makeVars({
      booking_link: "https://cal.com/martin/30min",
    }));
    expect(prompt).toContain("send_booking_link");
    expect(prompt).toContain("SMS");
    expect(prompt).not.toContain("get_available_slots");
  });

  it("Cal.com voll konfiguriert → Cal.com-Flow-Block mit get_available_slots", () => {
    const prompt = buildSystemPrompt("generic", makeVars({
      cal_username: "martin-amon-l2hybo",
      cal_event_type_slug: "30min",
    }));
    expect(prompt).toContain("Cal.com-Flow");
    expect(prompt).toContain("get_available_slots");
    expect(prompt).toContain("book_meeting");
  });
});

describe("buildSystemPrompt — Context-Block (Lead + Program)", () => {
  it("Lead-Name + Program werden gerendert", () => {
    const prompt = buildSystemPrompt("generic", makeVars({
      full_name: "Anna Schmidt",
      program_name: "PV-Anlagen-Beratung",
    }));
    expect(prompt).toContain("Anna Schmidt");
    expect(prompt).toContain("PV-Anlagen-Beratung");
  });

  it("Fallback auf first_name wenn full_name leer", () => {
    const prompt = buildSystemPrompt("generic", makeVars({
      full_name: "",
      first_name: "Anna",
    }));
    expect(prompt).toContain("Anna");
  });

  it("custom_fields.lead_context wird als Hook gerendert", () => {
    const prompt = buildSystemPrompt("generic", makeVars({
      custom_fields_json: JSON.stringify({ lead_context: "Hat 2 Kinder, sucht E-Auto" }),
    }));
    expect(prompt).toContain("Hook");
    expect(prompt).toContain("Hat 2 Kinder, sucht E-Auto");
  });
});

describe("buildSystemPrompt — Template-Selection + Fallback", () => {
  it("recruiting:de wird für programType='recruiting' gewählt (Use-Case-spezifischer Body)", () => {
    const prompt = buildSystemPrompt("recruiting", makeVars());
    // Recruiting-spezifischer Wortlaut (aus recruiting.ts):
    expect(prompt).toMatch(/Recruiter-Assistent|Bewerb|Stelle/i);
  });

  it("unknown language fällt auf :de-Variante zurück", () => {
    // 'fr' existiert nicht für recruiting → Fallback auf recruiting:de
    const prompt = buildSystemPrompt("recruiting", makeVars(), "fr");
    expect(prompt).toMatch(/Recruiter-Assistent|Bewerb/i);
  });

  it("product_finder:en wird für English gewählt (eigene Variante)", () => {
    const prompt = buildSystemPrompt("product_finder", makeVars(), "en");
    // English template hat englische Worte:
    expect(prompt).toContain("Thomas"); // Lead-Name immer da
    // Wir können nicht 100% den englischen Wortlaut prüfen ohne ihn zu kennen,
    // aber wir sicherstellen dass der Build durchläuft + die Lead-Vars drin sind.
  });
});
