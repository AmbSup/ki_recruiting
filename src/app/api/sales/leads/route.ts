import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";
import { validateCustomFields, SalesProgramType } from "@/lib/vapi-prompts/schemas";
import { requireReader, requireWriter } from "@/lib/auth/guards";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = await requireReader();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get("sales_program_id");
  const status = searchParams.get("status");
  const source = searchParams.get("source");

  let query = supabase
    .from("sales_leads")
    .select("id, sales_program_id, first_name, last_name, full_name, email, phone, company_name, role, source, status, consent_given, next_call_scheduled_at, created_at, updated_at, program:sales_programs(id, name)")
    .order("created_at", { ascending: false });

  if (programId) query = query.eq("sales_program_id", programId);
  if (status) query = query.eq("status", status);
  if (source) query = query.eq("source", source);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const supabase = createAdminClient();
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const sales_program_id = body.sales_program_id as string | undefined;
  const rawPhone = body.phone as string | undefined;
  if (!sales_program_id || !rawPhone) {
    return NextResponse.json({ error: "sales_program_id und phone sind Pflicht" }, { status: 422 });
  }
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return NextResponse.json({ error: "Telefonnummer ungültig" }, { status: 422 });
  }

  // Program laden um program_type zu kennen → custom_fields validieren
  const { data: program, error: progErr } = await supabase
    .from("sales_programs")
    .select("program_type")
    .eq("id", sales_program_id)
    .maybeSingle();
  if (progErr || !program) {
    return NextResponse.json({ error: "Sales Program nicht gefunden" }, { status: 404 });
  }

  const programType = (program.program_type ?? "generic") as SalesProgramType;
  const rawCustomFields = (body.custom_fields ?? {}) as Record<string, unknown>;
  const validation = validateCustomFields(programType, rawCustomFields);
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

  const { data, error } = await supabase
    .from("sales_leads")
    .insert({
      sales_program_id,
      phone,
      first_name: body.first_name ?? null,
      last_name: body.last_name ?? null,
      full_name: body.full_name ?? null,
      email: body.email ?? null,
      company_name: body.company_name ?? null,
      role: body.role ?? null,
      linkedin_url: body.linkedin_url ?? null,
      source: (body.source as string | undefined) ?? "manual",
      source_ref: body.source_ref ?? null,
      funnel_responses: body.funnel_responses ?? {},
      custom_fields: validation.data,
      consent_given: Boolean(body.consent_given),
      consent_source: body.consent_source ?? null,
      consent_timestamp: body.consent_given ? new Date().toISOString() : null,
      notes: body.notes ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    // 23505 = unique_violation (sales_program_id, phone)
    if ((error as { code?: string })?.code === "23505") {
      return NextResponse.json({ error: "Lead mit dieser Rufnummer existiert bereits im Program" }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
