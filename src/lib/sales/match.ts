import type { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminClient>;
type OfferRow = Database["public"]["Tables"]["sales_offers"]["Row"];

export type MatchedOffer = {
  id: string;
  name: string;
  summary: string | null;
  description: string | null;
  detail_url: string;
  image_url: string | null;
  tags: string[];
  price_cents: number | null;
  currency: string | null;
  score: number;
};

export type MatchResult =
  | { offer: MatchedOffer; score: number }
  | { offer: null; score: 0; fallback_message: string };

/**
 * Sucht das beste Offer für eine Liste von Präferenz-Tags via Tag-Overlap.
 *
 * Algorithmus:
 *   1. Query sales_offers WHERE sales_program_id=? AND active=true
 *      AND (tags ?| array[…preference_tags])      ← GIN-Index
 *   2. In-Memory: Score = intersection(offer.tags, preference_tags).length
 *   3. Top-1 wenn Score ≥ min_score, sonst null + fallback_message
 *
 * Bei Score-Gleichstand gewinnt das zuletzt-aktualisierte Offer
 * (stabile Reihenfolge via updated_at DESC). LLM-Re-Ranking ist V2.
 */
export async function matchOfferForLead(opts: {
  supabase: AdminClient;
  sales_program_id: string;
  preference_tags: string[];
  min_score?: number;
  fallback_message?: string;
}): Promise<MatchResult> {
  const minScore = opts.min_score ?? 1;
  const fallback =
    opts.fallback_message ??
    "Wir kuratieren dir individuelle Optionen — unser Team meldet sich.";

  // Edge: keine Tags → kein Match möglich
  if (opts.preference_tags.length === 0) {
    return { offer: null, score: 0, fallback_message: fallback };
  }

  // PostgREST: tags ?| array['asia','active']  → "any of these tags exists"
  // Im JS-Client als overlaps via cs (contains) geht nicht für JSONB ?|; wir
  // bauen daher die Filter-Expression mit or() über mehrere cs-Calls für JEDEN
  // Tag, das ist äquivalent zum ?|-Operator und nutzt den GIN-Index.
  const orFilter = opts.preference_tags
    .map((tag) => `tags.cs.["${escapeJsonbStr(tag)}"]`)
    .join(",");

  const { data, error } = await opts.supabase
    .from("sales_offers")
    .select(
      "id, name, summary, description, detail_url, image_url, tags, price_cents, currency",
    )
    .eq("sales_program_id", opts.sales_program_id)
    .eq("active", true)
    .or(orFilter)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[match] sales_offers query error:", error);
    return { offer: null, score: 0, fallback_message: fallback };
  }

  const rows = (data ?? []) as Pick<
    OfferRow,
    "id" | "name" | "summary" | "description" | "detail_url" | "image_url" | "tags" | "price_cents" | "currency"
  >[];

  if (rows.length === 0) {
    return { offer: null, score: 0, fallback_message: fallback };
  }

  const prefSet = new Set(opts.preference_tags);
  let best: MatchedOffer | null = null;
  for (const row of rows) {
    const offerTags = normalizeTags(row.tags);
    const score = offerTags.reduce((acc, t) => acc + (prefSet.has(t) ? 1 : 0), 0);
    if (!best || score > best.score) {
      best = {
        id: row.id,
        name: row.name,
        summary: row.summary,
        description: row.description,
        price_cents: row.price_cents,
        currency: row.currency,
        detail_url: row.detail_url,
        image_url: row.image_url,
        tags: offerTags,
        score,
      };
    }
  }

  if (!best || best.score < minScore) {
    return { offer: null, score: 0, fallback_message: fallback };
  }
  return { offer: best, score: best.score };
}

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string");
}

// Escapt Anführungszeichen und Backslashes in JSON-Strings für PostgREST-Filter.
function escapeJsonbStr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
