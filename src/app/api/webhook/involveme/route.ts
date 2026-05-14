import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Typen für den Involve.me Webhook-Payload
// ---------------------------------------------------------------------------
interface InvolveMeResponse {
  questionId?: string;
  id?: string;
  question?: string;
  title?: string;
  type?: string;
  value?: string | string[] | null;
  values?: string[];
}

interface InvolveMePayload {
  submissionId?: string;
  submission_id?: string;
  projectId?: string;
  project_id?: string;
  projectTitle?: string;
  project_title?: string;
  submittedAt?: string;
  created_at?: string;
  contact?: { name?: string; email?: string; phone?: string };
  contacts?: { name?: string; email?: string; phone?: string }[];
  responses?: InvolveMeResponse[];
  fields?: InvolveMeResponse[];
  utmParams?: Record<string, string>;
  utm_params?: Record<string, string>;
  outcomes?: { id: string; title: string }[];
  outcome?: { id: string; title: string };
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen zum Parsen des Payloads
// ---------------------------------------------------------------------------

type ApplicantSource = "facebook" | "instagram" | "linkedin" | "direct" | "referral";
const APPLICANT_SOURCES: ReadonlySet<string> = new Set([
  "facebook", "instagram", "linkedin", "direct", "referral",
]);

function normalizeApplicantSource(raw: string | undefined | null): ApplicantSource {
  if (raw && APPLICANT_SOURCES.has(raw)) return raw as ApplicantSource;
  return "direct";
}

/** Gibt den ersten String-Wert aus value / values zurück */
function firstValue(r: InvolveMeResponse): string | null {
  if (typeof r.value === "string" && r.value.trim()) return r.value.trim();
  if (Array.isArray(r.value) && r.value.length) return r.value[0];
  if (Array.isArray(r.values) && r.values.length) return r.values[0];
  return null;
}

/** Gibt alle Werte als String zurück */
function allValues(r: InvolveMeResponse): string | null {
  if (Array.isArray(r.value)) return r.value.join(", ");
  if (Array.isArray(r.values)) return r.values.join(", ");
  if (typeof r.value === "string" && r.value.trim()) return r.value.trim();
  return null;
}

/** Normalisiert den Feldtyp (lowercase, snake_case) */
function normalizeType(r: InvolveMeResponse): string {
  return (r.type ?? "").toLowerCase().replace(/[\s-]/g, "_");
}

/** Gibt den Frage-Titel zurück */
function fieldTitle(r: InvolveMeResponse): string {
  return r.question ?? r.title ?? "";
}

/** Parst Name + E-Mail + Telefon + CV-URL aus den Responses */
function extractContactAndCv(responses: InvolveMeResponse[]): {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  cvFileUrl: string | null;
  qualificationAnswers: Record<string, string>;
} {
  let fullName: string | null = null;
  let email: string | null = null;
  let phone: string | null = null;
  let cvFileUrl: string | null = null;
  const qualificationAnswers: Record<string, string> = {};

  for (const r of responses) {
    const type = normalizeType(r);
    const title = fieldTitle(r).toLowerCase();
    const val = firstValue(r);
    const all = allValues(r);

    // --- Name ---
    if (!fullName && (type === "name" || type === "full_name" || title.includes("name"))) {
      fullName = val;
      continue;
    }

    // --- E-Mail ---
    if (!email && (type === "email" || title.includes("mail"))) {
      email = val;
      continue;
    }

    // --- Telefon ---
    if (!phone && (type === "phone" || type === "phone_number" || type === "tel" || title.includes("telefon") || title.includes("phone") || title.includes("mobil"))) {
      phone = val;
      continue;
    }

    // --- Lebenslauf (File Upload) ---
    if (!cvFileUrl && (type === "file_upload" || type === "file" || title.includes("lebenslauf") || title.includes("cv") || title.includes("resume"))) {
      cvFileUrl = val;
      continue;
    }

    // --- Alle anderen Felder → Qualifikationsantworten ---
    if (all !== null) {
      qualificationAnswers[fieldTitle(r) || r.questionId || r.id || "unbekannt"] = all;
    }
  }

  return { fullName, email, phone, cvFileUrl, qualificationAnswers };
}

// ---------------------------------------------------------------------------
// POST /api/webhook/involveme
//
// Query-Parameter:
//   funnel_id  – UUID des Funnels in der Datenbank (optional)
//   job_id     – UUID des Jobs, falls kein Funnel angegeben (optional)
//   secret     – Webhook-Secret zur Absicherung
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  // 1. Webhook-Secret prüfen
  const webhookSecret = process.env.INVOLVEME_WEBHOOK_SECRET;
  // Fail CLOSED: kein Secret konfiguriert → 500. Kein Query-String-Secret mehr,
  // weil URLs (inkl. Query) in Vercel-Logs landen. Header-only.
  if (!webhookSecret) {
    console.error("[involveme-webhook] INVOLVEME_WEBHOOK_SECRET nicht gesetzt");
    return NextResponse.json({ error: "Server misconfig" }, { status: 500 });
  }
  const providedSecret =
    req.headers.get("x-webhook-secret") ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (providedSecret !== webhookSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Payload parsen
  let payload: InvolveMePayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 3. Felder normalisieren (Involve.me sendet unterschiedliche Formate je nach Version)
  const responses: InvolveMeResponse[] = payload.responses ?? payload.fields ?? [];
  const utmParams: Record<string, string> = payload.utmParams ?? payload.utm_params ?? {};

  // Kontakt aus dem contact-Objekt vorbelegen (falls vorhanden)
  const contactObj = payload.contact ?? (payload.contacts ?? [])[0] ?? {};

  // Responses parsen
  const { fullName, email, phone, cvFileUrl, qualificationAnswers } =
    extractContactAndCv(responses);

  // Fallback: Daten aus dem contact-Block nutzen
  const finalName = fullName ?? contactObj.name ?? null;
  const finalEmail = email ?? contactObj.email ?? null;
  const finalPhone = phone ?? contactObj.phone ?? null;

  // E-Mail + Name sind Pflichtfelder (applicants.email/full_name sind NOT NULL)
  if (!finalEmail) {
    return NextResponse.json({ error: "E-Mail fehlt im Payload" }, { status: 422 });
  }
  if (!finalName) {
    return NextResponse.json({ error: "Name fehlt im Payload" }, { status: 422 });
  }

  // 4. Query-Parameter auslesen
  const funnelId = req.nextUrl.searchParams.get("funnel_id") ?? null;
  const jobId = req.nextUrl.searchParams.get("job_id") ?? null;

  const supabase = createAdminClient();

  // 5. Funnel → Job-ID ableiten (falls job_id nicht direkt übergeben)
  let resolvedJobId = jobId;
  if (!resolvedJobId && funnelId) {
    const { data: funnel } = await supabase
      .from("funnels")
      .select("job_id, sales_program_id")
      .eq("id", funnelId)
      .single();
    resolvedJobId = funnel?.job_id ?? null;
    // Sales-Funnels laufen nicht über involve.me. Diese Integration ist
    // Recruiting-only — Sales-Submissions kommen über /api/apply.
    if (!resolvedJobId && funnel?.sales_program_id) {
      return NextResponse.json(
        { error: "Sales-Funnels werden via involve.me nicht unterstützt" },
        { status: 400 }
      );
    }
  }
  if (!resolvedJobId) {
    return NextResponse.json({ error: "Kein job_id ermittelt" }, { status: 400 });
  }

  // 6. Bewerber anlegen oder aktualisieren (upsert auf E-Mail)
  const { data: applicant, error: applicantError } = await supabase
    .from("applicants")
    .upsert(
      {
        email: finalEmail,
        full_name: finalName,
        phone: finalPhone,
        cv_file_url: cvFileUrl,
        consent_given_at: new Date().toISOString(),
      },
      { onConflict: "email", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (applicantError || !applicant) {
    console.error("[involveme-webhook] applicant upsert:", applicantError);
    return NextResponse.json({ error: "Datenbankfehler (Bewerber)" }, { status: 500 });
  }

  // 7. Bewerbung anlegen
  const { data: application, error: appError } = await supabase
    .from("applications")
    .insert({
      applicant_id: applicant.id,
      job_id: resolvedJobId,
      funnel_id: funnelId,
      pipeline_stage: "new",
      source: normalizeApplicantSource(utmParams.source ?? utmParams.utm_source),
      utm_params: utmParams,
      funnel_responses: qualificationAnswers,
      applied_at: payload.submittedAt ?? payload.created_at ?? new Date().toISOString(),
    })
    .select("id")
    .single();

  if (appError || !application) {
    console.error("[involveme-webhook] application insert:", appError);
    return NextResponse.json({ error: "Datenbankfehler (Bewerbung)" }, { status: 500 });
  }

  console.log(
    `[involveme-webhook] Neue Bewerbung: ${application.id} | Bewerber: ${finalEmail} | Funnel: ${funnelId ?? "—"}`
  );

  return NextResponse.json({ success: true, application_id: application.id }, { status: 201 });
}
