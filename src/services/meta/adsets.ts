import { metaFetch, AD_ACCOUNT_ID } from './client';
import type { MetaTargeting, MetaCampaignStatus } from '@/types/meta-ads';

export interface MetaAdSetCreateParams {
  campaign_id: string;
  name: string;
  status: MetaCampaignStatus;
  daily_budget_cents: number;
  targeting: MetaTargeting;
  optimization_goal?: string;
  billing_event?: string;
  bid_amount_cents?: number;
  promoted_object?: { page_id?: string; pixel_id?: string; custom_event_type?: string };
}

export interface MetaAdSetResponse {
  id: string;
  name: string;
  status: MetaCampaignStatus;
  campaign_id: string;
}

export async function createMetaAdSet(
  params: MetaAdSetCreateParams
): Promise<MetaAdSetResponse> {
  return metaFetch<MetaAdSetResponse>(`${AD_ACCOUNT_ID}/adsets`, {
    method: 'POST',
    body: {
      campaign_id: params.campaign_id,
      name: params.name,
      status: params.status,
      daily_budget: params.daily_budget_cents,
      targeting: params.targeting,
      optimization_goal: params.optimization_goal ?? 'LEAD_GENERATION',
      billing_event: params.billing_event ?? 'IMPRESSIONS',
      destination_type: 'WEBSITE',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      ...(params.bid_amount_cents ? { bid_amount: params.bid_amount_cents } : {}),
      ...(params.promoted_object
        ? {
            promoted_object: params.promoted_object.pixel_id
              ? { ...params.promoted_object, custom_event_type: params.promoted_object.custom_event_type ?? 'LEAD' }
              : params.promoted_object,
          }
        : {}),
    },
  });
}

export async function updateMetaAdSetBudget(
  metaAdSetId: string,
  daily_budget_cents: number
): Promise<{ success: boolean }> {
  return metaFetch<{ success: boolean }>(`${metaAdSetId}`, {
    method: 'POST',
    body: { daily_budget: daily_budget_cents },
  });
}

export async function updateMetaAdSetStatus(
  metaAdSetId: string,
  status: MetaCampaignStatus
): Promise<{ success: boolean }> {
  return metaFetch<{ success: boolean }>(`${metaAdSetId}`, {
    method: 'POST',
    body: { status },
  });
}
