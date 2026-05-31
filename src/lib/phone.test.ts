// Unit-Tests für normalizePhone + Status-Helfer.
// Konvention: Test-Datei liegt NEBEN dem Source — `phone.ts` → `phone.test.ts`.
// Vitest findet sie automatisch über das `*.test.ts`-Pattern.

import { describe, it, expect } from "vitest";
import { normalizePhone, isTerminalSalesStatus, isHardOptOutStatus } from "./phone";

// ─── normalizePhone ─────────────────────────────────────────────────────────
// `describe` gruppiert thematisch verwandte Tests. Reine Lesbarkeit, keine Logik.

describe("normalizePhone — österreichische Eingaben (Default)", () => {
  // Jeder einzelne `it`/`test`-Block ist EIN Test mit EINER konkreten Erwartung.

  it("0-Prefix wird zu +43", () => {
    expect(normalizePhone("06763165057")).toBe("+436763165057");
  });

  it("Whitespace und Bindestriche werden entfernt", () => {
    expect(normalizePhone("0676 3165 057")).toBe("+436763165057");
    expect(normalizePhone("0676-3165-057")).toBe("+436763165057");
    expect(normalizePhone("0676 / 3165 057")).toBe("+436763165057");
    expect(normalizePhone("(0676) 3165057")).toBe("+436763165057");
  });

  it("00-Prefix (alte internationale Notation) wird zu +", () => {
    expect(normalizePhone("00436763165057")).toBe("+436763165057");
  });

  it("Bereits E.164-Format bleibt unverändert", () => {
    expect(normalizePhone("+436763165057")).toBe("+436763165057");
  });
});

describe("normalizePhone — deutsche Eingaben (defaultCountry: DE)", () => {
  it("0-Prefix wird zu +49 wenn defaultCountry DE", () => {
    expect(normalizePhone("01731234567", "DE")).toBe("+491731234567");
  });

  it("E.164 wird respektiert auch wenn defaultCountry DE", () => {
    // Wenn schon Ländervorwahl → defaultCountry ignorieren
    expect(normalizePhone("+436763165057", "DE")).toBe("+436763165057");
  });
});

describe("normalizePhone — ungültige Eingaben", () => {
  it("null und undefined ergeben null", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
  });

  it("leerer String ergibt null", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull(); // nur Whitespace
  });

  it("Buchstaben ergeben null", () => {
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("0676abc")).toBeNull();
  });

  it("zu kurze E.164 ergibt null (< 6 Ziffern)", () => {
    expect(normalizePhone("+43123")).toBeNull();
  });

  it("zu lange E.164 ergibt null (> 16 Ziffern)", () => {
    expect(normalizePhone("+4367631650571234567")).toBeNull();
  });
});

// ─── Status-Helfer ──────────────────────────────────────────────────────────

describe("isTerminalSalesStatus", () => {
  it("erkennt Terminal-Stati als true", () => {
    expect(isTerminalSalesStatus("contacted")).toBe(true);
    expect(isTerminalSalesStatus("meeting_booked")).toBe(true);
    expect(isTerminalSalesStatus("not_interested")).toBe(true);
    expect(isTerminalSalesStatus("do_not_call")).toBe(true);
  });

  it("aktive Stati sind nicht terminal", () => {
    expect(isTerminalSalesStatus("new")).toBe(false);
    expect(isTerminalSalesStatus("in_progress")).toBe(false);
  });

  it("null und undefined sind nicht terminal", () => {
    expect(isTerminalSalesStatus(null)).toBe(false);
    expect(isTerminalSalesStatus(undefined)).toBe(false);
  });
});

describe("isHardOptOutStatus — Schutz gegen Belästigung", () => {
  it("not_interested und do_not_call sind Hard-Opt-Out", () => {
    expect(isHardOptOutStatus("not_interested")).toBe(true);
    expect(isHardOptOutStatus("do_not_call")).toBe(true);
  });

  it("contacted und meeting_booked sind NUR soft-terminal, kein Opt-Out", () => {
    // Wichtige Business-Regel: bei Funnel-Resubmit dürfen wir hier
    // re-engagen — der Lead hat selbst nochmal Interesse gezeigt.
    expect(isHardOptOutStatus("contacted")).toBe(false);
    expect(isHardOptOutStatus("meeting_booked")).toBe(false);
  });
});
