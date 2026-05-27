import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireReader } from "@/lib/auth/guards";
import { exportSalesLead } from "@/lib/gdpr/export";

export const maxDuration = 60;

// DSGVO Art. 15/20 — JSON-Auskunft über alle Daten eines Sales-Leads.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireReader();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const supabase = createAdminClient();
  const data = await exportSalesLead(supabase, id);
  if (!data) return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 });
  return new NextResponse(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="dsgvo-export-lead-${id}.json"`,
    },
  });
}
