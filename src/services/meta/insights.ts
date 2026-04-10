import { metaFetch } from './client';
import type { MetaInsightsResponse, MetaInsightsAction } from '@/types/meta-ads';

const INSIGHTS_FIELDS = [
  'impressions',
  'clicks',
  'spend',
  'reach',
  'frequency',
  'ctr',
  'cpc',
  'actions',
  'cost_per_action_type',
].join(',');

export interface ParsedInsights {
  impressions: number;
  clicks: number;
  leads: number;
  spend_cents: number;
  reach: number;
  frequency: number;
  ctr: number;
  cpc_cents: number;
  cpl_cents: number;
  date_start: string;
  date_stop: string;
  raw: MetaInsightsResponse;
}

function extractLeads(actions?: MetaInsightsAction[]): number {
  if (!actions) return 0;
  const leadAction = actions.find((a) => a.action_type === 'lead');
  return leadAction ? parseInt(leadAction.value, 10) : 0;
}

function eurosToCents(value?: string): number {
  if (!value) return 0;
  return Math.round(parseFloat(value) * 100);
}

export async function getInsights(
  metaEntityId: string,
  datePreset: string = 'last_7d'
): Promise<ParsedInsights | null> {
  try {
    const data = await metaFetch<{ data: MetaInsightsResponse[] }>(
      `${metaEntityId}/insights`,
      {
        params: {
          fields: INSIGHTS_FIELDS,
          date_preset: datePreset,
        },
      }
    );

    const row = data.data?.[0];
    if (!row) return null;

    const leads = extractLeads(row.actions);
    const spend_cents = eurosToCents(row.spend);
    const cpl_cents = leads > 0 ? Math.round(spend_cents / leads) : 0;

    return {
      impressions: parseInt(row.impressions ?? '0', 10),
      clicks: parseInt(row.clicks ?? '0', 10),
      leads,
      spend_cents,
      reach: parseInt(row.reach ?? '0', 10),
      frequency: parseFloat(row.frequency ?? '0'),
      ctr: parseFloat(row.ctr ?? '0'),
      cpc_cents: eurosToCents(row.cpc),
      cpl_cents,
      date_start: row.date_start ?? new Date().toISOString().split('T')[0],
      date_stop: row.date_stop ?? new Date().toISOString().split('T')[0],
      raw: row,
    };
  } catch {
    return null;
  }
}

export async function getDailyInsights(
  metaEntityId: string,
  since: string,
  until: string
): Promise<ParsedInsights[]> {
  const data = await metaFetch<{ data: MetaInsightsResponse[] }>(
    `${metaEntityId}/insights`,
    {
      params: {
        fields: INSIGHTS_FIELDS,
        time_range: JSON.stringify({ since, until }),
        time_increment: '1',
      },
    }
  );

  return (data.data ?? []).map((row) => {
    const leads = extractLeads(row.actions);
    const spend_cents = eurosToCents(row.spend);
    return {
      impressions: parseInt(row.impressions ?? '0', 10),
      clicks: parseInt(row.clicks ?? '0', 10),
      leads,
      spend_cents,
      reach: parseInt(row.reach ?? '0', 10),
      frequency: parseFloat(row.frequency ?? '0'),
      ctr: parseFloat(row.ctr ?? '0'),
      cpc_cents: eurosToCents(row.cpc),
      cpl_cents: leads > 0 ? Math.round(spend_cents / leads) : 0,
      date_start: row.date_start ?? '',
      date_stop: row.date_stop ?? '',
      raw: row,
    };
  });
}
