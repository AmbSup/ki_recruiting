import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get("sales_program_id");
  const status = searchParams.get("status");
  const leadId = searchParams.get("sales_lead_id");

  let query = supabase
    .from("sales_calls")
    .select("id, sales_lead_id, sales_program_id, status, started_at, ended_at, duration_seconds, end_reason, recording_url, created_at, sales_lead:sales_leads(id, full_name, first_name, last_name, phone, company_name), sales_program:sales_programs(id, name), analysis:sales_call_analyses(meeting_booked, interest_level, call_rating, sentiment, next_action)")
    .order("created_at", { ascending: false });

  if (programId) query = query.eq("sales_program_id", programId);
  if (status) query = query.eq("status", status);
  if (leadId) query = query.eq("sales_lead_id", leadId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ calls: data ?? [] });
}
