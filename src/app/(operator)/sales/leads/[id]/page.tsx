"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Lead = {
  id: string;
  sales_program_id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string;
  company_name: string | null;
  role: string | null;
  linkedin_url: string | null;
  source: string;
  source_ref: string | null;
  custom_fields: Record<string, unknown>;
  funnel_responses: Record<string, unknown>;
  consent_given: boolean;
  consent_source: string | null;
  consent_timestamp: string | null;
  notes: string | null;
  status: string;
  next_call_scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  program: { id: string; name: string; booking_link: string | null; auto_dial: boolean };
};

type FunnelLink = { id: string; name: string; slug: string; status: string | null };

type AdLeadLink = {
  id: string;
  ad: { id: string; name: string | null; ad_set: { id: string; name: string | null; campaign: { id: string; name: string | null } | null } | null } | null;
};

type CallRow = {
  id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  end_reason: string | null;
  analysis: {
    meeting_booked: boolean | null;
    interest_level: string | null;
    call_rating: number | null;
    summary: string | null;
    next_action: string | null;
  } | null;
};

const STATUS_OPTIONS = [
  { value: "new",              label: "Neu" },
  { value: "calling",          label: "Im Call" },
  { value: "contacted",        label: "Kontaktiert" },
  { value: "meeting_booked",   label: "Termin gebucht" },
  { value: "not_interested",   label: "Kein Interesse" },
  { value: "do_not_call",      label: "DNC (do-not-call)" },
  { value: "failed",           label: "Fehlgeschlagen" },
];

export default function SalesLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [funnel, setFunnel] = useState<FunnelLink | null>(null);
  const [adLead, setAdLead] = useState<AdLeadLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);
  const [triggerError, setTriggerError] = useState<{
    status: number;
    message: string;
    sales_call_id?: string;
    callStatus?: string;
  } | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [leadRes, callsRes] = await Promise.all([
      supabase
        .from("sales_leads")
        .select("*, program:sales_programs(id, name, booking_link, auto_dial)")
        .eq("id", id)
        .single(),
      supabase
        .from("sales_calls")
        .select("id, status, started_at, ended_at, duration_seconds, end_reason, analysis:sales_call_analyses(meeting_booked, interest_level, call_rating, summary, next_action)")
        .eq("sales_lead_id", id)
        .order("created_at", { ascending: false }),
    ]);
    if (leadRes.data) {
      const l = leadRes.data as unknown as Lead;
      setLead(l);
      setNotesDraft(l.notes ?? "");

      // Pipeline-Upstream: Funnel-Link wenn source=funnel + source_ref ist Funnel-ID,
      // Ad-Chain wenn der Lead via Meta-Leadgen-Matcher mit ad_leads.sales_lead_id verknüpft wurde.
      if (l.source === "funnel" && l.source_ref) {
        const { data: f } = await supabase
          .from("funnels")
          .select("id, name, slug, status")
          .eq("id", l.source_ref)
          .maybeSingle();
        setFunnel((f as FunnelLink | null) ?? null);
      } else {
        setFunnel(null);
      }

      const { data: al } = await supabase
        .from("ad_leads")
        .select("id, ad:ads(id, name, ad_set:ad_sets(id, name, campaign:ad_campaigns(id, name)))")
        .eq("sales_lead_id", l.id)
        .limit(1)
        .maybeSingle();
      setAdLead((al as unknown as AdLeadLink | null) ?? null);
    }
    setCalls((callsRes.data ?? []) as unknown as CallRow[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(newStatus: string) {
    const res = await fetch(`/api/sales/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) load();
  }

  async function saveNotes() {
    await fetch(`/api/sales/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notesDraft }),
    });
    setEditingNotes(false);
    load();
  }

  // Generic field-patch helper — used by EditableField rows. Throws on non-2xx
  // so the field can show the server's error message inline.
  async function patchField(field: string, value: string) {
    const res = await fetch(`/api/sales/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `Fehler ${res.status}`);
    }
    await load();
  }

  async function triggerCall() {
    setTriggering(true);
    setTriggerError(null);
    setTriggerMsg(null);
    const res = await fetch("/api/sales/trigger-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sales_lead_id: id }),
    });
    const data = await res.json();
    setTriggering(false);
    if (!res.ok) {
      setTriggerError({
        status: res.status,
        message: data.error ?? "Trigger fehlgeschlagen",
        sales_call_id: data.sales_call_id,
        callStatus: data.status,
      });
      return;
    }
    setTriggerMsg("Call wird initiiert…");
    setTimeout(() => { setTriggerMsg(null); load(); }, 2500);
  }

  async function deleteLead() {
    if (!confirm("Lead wirklich löschen? Alle Calls und Analysen gehen mit (cascade).")) return;
    await fetch(`/api/sales/leads/${id}`, { method: "DELETE" });
    window.location.href = "/sales/leads";
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><span className="material-symbols-outlined text-3xl text-outline animate-spin">progress_activity</span></div>;
  }
  if (!lead) {
    return <div className="px-8 pt-10"><p className="font-body text-on-surface-variant">Lead nicht gefunden.</p></div>;
  }

  const displayName = lead.full_name
    ?? [lead.first_name, lead.last_name].filter(Boolean).join(" ")
    ?? "–";

  return (
    <div className="px-8 pt-10 pb-32 max-w-[1440px] mx-auto">
      <Link href="/sales/leads" className="inline-flex items-center gap-1.5 text-outline hover:text-on-surface transition-colors mb-8">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest">Alle Leads</span>
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-tertiary-container/40 flex items-center justify-center text-lg font-bold text-tertiary">
            {displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-1">
              <Link href={`/sales/programs/${lead.program.id}`} className="hover:text-primary">
                {lead.program.name}
              </Link>
            </p>
            <h1 className="font-headline text-4xl italic text-on-surface leading-none">{displayName}</h1>
            {lead.company_name && (
              <p className="font-body text-on-surface-variant mt-1">
                {lead.company_name}{lead.role ? ` · ${lead.role}` : ""}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {triggerMsg && (
            <span className="font-label text-xs font-bold uppercase tracking-widest text-primary">
              {triggerMsg}
            </span>
          )}
          <button
            onClick={triggerCall}
            disabled={triggering || !lead.consent_given}
            title={!lead.consent_given ? "Kein dokumentiertes Opt-In" : "Call jetzt starten"}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">{triggering ? "progress_activity" : "call"}</span>
            Call starten
          </button>
          <button
            onClick={deleteLead}
            className="flex items-center gap-1.5 border border-error/30 text-error px-4 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-error-container/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Löschen
          </button>
        </div>
      </div>

      {triggerError && (
        <div className="flex items-start justify-between gap-3 bg-error-container/20 border border-error-container/40 rounded-xl px-4 py-3 mb-6">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-error text-sm mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
            <div>
              <div className="font-label text-xs font-bold uppercase tracking-widest text-error">
                Call-Trigger fehlgeschlagen ({triggerError.status})
              </div>
              <div className="font-body text-sm text-on-surface mt-1">{triggerError.message}</div>
              {triggerError.callStatus && (
                <div className="font-label text-xs text-outline mt-1">
                  Letzter Call-Status: <strong>{triggerError.callStatus}</strong>
                  {triggerError.sales_call_id && (
                    <>
                      {" · "}
                      <Link href={`/sales/calls/${triggerError.sales_call_id}`} className="underline">
                        Call öffnen
                      </Link>
                    </>
                  )}
                </div>
              )}
              {triggerError.status === 502 && (
                <div className="font-label text-xs text-outline mt-1">
                  n8n hat den Workflow nicht akzeptiert — prüf die letzte Execution unter{" "}
                  <a href="https://n8n.neuronic-automation.ai/workflow/Jwl2xHatoq1gZlZ4/executions" target="_blank" rel="noopener noreferrer" className="underline">
                    Sales — Start Sales Calls
                  </a>.
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setTriggerError(null)} className="material-symbols-outlined text-outline hover:text-on-surface text-sm">close</button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5 space-y-5">
          <Card label="Status & Aktion" icon="track_changes">
            <div>
              <label className="font-label text-xs text-outline block mb-1.5">Status</label>
              <select
                value={lead.status}
                onChange={(e) => changeStatus(e.target.value)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <p className="font-body text-xs text-outline mt-1.5">
                {["contacted", "meeting_booked", "not_interested", "do_not_call"].includes(lead.status)
                  ? "Terminaler Status — Re-Submissions setzen nicht auf 'Neu' zurück."
                  : "Status kann auch vom KI-Analyzer geändert werden."}
              </p>
            </div>
          </Card>

          <Card label="Calls" icon="call">
            {calls.length === 0 ? (
              <p className="font-body text-sm text-outline">Noch kein Call — `Call starten` rechts oben drücken.</p>
            ) : (
              <div className="space-y-2">
                {calls.map((c) => (
                  <Link
                    key={c.id}
                    href={`/sales/calls/${c.id}`}
                    className="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-3 hover:bg-surface-container transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-outline">
                        {c.analysis?.meeting_booked ? "event_available" : "phone_in_talk"}
                      </span>
                      <div>
                        <div className="font-label text-xs font-bold text-on-surface">
                          {c.started_at ? new Date(c.started_at).toLocaleString("de-AT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Noch nicht gestartet"}
                        </div>
                        <div className="font-label text-xs text-outline">
                          {c.status}
                          {c.duration_seconds ? ` · ${formatDuration(c.duration_seconds)}` : ""}
                          {c.analysis?.call_rating ? ` · ${c.analysis.call_rating}/10` : ""}
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline text-sm">arrow_forward</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card label="Notizen" icon="sticky_note_2">
            {editingNotes ? (
              <>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={4}
                  className={inputClass + " resize-none"}
                />
                <div className="flex gap-2 mt-3">
                  <button onClick={saveNotes} className="bg-primary text-on-primary px-4 py-2 rounded-xl font-label text-xs font-bold uppercase tracking-widest">Speichern</button>
                  <button onClick={() => { setEditingNotes(false); setNotesDraft(lead.notes ?? ""); }} className="border border-outline-variant/30 text-on-surface-variant px-4 py-2 rounded-xl font-label text-xs font-bold uppercase tracking-widest">Abbrechen</button>
                </div>
              </>
            ) : (
              <div className="flex items-start justify-between">
                <p className="font-body text-sm text-on-surface-variant whitespace-pre-wrap flex-1">
                  {lead.notes || <span className="text-outline">Keine Notizen.</span>}
                </p>
                <button onClick={() => setEditingNotes(true)} className="material-symbols-outlined text-outline hover:text-primary text-sm ml-3">edit</button>
              </div>
            )}
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-7 space-y-5">
          <Card label="Pipeline" icon="account_tree">
            <PipelineRow
              icon="flag"
              label="Program"
              href={`/sales/programs/${lead.program.id}`}
              value={lead.program.name}
            />
            <PipelineRow
              icon={sourceIcon(lead.source)}
              label="Quelle"
              value={sourceLabel(lead.source)}
              valueExtra={
                lead.source === "test" ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-label text-[10px] font-bold uppercase tracking-widest">Test</span>
                ) : null
              }
            />
            {funnel && (
              <PipelineRow
                icon="quiz"
                label="Funnel"
                href={`/funnels/${funnel.id}/editor`}
                value={funnel.name}
                valueExtra={
                  <span className="font-mono text-[10px] text-outline">/{funnel.slug}</span>
                }
              />
            )}
            {adLead && adLead.ad && (
              <PipelineRow
                icon="ads_click"
                label="Meta-Ad"
                value={
                  <span>
                    {adLead.ad.name ?? "(unbenannt)"}
                    {adLead.ad.ad_set?.campaign?.name && (
                      <span className="text-outline"> · {adLead.ad.ad_set.campaign.name}</span>
                    )}
                  </span>
                }
              />
            )}
            {(lead.source === "manual" || lead.source === "csv") && !funnel && !adLead && (
              <p className="font-body text-[11px] text-outline italic">Direkt-Submit — kein Upstream</p>
            )}
          </Card>

          <Card label="Kontakt" icon="person">
            <EditableField
              label="Vorname"
              value={lead.first_name ?? ""}
              onSave={(v) => patchField("first_name", v)}
            />
            <EditableField
              label="Nachname"
              value={lead.last_name ?? ""}
              onSave={(v) => patchField("last_name", v)}
            />
            <EditableField
              label="Telefon"
              value={lead.phone}
              type="tel"
              mono
              onSave={(v) => patchField("phone", v)}
            />
            <EditableField
              label="Email"
              value={lead.email ?? ""}
              type="email"
              onSave={(v) => patchField("email", v)}
            />
            <EditableField
              label="Firma"
              value={lead.company_name ?? ""}
              onSave={(v) => patchField("company_name", v)}
            />
            <EditableField
              label="Rolle"
              value={lead.role ?? ""}
              onSave={(v) => patchField("role", v)}
            />
            <EditableField
              label="LinkedIn"
              value={lead.linkedin_url ?? ""}
              type="text"
              placeholder="https://linkedin.com/in/…"
              onSave={(v) => patchField("linkedin_url", v)}
            />
          </Card>

          <Card label="Consent & Quelle" icon="verified_user">
            <InfoRow
              label="Opt-In"
              value={
                lead.consent_given
                  ? <span className="text-primary">Ja</span>
                  : <span className="text-error font-bold">Fehlt!</span>
              }
            />
            <InfoRow label="Quelle" value={lead.source} />
            <InfoRow label="Quelle seit" value={lead.consent_timestamp ? new Date(lead.consent_timestamp).toLocaleString("de-AT") : "–"} />
            <InfoRow label="Consent-Kanal" value={lead.consent_source ?? "–"} />
          </Card>

          {Object.keys(lead.custom_fields ?? {}).length > 0 && (
            <Card label="Custom Fields" icon="database">
              {(() => {
                const cf = lead.custom_fields ?? {};
                const leadCtx = typeof cf.lead_context === "string" ? cf.lead_context : null;
                const summary = typeof cf.funnel_summary === "string" ? cf.funnel_summary : null;
                const qa = Array.isArray(cf.funnel_qa) ? (cf.funnel_qa as Array<{ question?: string; answer?: string; key?: string }>) : null;
                // Per-Frage-Slug-Keys (z.B. was_ist_dein_hauptziel) sind bereits in der hübschen Q→A-Liste sichtbar
                // und im DB-custom_fields nur für die Vapi-Prompt-Interpolation. Im UI also dedupen.
                const qaKeys = new Set((qa ?? []).map((it) => it.key).filter((k): k is string => typeof k === "string" && k.length > 0));
                const restEntries = Object.entries(cf).filter(
                  ([k]) => k !== "lead_context" && k !== "funnel_summary" && k !== "funnel_qa" && !qaKeys.has(k),
                );
                return (
                  <>
                    {leadCtx && (
                      <div>
                        <span className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1">Lead-Hook</span>
                        <p className="font-body text-xs text-on-surface italic break-words">{leadCtx}</p>
                      </div>
                    )}
                    {qa && qa.length > 0 && (
                      <div>
                        <span className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5">Funnel-Antworten</span>
                        <ul className="space-y-1.5">
                          {qa.map((item, i) => (
                            <li key={i} className="font-body text-xs text-on-surface-variant break-words">
                              <span className="text-outline">{item.question}</span>
                              <span className="mx-1.5">→</span>
                              <span className="font-medium text-on-surface">{item.answer}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!qa && summary && (
                      <div>
                        <span className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1">Zusammenfassung</span>
                        <pre className="font-body text-xs text-on-surface-variant whitespace-pre-wrap break-words">{summary}</pre>
                      </div>
                    )}
                    {restEntries.length > 0 && (
                      <div className="pt-1">
                        {restEntries.map(([k, v]) => (
                          <InfoRow
                            key={k}
                            label={k}
                            value={typeof v === "string" || typeof v === "number" || typeof v === "boolean"
                              ? String(v)
                              : <span className="font-mono text-[10px]">{JSON.stringify(v)}</span>}
                          />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </Card>
          )}

          {/* Roh-Funnel-Responses (Question-Text/Block-ID → option.value). Nur als Fallback,
              wenn die saubere funnel_qa-Variante fehlt (alte Leads vor 2026-04-26). */}
          {!Array.isArray(lead.custom_fields?.funnel_qa) && Object.keys(lead.funnel_responses ?? {}).length > 0 && (
            <Card label="Funnel-Antworten (raw)" icon="quiz">
              {Object.entries(lead.funnel_responses).map(([k, v]) => (
                <InfoRow key={k} label={k} value={Array.isArray(v) ? v.join(", ") : String(v)} />
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function PipelineRow({ icon, label, value, href, valueExtra }: {
  icon: string;
  label: string;
  value: React.ReactNode;
  href?: string;
  valueExtra?: React.ReactNode;
}) {
  const inner = (
    <div className="flex items-center gap-2 min-w-0">
      <span className={`font-body text-sm ${href ? "text-primary group-hover:underline" : "text-on-surface"} truncate`}>{value}</span>
      {valueExtra}
    </div>
  );
  return (
    <div className="flex items-center justify-between gap-3 py-1 group">
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-symbols-outlined text-outline text-sm flex-shrink-0">{icon}</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest text-outline flex-shrink-0">{label}</span>
      </div>
      {href ? (
        <Link href={href} className="flex items-center gap-1 min-w-0">
          {inner}
          <span className="material-symbols-outlined text-outline text-xs">arrow_forward</span>
        </Link>
      ) : inner}
    </div>
  );
}

function sourceIcon(source: string): string {
  return source === "funnel" ? "quiz"
    : source === "meta_form" ? "ads_click"
    : source === "csv" ? "table_chart"
    : source === "test" ? "science"
    : "edit";
}

function sourceLabel(source: string): string {
  return source === "funnel" ? "Funnel"
    : source === "meta_form" ? "Meta-Ads"
    : source === "csv" ? "CSV-Import"
    : source === "test" ? "Test-Mode"
    : "Manuell";
}

function Card({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-primary text-base">{icon}</span>
        <span className="font-label text-sm font-bold uppercase tracking-widest text-primary">{label}</span>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="font-label text-xs font-bold uppercase tracking-widest text-outline flex-shrink-0">{label}</span>
      <span className={`font-body text-xs text-on-surface-variant text-right min-w-0 break-words [overflow-wrap:anywhere] ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

// EditableField: inline-edit für simple text inputs (Telefon, Email, Name, Firma, Rolle, LinkedIn).
// Pencil-Icon → Input + Save/Cancel. Bei Save → onSave(value) → PATCH + reload.
function EditableField({
  label,
  value,
  onSave,
  mono,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  mono?: boolean;
  type?: "text" | "email" | "tel";
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function commit() {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-start justify-between gap-3">
        <span className="font-label text-xs font-bold uppercase tracking-widest text-outline flex-shrink-0 pt-1.5">{label}</span>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0 items-end">
          <div className="flex gap-1.5 w-full">
            <input
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
              placeholder={placeholder}
              autoFocus
              className={`flex-1 min-w-0 bg-surface-container-low border border-outline-variant/30 rounded-lg px-2 py-1 font-body text-xs ${mono ? "font-mono" : ""} text-on-surface focus:outline-none focus:border-primary`}
            />
            <button onClick={commit} disabled={saving} className="material-symbols-outlined text-primary text-sm hover:text-primary-dim disabled:opacity-50" title="Speichern">check</button>
            <button onClick={() => { setDraft(value); setEditing(false); setError(null); }} className="material-symbols-outlined text-outline text-sm hover:text-error" title="Abbrechen">close</button>
          </div>
          {error && <span className="font-label text-[10px] text-error">{error}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 group">
      <span className="font-label text-xs font-bold uppercase tracking-widest text-outline flex-shrink-0">{label}</span>
      <div className="flex items-start gap-2 min-w-0">
        <span className={`font-body text-xs text-on-surface-variant text-right min-w-0 break-words [overflow-wrap:anywhere] ${mono ? "font-mono" : ""}`}>
          {value || <span className="text-outline">–</span>}
        </span>
        <button
          onClick={() => { setDraft(value); setEditing(true); }}
          className="material-symbols-outlined text-outline text-xs hover:text-primary opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0"
          title="Bearbeiten"
        >
          edit
        </button>
      </div>
    </div>
  );
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")} min`;
}

const inputClass = "w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
