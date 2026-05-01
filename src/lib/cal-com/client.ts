// Cal.com v2 API-Client (api.cal.com — funktioniert auch für cal.eu-Instanz,
// dort ist nur die public booking-page-Domain anders, API ist unified).
// Auth: Bearer + cal-api-version-Header.
// Docs: https://cal.com/docs/api-reference/v2/introduction

const CAL_API_BASE = "https://api.cal.com/v2";
const CAL_API_VERSION = "2024-09-04";

function authHeaders(): Record<string, string> {
  const key = process.env.CAL_COM_API_KEY;
  if (!key) {
    throw new Error("CAL_COM_API_KEY nicht gesetzt — bitte in Vercel-Env-Vars hinterlegen");
  }
  return {
    Authorization: `Bearer ${key}`,
    "cal-api-version": CAL_API_VERSION,
    "Content-Type": "application/json",
  };
}

// ─── Slots ────────────────────────────────────────────────────────────────────

export type CalSlot = { start: string; end: string };

/**
 * Fragt verfügbare Slots ab.
 * Cal.com gibt sie als Object zurück: { "YYYY-MM-DD": [{ start, end }] }.
 * Wir flatten zu einer einzigen Liste, sortiert aufsteigend nach start.
 */
export async function fetchAvailableSlots(opts: {
  username: string;
  eventTypeSlug: string;
  startISO: string; // ISO datetime, UTC oder mit TZ-Offset
  endISO: string;
  timeZone?: string; // default Europe/Vienna
}): Promise<CalSlot[]> {
  const params = new URLSearchParams({
    username: opts.username,
    eventTypeSlug: opts.eventTypeSlug,
    start: opts.startISO,
    end: opts.endISO,
    timeZone: opts.timeZone ?? "Europe/Vienna",
  });
  const url = `${CAL_API_BASE}/slots?${params.toString()}`;
  const res = await fetch(url, { headers: authHeaders(), method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cal.com /slots ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    status: string;
    data: Record<string, Array<{ start: string; end?: string }>>;
  };
  const slots: CalSlot[] = [];
  for (const day of Object.values(json.data ?? {})) {
    for (const s of day) {
      // Manche Cal.com-Versionen geben nur start zurück; end ableiten aus next-slot
      // oder default 30 Min. Hier: best-effort default 30 Min wenn end fehlt.
      const start = s.start;
      const end = s.end ?? new Date(new Date(start).getTime() + 30 * 60 * 1000).toISOString();
      slots.push({ start, end });
    }
  }
  slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return slots;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export type CalBookingResult = {
  uid: string;
  id: number | string;
  start: string;
  end: string;
  status: string;
};

/**
 * Erzeugt eine Buchung. Lead-Email ist Pflicht (Cal.com kann ohne nicht buchen).
 * Bei Slot-already-taken (409) oder anderem 4xx wirft die Funktion — Caller muss
 * den Fehler abfangen und auf SMS-Fallback umschwenken.
 */
export async function createBooking(opts: {
  eventTypeSlug: string;
  username: string;
  start: string; // ISO datetime
  attendee: {
    name: string;
    email: string;
    timeZone?: string;
    phoneNumber?: string;
  };
  metadata?: Record<string, string>;
  notes?: string;
}): Promise<CalBookingResult> {
  const body = {
    start: opts.start,
    eventTypeSlug: opts.eventTypeSlug,
    username: opts.username,
    attendee: {
      name: opts.attendee.name,
      email: opts.attendee.email,
      timeZone: opts.attendee.timeZone ?? "Europe/Vienna",
      ...(opts.attendee.phoneNumber ? { phoneNumber: opts.attendee.phoneNumber } : {}),
    },
    ...(opts.metadata ? { metadata: opts.metadata } : {}),
    ...(opts.notes ? { bookingFieldsResponses: { notes: opts.notes } } : {}),
  };
  const res = await fetch(`${CAL_API_BASE}/bookings`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cal.com /bookings ${res.status}: ${text.slice(0, 400)}`);
  }
  const json = (await res.json()) as {
    status: string;
    data: { uid: string; id: number | string; start: string; end: string; status: string };
  };
  return json.data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolves cal_username + cal_event_type_slug from a sales_program with env-fallback. */
export function resolveCalIdentity(program: {
  cal_username?: string | null;
  cal_event_type_slug?: string | null;
  cal_timezone?: string | null;
}): { username: string; eventTypeSlug: string; timezone: string } | null {
  const username = program.cal_username?.trim() || process.env.CAL_COM_DEFAULT_USERNAME;
  const eventTypeSlug =
    program.cal_event_type_slug?.trim() || process.env.CAL_COM_DEFAULT_EVENT_TYPE_SLUG;
  const timezone = program.cal_timezone?.trim() || "Europe/Vienna";
  if (!username || !eventTypeSlug) return null;
  return { username, eventTypeSlug, timezone };
}
