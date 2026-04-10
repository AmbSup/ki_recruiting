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
      daily_budget: params.daily_budget_cents,
      special_ad_categories: params.special_ad_categories ?? [],
    },
  });
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
