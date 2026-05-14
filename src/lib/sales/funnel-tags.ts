/**
 * Mappt Funnel-Antworten auf Preference-Tags, gesteuert durch eine pro-Program
 * konfigurierte Tag-Map in `sales_programs.call_strategy.matching.funnel_tag_map`.
 *
 * Beispiel-Konfig:
 *   {
 *     "Region": { "Asien": "asia", "USA": "usa" },
 *     "Stil":   { "Aktiv": "active", "Sightseeing": "sightseeing" }
 *   }
 *
 * funnel_responses sieht typischerweise so aus (von /api/apply gebaut):
 *   { "Region": "Asien", "Stil": "Aktiv" }
 * oder mit Multi-Select / verschachtelt:
 *   { "Region": ["Asien"], "Tags": { "stil": "Aktiv" } }
 *
 * Wir laufen die Map durch und schauen für jeden Question-Key, ob es im
 * funnel_responses einen passenden Antwort-String gibt. Matching case-insensitive
 * + trimmed. Multi-Select-Arrays werden komplett gematcht.
 */
export function extractPreferenceTags(
  funnelResponses: Record<string, unknown> | null | undefined,
  tagMap: Record<string, Record<string, string>> | null | undefined,
): string[] {
  if (!funnelResponses || !tagMap) return [];
  const tags = new Set<string>();

  for (const [questionKey, answerMap] of Object.entries(tagMap)) {
    const answers = collectAnswerStrings(funnelResponses, questionKey);
    if (answers.length === 0) continue;

    // Normalize answer map keys for case-insensitive lookup
    const normalizedAnswerMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(answerMap)) {
      normalizedAnswerMap[normalize(k)] = v;
    }

    for (const answer of answers) {
      const tag = normalizedAnswerMap[normalize(answer)];
      if (tag) tags.add(tag);
    }
  }

  return Array.from(tags);
}

/**
 * Sucht im funnel_responses den (eventuell verschachtelten) Wert zum Question-Key
 * und gibt alle gefundenen Antwort-Strings zurück. Unterstützt String, String[],
 * und Objekt-Werte mit Nesting auf einer Ebene.
 */
function collectAnswerStrings(
  responses: Record<string, unknown>,
  questionKey: string,
): string[] {
  const direct = findValueByKey(responses, questionKey);
  if (direct === null) return [];
  return flattenStrings(direct);
}

function findValueByKey(obj: Record<string, unknown>, key: string): unknown {
  // direkter Match (case-insensitive)
  for (const k of Object.keys(obj)) {
    if (normalize(k) === normalize(key)) return obj[k];
  }
  // eine Ebene tiefer (falls funnel_responses geschachtelt ist)
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const sub = findValueByKey(v as Record<string, unknown>, key);
      if (sub !== null) return sub;
    }
  }
  return null;
}

function flattenStrings(v: unknown): string[] {
  if (v === null || v === undefined) return [];
  if (typeof v === "string") return v.trim() ? [v.trim()] : [];
  if (typeof v === "number" || typeof v === "boolean") return [String(v)];
  if (Array.isArray(v)) return v.flatMap(flattenStrings);
  // Objects: take top-level string values (z.B. {value: "Asien", label: "Asien"})
  if (typeof v === "object") {
    return Object.values(v as Record<string, unknown>).flatMap(flattenStrings);
  }
  return [];
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}
