import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export const maxDuration = 10;
export const runtime = "nodejs";

// Public-Endpoint, kein Auth. Wird vom Funnel-Player (öffentliche URL) aufgerufen.
// Tracking-Failures dürfen den Funnel nicht blockieren — daher fire-and-forget
// auf Client-Side, hier silent-fail mit 200 OK falls Insert scheitert.

const COOKIE_NAME = "_fv";
const COOKIE_MAX_AGE_DAYS = 30;

type Body = {
  funnel_id?: string;
  event_type?: "view" | "page_view" | "submit";
  page_order?: number | null;
  utm?: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
  };
  referrer?: string | null;
};

function detectDevice(userAgent: string | null): "mobile" | "tablet" | "desktop" | "unknown" {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|android|webos|opera mini|blackberry|windows phone/i.test(ua)) return "mobile";
  if (/mozilla|chrome|safari|firefox|edge/i.test(ua)) return "desktop";
  return "unknown";
}

function generateVisitorId(): string {
  // 32 Zeichen Hex aus 16 random Bytes — opaque, nicht reversibel zu PII
  return crypto.randomBytes(16).toString("hex");
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  const { funnel_id, event_type, page_order, utm, referrer } = body;
  if (!funnel_id || !event_type) {
    return NextResponse.json({ ok: false, reason: "missing_fields" }, { status: 200 });
  }
  if (!["view", "page_view", "submit"].includes(event_type)) {
    return NextResponse.json({ ok: false, reason: "invalid_event_type" }, { status: 200 });
  }

  // Cookie lesen oder generieren
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  const visitorId = existing && existing.length === 32 ? existing : generateVisitorId();

  // Device aus UA
  const userAgent = req.headers.get("user-agent");
  const deviceType = detectDevice(userAgent);

  // Insert (silent failure — niemals den Funnel-Submit blockieren)
  const supabase = createAdminClient();
  await supabase
    .from("funnel_events")
    .insert({
      funnel_id,
      event_type,
      page_order: typeof page_order === "number" ? page_order : null,
      visitor_id: visitorId,
      device_type: deviceType,
      utm_source: utm?.source ?? null,
      utm_medium: utm?.medium ?? null,
      utm_campaign: utm?.campaign ?? null,
      referrer: typeof referrer === "string" ? referrer.slice(0, 500) : null,
    })
    .then((res) => {
      if (res.error) console.error("[funnels/track] insert failed:", res.error.message);
    });

  // Response mit Set-Cookie wenn neu
  const response = NextResponse.json({ ok: true });
  if (!existing) {
    response.cookies.set(COOKIE_NAME, visitorId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
    });
  }
  return response;
}
