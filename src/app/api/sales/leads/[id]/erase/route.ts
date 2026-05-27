import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriter } from "@/lib/auth/guards";
import { eraseSalesLead } from "@/lib/gdpr/erase";

export const maxDuration = 60;

// DSGVO Art. 17 — vollständige Löschung eines Sales-Leads + aller abhängigen
// Daten + Storage-Objekte. Schreibt einen Audit-Eintrag in gdpr_erasure_log.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const supabase = createAdminClient();
  const summary = await eraseSalesLead(supabase, id);
  if (summary.errors.length > 0) {
    return NextResponse.json({ success: false, summary }, { status: 207 });
  }
  return NextResponse.json({ success: true, summary });
}
