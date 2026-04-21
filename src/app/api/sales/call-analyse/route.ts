import { NextRequest, NextResponse } from "next/server";
import { runSalesCallAnalysis, TranscriptMessage } from "@/agents/sales-call-analyzer";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: {
    sales_call_id?: string;
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

  if (!body.sales_call_id) {
    return NextResponse.json({ error: "sales_call_id fehlt" }, { status: 422 });
  }

  const result = await runSalesCallAnalysis({
    sales_call_id: body.sales_call_id,
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
    { success: true, sales_call_analysis_id: result.sales_call_analysis_id },
    { status: 201 },
  );
}
