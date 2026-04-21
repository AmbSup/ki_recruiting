import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("company_id");
  const status = searchParams.get("status");

  let query = supabase
    .from("sales_programs")
    .select("id, company_id, name, status, auto_dial, vapi_assistant_id, booking_link, created_at, company:companies(id, name)")
    .order("created_at", { ascending: false });

  if (companyId) query = query.eq("company_id", companyId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ programs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const company_id = body.company_id as string | undefined;
  const name = body.name as string | undefined;
  if (!company_id || !name) {
    return NextResponse.json({ error: "company_id und name sind Pflicht" }, { status: 422 });
  }

  const { data, error } = await supabase
    .from("sales_programs")
    .insert({
      company_id,
      name,
      product_pitch: body.product_pitch ?? null,
      value_proposition: body.value_proposition ?? null,
      target_persona: body.target_persona ?? null,
      script_guidelines: body.script_guidelines ?? null,
      vapi_assistant_id: body.vapi_assistant_id ?? null,
      caller_phone_number: body.caller_phone_number ?? null,
      booking_link: body.booking_link ?? null,
      meta_form_ids: body.meta_form_ids ?? [],
      auto_dial: body.auto_dial ?? false,
      status: body.status ?? "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }
  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
