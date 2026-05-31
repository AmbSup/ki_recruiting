// Unit-Tests für den minimalen CSV-Parser.
// Deckt RFC-4180-typische Edge-Cases ab: Quoting, escaped Quotes, CRLF/LF,
// Leerzeilen, fehlende trailing Felder, Header-Normalisierung.

import { describe, it, expect } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv — Standard-Fälle", () => {
  it("parsed einfache Header + Zeilen", () => {
    const result = parseCsv("name,email\nThomas,thomas@example.com\nAnna,anna@example.com");
    expect(result.headers).toEqual(["name", "email"]);
    expect(result.rows).toEqual([
      { name: "Thomas", email: "thomas@example.com" },
      { name: "Anna", email: "anna@example.com" },
    ]);
  });

  it("Header werden zu lowercase normalisiert + getrimmt", () => {
    const result = parseCsv("  Name , E-Mail \nThomas,thomas@example.com");
    expect(result.headers).toEqual(["name", "e-mail"]);
    expect(result.rows[0]).toEqual({ name: "Thomas", "e-mail": "thomas@example.com" });
  });

  it("Werte werden getrimmt", () => {
    const result = parseCsv("name,phone\n  Thomas  ,  +43676123  ");
    expect(result.rows[0]).toEqual({ name: "Thomas", phone: "+43676123" });
  });
});

describe("parseCsv — Quoting (RFC 4180)", () => {
  it("Komma innerhalb gequoteter Felder wird nicht als Trenner gewertet", () => {
    // Häufig bei Adressen: "Berlin, Deutschland"
    const result = parseCsv('name,address\n"Thomas","Berlin, Deutschland"');
    expect(result.rows[0]).toEqual({ name: "Thomas", address: "Berlin, Deutschland" });
  });

  it('doppeltes Quote ("") innerhalb gequoteter Felder wird zu einem "', () => {
    // CSV-Standard: "Hallo ""Welt""" → Hallo "Welt"
    const result = parseCsv('quote\n"Er sagte ""Hallo"" zu mir"');
    expect(result.rows[0]).toEqual({ quote: 'Er sagte "Hallo" zu mir' });
  });

  it("Newline innerhalb gequoteter Felder bleibt erhalten", () => {
    const result = parseCsv('name,bio\n"Anna","Zeile 1\nZeile 2"');
    expect(result.rows[0]).toEqual({ name: "Anna", bio: "Zeile 1\nZeile 2" });
  });
});

describe("parseCsv — Zeilen-Trenner", () => {
  it("CRLF (Windows-Excel-Export) funktioniert wie LF", () => {
    const result = parseCsv("name,age\r\nThomas,42\r\nAnna,38");
    expect(result.rows).toEqual([
      { name: "Thomas", age: "42" },
      { name: "Anna", age: "38" },
    ]);
  });

  it("Trailing Leerzeile wird ignoriert (nicht als leere Row gerendert)", () => {
    const result = parseCsv("name\nThomas\n\n");
    expect(result.rows).toEqual([{ name: "Thomas" }]);
  });

  it("Leerzeilen MITTEN im File werden übersprungen", () => {
    const result = parseCsv("name\nThomas\n\nAnna");
    expect(result.rows).toEqual([{ name: "Thomas" }, { name: "Anna" }]);
  });
});

describe("parseCsv — fehlende Felder + Ränder", () => {
  it("fehlende trailing Felder werden zu leerem String", () => {
    // Zeile hat weniger Spalten als Header → restliche Felder sind ""
    const result = parseCsv("name,email,phone\nThomas,thomas@example.com");
    expect(result.rows[0]).toEqual({ name: "Thomas", email: "thomas@example.com", phone: "" });
  });

  it("komplett leerer Input gibt leeres Result", () => {
    const result = parseCsv("");
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it("nur Header-Zeile (keine Daten) ergibt leere rows", () => {
    const result = parseCsv("name,email");
    expect(result.headers).toEqual(["name", "email"]);
    expect(result.rows).toEqual([]);
  });
});
