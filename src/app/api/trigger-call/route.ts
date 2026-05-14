import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireWriterOrN8n } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  const auth = await requireWriterOrN8n(req);
  if (!auth.ok) return auth.response;
  const { application_id } = await req.json();

  if (!application_id) {
    return NextResponse.json({ error: 'application_id fehlt' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('applications')
    .select(`
      id,
      applicant:applicants(id, full_name, email, phone),
      job:jobs(id, title)
    `)
    .eq('id', application_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Bewerbung nicht gefunden' }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as any;
  const applicant = Array.isArray(d.applicant) ? d.applicant[0] : d.applicant;
  const job = Array.isArray(d.job) ? d.job[0] : d.job;

  if (!applicant?.phone) {
    return NextResponse.json({ error: 'Keine Telefonnummer beim Bewerber hinterlegt' }, { status: 422 });
  }

  const n8nBase = process.env.N8N_BASE_URL;
  if (!n8nBase) {
    return NextResponse.json({ error: 'N8N_BASE_URL nicht konfiguriert' }, { status: 500 });
  }

  const nameParts = (applicant.full_name as string).trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '-';

  const res = await fetch(`${n8nBase}/webhook/start-booking-call-v2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      result: 'accepted',
      application_id,
      candidate_id: applicant.id,
      candidate_first_name: firstName,
      candidate_last_name: lastName,
      candidate_email: applicant.email ?? '',
      candidate_phone_number: applicant.phone,
      job_id: job.id,
      job_title: job.title,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[trigger-call] n8n error:', res.status, text);
    return NextResponse.json({ error: 'n8n Webhook fehlgeschlagen' }, { status: 502 });
  }

  // Mark stage so UI can show "call queued"
  await supabase.from('applications').update({ pipeline_stage: 'call_scheduled' }).eq('id', application_id);

  return NextResponse.json({ success: true });
}
