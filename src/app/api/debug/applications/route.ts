import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("applications")
    .select("id, pipeline_stage, applied_at, applicant:applicants(full_name, email)")
    .order("applied_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ count: data?.length ?? 0, error: error?.message ?? null, data });
}
