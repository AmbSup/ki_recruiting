import { NextResponse } from 'next/server';
import { listMetaCampaigns } from '@/services/meta/campaigns';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireReader } from '@/lib/auth/guards';

export async function GET() {
  const auth = await requireReader();
  if (!auth.ok) return auth.response;
  try {
    const [metaCampaigns, supabase] = await Promise.all([
      listMetaCampaigns(),
      Promise.resolve(createAdminClient()),
    ]);

    const { data: dbCampaigns } = await supabase
      .from('ad_campaigns')
      .select('meta_campaign_id, job_id, funnel_id, job:jobs(title, company:companies(name)), funnel:funnels(name, slug)');

    const dbMap = new Map((dbCampaigns ?? []).map((c) => [c.meta_campaign_id, c]));

    const campaigns = metaCampaigns.map((mc) => {
      const db = dbMap.get(mc.id);
      const insights = mc.insights?.data?.[0];
      const leadAction = insights?.actions?.find((a) => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped');
      const spend_cents = Math.round(parseFloat(insights?.spend ?? '0') * 100);
      const leads = leadAction ? parseInt(leadAction.value, 10) : 0;

      return {
        id: mc.id,
        name: mc.name,
        status: mc.status.toLowerCase(),
        objective: mc.objective,
        daily_budget_cents: parseInt(mc.daily_budget ?? '0', 10),
        impressions: parseInt(insights?.impressions ?? '0', 10),
        clicks: parseInt(insights?.clicks ?? '0', 10),
        leads,
        spend_cents,
        cpl_cents: leads > 0 ? Math.round(spend_cents / leads) : 0,
        created_time: mc.created_time,
        job: db?.job ?? null,
        funnel: db?.funnel ?? null,
      };
    });

    return NextResponse.json({ campaigns });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
