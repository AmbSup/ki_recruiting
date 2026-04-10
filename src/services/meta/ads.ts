import { metaFetch, AD_ACCOUNT_ID } from './client';
import type { MetaCampaignStatus } from '@/types/meta-ads';

export interface MetaAdCreateParams {
  adset_id: string;
  name: string;
  status: MetaCampaignStatus;
  creative: {
    headline: string;
    primary_text: string;
    description?: string;
    cta_type: string;
    image_hash?: string;
    page_id: string;
    link_url: string;
  };
}

export interface MetaAdResponse {
  id: string;
  name: string;
  status: MetaCampaignStatus;
}

export async function createMetaAd(
  params: MetaAdCreateParams
): Promise<MetaAdResponse> {
  // First create the ad creative
  const creative = await metaFetch<{ id: string }>(
    `${AD_ACCOUNT_ID}/adcreatives`,
    {
      method: 'POST',
      body: {
        name: `Creative - ${params.name}`,
        object_story_spec: {
          page_id: params.creative.page_id,
          link_data: {
            message: params.creative.primary_text,
            link: params.creative.link_url,
            name: params.creative.headline,
            description: params.creative.description ?? '',
            call_to_action: {
              type: params.creative.cta_type,
              value: { link: params.creative.link_url },
            },
            ...(params.creative.image_hash
              ? { image_hash: params.creative.image_hash }
              : {}),
          },
        },
      },
    }
  );

  // Then create the ad referencing the creative
  return metaFetch<MetaAdResponse>(`${AD_ACCOUNT_ID}/ads`, {
    method: 'POST',
    body: {
      name: params.name,
      adset_id: params.adset_id,
      creative: { creative_id: creative.id },
      status: params.status,
    },
  });
}

export async function updateMetaAdStatus(
  metaAdId: string,
  status: MetaCampaignStatus
): Promise<{ success: boolean }> {
  return metaFetch<{ success: boolean }>(`${metaAdId}`, {
    method: 'POST',
    body: { status },
  });
}
