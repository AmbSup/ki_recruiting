import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyN8nSecret } from "@/lib/auth/guards";
import { sendOfferLink } from "@/lib/notifications/twilio";

export const maxDuration = 30;
export const runtime = "nodejs";

/**
 * POST /api/sales/offers/send-link
 *
 * Wird vom n8n-`send_offer_link`-Tool-Branch aufgerufen, wenn der Vapi-
 * Assistant dem Kunden den Detail-Link zum gerade besprochenen Angebot
 * per SMS UND WhatsApp schicken soll.
 *
 * Body: { sales_lead_id }
 *
 * Auflösung:
 *   1. Lade Lead → phone, first_name, custom_fields.matched_offer_id
 *   2. Lade sales_offers-Row via matched_offer_id
 *   3. Twilio: SMS + WhatsApp parallel via sendOfferLink()
 *
 * Wenn matched_offer_id fehlt (z.B. kein Pre-Match passierte) → 422.
 */
export async function POST(req: NextRequest) {
  const auth = verifyN8nSecret(req);
  if (!auth.ok) return auth.response;

  let body: { sales_lead_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { sales_lead_id } = body;
  if (!sales_lead_id) {
    return NextResponse.json({ error: "sales_lead_id fehlt" }, { status: 422 });
  }

  const supabase = createAdminClient();
  const { data: leadRaw } = await supabase
    .from("sales_leads")
    .select("phone, first_name, custom_fields, program:sales_programs(language, program_type)")
    .eq("id", sales_lead_id)
    .maybeSingle();

  if (!leadRaw) {
    return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 });
  }

  const lead = leadRaw as unknown as {
    phone: string;
    first_name: string | null;
    custom_fields: Record<string, unknown> | null;
    program: { language: string | null; program_type: string | null } | { language: string | null; program_type: string | null }[] | null;
  };
  const programObj = Array.isArray(lead.program) ? lead.program[0] : lead.program;
  const language = (programObj?.language ?? "de").toLowerCase();
  const isEn = language === "en";
  const programType = programObj?.program_type ?? "generic";

  const customFields = (lead.custom_fields ?? {}) as Record<string, unknown>;
  const offerId = typeof customFields.matched_offer_id === "string"
    ? customFields.matched_offer_id
    : null;
  if (!offerId) {
    return NextResponse.json(
      { error: "Kein matched_offer_id am Lead — kann nichts schicken." },
      { status: 422 },
    );
  }

  const { data: offer } = await supabase
    .from("sales_offers")
    .select("name, detail_url, image_url")
    .eq("id", offerId)
    .maybeSingle();

  if (!offer) {
    return NextResponse.json(
      { error: "Gemachtes Angebot nicht mehr verfügbar" },
      { status: 404 },
    );
  }

  // Channel per program_type. product_finder (Reise-Konfigurator) nutzt
  // WhatsApp, alles andere bleibt SMS. Muss konsistent zu notify_channels
  // im trigger-call sein, sonst sagt der Bot "WhatsApp" und der Lead
  // bekommt SMS (oder umgekehrt).
  // Voraussetzung WhatsApp: TWILIO_WHATSAPP_NUMBER + TWILIO_WHATSAPP_CONTENT_SID
  // gesetzt. Wenn nicht, skippt sendWhatsApp graceful und der Link kommt
  // nicht beim Lead an.
  const channels: ("sms" | "whatsapp")[] = programType === "product_finder"
    ? ["whatsapp"]
    : ["sms"];

  try {
    const result = await sendOfferLink({
      toPhone: lead.phone,
      channels,
      leadFirstName: lead.first_name ?? undefined,
      offerName: offer.name,
      detailUrl: offer.detail_url,
      imageUrl: offer.image_url ?? undefined,
      language,
    });
    return NextResponse.json({
      success: result.errors.length === 0 || Boolean(result.smsSid || result.whatsappSid),
      sms_sid: result.smsSid ?? null,
      whatsapp_sid: result.whatsappSid ?? null,
      errors: result.errors,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Send-Link failed";
    console.error("[offers/send-link]", e);
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }
}
