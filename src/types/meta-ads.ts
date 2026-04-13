// ============================================================
// Meta Ads Engine — TypeScript Types
// ============================================================

export type MetaCampaignStatus =
  | 'PAUSED'
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'DELETED'
  | 'IN_PROCESS'
  | 'WITH_ISSUES';

export type MetaAdObjective =
  | 'OUTCOME_LEADS'
  | 'OUTCOME_SALES'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_APP_PROMOTION';

export type OptimizationAction =
  | 'budget_increased'
  | 'budget_decreased'
  | 'paused'
  | 'reactivated'
  | 'creative_rotated'
  | 'audience_expanded'
  | 'killed';

// ---- DB Row Types ----

export interface AdCampaign {
  id: string;
  job_id: string;
  company_id: string;
  meta_campaign_id: string | null;
  name: string;
  objective: MetaAdObjective;
  status: MetaCampaignStatus;
  daily_budget_cents: number;
  lifetime_budget_cents: number | null;
  total_spent_cents: number;
  impressions: number;
  clicks: number;
  leads: number;
  ctr: number | null;
  cpl_cents: number | null;
  kill_switch_triggered: boolean;
  kill_switch_reason: string | null;
  started_at: string | null;
  ended_at: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdSet {
  id: string;
  ad_campaign_id: string;
  meta_adset_id: string | null;
  name: string;
  status: MetaCampaignStatus;
  daily_budget_cents: number | null;
  targeting: MetaTargeting;
  optimization_goal: string;
  billing_event: string;
  bid_amount_cents: number | null;
  impressions: number;
  clicks: number;
  leads: number;
  ctr: number | null;
  cpl_cents: number | null;
  performance_score: number | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ad {
  id: string;
  ad_set_id: string;
  ad_campaign_id: string;
  meta_ad_id: string | null;
  name: string;
  status: MetaCampaignStatus;
  headline: string;
  primary_text: string;
  description: string | null;
  cta_type: string;
  image_url: string | null;
  image_hash: string | null;
  impressions: number;
  clicks: number;
  leads: number;
  ctr: number | null;
  cpl_cents: number | null;
  performance_score: number | null;
  variant_label: string | null;
  generated_by_ai: boolean;
  creative_insight_id: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdPerformance {
  id: string;
  entity_type: 'campaign' | 'adset' | 'ad';
  entity_id: string;
  meta_entity_id: string;
  date_start: string;
  date_stop: string;
  impressions: number;
  clicks: number;
  leads: number;
  spend_cents: number;
  reach: number;
  frequency: number | null;
  ctr: number | null;
  cpc_cents: number | null;
  cpl_cents: number | null;
  raw_insights: Record<string, unknown>;
  synced_at: string;
}

export interface CreativeInsight {
  id: string;
  job_category: string;
  hook_type: 'salary' | 'urgency' | 'social_proof' | 'benefit' | 'question';
  headline_template: string;
  primary_text_template: string | null;
  usage_count: number;
  avg_ctr: number | null;
  avg_cpl_cents: number | null;
  avg_performance_score: number | null;
  total_leads: number;
  total_impressions: number;
  effectiveness_rank: number | null;
  created_at: string;
  updated_at: string;
}

export interface AdLead {
  id: string;
  ad_id: string | null;
  ad_set_id: string | null;
  ad_campaign_id: string;
  meta_lead_id: string | null;
  meta_form_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  raw_field_data: Record<string, unknown>;
  applicant_id: string | null;
  application_id: string | null;
  imported_at: string;
  matched_at: string | null;
  created_at: string;
}

export interface OptimizationLog {
  id: string;
  entity_type: 'campaign' | 'adset' | 'ad';
  entity_id: string;
  action: OptimizationAction;
  reason: string | null;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  triggered_by: 'n8n' | 'manual' | 'kill_switch';
  created_at: string;
}

// ---- Meta API Types ----

export interface MetaGeoLocation {
  countries?: string[];
  regions?: { key: string }[];
  cities?: { key: string }[];
}

export interface MetaInterest {
  id: string;
  name: string;
}

export interface MetaTargeting {
  age_min?: number;
  age_max?: number;
  genders?: number[];
  geo_locations?: MetaGeoLocation;
  interests?: MetaInterest[];
  behaviors?: MetaInterest[];
  custom_audiences?: { id: string }[];
  lookalike_audiences?: { id: string }[];
  publisher_platforms?: string[];
  facebook_positions?: string[];
  instagram_positions?: string[];
  device_platforms?: string[];
}

export interface MetaInsightsAction {
  action_type: string;
  value: string;
}

export interface MetaInsightsResponse {
  impressions?: string;
  clicks?: string;
  spend?: string;
  reach?: string;
  frequency?: string;
  ctr?: string;
  cpc?: string;
  actions?: MetaInsightsAction[];
  date_start?: string;
  date_stop?: string;
}

// ---- Agent Input/Output Types ----

export interface CreativeVariant {
  headline: string;
  primary_text: string;
  description?: string;
  cta_type: string;
  hook_type: 'salary' | 'urgency' | 'social_proof' | 'benefit' | 'question';
}

export interface CampaignCreateOptions {
  job_id: string;
  company_id: string;
  daily_budget_cents: number;
  regions?: string[];
  job_category: string;
  meta_page_id?: string;
  // Wizard overrides (all optional — agent uses AI defaults if absent)
  funnel_id?: string;
  campaign_name?: string;
  objective?: string;
  special_category?: string;
  age_min?: number;
  age_max?: number;
  gender?: 'ALL' | 'MALE' | 'FEMALE';
  placement_type?: 'automatic' | 'manual';
  placements?: string[];
  destination_url?: string;
  primary_text?: string;
  headline?: string;
  cta_type?: string;
  ad_image_url?: string;
  pixel_id?: string;
  utm_campaign?: string;
}

export interface PerformanceScoreInput {
  ctr: number;
  cpl_cents: number;
  leads: number;
  frequency: number;
  impressions: number;
}
