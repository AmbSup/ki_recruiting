import { NextRequest, NextResponse } from 'next/server';
import { runAudienceOptimizer } from '@/agents/audience-optimizer';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return true;
  return req.headers.get('x-webhook-secret') === secret;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
