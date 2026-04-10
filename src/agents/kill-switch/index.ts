import { createAdminClient } from '@/lib/supabase/admin';
import { updateMetaCampaignStatus } from '@/services/meta/campaigns';
import { updateMetaAdSetStatus } from '@/services/meta/adsets';
import { updateMetaAdStatus } from '@/services/meta/ads';

const THRESHOLDS = {
  maxDailySpendCents: 50000,   // €500/day per campaign
  maxCplCents: 8000,           // €80 cost-per-lead
  maxFrequency: 4.0,           // ad fatigue threshold
  minLeadsAfter3Days: 1,       // min leads after 3 days with 1000+ impressions
  minImpressionsForLeadCheck: 1000,
} as const;

export async function runKillSwitch(): Promise<{
  campaigns_paused: number;
  adsets_paused: number;
  ads_paused: number;
}> {
  const supabase = createAdminClient();
  const stats = { campaigns_paused: 0, adsets_paused: 0, ads_paused: 0 };

  // --- Campaign level: daily spend check ---
  const { data: campaigns } = await supabase
    .from('ad_campaigns')
    .select('id, meta_campaign_id, name, total_spent_cents, daily_budget_cents')
    .eq('status', 'ACTIVE')
    .not('meta_campaign_id', 'is', null);

  if (campaigns) {
    for (const campaign of campaigns) {
      const todaySpend = campaign.total_spent_cents ?? 0;
      if (todaySpend > THRESHOLDS.maxDailySpendCents) {
        await updateMetaCampaignStatus(campaign.meta_campaign_id!, 'PAUSED');
        await supabase
          .from('ad_campaigns')
          .update({
            status: 'PAUSED',
            kill_switch_triggered: true,
            kill_switch_reason: `Daily spend €${(todaySpend / 100).toFixed(2)} exceeded threshold €${(THRESHOLDS.maxDailySpendCents / 100).toFixed(2)}`,
          })
          .eq('id', campaign.id);

        await supabase.from('optimization_log').insert({
          entity_type: 'campaign',
          entity_id: campaign.id,
          action: 'killed',
          reason: `Kill switch: daily spend €${(todaySpend / 100).toFixed(2)} > €${(THRESHOLDS.maxDailySpendCents / 100).toFixed(2)}`,
          previous_value: { status: 'ACTIVE', total_spent_cents: todaySpend },
          new_value: { status: 'PAUSED' },
          triggered_by: 'kill_switch',
        });

        stats.campaigns_paused++;
      }
    }
  }

  // --- Ad set level: CPL check ---
  const { data: adSets } = await supabase
    .from('ad_sets')
    .select('id, meta_adset_id, cpl_cents, leads')
    .eq('status', 'ACTIVE')
    .not('meta_adset_id', 'is', null)
    .not('cpl_cents', 'is', null);

  if (adSets) {
    for (const adSet of adSets) {
      if ((adSet.cpl_cents ?? 0) > THRESHOLDS.maxCplCents && (adSet.leads ?? 0) > 0) {
        await updateMetaAdSetStatus(adSet.meta_adset_id!, 'PAUSED');
        await supabase.from('ad_sets').update({ status: 'PAUSED' }).eq('id', adSet.id);
        await supabase.from('optimization_log').insert({
          entity_type: 'adset',
          entity_id: adSet.id,
          action: 'killed',
          reason: `Kill switch: CPL €${((adSet.cpl_cents ?? 0) / 100).toFixed(2)} > threshold €${(THRESHOLDS.maxCplCents / 100).toFixed(2)}`,
          previous_value: { status: 'ACTIVE', cpl_cents: adSet.cpl_cents },
          new_value: { status: 'PAUSED' },
          triggered_by: 'kill_switch',
        });
        stats.adsets_paused++;
      }
    }
  }

  // --- Ad level: frequency + no-lead check ---
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: ads } = await supabase
    .from('ads')
    .select('id, meta_ad_id, impressions, leads, created_at')
    .eq('status', 'ACTIVE')
    .not('meta_ad_id', 'is', null);

  if (ads) {
    for (const ad of ads) {
      // Get latest frequency from ad_performance
      const { data: perf } = await supabase
        .from('ad_performance')
        .select('frequency, impressions, leads')
        .eq('entity_type', 'ad')
        .eq('entity_id', ad.id)
        .order('date_start', { ascending: false })
        .limit(1)
        .single();

      let shouldKill = false;
      let reason = '';

      // Frequency check
      if (perf && (perf.frequency ?? 0) > THRESHOLDS.maxFrequency) {
        shouldKill = true;
        reason = `Frequency ${perf.frequency?.toFixed(2)} > ${THRESHOLDS.maxFrequency} (ad fatigue)`;
      }

      // No leads after 3 days with sufficient impressions
      const createdAt = new Date(ad.created_at);
      const isOlderThan3Days = createdAt < new Date(threeDaysAgo);
      if (
        !shouldKill &&
        isOlderThan3Days &&
        (ad.impressions ?? 0) >= THRESHOLDS.minImpressionsForLeadCheck &&
        (ad.leads ?? 0) < THRESHOLDS.minLeadsAfter3Days
      ) {
        shouldKill = true;
        reason = `0 leads after 3 days with ${ad.impressions} impressions`;
      }

      if (shouldKill) {
        await updateMetaAdStatus(ad.meta_ad_id!, 'PAUSED');
        await supabase.from('ads').update({ status: 'PAUSED' }).eq('id', ad.id);
        await supabase.from('optimization_log').insert({
          entity_type: 'ad',
          entity_id: ad.id,
          action: 'killed',
          reason: `Kill switch: ${reason}`,
          previous_value: { status: 'ACTIVE' },
          new_value: { status: 'PAUSED' },
          triggered_by: 'kill_switch',
        });
        stats.ads_paused++;
      }
    }
  }

  return stats;
}
