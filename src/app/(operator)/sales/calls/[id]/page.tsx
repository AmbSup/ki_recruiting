"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type TranscriptSegment = { index: number; speaker: string; text: string };

type CallDetail = {
  id: string;
  sales_lead_id: string;
  sales_program_id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  end_reason: string | null;
  recording_url: string | null;
  transcript: { full_text?: string; segments?: TranscriptSegment[] } | null;
  vapi_metadata: Record<string, unknown>;
  created_at: string;
  sales_lead: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string;
    company_name: string | null;
    role: string | null;
    source: string;
    source_ref: string | null;
  };
  sales_program: { id: string; name: string; booking_link: string | null };
  analysis: {
    id: string;
    meeting_booked: boolean;
    meeting_datetime: string | null;
    interest_level: string | null;
    call_rating: number | null;
    sentiment: string | null;
    summary: string | null;
    objections: string[];
    pain_points: string[];
    next_action: string | null;
    next_action_at: string | null;
    key_quotes: { speaker: string; quote: string }[];
    model_version: string | null;
    analyzed_at: string;
  } | null;
};

export default function SalesCallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [call, setCall] = useState<CallDetail | null>(null);
  const [funnel, setFunnel] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"analysis" | "transcript">("analysis");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sales_calls")
      .select(`
        *,
        sales_lead:sales_leads(id, full_name, first_name, last_name, email, phone, company_name, role, source, source_ref),
        sales_program:sales_programs(id, name, booking_link),
        analysis:sales_call_analyses(*)
      `)
      .eq("id", id)
      .single()
      .then(async ({ data }) => {
        if (data) {
          const d = data as unknown as Record<string, unknown>;
          const analysis = Array.isArray(d.analysis) ? d.analysis[0] : d.analysis;
          const c = { ...data, analysis } as unknown as CallDetail;
          setCall(c);

          // Pipeline-Breadcrumb braucht den Funnel, falls der Lead via Funnel kam.
          if (c.sales_lead.source === "funnel" && c.sales_lead.source_ref) {
            const { data: f } = await supabase
              .from("funnels")
              .select("id, name, slug")
              .eq("id", c.sales_lead.source_ref)
              .maybeSingle();
            setFunnel((f as { id: string; name: string; slug: string } | null) ?? null);
          }
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><span className="material-symbols-outlined text-3xl text-outline animate-spin">progress_activity</span></div>;
  }
  if (!call) {
    return <div className="px-8 pt-10"><p className="font-body text-on-surface-variant">Call nicht gefunden.</p></div>;
  }

  const name = call.sales_lead.full_name
    ?? [call.sales_lead.first_name, call.sales_lead.last_name].filter(Boolean).join(" ")
    ?? call.sales_lead.phone;
  const segments: TranscriptSegment[] = call.transcript?.segments ?? [];

  return (
    <div className="px-8 pt-10 pb-32 max-w-[1200px]">
      <Link href="/sales/calls" className="inline-flex items-center gap-1.5 text-outline hover:text-on-surface transition-colors mb-8">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest">Alle Calls</span>
      </Link>

      {/* Pipeline-Breadcrumb: klickbare Chips entlang der Sales-Kette. */}
      <nav className="flex items-center flex-wrap gap-1.5 mb-3 font-label text-[11px] font-bold uppercase tracking-widest">
        <Link href={`/sales/programs/${call.sales_program.id}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-xs">flag</span>
          {call.sales_program.name}
        </Link>
        <span className="text-outline">›</span>
        <Link href={`/sales/leads/${call.sales_lead.id}`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-xs">person</span>
          {name}
        </Link>
        {funnel && (
          <>
            <span className="text-outline">›</span>
            <Link href={`/funnels/${funnel.id}/editor`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xs">quiz</span>
              {funnel.name}
            </Link>
          </>
        )}
        {(call.sales_lead.source === "manual" || call.sales_lead.source === "csv" || call.sales_lead.source === "test") && (
          <>
            <span className="text-outline">·</span>
            <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-outline">
              {call.sales_lead.source === "manual" ? "Manuell" : call.sales_lead.source === "csv" ? "CSV-Import" : "Test-Mode"}
            </span>
          </>
        )}
      </nav>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-headline text-4xl italic text-on-surface leading-none">Sales Call</h1>
          <p className="font-body text-on-surface-variant mt-1">
            {call.started_at ? new Date(call.started_at).toLocaleString("de-AT") : "Noch nicht gestartet"}
            {call.duration_seconds ? ` · ${formatDuration(call.duration_seconds)}` : ""}
            {call.end_reason ? ` · ${call.end_reason}` : ""}
          </p>
        </div>
        {call.analysis?.meeting_booked && (
          <div className="bg-primary-container rounded-2xl px-5 py-4 text-center">
            <span className="material-symbols-outlined text-on-primary-container text-3xl block mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
            <div className="font-label text-xs font-bold uppercase tracking-widest text-on-primary-container">Meeting gebucht</div>
            {call.analysis.meeting_datetime && (
              <div className="font-body text-xs text-on-primary-container mt-1">
                {new Date(call.analysis.meeting_datetime).toLocaleString("de-AT", { dateStyle: "medium", timeStyle: "short" })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <Card label="Lead-Info" icon="person">
            <InfoRow label="Name" value={name} />
            <InfoRow label="Firma" value={call.sales_lead.company_name ?? "–"} />
            <InfoRow label="Rolle" value={call.sales_lead.role ?? "–"} />
            <InfoRow label="Telefon" value={call.sales_lead.phone} mono />
            {call.sales_lead.email && <InfoRow label="Email" value={call.sales_lead.email} />}
          </Card>

          {call.analysis && (
            <Card label="Kennzahlen" icon="bar_chart">
              <InfoRow label="Rating" value={call.analysis.call_rating ? `${call.analysis.call_rating} / 10` : "–"} />
              <InfoRow label="Interesse" value={call.analysis.interest_level ?? "–"} />
              <InfoRow label="Stimmung" value={call.analysis.sentiment ?? "–"} />
              <InfoRow label="Next Action" value={call.analysis.next_action ?? "–"} />
              {call.analysis.next_action_at && (
                <InfoRow label="Fällig" value={new Date(call.analysis.next_action_at).toLocaleDateString("de-AT")} />
              )}
            </Card>
          )}

          {call.recording_url && (
            <Card label="Aufnahme" icon="mic">
              <audio
                src={`/api/sales/calls/${call.id}/recording`}
                controls
                preload="metadata"
                className="w-full"
              />
              <a
                href={`/api/sales/calls/${call.id}/recording`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-label text-xs text-primary hover:underline mt-2"
              >
                <span className="material-symbols-outlined text-xs">download</span>
                Audio herunterladen
              </a>
            </Card>
          )}
        </div>

        <div className="col-span-12 lg:col-span-8">
          <div className="bg-surface-container-lowest rounded-2xl shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] overflow-hidden">
            <div className="flex border-b border-outline-variant/10">
              <TabBtn active={tab === "analysis"} onClick={() => setTab("analysis")} label="Analyse" icon="insights" />
              <TabBtn active={tab === "transcript"} onClick={() => setTab("transcript")} label="Transkript" icon="subtitles" count={segments.length} />
            </div>

            <div className="p-6">
              {tab === "analysis" && (
                call.analysis ? (
                  <div className="space-y-5">
                    {call.analysis.summary && (
                      <Section label="Zusammenfassung">
                        <p className="font-body text-sm text-on-surface">{call.analysis.summary}</p>
                      </Section>
                    )}
                    {call.analysis.pain_points?.length > 0 && (
                      <Section label="Pain Points">
                        <ul className="space-y-1.5">
                          {call.analysis.pain_points.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 font-body text-sm">
                              <span className="material-symbols-outlined text-tertiary text-sm mt-0.5">problem</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </Section>
                    )}
                    {call.analysis.objections?.length > 0 && (
                      <Section label="Einwände">
                        <ul className="space-y-1.5">
                          {call.analysis.objections.map((o, i) => (
                            <li key={i} className="flex items-start gap-2 font-body text-sm">
                              <span className="material-symbols-outlined text-error text-sm mt-0.5">flag</span>
                              <span>{o}</span>
                            </li>
                          ))}
                        </ul>
                      </Section>
                    )}
                    {call.analysis.key_quotes?.length > 0 && (
                      <Section label="Zitate">
                        <div className="space-y-3">
                          {call.analysis.key_quotes.map((q, i) => (
                            <div key={i} className={`rounded-xl px-4 py-3 ${q.speaker === "lead" ? "bg-tertiary-container/20" : "bg-primary-container/20"}`}>
                              <div className="font-label text-xs font-bold uppercase tracking-widest mb-1 text-outline">
                                {q.speaker === "lead" ? "Lead" : "Agent"}
                              </div>
                              <p className="font-body text-sm italic">&ldquo;{q.quote}&rdquo;</p>
                            </div>
                          ))}
                        </div>
                      </Section>
                    )}
                    <div className="pt-3 border-t border-outline-variant/10 font-label text-xs text-outline">
                      Analysiert von {call.analysis.model_version ?? "Claude"} · {new Date(call.analysis.analyzed_at).toLocaleString("de-AT")}
                    </div>
                  </div>
                ) : (
                  <p className="font-body text-sm text-outline">Noch keine Analyse verfügbar. Sobald der Call beendet ist, läuft der Claude-Analyzer.</p>
                )
              )}
              {tab === "transcript" && (
                segments.length > 0 ? (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {segments.map((s) => (
                      <div key={s.index} className={`flex gap-3 ${s.speaker === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${s.speaker === "user" ? "bg-tertiary-container/40 text-tertiary" : "bg-primary-container/40 text-primary"}`}>
                          <span className="material-symbols-outlined text-sm">{s.speaker === "user" ? "person" : "support_agent"}</span>
                        </div>
                        <div className={`flex-1 max-w-[80%] ${s.speaker === "user" ? "text-right" : ""}`}>
                          <div className="font-label text-xs text-outline mb-0.5">{s.speaker === "user" ? "Lead" : "Agent"}</div>
                          <div className={`inline-block px-4 py-2 rounded-2xl font-body text-sm ${s.speaker === "user" ? "bg-tertiary-container/30" : "bg-surface-container"}`}>
                            {s.text}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : call.transcript?.full_text ? (
                  <pre className="font-body text-sm text-on-surface whitespace-pre-wrap">{call.transcript.full_text}</pre>
                ) : (
                  <p className="font-body text-sm text-outline">Kein Transkript verfügbar.</p>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">{label}</span>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="font-label text-xs font-bold uppercase tracking-widest text-outline flex-shrink-0">{label}</span>
      <span className={`font-body text-xs text-on-surface-variant text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">{label}</h3>
      {children}
    </div>
  );
}

function TabBtn({ active, onClick, label, icon, count }: { active: boolean; onClick: () => void; label: string; icon: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 font-label text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-px ${
        active ? "border-primary text-primary" : "border-transparent text-outline hover:text-on-surface"
      }`}
    >
      <span className="material-symbols-outlined text-sm">{icon}</span>
      {label}
      {count !== undefined && <span className="font-mono">({count})</span>}
    </button>
  );
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")} min`;
}
