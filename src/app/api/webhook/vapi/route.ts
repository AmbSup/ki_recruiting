import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// POST /api/webhook/vapi
//
// Two purposes:
//   1. "assistant-request" — Vapi asks which assistant to use for an incoming
//      SIP call. We look up the active call session by phone number. Sales is
//      checked first (sales_call_sessions), Recruiting is the fallback
//      (call_sessions). The routing happens here because both sides share the
//      same Vapi SIP user (aiprofis@sip.vapi.ai).
//
//   2. "end-of-call-report" — forwarded here if n8n is not used. Currently
//      we return 200 and let n8n handle it via its own webhook.
// ---------------------------------------------------------------------------

const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID!;
const VAPI_SALES_ASSISTANT_ID = process.env.VAPI_SALES_ASSISTANT_ID;

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

    // Phone number of the callee (outbound call: call.customer.number)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const phoneNumber = (call?.customer as any)?.number as string | undefined;

    const supabase = createAdminClient();

    // ── Sales first ────────────────────────────────────────────────────────
    if (phoneNumber) {
      const { data: salesSession } = await supabase
        .from("sales_call_sessions")
        .select("sales_lead_id, sales_call_id, cached_data")
        .eq("phone_number", phoneNumber)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (salesSession) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cached = salesSession.cached_data as any;
        const lead = cached?.lead ?? {};
        const program = cached?.program ?? {};
        const assistantId = program?.vapi_assistant_id ?? VAPI_SALES_ASSISTANT_ID;

        console.log(
          "[vapi-webhook] assistant-request (sales) | phone:", phoneNumber,
          "| sales_lead_id:", salesSession.sales_lead_id,
          "| assistant_id:", assistantId,
        );

        return NextResponse.json({
          assistant: {
            ...(assistantId ? { id: assistantId } : {}),
            variableValues: {
              // Template-Variablen aus docs/vapi-sales-agent.md
              first_name: lead.first_name ?? "",
              last_name: lead.last_name ?? "",
              full_name: lead.full_name ?? "",
              company_name: lead.company_name ?? "",
              role: lead.role ?? "",
              notes: lead.notes ?? "",
              custom_fields_json: JSON.stringify(lead.custom_fields ?? {}),
              program_name: program.name ?? "",
              product_pitch: program.product_pitch ?? "",
              value_proposition: program.value_proposition ?? "",
              target_persona: program.target_persona ?? "",
              booking_link: program.booking_link ?? "",
              // IDs für Tool-Calls + End-of-Call-Processing
              sales_lead_id: salesSession.sales_lead_id,
              sales_call_id: salesSession.sales_call_id,
              sales_program_id: program.id ?? null,
            },
          },
        });
      }
    }

    // ── Recruiting fallback ────────────────────────────────────────────────
    let session: Record<string, unknown> | null = null;
    if (phoneNumber) {
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

    console.log(
      "[vapi-webhook] assistant-request (recruiting) | phone:", phoneNumber,
      "| application_id:", session?.application_id ?? null,
    );

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
