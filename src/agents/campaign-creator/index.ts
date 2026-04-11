import { createAdminClient } from '@/lib/supabase/admin';
import { createMetaCampaign } from '@/services/meta/campaigns';
import { createMetaAdSet } from '@/services/meta/adsets';
import { generateCreatives } from '@/agents/creative-generator';
import { getFunnelPublicUrl } from '@/lib/funnel-url';
import type { CampaignCreateOptions, MetaTargeting } from '@/types/meta-ads';

// Interest clusters per job category
const INTEREST_CLUSTERS: Record<string, { id: string; name: string }[]> = {
  Elektriker: [
    { id: '6003107902433', name: 'Elektrotechnik' },
    { id: '6003384750160', name: 'Handwerk' },
    { id: '6002910539513', name: 'DIY' },
  ],
  Maurer: [
    { id: '6003384750160', name: 'Handwerk' },
    { id: '6003338605867', name: 'Bauwesen' },
  ],
  Installateur: [
    { id: '6003384750160', name: 'Handwerk' },
    { id: '6003107902433', name: 'Sanitär' },
  ],
  Maler: [
    { id: '6003384750160', name: 'Handwerk' },
    { id: '6002910539513', name: 'Heimwerken' },
  ],
  Schlosser: [
    { id: '6003384750160', name: 'Handwerk' },
    { id: '6003107902433', name: 'Metallverarbeitung' },
  ],
};

function genderToMeta(gender?: string): number[] | undefined {
  if (!gender || gender === 'ALL') return undefined;
  return gender === 'MALE' ? [1] : [2];
}

function buildPlacementsTargeting(
  placementType: string | undefined,
  placements: string[] | undefined
): Pick<MetaTargeting, 'publisher_platforms' | 'facebook_positions' | 'instagram_positions'> {
  if (placementType !== 'manual' || !placements || placements.length === 0) {
    return { publisher_platforms: ['facebook', 'instagram'] };
  }
  const fbPositions = placements
    .filter((p) => p.startsWith('facebook_'))
    .map((p) => p.replace('facebook_', ''));
  const igPositions = placements
    .filter((p) => p.startsWith('instagram_'))
    .map((p) => p.replace('instagram_', ''));
  const platforms: string[] = [];
  if (fbPositions.length > 0 || placements.includes('messenger')) platforms.push('facebook');
  if (igPositions.length > 0) platforms.push('instagram');
  return {
    publisher_platforms: platforms.length > 0 ? platforms : ['facebook', 'instagram'],
    ...(fbPositions.length > 0 ? { facebook_positions: fbPositions } : {}),
    ...(igPositions.length > 0 ? { instagram_positions: igPositions } : {}),
  };
}

function buildTargetingVariants(
  jobCategory: string,
  regions: string[],
  options: {
    age_min?: number;
    age_max?: number;
    gender?: string;
    placement_type?: string;
    placements?: string[];
    customInterests?: string[];
  }
): Array<{ name: string; targeting: MetaTargeting }> {
  const interests = INTEREST_CLUSTERS[jobCategory] ?? [];
  const geoLocations: MetaTargeting['geo_locations'] =
    regions.length > 0
      ? { countries: ['AT'], regions: regions.map((r) => ({ key: r })) }
      : { countries: ['AT'] };

  const ageMin = options.age_min ?? 22;
  const ageMax = options.age_max ?? 55;
  const genders = genderToMeta(options.gender);
  const placements = buildPlacementsTargeting(options.placement_type, options.placements);

  return [
    {
      name: `Broad ${ageMin}-${ageMax}`,
      targeting: {
        age_min: ageMin,
        age_max: ageMax,
        ...(genders ? { genders } : {}),
        geo_locations: geoLocations,
        ...placements,
        device_platforms: ['mobile'],
      },
    },
    {
      name: `Interests ${Math.min(ageMin + 3, 25)}-${Math.max(ageMax - 10, 35)}`,
      targeting: {
        age_min: Math.min(ageMin + 3, 25),
        age_max: Math.max(ageMax - 10, 35),
        ...(genders ? { genders } : {}),
        interests,
        geo_locations: geoLocations,
        ...placements,
        device_platforms: ['mobile'],
      },
    },
    {
      name: `Retargeting ${ageMin}-${Math.max(ageMax - 5, 40)}`,
      targeting: {
        age_min: ageMin,
        age_max: Math.max(ageMax - 5, 40),
        ...(genders ? { genders } : {}),
        geo_locations: geoLocations,
        publisher_platforms: ['facebook'],
        facebook_positions: ['feed'],
        device_platforms: ['mobile'],
      },
    },
  ];
}

export async function createRecruitingCampaign(options: CampaignCreateOptions): Promise<{
  ad_campaign_id: string;
  meta_campaign_id: string;
  campaign_name: string;
}> {
  const supabase = createAdminClient();

  // Fetch job details
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, location, salary_range, company_id')
    .eq('id', options.job_id)
    .single();

  if (jobError || !job) throw new Error(`Job not found: ${options.job_id}`);

  // Resolve destination URL from funnel if not explicitly provided
  let destinationUrl = options.destination_url;
  if (!destinationUrl && options.funnel_id) {
    const { data: funnelData } = await supabase
      .from('funnels')
      .select('slug, funnel_type, external_url')
      .eq('id', options.funnel_id)
      .single();
    if (funnelData) {
      destinationUrl = getFunnelPublicUrl(funnelData as { slug: string; funnel_type: string; external_url: string | null });
    }
  }

  const campaignName = options.campaign_name ?? `[KI] ${job.title} – ${job.location ?? 'AT'}`;
  const objective = (options.objective ?? 'OUTCOME_LEADS') as import('@/types/meta-ads').MetaAdObjective;
  const specialAdCategories = options.special_category ? [options.special_category] : [];

  // 1. Create Meta campaign
  const metaCampaign = await createMetaCampaign({
    name: campaignName,
    objective: objective as 'OUTCOME_LEADS',
    status: 'PAUSED',
    daily_budget_cents: options.daily_budget_cents,
    special_ad_categories: specialAdCategories,
  });

  // 2. Save campaign to DB
  const { data: dbCampaign, error: campaignError } = await supabase
    .from('ad_campaigns')
    .insert({
      job_id: options.job_id,
      company_id: options.company_id,
      meta_campaign_id: metaCampaign.id,
      name: campaignName,
      objective: objective as string,
      status: 'PAUSED',
      daily_budget_cents: options.daily_budget_cents,
      funnel_id: options.funnel_id ?? null,
    })
    .select('id')
    .single();

  if (campaignError || !dbCampaign) throw new Error(`Failed to save campaign to DB: ${campaignError?.message}`);

  // 3. Generate or use provided creatives
  let creatives;
  if (options.primary_text && options.headline) {
    // Use wizard-provided creative as the base variant
    creatives = [{
      headline: options.headline,
      primary_text: options.primary_text,
      cta_type: options.cta_type ?? 'APPLY_NOW',
      hook_type: 'benefit' as const,
    }];
  } else {
    creatives = await generateCreatives({
      job_title: job.title,
      job_category: options.job_category,
      location: job.location ?? 'Österreich',
      salary_range: job.salary_range ?? undefined,
      count: 3,
    });
  }

  // 4. Create ad sets with different targeting variants
  const targetingVariants = buildTargetingVariants(
    options.job_category,
    options.regions ?? [],
    {
      age_min: options.age_min,
      age_max: options.age_max,
      gender: options.gender,
      placement_type: options.placement_type,
      placements: options.placements,
    }
  );

  for (const variant of targetingVariants) {
    const metaAdSet = await createMetaAdSet({
      campaign_id: metaCampaign.id,
      name: `${campaignName} – ${variant.name}`,
      status: 'PAUSED',
      daily_budget_cents: Math.floor(options.daily_budget_cents / targetingVariants.length),
      targeting: variant.targeting,
    });

    // Save ad set to DB
    const { data: dbAdSet, error: adSetError } = await supabase
      .from('ad_sets')
      .insert({
        ad_campaign_id: dbCampaign.id,
        meta_adset_id: metaAdSet.id,
        name: `${campaignName} – ${variant.name}`,
        status: 'PAUSED',
        daily_budget_cents: Math.floor(options.daily_budget_cents / targetingVariants.length),
        targeting: variant.targeting,
      })
      .select('id')
      .single();

    if (adSetError || !dbAdSet) continue;

    // Save ads to DB (not yet pushed to Meta — need page_id + image)
    const labels = ['A', 'B', 'C'];
    for (let i = 0; i < creatives.length; i++) {
      const c = creatives[i];
      await supabase.from('ads').insert({
        ad_set_id: dbAdSet.id,
        ad_campaign_id: dbCampaign.id,
        name: `${job.title} – ${variant.name} – ${labels[i]}`,
        status: 'PAUSED',
        headline: c.headline,
        primary_text: c.primary_text,
        description: c.description ?? null,
        cta_type: c.cta_type,
        variant_label: labels[i],
        generated_by_ai: true,
        ...(destinationUrl ? { destination_url: destinationUrl } : {}),
      });
    }
  }

  return {
    ad_campaign_id: dbCampaign.id,
    meta_campaign_id: metaCampaign.id,
    campaign_name: campaignName,
  };
}
