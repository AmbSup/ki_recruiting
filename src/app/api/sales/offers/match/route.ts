import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyN8nSecret } from "@/lib/auth/guards";
import { matchOfferForLead } from "@/lib/sales/match";
import type { Json } from "@/types/database";

export const maxDuration = 30;

/**
 * POST /api/sales/offers/match
 *
 * Wird vom n8n-`match_offer`-Tool-Branch aufgerufen, wenn der Vapi-Assistant
 * mid-Call ein Re-Match anfordert (Lead will doch was anderes als das pre-
 * gematche Angebot).
 *
 * Body: { sales_lead_id, sales_program_id?, preference_tags }
 *   - sales_program_id ist optional: wenn nicht mitgegeben, leiten wir es
 *     aus dem Lead ab.
 *
 * Persistiert das neue matched_offer_id in sales_leads.custom_fields, damit
 * der nachfolgende send_offer_link-Tool-Call das richtige Offer schickt.
 */
export async function POST(req: NextRequest) {
  const auth = verifyN8nSecret(req);
  if (!auth.ok) return auth.response;

  let body: {
    sales_lead_id?: string;
    sales_program_id?: string;
    preference_tags?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { sales_lead_id } = body;
  if (!sales_lead_id) {
    return NextResponse.json({ error: "sales_lead_id fehlt" }, { status: 422 });
  }
  const tagsRaw = Array.isArray(body.preference_tags) ? body.preference_tags : [];
  const preference_tags = tagsRaw.filter((t): t is string => typeof t === "string");

  const supabase = createAdminClient();

  // Program-ID + Matching-Config aus Lead laden
  const { data: lead } = await supabase
    .from("sales_leads")
    .select("sales_program_id, custom_fields, program:sales_programs(call_strategy)")
    .eq("id", sales_lead_id)
    .maybeSingle();

  if (!lead) {
    return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 });
  }

  const programId = body.sales_program_id ?? lead.sales_program_id;
  const programRaw = Array.isArray(lead.program) ? lead.program[0] : lead.program;
  const callStrategy = (programRaw?.call_strategy ?? {}) as Record<string, unknown>;
  const matchingCfg = (callStrategy.matching ?? {}) as {
    min_match_score?: number;
    fallback_message?: string;
  };

  const result = await matchOfferForLead({
    supabase,
    sales_program_id: programId,
    preference_tags,
    min_score: matchingCfg.min_match_score,
    fallback_message: matchingCfg.fallback_message,
  });

  // Persist matched_offer_id in lead.custom_fields, falls Match
  if (result.offer) {
    const currentCustom = (lead.custom_fields ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = {
      ...currentCustom,
      matched_offer_id: result.offer.id,
      preference_tags,
    };
    await supabase
      .from("sales_leads")
      .update({ custom_fields: merged as Json })
      .eq("id", sales_lead_id);
  }

  return NextResponse.json({
    offer: result.offer
      ? {
          name: result.offer.name,
          summary: result.offer.summary,
          detail_url: result.offer.detail_url,
        }
      : null,
    score: result.score,
    fallback_message: result.offer ? null : (result as { fallback_message: string }).fallback_message,
  });
}
