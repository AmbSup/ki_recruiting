import { NextRequest, NextResponse } from 'next/server';
import { runBudgetOptimizer } from '@/agents/budget-optimizer';
import { verifyN8nSecret } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  const auth = verifyN8nSecret(req);
  if (!auth.ok) return auth.response;

  try {
    const result = await runBudgetOptimizer();
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('[/api/meta/optimize/budget]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
