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

export async function updateMetaCampaignStatus(
  metaCampaignId: string,
  status: MetaCampaignStatus
): Promise<{ success: boolean }> {
  return metaFetch<{ success: boolean }>(`${metaCampaignId}`, {
    method: 'POST',
    body: { status },
  });
}
