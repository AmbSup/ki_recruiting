import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireReader } from "@/lib/auth/guards";

export const maxDuration = 60;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireReader();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("sales_calls")
    .select(`
      *,
      sales_lead:sales_leads(*),
      sales_program:sales_programs(id, name, booking_link),
      analysis:sales_call_analyses(*)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Call nicht gefunden" }, { status: 404 });
  return NextResponse.json({ call: data });
}
