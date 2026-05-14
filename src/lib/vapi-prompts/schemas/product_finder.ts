import { z } from "zod";
import type { FieldMetaMap } from "./index";

/**
 * Product-Finder: Discovery passiert im Funnel, der Call präsentiert nur.
 *
 * - `preference_tags`: gesetzt von /api/apply via funnel_tag_map (Operator-Config
 *   in `sales_programs.call_strategy.matching.funnel_tag_map`).
 * - `matched_offer_id`: gesetzt von /api/sales/trigger-call (Pre-Match) oder
 *   vom Vapi-Tool `match_offer` (Mid-Call Re-Match).
 *
 * Beide Felder sind reine System-Felder — Operator-Lead-Modal zeigt sie
 * read-only an. Funnel-Answers (frei) liegen in `sales_leads.funnel_responses`,
 * nicht hier.
 */
export const productFinderSchema = z.object({
  preference_tags: z.array(z.string()).optional(),
  matched_offer_id: z.string().uuid().optional(),
}).strict();

export const productFinderFieldMeta: FieldMetaMap = {
  preference_tags: { label: "Präferenz-Tags (auto)", type: "text" },
  matched_offer_id: { label: "Gemachtes Top-Angebot (ID)", type: "text" },
};
