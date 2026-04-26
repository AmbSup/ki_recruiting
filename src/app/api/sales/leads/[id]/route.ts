import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { validateCustomFields, SalesProgramType } from "@/lib/vapi-prompts/schemas";

export const maxDuration = 60;

const EDITABLE_FIELDS = [
  "first_name", "last_name", "full_name", "email",
  "company_name", "role", "linkedin_url",
  "funnel_responses", "custom_fields", "notes",
  "status", "next_call_scheduled_at",
] as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("sales_leads")
    .select("*, program:sales_programs(id, name, booking_link, auto_dial)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 });
  return NextResponse.json({ lead: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const update: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  if ("phone" in body) {
    const normalized = normalizePhone(body.phone as string);
    if (!normalized) return NextResponse.json({ error: "Telefonnummer ungültig" }, { status: 422 });
    update.phone = normalized;
  }

  // Bei custom_fields-Update gegen das Schema des zugehörigen Programs validieren
  if ("custom_fields" in update) {
    const { data: lead } = await supabase
      .from("sales_leads")
      .select("sales_program_id, program:sales_programs(program_type)")
      .eq("id", id)
      .maybeSingle();
    const programRaw = (lead as unknown as { program: { program_type?: string } | null } | null)?.program;
    const programType = (programRaw?.program_type ?? "generic") as SalesProgramType;
    const validation = validateCustomFields(programType, update.custom_fields);
    if (!validation.ok) {
      return NextResponse.json(
        {
          error: "custom_fields_validation_failed",
          program_type: programType,
          issues: validation.issues,
        },
        { status: 400 },
      );
    }
    update.custom_fields = validation.data;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Keine Änderungen" }, { status: 400 });
  }

  const { error } = await supabase.from("sales_leads").update(update).eq("id", id);
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      // Unique-Constraint (sales_program_id, phone) verletzt — andere Lead-Row in
      // demselben Program hat schon diese Nummer. Hilf dem User mit Name + ID
      // des kollidierenden Leads, damit er manuell mergen oder löschen kann.
      let conflictDetail = "";
      let conflictLeadId: string | null = null;
      if (typeof update.phone === "string") {
        const { data: current } = await supabase
          .from("sales_leads")
          .select("sales_program_id")
          .eq("id", id)
          .maybeSingle();
        const programId = (current as { sales_program_id?: string } | null)?.sales_program_id;
        if (programId) {
          const { data: other } = await supabase
            .from("sales_leads")
            .select("id, full_name, first_name, last_name")
            .eq("sales_program_id", programId)
            .eq("phone", update.phone)
            .neq("id", id)
            .maybeSingle();
          if (other) {
            const o = other as { id: string; full_name: string | null; first_name: string | null; last_name: string | null };
            const name = o.full_name || [o.first_name, o.last_name].filter(Boolean).join(" ") || "(unbenannt)";
            conflictDetail = ` — bereits bei „${name}" im selben Program in Verwendung`;
            conflictLeadId = o.id;
          }
        }
      }
      return NextResponse.json(
        {
          error: `Rufnummer-Konflikt${conflictDetail}`,
          conflict_lead_id: conflictLeadId,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("sales_leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
