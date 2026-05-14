import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireReader, requireWriter } from "@/lib/auth/guards";

export const maxDuration = 60;

const EDITABLE_FIELDS = [
  "name", "product_pitch", "value_proposition", "target_persona",
  "script_guidelines", "vapi_assistant_id", "vapi_phone_number_id",
  "caller_phone_number", "booking_link", "meta_form_ids",
  "auto_dial", "status", "system_prompt_override", "first_message_override",
  "cal_username", "cal_event_type_slug", "cal_timezone",
] as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireReader();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("sales_programs")
    .select("*, company:companies(id, name)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Program nicht gefunden" }, { status: 404 });
  return NextResponse.json({ program: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const supabase = createAdminClient();
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const update: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  // call_strategy: server-side merge — UI sendet ein partielles Object und wir
  // verschmelzen mit existierendem JSONB. Verhindert, dass z.B. require_consent
  // oder llm_model genuked werden, wenn die UI sie nicht in jedem Save mitsendet.
  if ("call_strategy" in body && body.call_strategy && typeof body.call_strategy === "object") {
    const { data: current } = await supabase
      .from("sales_programs")
      .select("call_strategy")
      .eq("id", id)
      .maybeSingle();
    const existing = (current?.call_strategy as Record<string, unknown> | null) ?? {};
    update.call_strategy = { ...existing, ...(body.call_strategy as Record<string, unknown>) };
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Keine Änderungen" }, { status: 400 });
  }

  const { error } = await supabase.from("sales_programs").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("sales_programs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
