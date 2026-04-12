import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadImageToMeta } from '@/services/meta/images';
import { createMetaAd } from '@/services/meta/ads';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ad_id, image_base64, page_id: bodyPageId } = body as {
      ad_id: string;
      image_base64: string;
      page_id?: string;
    };

    if (!ad_id) return NextResponse.json({ error: 'ad_id is required' }, { status: 400 });
    if (!image_base64) return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 });

    const page_id = bodyPageId ?? process.env.META_PAGE_ID;
    if (!page_id) return NextResponse.json({ error: 'META_PAGE_ID not configured' }, { status: 500 });

    const supabase = createAdminClient();

    // Fetch ad + adset for meta_adset_id
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('id, name, headline, primary_text, description, cta_type, destination_url, ad_set_id, meta_ad_id')
      .eq('id', ad_id)
      .single();

    if (adError || !ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }
    if (ad.meta_ad_id) {
      return NextResponse.json({ error: 'Ad already published to Meta', meta_ad_id: ad.meta_ad_id }, { status: 409 });
    }

    const { data: adSet, error: adSetError } = await supabase
      .from('ad_sets')
      .select('meta_adset_id')
      .eq('id', ad.ad_set_id)
      .single();

    if (adSetError || !adSet?.meta_adset_id) {
      return NextResponse.json({ error: 'Ad set not found or not synced with Meta' }, { status: 404 });
    }

    if (!ad.destination_url) {
      return NextResponse.json({ error: 'Ad has no destination_url' }, { status: 400 });
    }

    // 1. Upload image to Meta
    const image_hash = await uploadImageToMeta(image_base64, `${ad.name}.jpg`);

    // 2. Create ad creative + ad on Meta
    const metaAd = await createMetaAd({
      adset_id: adSet.meta_adset_id,
      name: ad.name,
      status: 'PAUSED',
      creative: {
        headline: ad.headline,
        primary_text: ad.primary_text,
        description: ad.description ?? undefined,
        cta_type: ad.cta_type ?? 'APPLY_NOW',
        image_hash,
        page_id,
        link_url: ad.destination_url,
      },
    });

    // 3. Update DB
    await supabase
      .from('ads')
      .update({ meta_ad_id: metaAd.id, image_hash, status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', ad_id);

    return NextResponse.json({ success: true, meta_ad_id: metaAd.id, image_hash });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
