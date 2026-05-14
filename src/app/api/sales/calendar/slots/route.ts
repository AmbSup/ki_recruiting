import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAvailableSlots, resolveCalIdentity } from "@/lib/cal-com/client";
import { formatSlots } from "@/lib/cal-com/format-slots";
import { requireWriterOrN8n } from "@/lib/auth/guards";

export const maxDuration = 30;
export const runtime = "nodejs";

// GET /api/sales/calendar/slots?program_id=...&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
//
// Liefert verfügbare Slots aus Cal.com, formatiert für Vapi-Vorlesen.
// Wird aufgerufen von:
//  1. Dem n8n-Workflow `Sales — Vapi Data Tools` als Reaktion auf das Vapi-Tool
//     `get_available_slots` während eines Live-Calls.
//  2. Optional vom UI (z.B. zum Debuggen vor einem Call).
//
// Auth: keine — der Endpoint ist für n8n + UI server-side, hat aber keine PII.
// Default-Range: heute bis +14 Tage.

export async function GET(req: NextRequest) {
  const auth = await requireWriterOrN8n(req);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get("program_id");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const limit = Number(searchParams.get("limit") ?? 5);

  if (!programId) {
    return NextResponse.json({ error: "program_id erforderlich" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: program, error: pErr } = await supabase
    .from("sales_programs")
    .select("id, cal_username, cal_event_type_slug, cal_timezone")
    .eq("id", programId)
    .single();
  if (pErr || !program) {
    return NextResponse.json({ error: "Sales-Program nicht gefunden" }, { status: 404 });
  }

  const cal = resolveCalIdentity(program);
  if (!cal) {
    return NextResponse.json(
      {
        error:
          "Cal.com-Konfiguration fehlt — bitte cal_username + cal_event_type_slug am Sales-Program setzen oder CAL_COM_DEFAULT_USERNAME/CAL_COM_DEFAULT_EVENT_TYPE_SLUG als Env-Var.",
      },
      { status: 422 },
    );
  }

  // Date-Range: in TZ des Programs interpretieren, nicht UTC.
  // Default: heute 00:00 → heute+14 23:59 in der gewählten TZ.
  const now = new Date();
  const startDate = dateFrom ? new Date(dateFrom + "T00:00:00") : now;
  const endDate = dateTo
    ? new Date(dateTo + "T23:59:59")
    : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  let slots;
  try {
    slots = await fetchAvailableSlots({
      username: cal.username,
      eventTypeSlug: cal.eventTypeSlug,
      startISO: startDate.toISOString(),
      endISO: endDate.toISOString(),
      timeZone: cal.timezone,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[calendar/slots] cal.com error:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const formatted = formatSlots(slots, isFinite(limit) && limit > 0 ? limit : 5, cal.timezone);

  return NextResponse.json({
    program_id: programId,
    timezone: cal.timezone,
    count: formatted.length,
    slots: formatted,
  });
}
