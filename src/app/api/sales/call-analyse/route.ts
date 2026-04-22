import { NextRequest, NextResponse } from "next/server";
import { runSalesCallAnalysis, TranscriptMessage } from "@/agents/sales-call-analyzer";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: {
    sales_call_id?: string;
    customer_phone?: string;
    vapi_call_id?: string;
    transcript_messages?: TranscriptMessage[];
    transcript_text?: string;
    recording_url?: string | null;
    started_at?: string | null;
    ended_at?: string | null;
    end_reason?: string | null;
    vapi_end_report?: Record<string, unknown> | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // sales_call_id resolution: explicit → vapi_call_id lookup → phone → latest active
  // Notwendig, weil Vapi's assistant-request-Webhook mit Static-Binding nicht feuert
  // und sales_call_id nicht in variableValues ankommt.
  let salesCallId = body.sales_call_id ?? null;

  if (!salesCallId) {
    const supabase = createAdminClient();

    if (body.vapi_call_id) {
      const { data } = await supabase
        .from("sales_calls")
        .select("id")
        .eq("vapi_call_id", body.vapi_call_id)
        .maybeSingle();
      salesCallId = data?.id ?? null;
    }

    if (!salesCallId && body.customer_phone) {
      const { data: lead } = await supabase
        .from("sales_leads")
        .select("id")
        .eq("phone", body.customer_phone)
        .maybeSingle();
      if (lead?.id) {
        const { data: call } = await supabase
          .from("sales_calls")
          .select("id, status")
          .eq("sales_lead_id", lead.id)
          .in("status", ["in_progress", "ringing", "initiated"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        salesCallId = call?.id ?? null;
        if (!salesCallId) {
          // Fallback: letzter beliebiger Call
          const { data: any } = await supabase
            .from("sales_calls")
            .select("id")
            .eq("sales_lead_id", lead.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          salesCallId = any?.id ?? null;
        }
      }
    }
  }

  if (!salesCallId) {
    return NextResponse.json(
      { error: "sales_call_id nicht auflösbar (weder direkt noch via vapi_call_id/customer_phone)" },
      { status: 422 },
    );
  }

  const result = await runSalesCallAnalysis({
    sales_call_id: salesCallId,
    transcript_messages: body.transcript_messages ?? [],
    transcript_text: body.transcript_text ?? "",
    recording_url: body.recording_url ?? null,
    started_at: body.started_at ?? null,
    ended_at: body.ended_at ?? null,
    end_reason: body.end_reason ?? null,
    vapi_end_report: body.vapi_end_report as never,
  });

  if (!result) {
    return NextResponse.json({ error: "Analyse fehlgeschlagen" }, { status: 500 });
  }

  return NextResponse.json(
    {
      success: true,
      sales_call_id: salesCallId,
      sales_call_analysis_id: result.sales_call_analysis_id,
    },
    { status: 201 },
  );
}
