import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone } from "@/lib/phone";

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

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Keine Änderungen" }, { status: 400 });
  }

  const { error } = await supabase.from("sales_leads").update(update).eq("id", id);
  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Rufnummer-Konflikt im Program" }, { status: 409 });
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
