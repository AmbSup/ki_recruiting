import { NextRequest, NextResponse } from 'next/server';
import { runAudienceOptimizer } from '@/agents/audience-optimizer';
import { verifyN8nSecret } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  const auth = verifyN8nSecret(req);
  if (!auth.ok) return auth.response;

  try {
    const result = await runAudienceOptimizer();
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('[/api/meta/optimize/audience]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
