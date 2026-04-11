import { NextRequest, NextResponse } from 'next/server';
import { createRecruitingCampaign } from '@/agents/campaign-creator';

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return true; // no secret configured — allow in dev
  return req.headers.get('x-webhook-secret') === secret;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    job_id: string;
    company_id: string;
    job_category: string;
    daily_budget_cents?: number;
    regions?: string[];
    meta_page_id?: string;
    // Wizard overrides
    funnel_id?: string;
    campaign_name?: string;
    objective?: string;
    special_category?: string;
    age_min?: number;
    age_max?: number;
    gender?: 'ALL' | 'MALE' | 'FEMALE';
    placement_type?: 'automatic' | 'manual';
    placements?: string[];
    destination_url?: string;
    primary_text?: string;
    headline?: string;
    cta_type?: string;
    pixel_id?: string;
    utm_campaign?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.job_id || !body.company_id || !body.job_category) {
    return NextResponse.json(
      { error: 'job_id, company_id and job_category are required' },
      { status: 422 }
    );
  }

  try {
    const result = await createRecruitingCampaign({
      job_id: body.job_id,
      company_id: body.company_id,
      job_category: body.job_category,
      daily_budget_cents: body.daily_budget_cents ?? 5000,
      regions: body.regions ?? [],
      meta_page_id: body.meta_page_id,
      funnel_id: body.funnel_id,
      campaign_name: body.campaign_name,
      objective: body.objective,
      special_category: body.special_category,
      age_min: body.age_min,
      age_max: body.age_max,
      gender: body.gender,
      placement_type: body.placement_type,
      placements: body.placements,
      destination_url: body.destination_url,
      primary_text: body.primary_text,
      headline: body.headline,
      cta_type: body.cta_type,
      pixel_id: body.pixel_id,
      utm_campaign: body.utm_campaign,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('[/api/meta/campaigns/create]', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    const raw = (err as { raw?: unknown })?.raw;
    return NextResponse.json(
      { error: message, ...(raw ? { meta_error: raw } : {}) },
      { status: 500 }
    );
  }
}
