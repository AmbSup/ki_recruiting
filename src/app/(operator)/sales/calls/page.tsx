"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Call = {
  id: string;
  sales_lead_id: string;
  sales_program_id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  end_reason: string | null;
  recording_url: string | null;
  created_at: string;
  sales_lead: { full_name: string | null; first_name: string | null; last_name: string | null; phone: string; company_name: string | null };
  sales_program: { id: string; name: string };
  analysis: {
    meeting_booked: boolean | null;
    interest_level: string | null;
    call_rating: number | null;
    sentiment: string | null;
    next_action: string | null;
  } | null;
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  initiated:   { label: "Gestartet",    icon: "schedule",        bg: "bg-primary-container/30",   text: "text-primary" },
  ringing:     { label: "Klingelt",     icon: "phone_in_talk",   bg: "bg-tertiary-container/30",  text: "text-tertiary" },
  in_progress: { label: "Läuft",        icon: "phone_in_talk",   bg: "bg-primary-container/50",   text: "text-primary" },
  completed:   { label: "Abgeschl.",    icon: "check_circle",    bg: "bg-surface-container-high", text: "text-outline" },
  failed:      { label: "Fehlgeschl.",  icon: "error",           bg: "bg-error-container/20",     text: "text-error" },
  no_answer:   { label: "Keine Antw.",  icon: "phone_missed",    bg: "bg-tertiary-container/20",  text: "text-tertiary" },
};

export default function SalesCallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("sales_calls")
      .select("id, sales_lead_id, sales_program_id, status, started_at, ended_at, duration_seconds, end_reason, recording_url, created_at, sales_lead:sales_leads(full_name, first_name, last_name, phone, company_name), sales_program:sales_programs(id, name), analysis:sales_call_analyses(meeting_booked, interest_level, call_rating, sentiment, next_action)")
      .order("created_at", { ascending: false });
    setCalls((data ?? []) as unknown as Call[]);
    const { data: progs } = await supabase.from("sales_programs").select("id, name").order("name");
    setPrograms((progs ?? []) as { id: string; name: string }[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = calls.filter((c) => {
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchProgram = programFilter === "all" || c.sales_program_id === programFilter;
    return matchStatus && matchProgram;
  });

  const meetingsBooked = calls.filter((c) => c.analysis?.meeting_booked).length;
  const avgRating = (() => {
    const rated = calls.map((c) => c.analysis?.call_rating).filter((r): r is number => typeof r === "number");
    return rated.length ? (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1) : "–";
  })();
  const completedCount = calls.filter((c) => c.status === "completed").length;
  const avgDuration = (() => {
    const durs = calls.map((c) => c.duration_seconds).filter((d): d is number => typeof d === "number" && d > 0);
    if (!durs.length) return "–";
    const avg = Math.round(durs.reduce((a, b) => a + b, 0) / durs.length);
    return formatDuration(avg);
  })();

  return (
    <div className="px-8 pt-10 pb-32">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
            <Link href="/sales" className="hover:text-primary transition-colors">Sales</Link> · Calls
          </p>
          <h1 className="font-headline text-5xl italic text-on-surface leading-none">Sales Calls</h1>
          <p className="font-body text-on-surface-variant mt-2">
            {loading ? "Lädt…" : `${calls.length} Calls · ${meetingsBooked} Meetings gebucht`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MiniStat label="Gesamt" value={String(calls.length)} icon="call" />
        <MiniStat label="Abgeschlossen" value={String(completedCount)} icon="check_circle" />
        <MiniStat label="Meetings" value={String(meetingsBooked)} icon="event_available" />
        <MiniStat label="Ø Rating" value={String(avgRating)} icon="star" />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className={selectClass}>
          <option value="all">Alle Programs</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {["all", "initiated", "in_progress", "completed", "no_answer", "failed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors ${
              statusFilter === s
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {s === "all" ? "Alle" : (STATUS_CONFIG[s]?.label ?? s)}
          </button>
        ))}
        <div className="ml-auto font-label text-xs text-outline">
          Ø Dauer: <span className="font-bold text-on-surface">{avgDuration}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 font-label text-outline">Lädt…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-16 text-center shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
          <span className="material-symbols-outlined text-6xl text-outline-variant mb-4 block">call</span>
          <p className="font-body text-sm text-outline">Noch keine Calls in diesem Filter.</p>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-container-low border-b border-outline-variant/10">
              <tr>
                <Th>Lead</Th>
                <Th>Program</Th>
                <Th>Status</Th>
                <Th>Dauer</Th>
                <Th>Meeting</Th>
                <Th>Rating</Th>
                <Th>Start</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const s = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.initiated;
                const name = c.sales_lead.full_name
                  ?? [c.sales_lead.first_name, c.sales_lead.last_name].filter(Boolean).join(" ")
                  ?? c.sales_lead.phone;
                return (
                  <tr key={c.id} className="border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors">
                    <Td>
                      <div className="font-label text-xs font-bold text-on-surface">{name}</div>
                      <div className="font-label text-xs text-outline">{c.sales_lead.company_name ?? "–"}</div>
                    </Td>
                    <Td><span className="font-body text-xs">{c.sales_program?.name ?? "–"}</span></Td>
                    <Td>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label text-xs font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
                        <span className="material-symbols-outlined text-xs">{s.icon}</span>
                        {s.label}
                      </span>
                    </Td>
                    <Td><span className="font-label text-xs font-mono">{formatDuration(c.duration_seconds)}</span></Td>
                    <Td>
                      {c.analysis?.meeting_booked ? (
                        <span className="inline-flex items-center gap-1 text-primary font-label text-xs font-bold">
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
                          Ja
                        </span>
                      ) : (
                        <span className="font-label text-xs text-outline">–</span>
                      )}
                    </Td>
                    <Td>
                      {c.analysis?.call_rating ? (
                        <span className="font-label text-xs font-bold">{c.analysis.call_rating}/10</span>
                      ) : (
                        <span className="font-label text-xs text-outline">–</span>
                      )}
                    </Td>
                    <Td>
                      <span className="font-label text-xs text-outline">
                        {c.started_at ? formatShort(c.started_at) : formatShort(c.created_at)}
                      </span>
                    </Td>
                    <Td>
                      <Link href={`/sales/calls/${c.id}`} className="material-symbols-outlined text-outline hover:text-primary text-sm">
                        arrow_forward
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 font-label text-xs font-bold uppercase tracking-widest text-outline">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl px-4 py-3 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
      <div className="flex items-center justify-between">
        <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">{label}</span>
        <span className="material-symbols-outlined text-outline-variant text-sm">{icon}</span>
      </div>
      <div className="font-headline text-2xl text-on-surface leading-none mt-1">{value}</div>
    </div>
  );
}

function formatDuration(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
function formatShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit" }) + " · " + d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
}

const selectClass = "bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-2 font-label text-xs font-bold uppercase tracking-widest text-on-surface focus:outline-none focus:border-primary transition-colors";
