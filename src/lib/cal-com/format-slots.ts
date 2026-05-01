import type { CalSlot } from "./client";

// Wandelt Cal.com-Slots in für Vapi-Vorlesen taugliche DACH-Labels.
// Beispiel: { start: "2026-05-05T09:00:00+02:00" } → "Dienstag, 5. Mai um 09:00"

const WEEKDAY_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const MONTH_DE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export type FormattedSlot = {
  start: string;            // ISO, unverändert für API-Booking
  end: string;
  label_de: string;         // "Dienstag, 5. Mai um 09:00"
  date_iso: string;         // "2026-05-05" für Logik
  time_iso: string;         // "09:00" für Logik
};

/**
 * Formatiert eine Slot-Liste für Voice-Output.
 * Gibt MAX `limit` Slots zurück, gleichmäßig verteilt über das Zeitfenster
 * (nicht nur die ersten 5 vom selben Tag), damit der AI dem Lead "Donnerstag oder
 * Freitag" anbieten kann statt "9:00, 9:30, 10:00 am selben Vormittag".
 */
export function formatSlots(slots: CalSlot[], limit = 5, timeZone = "Europe/Vienna"): FormattedSlot[] {
  if (slots.length === 0) return [];

  // Group by date
  const byDate = new Map<string, CalSlot[]>();
  for (const s of slots) {
    const date = new Date(s.start).toLocaleDateString("sv-SE", { timeZone }); // "YYYY-MM-DD"
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(s);
  }

  // Round-robin über Tage: zuerst Slot 0 von jedem Tag, dann Slot 1, ...
  const days = [...byDate.values()];
  const picked: CalSlot[] = [];
  let idx = 0;
  while (picked.length < limit) {
    let added = false;
    for (const day of days) {
      if (idx < day.length) {
        picked.push(day[idx]);
        if (picked.length >= limit) break;
        added = true;
      }
    }
    if (!added) break;
    idx += 1;
  }

  return picked.map((s) => formatOne(s, timeZone));
}

function formatOne(s: CalSlot, timeZone: string): FormattedSlot {
  const d = new Date(s.start);
  // toLocaleString ist hier zuverlässiger als Intl.DateTimeFormat-formatToParts für TZ
  const parts = new Intl.DateTimeFormat("de-AT", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  // Fallbacks falls Intl mal abweicht (Node-Version, Locale-Daten):
  const wd = get("weekday") || WEEKDAY_DE[d.getUTCDay()];
  const day = get("day") || String(d.getUTCDate());
  const month = get("month") || MONTH_DE[d.getUTCMonth()];
  const hour = get("hour") || String(d.getUTCHours()).padStart(2, "0");
  const minute = get("minute") || String(d.getUTCMinutes()).padStart(2, "0");

  const label_de = `${wd}, ${day}. ${month} um ${hour}:${minute}`;
  const date_iso = d.toLocaleDateString("sv-SE", { timeZone });
  const time_iso = `${hour}:${minute}`;
  return { start: s.start, end: s.end, label_de, date_iso, time_iso };
}
