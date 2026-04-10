import { createAdminClient } from '@/lib/supabase/admin';
import { getInsights } from '@/services/meta/insights';
import type { PerformanceScoreInput } from '@/types/meta-ads';

// Normalize a value between min (worst) and max (best) to 0–1
function normalize(value: number, worst: number, best: number): number {
  if (best === worst) return 0;
  const clamped = Math.max(Math.min(value, Math.max(worst, best)), Math.min(worst, best));
  return (clamped - worst) / (best - worst);
}

export function calculatePerformanceScore(metrics: PerformanceScoreInput): number {
  // Don't score ads with too few impressions
  if (metrics.impressions < 200) return 0;

  const ctrScore = normalize(metrics.ctr, 0.3, 3.0) * 2.5;           // 25% weight
  const cplScore = normalize(metrics.cpl_cents, 8000, 300) * 3.5;     // 35% — lower CPL = better
  const leadsScore = normalize(metrics.leads, 0, 20) * 3.0;           // 30%
  const freqScore = normalize(metrics.frequency, 4.0, 1.0) * 1.0;    // 10% — lower freq = better

  return Math.min(10, Math.max(0, ctrScore + cplScore + leadsScore + freqScore));
}

export async function runPerformanceAnalyzer(): Promise<{
  synced: number;
  errors: number;
}> {
  const supabase = createAdminClient();
  let synced = 0;
  let errors = 0;

  // Fetch all active ads with a meta_ad_id
  const { data: ads } = await supabase
    .from('ads')
    .select('id, meta_ad_id, ad_set_id, ad_campaign_id, headline, primary_text, cta_type')
    .eq('status', 'ACTIVE')
    .not('meta_ad_id', 'is', null);

  if (!ads || ads.length === 0) return { synced: 0, errors: 0 };

  for (const ad of ads) {
    if (!ad.meta_ad_id) continue;

    const insights = await getInsights(ad.meta_ad_id, 'last_7d');
    if (!insights) {
      errors++;
      continue;
    }

    // Insert performance snapshot
    await supabase.from('ad_performance').upsert(
      {
        entity_type: 'ad',
        entity_id: ad.id,
        meta_entity_id: ad.meta_ad_id,
        date_start: insights.date_start,
        date_stop: insights.date_stop,
        impressions: insights.impressions,
        clicks: insights.clicks,
        leads: insights.leads,
        spend_cents: insights.spend_cents,
        reach: insights.reach,
        frequency: insights.frequency,
        ctr: insights.ctr,
        cpc_cents: insights.cpc_cents,
        cpl_cents: insights.cpl_cents,
        raw_insights: insights.raw as Record<string, unknown>,
      },
      { onConflict: 'entity_type,entity_id,date_start', ignoreDuplicates: false }
    );

    // Calculate and update performance score
    const score = calculatePerformanceScore({
      ctr: insights.ctr,
      cpl_cents: insights.cpl_cents,
      leads: insights.leads,
      frequency: insights.frequency,
      impressions: insights.impressions,
    });

    await supabase
      .from('ads')
      .update({
        performance_score: score,
        impressions: insights.impressions,
        clicks: insights.clicks,
        leads: insights.leads,
        ctr: insights.ctr,
        cpl_cents: insights.cpl_cents,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', ad.id);

    // If high-performing ad, upsert into creative_insights for self-learning
    if (score >= 7 && insights.impressions >= 500) {
      // Fetch job category from campaign
      const { data: campaign } = await supabase
        .from('ad_campaigns')
        .select('job_id')
        .eq('id', ad.ad_campaign_id)
        .single();

      if (campaign) {
        const { data: job } = await supabase
          .from('jobs')
          .select('title')
          .eq('id', campaign.job_id)
          .single();

        if (job) {
          const jobCategory = job.title.split(' ')[0]; // rough category
          await supabase.from('creative_insights').upsert(
            {
              job_category: jobCategory,
              hook_type: 'benefit',
              headline_template: ad.headline,
              primary_text_template: ad.primary_text,
              avg_ctr: insights.ctr,
              avg_cpl_cents: insights.cpl_cents,
              avg_performance_score: score,
              total_leads: insights.leads,
              total_impressions: insights.impressions,
              usage_count: 1,
            },
            {
              onConflict: 'job_category,hook_type,headline_template',
              ignoreDuplicates: false,
            }
          );
        }
      }
    }

    synced++;
  }

  // Recalculate ad set scores (average of their ads)
  const { data: adSets } = await supabase
    .from('ad_sets')
    .select('id')
    .eq('status', 'ACTIVE');

  if (adSets) {
    for (const adSet of adSets) {
      const { data: setAds } = await supabase
        .from('ads')
        .select('performance_score')
        .eq('ad_set_id', adSet.id)
        .not('performance_score', 'is', null);

      if (setAds && setAds.length > 0) {
        const avg =
          setAds.reduce((sum, a) => sum + (a.performance_score ?? 0), 0) / setAds.length;
        await supabase
          .from('ad_sets')
          .update({ performance_score: avg })
          .eq('id', adSet.id);
      }
    }
  }

  return { synced, errors };
}
