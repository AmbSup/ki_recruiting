import { metaFetch, AD_ACCOUNT_ID } from './client';
import type { MetaCampaignStatus, MetaAdObjective } from '@/types/meta-ads';

export interface MetaCampaignCreateParams {
  name: string;
  objective: MetaAdObjective;
  status: MetaCampaignStatus;
  daily_budget_cents: number;
  special_ad_categories?: string[];
}

export interface MetaCampaignResponse {
  id: string;
  name: string;
  status: MetaCampaignStatus;
}

export async function createMetaCampaign(
  params: MetaCampaignCreateParams
): Promise<MetaCampaignResponse> {
  return metaFetch<MetaCampaignResponse>(`${AD_ACCOUNT_ID}/campaigns`, {
    method: 'POST',
    body: {
      name: params.name,
      objective: params.objective,
      status: params.status,
      special_ad_categories: params.special_ad_categories ?? [],
      // Budget is managed at ad set level — no campaign-level budget
    },
  });
}

export interface MetaCampaignListItem {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  created_time: string;
  insights?: {
    data: Array<{
      impressions?: string;
      clicks?: string;
      spend?: string;
      actions?: Array<{ action_type: string; value: string }>;
    }>;
  };
}

export async function listMetaCampaigns(): Promise<MetaCampaignListItem[]> {
  const result = await metaFetch<{ data: MetaCampaignListItem[] }>(
    `${AD_ACCOUNT_ID}/campaigns`,
    {
      params: {
        fields: 'id,name,status,objective,daily_budget,created_time,insights.date_preset(last_30d){impressions,clicks,spend,actions}',
        limit: '50',
      },
    }
  );
  return result.data ?? [];
}

export async function updateMetaCampaignStatus(
  metaCampaignId: string,
  status: MetaCampaignStatus
): Promise<{ success: boolean }> {
  return metaFetch<{ success: boolean }>(`${metaCampaignId}`, {
    method: 'POST',
    body: { status },
  });
}
