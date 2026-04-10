import { createAdminClient } from '@/lib/supabase/admin';
import { updateMetaAdSetBudget, updateMetaAdSetStatus } from '@/services/meta/adsets';

const MAX_DAILY_BUDGET_CENTS = 20000; // €200/day hard cap
const MIN_DAILY_BUDGET_CENTS = 500;   // €5/day floor

export async function runBudgetOptimizer(): Promise<{
  paused: number;
  increased: number;
  decreased: number;
  held: number;
}> {
  const supabase = createAdminClient();
  const stats = { paused: 0, increased: 0, decreased: 0, held: 0 };

  const { data: adSets } = await supabase
    .from('ad_sets')
    .select('id, meta_adset_id, performance_score, daily_budget_cents, ad_campaign_id')
    .eq('status', 'ACTIVE')
    .not('performance_score', 'is', null)
    .not('meta_adset_id', 'is', null);

  if (!adSets) return stats;

  for (const adSet of adSets) {
    const score = adSet.performance_score ?? 0;
    const currentBudget = adSet.daily_budget_cents ?? 1000;
    let action: string;
    let newBudget: number | null = null;

    if (score < 2.5) {
      // Pause — too poor to waste budget
      await updateMetaAdSetStatus(adSet.meta_adset_id!, 'PAUSED');
      await supabase.from('ad_sets').update({ status: 'PAUSED' }).eq('id', adSet.id);
      action = 'paused';
      stats.paused++;
    } else if (score < 4.0) {
      // Reduce budget 20%
      newBudget = Math.max(MIN_DAILY_BUDGET_CENTS, Math.floor(currentBudget * 0.8));
      action = 'budget_decreased';
      stats.decreased++;
    } else if (score >= 7.0) {
      // Increase budget 20%
      newBudget = Math.min(MAX_DAILY_BUDGET_CENTS, Math.floor(currentBudget * 1.2));
      action = 'budget_increased';
      stats.increased++;
    } else {
      // 4.0–7.0 — hold
      action = 'held';
      stats.held++;
    }

    if (newBudget !== null && newBudget !== currentBudget) {
      await updateMetaAdSetBudget(adSet.meta_adset_id!, newBudget);
      await supabase
        .from('ad_sets')
        .update({ daily_budget_cents: newBudget })
        .eq('id', adSet.id);
    }

    if (action !== 'held') {
      await supabase.from('optimization_log').insert({
        entity_type: 'adset',
        entity_id: adSet.id,
        action: action === 'paused' ? 'paused' : action === 'budget_increased' ? 'budget_increased' : 'budget_decreased',
        reason: `Performance score: ${score.toFixed(2)}`,
        previous_value: { daily_budget_cents: currentBudget, status: 'ACTIVE' },
        new_value:
          action === 'paused'
            ? { status: 'PAUSED' }
            : { daily_budget_cents: newBudget },
        triggered_by: 'n8n',
      });
    }
  }

  return stats;
}
