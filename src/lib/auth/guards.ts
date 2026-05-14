import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient as createServerClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "operator" | "viewer" | "customer";

const READ_ROLES: ReadonlySet<UserRole> = new Set(["admin", "operator", "viewer"]);
const WRITE_ROLES: ReadonlySet<UserRole> = new Set(["admin", "operator"]);

type GuardResult =
  | { ok: true; userId: string; role: UserRole }
  | { ok: false; response: NextResponse };

async function loadSessionRole(): Promise<{ userId: string; role: UserRole } | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.role) return null;
  return { userId: user.id, role: profile.role as UserRole };
}

/** Read access: admin, operator, viewer. Use for GET endpoints. */
export async function requireReader(): Promise<GuardResult> {
  const session = await loadSessionRole();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!READ_ROLES.has(session.role)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId: session.userId, role: session.role };
}

/** Write access: admin, operator only. Use for POST/PATCH/DELETE endpoints. */
export async function requireWriter(): Promise<GuardResult> {
  const session = await loadSessionRole();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!WRITE_ROLES.has(session.role)) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true, userId: session.userId, role: session.role };
}

/**
 * Verify the N8N_WEBHOOK_SECRET shared header for routes triggered from n8n.
 * Accepts X-Webhook-Secret header (same convention as bestehende Meta-Routes).
 * Fails CLOSED if env var not set (kein dev-allow mehr).
 */
export function verifyN8nSecret(req: Request): { ok: true } | { ok: false; response: NextResponse } {
  const expected = process.env.N8N_WEBHOOK_SECRET;
  if (!expected) {
    console.error("[auth] N8N_WEBHOOK_SECRET not configured");
    return { ok: false, response: NextResponse.json({ error: "Server misconfig" }, { status: 500 }) };
  }
  const provided = req.headers.get("x-webhook-secret") ?? "";
  if (!safeEqual(provided, expected)) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true };
}

/**
 * Combined: accept either a logged-in operator/admin session OR a valid n8n shared secret.
 * Use for routes that are called from both UI and n8n (e.g. /api/sales/trigger-call).
 */
export async function requireWriterOrN8n(req: Request): Promise<GuardResult | { ok: true; via: "n8n" }> {
  const n8n = verifyN8nSecret(req);
  if (n8n.ok) return { ok: true, via: "n8n" };
  return await requireWriter();
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
