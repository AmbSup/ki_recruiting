import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runRetentionPurge } from "@/lib/gdpr/retention";

export const maxDuration = 60;

// DSGVO Art. 5 (1)(e) — täglicher Retention-Purge. Wird von Vercel Cron
// aufgerufen (siehe vercel.json). Schutz: CRON_SECRET muss als Bearer-Token
// oder ?secret= übereinstimmen — verhindert öffentliches Auslösen.
//
// Vercel Cron schickt automatisch den Header "Authorization: Bearer <CRON_SECRET>"
// wenn CRON_SECRET als Env-Var gesetzt ist. Wir akzeptieren zusätzlich ?secret=
// für manuelles Testen.
async function handle(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET nicht konfiguriert" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  const querySecret = new URL(req.url).searchParams.get("secret");
  const ok = authHeader === `Bearer ${secret}` || querySecret === secret;
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const months = Number(process.env.RETENTION_MONTHS) || 12;
  const supabase = createAdminClient();
  const result = await runRetentionPurge(supabase, months);
  return NextResponse.json(result);
}

// Vercel Cron triggert per GET.
export async function GET(req: NextRequest) {
  return handle(req);
}

// POST für manuelles Auslösen (gleicher Secret-Check).
export async function POST(req: NextRequest) {
  return handle(req);
}
