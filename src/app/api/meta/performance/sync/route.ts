import { NextRequest, NextResponse } from 'next/server';
import { runPerformanceAnalyzer } from '@/agents/performance-analyzer';
import { verifyN8nSecret } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  const auth = verifyN8nSecret(req);
  if (!auth.ok) return auth.response;

  try {
    const result = await runPerformanceAnalyzer();
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('[/api/meta/performance/sync]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
