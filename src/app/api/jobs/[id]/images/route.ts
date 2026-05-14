import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireReader, requireWriter } from '@/lib/auth/guards';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireReader();
  if (!auth.ok) return auth.response;
  const { id: jobId } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('job_ad_images')
    .select('id, url, image_hash, label, ai_generated, ai_prompt, created_at')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ images: data ?? [] });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id: jobId } = await params;
  const imageId = req.nextUrl.searchParams.get('image_id');
  if (!imageId) return NextResponse.json({ error: 'image_id required' }, { status: 400 });

  const supabase = createAdminClient();

  // Fetch to get storage path for deletion
  const { data: img } = await supabase
    .from('job_ad_images')
    .select('id, url, job_id')
    .eq('id', imageId)
    .eq('job_id', jobId)
    .single();

  if (!img) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

  // Extract storage path from public URL and delete from storage
  try {
    const url = new URL(img.url);
    const pathMatch = url.pathname.match(/funnel-media\/(.+)$/);
    if (pathMatch) {
      await supabase.storage.from('funnel-media').remove([pathMatch[1]]);
    }
  } catch {
    // Storage deletion is best-effort — continue with DB deletion
  }

  const { error } = await supabase.from('job_ad_images').delete().eq('id', imageId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWriter();
  if (!auth.ok) return auth.response;
  const { id: jobId } = await params;
  const { selected_ad_image_url } = await req.json();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('jobs')
    .update({ selected_ad_image_url: selected_ad_image_url ?? null })
    .eq('id', jobId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
