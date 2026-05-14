import { NextRequest, NextResponse } from 'next/server';
import { generateCreatives } from '@/agents/creative-generator';
import { verifyN8nSecret } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  const auth = verifyN8nSecret(req);
  if (!auth.ok) return auth.response;

  let body: {
    job_title: string;
    job_category: string;
    location: string;
    salary_range?: string;
    count?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.job_title || !body.job_category || !body.location) {
    return NextResponse.json(
      { error: 'job_title, job_category and location are required' },
      { status: 422 }
    );
  }

  try {
    const variants = await generateCreatives({
      job_title: body.job_title,
      job_category: body.job_category,
      location: body.location,
      salary_range: body.salary_range,
      count: body.count ?? 3,
    });

    return NextResponse.json({ variants }, { status: 200 });
  } catch (err) {
    console.error('[/api/meta/creative/generate]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
