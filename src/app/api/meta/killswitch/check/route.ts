import { NextRequest, NextResponse } from 'next/server';
import { runKillSwitch } from '@/agents/kill-switch';
import { verifyN8nSecret } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  const auth = verifyN8nSecret(req);
  if (!auth.ok) return auth.response;

  try {
    const result = await runKillSwitch();
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('[/api/meta/killswitch/check]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
