// Normalisierung: Google-Maps-Places (Apify-Actor-Output) → sales_leads-Rows.
// Wichtig: consent_given=false, source='apify_gmaps', status='discovered'.
// Voice-Calls dürfen erst nach separatem Consent-Signal getriggert werden.

import { normalizePhone } from "@/lib/phone";
import type { ApifyGmapsPlace } from "./client";

export type NormalizedLead = {
  phone: string;
  email: string | null;
  company_name: string;
  first_name: null;
  last_name: null;
  full_name: null;
  role: null;
  linkedin_url: null;
  notes: string;
  custom_fields: Record<string, unknown>;
  source: "apify_gmaps";
  status: "discovered";
  consent_given: false;
};

/**
 * Konvertiere ein Apify-Google-Places-Ergebnis in eine sales_leads-Row.
 * Returnt null wenn keine gültige Telefonnummer extrahierbar ist (dann
 * gibt's keinen Weg dedupe zu machen — Zeile wird verworfen).
 */
export function normalizePlace(place: ApifyGmapsPlace): NormalizedLead | null {
  const phone = normalizePhone(place.phoneUnformatted ?? place.phone ?? null);
  if (!phone) return null;

  const email = firstValidEmail(place.emails);

  const notesParts: string[] = [];
  if (place.address) notesParts.push(`Adresse: ${place.address}`);
  if (place.categoryName) notesParts.push(`Kategorie: ${place.categoryName}`);
  if (typeof place.totalScore === "number") {
    notesParts.push(`Google-Rating: ${place.totalScore.toFixed(1)} (${place.reviewsCount ?? 0} Reviews)`);
  }
  if (place.website) notesParts.push(`Website: ${place.website}`);
  if (place.url) notesParts.push(`Google-Maps: ${place.url}`);

  return {
    phone,
    email,
    company_name: place.title?.trim() || "Unbekannter Betrieb",
    first_name: null,
    last_name: null,
    full_name: null,
    role: null,
    linkedin_url: null,
    notes: notesParts.join("\n"),
    custom_fields: {
      gmaps_place_id: place.placeId,
      gmaps_url: place.url,
      gmaps_categories: place.categories,
      gmaps_rating: place.totalScore,
      gmaps_reviews_count: place.reviewsCount,
      gmaps_website: place.website,
      gmaps_postal_code: place.postalCode,
      gmaps_city: place.city,
      gmaps_country: place.countryCode,
    },
    source: "apify_gmaps",
    status: "discovered",
    consent_given: false,
  };
}

function firstValidEmail(emails: string[] | undefined): string | null {
  if (!emails || emails.length === 0) return null;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  for (const raw of emails) {
    const trimmed = raw.trim().toLowerCase();
    if (emailRegex.test(trimmed)) return trimmed;
  }
  return null;
}

/**
 * Aktueller Wechselkurs USD → EUR. Für Budget-Cap-Rechnung.
 * Snapshot, kein Live-Fetch — Approximation ist ausreichend für Budget-Guard.
 * Update ~1x pro Quartal.
 */
export const USD_TO_EUR = 0.93;
