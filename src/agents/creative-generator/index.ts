import { generateText } from '@/services/claude/client';
import { createAdminClient } from '@/lib/supabase/admin';
import type { CreativeVariant } from '@/types/meta-ads';

const DEFAULT_HOOKS: Record<string, string[]> = {
  Elektriker: [
    'Elektriker gesucht – sofort!',
    'Bist du Elektriker in Österreich?',
    'Top-Gehalt für Elektriker',
  ],
  Maurer: ['Maurer gesucht – faire Bezahlung', 'Bist du Maurer?', 'Maurer mit Erfahrung gesucht'],
  Installateur: ['Installateur gesucht', 'Sanitär & Heizung – Top-Job', 'Wir suchen dich!'],
  Maler: ['Maler/Anstreicher gesucht', 'Top-Job für Maler in deiner Region'],
  Schlosser: ['Schlosser / Metallbauer gesucht', 'Schlosserei – faire Bezahlung'],
};

export interface GenerateCreativesInput {
  job_title: string;
  job_category: string;
  location: string;
  salary_range?: string;
  count?: number;
}

export async function generateCreatives(
  input: GenerateCreativesInput
): Promise<CreativeVariant[]> {
  const { job_title, job_category, location, salary_range, count = 3 } = input;

  // Fetch best-performing hooks from creative_insights
  const supabase = createAdminClient();
  const { data: insights } = await supabase
    .from('creative_insights')
    .select('headline_template, hook_type')
    .eq('job_category', job_category)
    .not('effectiveness_rank', 'is', null)
    .order('effectiveness_rank', { ascending: true })
    .limit(5);

  const bestHooks =
    insights && insights.length > 0
      ? insights.map((i) => i.headline_template).join('\n- ')
      : (DEFAULT_HOOKS[job_category] ?? DEFAULT_HOOKS['Elektriker']).join('\n- ');

  const prompt = `Du schreibst Facebook/Instagram Recruiting-Anzeigen für ${job_category} in Österreich.

Zielgruppe: Handwerker, 22–55 Jahre, Mobile User, sprechen Deutsch.
Position: ${job_title}
Standort: ${location}
${salary_range ? `Gehalt: ${salary_range}` : ''}

Bewährte Hooks aus bisherigen Kampagnen:
- ${bestHooks}

Regeln:
- Einfache, direkte Sprache (kein Fachjargon, kein Bullshit-Bingo)
- Gehalt oder Benefit IMMER in der Headline
- Body: max 2–3 kurze Sätze, sehr direkt
- CTA: immer "Jetzt bewerben – 2 Min." oder ähnlich
- Mobile-First: kurz, prägnant, scrollstopper
- Keine Emojis im Haupttext, nur wenn es natürlich wirkt

Erstelle exakt ${count} verschiedene Anzeigen-Varianten als JSON Array (nichts anderes, nur das JSON):
[
  {
    "headline": "...",
    "primary_text": "...",
    "description": "...",
    "cta_type": "APPLY_NOW",
    "hook_type": "salary|urgency|social_proof|benefit|question"
  }
]`;

  const raw = await generateText(prompt, 1200);

  // Extract JSON from response
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Claude returned no valid JSON array');

  const variants = JSON.parse(jsonMatch[0]) as CreativeVariant[];
  return variants.slice(0, count);
}
