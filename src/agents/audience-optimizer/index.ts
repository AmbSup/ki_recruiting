import { createAdminClient } from '@/lib/supabase/admin';
import { metaFetch, AD_ACCOUNT_ID } from '@/services/meta/client';
import { createMetaAdSet } from '@/services/meta/adsets';
import { generateText } from '@/services/claude/client';

interface LookalikeAudienceResponse {
  id: string;
  name: string;
}

async function createCustomAudienceFromLeads(emails: string[]): Promise<string | null> {
  try {
    const audience = await metaFetch<{ id: string }>(
      `${AD_ACCOUNT_ID}/customaudiences`,
      {
        method: 'POST',
        body: {
          name: `KI Recruiting Leads – ${new Date().toISOString().split('T')[0]}`,
          subtype: 'CUSTOM',
          description: 'Qualified leads from KI Recruiting',
          customer_file_source: 'USER_PROVIDED_ONLY',
        },
      }
    );

    // Add users to the audience
    const hashedEmails = emails.map((e) => e.toLowerCase().trim());
    await metaFetch(`${audience.id}/users`, {
      method: 'POST',
      body: {
        payload: {
          schema: ['EMAIL'],
          data: hashedEmails.map((e) => [e]),
        },
      },
    });

    return audience.id;
  } catch {
    return null;
  }
}

async function createLookalikeAudience(
  sourceAudienceId: string,
  country = 'AT'
): Promise<LookalikeAudienceResponse | null> {
  try {
    return await metaFetch<LookalikeAudienceResponse>(
      `${AD_ACCOUNT_ID}/customaudiences`,
      {
        method: 'POST',
        body: {
          name: `KI Lookalike AT – ${new Date().toISOString().split('T')[0]}`,
          subtype: 'LOOKALIKE',
          origin_audience_id: sourceAudienceId,
          lookalike_spec: {
            type: 'similarity',
            country,
            ratio: 0.02, // top 2% similarity
          },
        },
      }
    );
  } catch {
    return null;
  }
}

async function suggestInterestClusters(jobCategory: string): Promise<string[]> {
  const prompt = `Du bist ein Meta Ads Experte für Recruiting in Österreich.

Für die Jobkategorie "${jobCategory}" — schlage 5 Facebook/Instagram Interest-Cluster vor,
die gut für Recruiting-Anzeigen funktionieren würden.

Antworte nur mit einem JSON Array aus Strings (Interest-Namen auf Deutsch/Englisch):
["Interest 1", "Interest 2", "Interest 3", "Interest 4", "Interest 5"]`;

  try {
    const raw = await generateText(prompt, 300);
    const match = raw.match(/\[[\s\S]*?\]/);
    if (!match) return [];
    return JSON.parse(match[0]) as string[];
  } catch {
    return [];
  }
}

export async function runAudienceOptimizer(): Promise<{
  lookalikes_created: number;
  new_adsets: number;
}> {
  const supabase = createAdminClient();
  let lookalikes_created = 0;
  let new_adsets = 0;

  // Get qualified leads (linked to applications)
  const { data: leads } = await supabase
    .from('ad_leads')
    .select('email, ad_campaign_id')
    .not('application_id', 'is', null)
    .not('email', 'is', null)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (!leads || leads.length < 20) {
    // Not enough leads for lookalike — just suggest new interests
    const { data: campaigns } = await supabase
      .from('ad_campaigns')
      .select('id, job_id, meta_campaign_id')
      .eq('status', 'ACTIVE')
      .limit(3);

    if (campaigns) {
      for (const campaign of campaigns) {
        const { data: job } = await supabase
          .from('jobs')
          .select('title')
          .eq('id', campaign.job_id)
          .single();

        if (!job || !campaign.meta_campaign_id) continue;
        const category = job.title.split(' ')[0];
        const interests = await suggestInterestClusters(category);

        if (interests.length > 0) {
          const metaAdSet = await createMetaAdSet({
            campaign_id: campaign.meta_campaign_id,
            name: `AI Interests – ${category} – ${new Date().toISOString().split('T')[0]}`,
            status: 'PAUSED',
            daily_budget_cents: 1000,
            targeting: {
              age_min: 22,
              age_max: 50,
              geo_locations: { countries: ['AT'] },
              interests: interests.map((name, idx) => ({ id: String(idx), name })),
              device_platforms: ['mobile'],
            },
          });

          // Get first ad set for this campaign to get an ad_set_id reference
          const { data: existingAdSet } = await supabase
            .from('ad_sets')
            .select('id')
            .eq('ad_campaign_id', campaign.id)
            .limit(1)
            .single();

          if (existingAdSet) {
            await supabase.from('ad_sets').insert({
              ad_campaign_id: campaign.id,
              meta_adset_id: metaAdSet.id,
              name: `AI Interests – ${category}`,
              status: 'PAUSED',
              daily_budget_cents: 1000,
              targeting: { interests },
            });
            new_adsets++;

            await supabase.from('optimization_log').insert({
              entity_type: 'adset',
              entity_id: campaign.id,
              action: 'audience_expanded',
              reason: `AI suggested new interest clusters for ${category}`,
              new_value: { interests },
              triggered_by: 'n8n',
            });
          }
        }
      }
    }

    return { lookalikes_created, new_adsets };
  }

  // Group emails by campaign
  const emailsByCampaign = leads.reduce<Record<string, string[]>>((acc, lead) => {
    if (!acc[lead.ad_campaign_id]) acc[lead.ad_campaign_id] = [];
    if (lead.email) acc[lead.ad_campaign_id].push(lead.email);
    return acc;
  }, {});

  for (const [campaignId, emails] of Object.entries(emailsByCampaign)) {
    if (emails.length < 20) continue;

    const { data: campaign } = await supabase
      .from('ad_campaigns')
      .select('meta_campaign_id')
      .eq('id', campaignId)
      .single();

    if (!campaign?.meta_campaign_id) continue;

    const sourceAudienceId = await createCustomAudienceFromLeads(emails);
    if (!sourceAudienceId) continue;

    const lookalike = await createLookalikeAudience(sourceAudienceId);
    if (!lookalike) continue;
    lookalikes_created++;

    // Create a new ad set targeting the lookalike
    const metaAdSet = await createMetaAdSet({
      campaign_id: campaign.meta_campaign_id,
      name: `Lookalike – ${new Date().toISOString().split('T')[0]}`,
      status: 'PAUSED',
      daily_budget_cents: 1500,
      targeting: {
        age_min: 22,
        age_max: 55,
        geo_locations: { countries: ['AT'] },
        lookalike_audiences: [{ id: lookalike.id }],
        device_platforms: ['mobile'],
      },
    });

    await supabase.from('ad_sets').insert({
      ad_campaign_id: campaignId,
      meta_adset_id: metaAdSet.id,
      name: `Lookalike – ${new Date().toISOString().split('T')[0]}`,
      status: 'PAUSED',
      daily_budget_cents: 1500,
      targeting: { lookalike_audiences: [{ id: lookalike.id }] },
    });

    new_adsets++;

    await supabase.from('optimization_log').insert({
      entity_type: 'campaign',
      entity_id: campaignId,
      action: 'audience_expanded',
      reason: `Created lookalike audience from ${emails.length} qualified leads`,
      new_value: { lookalike_audience_id: lookalike.id },
      triggered_by: 'n8n',
    });
  }

  return { lookalikes_created, new_adsets };
}
