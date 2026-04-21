// Minimale Telefonnummer-Normalisierung Richtung E.164.
// Kein libphonenumber-Dependency — bewusst pragmatisch für AT/DE-Standard.
// Default-Country-Code +43 (Austria), überschreibbar pro Aufruf.

export function normalizePhone(input: string | null | undefined, defaultCountry: "AT" | "DE" = "AT"): string | null {
  if (!input) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  // Alle Whitespaces, Bindestriche, Klammern, Schrägstriche entfernen
  let cleaned = raw.replace(/[\s\-()\/]/g, "");

  // Führende 00 → +
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  // Schon E.164?
  if (cleaned.startsWith("+")) {
    return /^\+\d{6,16}$/.test(cleaned) ? cleaned : null;
  }

  // Führende 0 + Default-Country auf AT/DE Code
  if (cleaned.startsWith("0")) {
    const cc = defaultCountry === "DE" ? "+49" : "+43";
    return cc + cleaned.slice(1);
  }

  // Sonst: mit + prefixen (User hat evtl. Landesvorwahl ohne + eingegeben)
  if (/^\d{6,16}$/.test(cleaned)) return "+" + cleaned;

  return null;
}

// Terminal-Status, die bei Re-Submission NICHT auf "new" zurückgesetzt werden
export const TERMINAL_SALES_LEAD_STATUSES = [
  "contacted",
  "meeting_booked",
  "not_interested",
  "do_not_call",
] as const;

export function isTerminalSalesStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return (TERMINAL_SALES_LEAD_STATUSES as readonly string[]).includes(status);
}
