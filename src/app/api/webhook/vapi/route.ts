import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// POST /api/webhook/vapi
//
// Two purposes:
//   1. "assistant-request" — Vapi asks which assistant to use for an incoming
//      SIP call. We look up call_sessions by phone number to get the candidate
//      context (name, job, application_id) since Twilio SIP headers are not
//      forwarded to Vapi.
//
//   2. "end-of-call-report" — forwarded here if n8n is not used. Currently
//      we return 200 and let n8n handle it via its own webhook.
// ---------------------------------------------------------------------------

const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID!;

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message as Record<string, unknown> | undefined;
  const messageType = message?.type as string | undefined;

  // ── 1. Assistant Request ──────────────────────────────────────────────────
  if (messageType === "assistant-request") {
    const call = message?.call as Record<string, unknown> | undefined;

    // Phone number of the candidate (outbound call: call.customer.number)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const phoneNumber = (call?.customer as any)?.number as string | undefined;

    // Look up the active call session by phone number
    let session: Record<string, unknown> | null = null;
    if (phoneNumber) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("call_sessions")
        .select("application_id, job_id, candidate_id, cached_data")
        .eq("phone_number", phoneNumber)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      session = data as Record<string, unknown> | null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cached = session?.cached_data as any;
    const candidate = cached?.candidate ?? {};

    console.log("[vapi-webhook] assistant-request | phone:", phoneNumber, "| application_id:", session?.application_id ?? null);

    return NextResponse.json({
      assistant: {
        ...(VAPI_ASSISTANT_ID ? { id: VAPI_ASSISTANT_ID } : {}),
        variableValues: {
          application_id: session?.application_id ?? null,
          candidate_id: session?.candidate_id ?? null,
          job_id: session?.job_id ?? null,
          candidate_first_name: candidate.first_name ?? null,
          candidate_last_name: candidate.last_name ?? null,
          candidate_email: candidate.email ?? null,
          candidate_phone_number: phoneNumber ?? null,
          job_title: cached?.job?.title ?? null,
        },
      },
    });
  }

  // ── 2. All other Vapi events — acknowledge and ignore (n8n handles them) ──
  return NextResponse.json({ received: true });
}
