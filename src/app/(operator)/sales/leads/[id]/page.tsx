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
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);
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

  async function triggerCall() {
    setTriggering(true);
    setTriggerMsg(null);
    const res = await fetch("/api/sales/trigger-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sales_lead_id: id }),
    });
    const data = await res.json();
    setTriggering(false);
    if (!res.ok) {
      setTriggerMsg(data.error ?? "Trigger fehlgeschlagen");
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
    <div className="px-8 pt-10 pb-32 max-w-[1200px]">
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

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 space-y-5">
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

        <div className="col-span-12 lg:col-span-5 space-y-5">
          <Card label="Kontakt" icon="person">
            <InfoRow label="Telefon" value={lead.phone} mono />
            {lead.email && <InfoRow label="Email" value={lead.email} />}
            {lead.linkedin_url && (
              <InfoRow label="LinkedIn" value={
                <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Profil →
                </a>
              } />
            )}
            <InfoRow label="Firma" value={lead.company_name ?? "–"} />
            <InfoRow label="Rolle" value={lead.role ?? "–"} />
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
              {Object.entries(lead.custom_fields).map(([k, v]) => (
                <InfoRow key={k} label={k} value={String(v)} />
              ))}
            </Card>
          )}

          {Object.keys(lead.funnel_responses ?? {}).length > 0 && (
            <Card label="Funnel-Antworten" icon="quiz">
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

function Card({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] space-y-3">
      <div className="flex items-center gap-2 mb-1">
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

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")} min`;
}

const inputClass = "w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
