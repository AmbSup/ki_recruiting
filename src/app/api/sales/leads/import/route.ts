import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, isTerminalSalesStatus } from "@/lib/phone";
import { parseCsv } from "@/lib/csv";
import { requireWriter } from "@/lib/auth/guards";

export const maxDuration = 60;

const KNOWN_COLUMNS = new Set([
  "phone", "first_name", "last_name", "full_name", "email",
  "company_name", "role", "linkedin_url", "notes",
]);

export async function POST(req: NextRequest) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const contentType = req.headers.get("content-type") ?? "";
  let csvText: string;
  let salesProgramId: string | null = null;
  let consentConfirmed = false;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      salesProgramId = (form.get("sales_program_id") as string) ?? null;
      consentConfirmed = form.get("consent_confirmed") === "true";
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "CSV-Datei fehlt" }, { status: 422 });
      }
      csvText = await file.text();
    } else {
      const body = await req.json();
      csvText = body.csv_text ?? "";
      salesProgramId = body.sales_program_id ?? null;
      consentConfirmed = Boolean(body.consent_confirmed);
    }
  } catch {
    return NextResponse.json({ error: "Request konnte nicht gelesen werden" }, { status: 400 });
  }

  if (!salesProgramId) {
    return NextResponse.json({ error: "sales_program_id fehlt" }, { status: 422 });
  }
  if (!consentConfirmed) {
    return NextResponse.json({ error: "Opt-In muss bestätigt werden" }, { status: 422 });
  }
  if (!csvText.trim()) {
    return NextResponse.json({ error: "CSV leer" }, { status: 422 });
  }

  const { headers, rows } = parseCsv(csvText);
  if (!headers.includes("phone")) {
    return NextResponse.json({ error: "Spalte 'phone' ist Pflicht" }, { status: 422 });
  }

  const supabase = createAdminClient();
  let created = 0;
  let updated = 0;
  let skippedTerminal = 0;
  let skippedInvalid = 0;
  const errors: { row: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const phone = normalizePhone(row.phone);
    if (!phone) {
      skippedInvalid++;
      errors.push({ row: i + 2, reason: "Telefonnummer ungültig" });
      continue;
    }

    // Custom-Fields = alles außerhalb der bekannten Spalten
    const customFields: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      if (!KNOWN_COLUMNS.has(key) && value) customFields[key] = value;
    }

    // Core-Felder
    const coreFields = {
      first_name: row.first_name || null,
      last_name: row.last_name || null,
      full_name: row.full_name || null,
      email: row.email || null,
      company_name: row.company_name || null,
      role: row.role || null,
      linkedin_url: row.linkedin_url || null,
      notes: row.notes || null,
    };

    // Lookup-or-Update auf (sales_program_id, phone)
    const { data: existing } = await supabase
      .from("sales_leads")
      .select("id, status, custom_fields")
      .eq("sales_program_id", salesProgramId)
      .eq("phone", phone)
      .maybeSingle();

    if (existing) {
      if (isTerminalSalesStatus(existing.status)) {
        skippedTerminal++;
        continue;
      }
      // Merge: Core-Felder nur setzen wenn vorher leer wäre — wir überschreiben
      // hier aber bewusst nicht, um CSV-Refreshes nicht zerstörerisch zu machen.
      // Custom_fields + consent aktualisieren, Status bleibt (kein Re-Engage).
      const mergedCustom = { ...(existing.custom_fields as Record<string, unknown>), ...customFields };
      const { error } = await supabase
        .from("sales_leads")
        .update({
          custom_fields: mergedCustom,
          consent_given: true,
          consent_source: "manual_import",
          consent_timestamp: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) { errors.push({ row: i + 2, reason: error.message }); continue; }
      updated++;
    } else {
      const { error } = await supabase.from("sales_leads").insert({
        sales_program_id: salesProgramId,
        phone,
        ...coreFields,
        source: "csv_import",
        custom_fields: customFields,
        consent_given: true,
        consent_source: "manual_import",
        consent_timestamp: new Date().toISOString(),
      });
      if (error) {
        if ((error as { code?: string }).code === "23505") {
          // Race — retry as update
          await supabase
            .from("sales_leads")
            .update({ custom_fields: customFields, consent_timestamp: new Date().toISOString() })
            .eq("sales_program_id", salesProgramId)
            .eq("phone", phone);
          updated++;
        } else {
          errors.push({ row: i + 2, reason: error.message });
        }
        continue;
      }
      created++;
    }
  }

  return NextResponse.json({
    created,
    updated,
    skipped_terminal: skippedTerminal,
    skipped_invalid: skippedInvalid,
    errors,
  });
}
