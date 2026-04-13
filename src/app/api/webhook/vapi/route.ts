import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// POST /api/webhook/vapi
//
// Two purposes:
//   1. "assistant-request" — Vapi asks which assistant to use for an incoming
//      SIP call. We read the SIP headers (passed from Twilio) and return the
//      assistant config with variableValues populated.
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

    // Vapi passes SIP headers under call.sipHeaders (keys normalised to lowercase)
    const sipHeaders = (call?.sipHeaders ?? {}) as Record<string, string>;

    // Extract variables from SIP headers sent by Twilio Studio
    const applicationId =
      sipHeaders["x-application-id"] ??
      sipHeaders["X-application-id"] ??
      null;
    const candidateId =
      sipHeaders["x-candidate-id"] ??
      sipHeaders["X-candidate-id"] ??
      null;
    const jobId =
      sipHeaders["x-job-id"] ??
      sipHeaders["X-job-id"] ??
      null;
    const firstName =
      sipHeaders["x-first-name"] ??
      sipHeaders["X-first-name"] ??
      null;
    const lastName =
      sipHeaders["x-last-name"] ??
      sipHeaders["X-last-name"] ??
      null;
    const email =
      sipHeaders["x-email"] ??
      sipHeaders["X-email"] ??
      null;
    const phone =
      sipHeaders["x-phone"] ??
      sipHeaders["X-phone"] ??
      null;
    const jobTitle =
      sipHeaders["x-job-title"] ??
      sipHeaders["X-job-title"] ??
      null;

    console.log("[vapi-webhook] assistant-request | application_id:", applicationId);

    return NextResponse.json({
      assistant: {
        ...(VAPI_ASSISTANT_ID ? { id: VAPI_ASSISTANT_ID } : {}),
        variableValues: {
          application_id: applicationId,
          candidate_id: candidateId,
          job_id: jobId,
          candidate_first_name: firstName,
          candidate_last_name: lastName,
          candidate_email: email,
          candidate_phone_number: phone,
          job_title: jobTitle,
        },
      },
    });
  }

  // ── 2. All other Vapi events — acknowledge and ignore (n8n handles them) ──
  return NextResponse.json({ received: true });
}
