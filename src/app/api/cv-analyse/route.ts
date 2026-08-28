import { NextRequest, NextResponse } from "next/server";
import { requireWriter } from "@/lib/auth/guards";
import { analyzeApplicationCv } from "@/services/cv-analysis";

export const maxDuration = 60;

// Public submissions are analyzed internally by /api/apply. This endpoint is
// reserved for authenticated operator retries.
export async function POST(req: NextRequest) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;

  let applicationId: string | undefined;
  try {
    ({ application_id: applicationId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!applicationId) return NextResponse.json({ error: "application_id fehlt" }, { status: 400 });

  const result = await analyzeApplicationCv(applicationId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ success: true });
}
