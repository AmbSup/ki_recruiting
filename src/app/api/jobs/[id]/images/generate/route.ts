import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '@/lib/supabase/admin';
import { composeAdImage } from '@/services/meta/image-composer';

export const maxDuration = 60;

const JOB_SCENE_MAP: Array<{ keywords: string[]; scene: string }> = [
  { keywords: ['filialleiter', 'einzelhandel', 'retail', 'verkauf', 'markt', 'shop', 'store', 'kassierer'],
    scene: 'modern retail store interior, professional store manager between product shelves, staff interaction, bright shop lighting' },
  { keywords: ['küche', 'koch', 'restaurant', 'gastronomie', 'hotel', 'service', 'kellner', 'gastro'],
    scene: 'professional restaurant kitchen or dining area, chef or service staff at work, warm ambience' },
  { keywords: ['bau', 'bauleiter', 'elektriker', 'installateur', 'monteur', 'handwerk', 'tischler', 'maler', 'schlosser'],
    scene: 'construction site or workshop, skilled tradesperson with tools, safety equipment, professional environment' },
  { keywords: ['pflege', 'krankenpflege', 'altenpflege', 'sozial', 'betreuer', 'arzt', 'arzthelfer'],
    scene: 'modern healthcare facility, caring professional with patient or colleague, bright clinical environment' },
  { keywords: ['lager', 'logistik', 'fahrer', 'transport', 'spedition', 'kommissionier'],
    scene: 'modern warehouse or logistics center, worker with scanner or forklift, organized shelving' },
  { keywords: ['entwickler', 'software', 'it', 'programmierer', 'data', 'devops', 'ux', 'designer'],
    scene: 'modern tech office, developer at multiple screens, collaborative open workspace, natural light' },
  { keywords: ['buchhalter', 'steuer', 'controlling', 'finanzen', 'rechnungswesen', 'bilanz'],
    scene: 'professional office with financial documents, accountant at desk with computer, clean modern workspace' },
  { keywords: ['vertrieb', 'sales', 'marketing', 'außendienst', 'kundenberater', 'account'],
    scene: 'professional in client meeting or on the road, business presentation, confident sales environment' },
  { keywords: ['produktion', 'fertigung', 'industrie', 'maschine', 'qualität', 'cnc', 'operator'],
    scene: 'clean modern production facility, technician operating machinery, industrial environment with safety gear' },
  { keywords: ['assistent', 'sekretär', 'verwaltung', 'office', 'sachbearbeiter', 'büro'],
    scene: 'bright modern office, professional at desk, organized workspace, natural light' },
];

// Manual style overrides (shown as optional UI buttons)
const MANUAL_STYLES: Record<string, string> = {
  'Büro':         'modern office environment, professional desk, bright workspace',
  'Produktion':   'industrial production facility, clean factory floor, machinery',
  'Außendienst':  'outdoor professional field work, road, vehicle, nature background',
  'Team':         'diverse team collaboration, group of professionals, meeting room',
};

function detectScene(jobTitle: string, category: string | null): string {
  const text = `${jobTitle} ${category ?? ''}`.toLowerCase();
  for (const entry of JOB_SCENE_MAP) {
    if (entry.keywords.some((k) => text.includes(k))) return entry.scene;
  }
  return 'professional at work in a modern workplace, bright natural light, diverse team';
}

async function generateFluxPrompt(
  jobTitle: string,
  category: string | null,
  description: string | null,
  style: string | undefined
): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  // Use manual override if provided, otherwise auto-detect from job title/category
  const styleHint = style ? (MANUAL_STYLES[style] ?? style) : detectScene(jobTitle, category);

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `Create a single concise image generation prompt (max 2 sentences) for a Facebook recruitment ad background photo.
Job: ${jobTitle}${category ? ` (${category})` : ''}${description ? `\nContext: ${description.slice(0, 200)}` : ''}
Scene hint: ${styleHint}
Rules: photorealistic, professional, NO text or words in image, bright modern lighting, wide diversity of people, cinematic quality.
Return ONLY the prompt, nothing else.`,
    }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
  return text || `Professional recruitment photo for ${jobTitle}, modern workplace, photorealistic, no text, bright lighting`;
}

async function runFlux(prompt: string): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('REPLICATE_API_TOKEN not set');

  // Create prediction
  const createRes = await fetch(
    'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { prompt, aspect_ratio: '1:1', output_format: 'webp', num_outputs: 1 } }),
    }
  );
  const prediction = await createRes.json();
  if (!createRes.ok) throw new Error(`Replicate create error: ${prediction.detail ?? JSON.stringify(prediction)}`);

  const pollUrl = prediction.urls?.get ?? `https://api.replicate.com/v1/predictions/${prediction.id}`;

  // Poll until done (max 30s)
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(pollUrl, { headers: { Authorization: `Bearer ${token}` } });
    const result = await pollRes.json();
    if (result.status === 'succeeded') {
      const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
      if (!outputUrl) throw new Error('Replicate returned no output URL');
      return outputUrl as string;
    }
    if (result.status === 'failed' || result.status === 'canceled') {
      throw new Error(`Replicate prediction ${result.status}: ${result.error ?? ''}`);
    }
  }
  throw new Error('Replicate prediction timed out after 30s');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await req.json().catch(() => ({}));
    const style: string | undefined = body.style;

    const supabase = createAdminClient();

    // 1. Fetch job + company logo
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, category, description, location, benefits, company:companies(logo_url)')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Parse up to 3 benefits from the benefits text field
    const benefitLines: string[] = job.benefits
      ? (job.benefits as string).split('\n').map((l: string) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean).slice(0, 3)
      : [];

    const logoUrl: string | undefined = (job.company as { logo_url?: string } | null)?.logo_url ?? undefined;

    // 2. Generate FLUX prompt via Claude
    const aiPrompt = await generateFluxPrompt(job.title, job.category as string | null, job.description as string | null, style);

    // 3. Generate image with FLUX
    const backgroundUrl = await runFlux(aiPrompt);

    // 4. Compose: background + branding overlay (logo + benefits + title + CTA)
    const composedBuffer = await composeAdImage(backgroundUrl, {
      title: job.title,
      location: (job.location as string | null) ?? undefined,
      benefits: benefitLines,
      logoUrl,
    });

    // 5. Upload to Supabase Storage
    const filename = `job-images/${jobId}/${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('funnel-media')
      .upload(filename, composedBuffer, { contentType: 'image/png', upsert: false });

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from('funnel-media').getPublicUrl(filename);
    const publicUrl = urlData.publicUrl;

    // 6. Save to job_ad_images
    const { data: inserted, error: insertError } = await supabase
      .from('job_ad_images')
      .insert({ job_id: jobId, url: publicUrl, ai_generated: true, ai_prompt: aiPrompt })
      .select('id, url, ai_generated, ai_prompt, created_at')
      .single();

    if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);

    return NextResponse.json({ success: true, image: inserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
