"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Meeting = {
  id: string;
  cal_booking_uid: string;
  cal_event_type_slug: string | null;
  start_at: string;
  end_at: string;
  status: string;
  source: string;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
  notes: string | null;
  sales_program_id: string;
  sales_lead_id: string | null;
  sales_call_id: string | null;
  sales_program: { name: string } | null;
  sales_lead: { full_name: string | null; first_name: string | null; last_name: string | null } | null;
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  confirmed:   { label: "Bestätigt",    icon: "check_circle",    bg: "bg-primary-container/40",  text: "text-on-primary-container" },
  rescheduled: { label: "Verschoben",   icon: "update",          bg: "bg-tertiary-container/40", text: "text-on-tertiary-container" },
  cancelled:   { label: "Abgesagt",     icon: "cancel",          bg: "bg-error-container/30",    text: "text-error" },
  no_show:     { label: "No-Show",      icon: "person_off",      bg: "bg-error-container/20",    text: "text-error" },
};

const SOURCE_LABEL: Record<string, string> = {
  ai_call:     "KI-Call",
  public_page: "Cal.com-Seite",
  manual:      "Manuell",
};

function leadName(m: Meeting): string {
  if (m.attendee_name) return m.attendee_name;
  if (m.sales_lead?.full_name) return m.sales_lead.full_name;
  const joined = [m.sales_lead?.first_name, m.sales_lead?.last_name].filter(Boolean).join(" ");
  return joined || "(Kein Lead-Match)";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-AT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
}

export default function SalesCalendarPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("upcoming");
  const [programFilter, setProgramFilter] = useState("all");
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("sales_meetings")
      .select(
        "id, cal_booking_uid, cal_event_type_slug, start_at, end_at, status, source, attendee_name, attendee_email, attendee_phone, notes, sales_program_id, sales_lead_id, sales_call_id, sales_program:sales_programs(name), sales_lead:sales_leads(full_name, first_name, last_name)",
      )
      .order("start_at", { ascending: true });
    setMeetings((data ?? []) as unknown as Meeting[]);
    const { data: progs } = await supabase.from("sales_programs").select("id, name").order("name");
    setPrograms((progs ?? []) as { id: string; name: string }[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { groupedArr, upcoming, cancelled, aiBooked, publicBooked } = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- now-Snapshot pro Memo-Run, ist intentional
    const now = Date.now();
    const filtered = meetings.filter((m) => {
      const matchProgram = programFilter === "all" || m.sales_program_id === programFilter;
      const isFuture = new Date(m.start_at).getTime() >= now - 60 * 60 * 1000; // 1h Grace
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "upcoming" && isFuture && m.status !== "cancelled") ||
        (statusFilter === "past" && !isFuture) ||
        m.status === statusFilter;
      return matchProgram && matchStatus;
    });
    const grouped = new Map<string, Meeting[]>();
    for (const m of filtered) {
      const key = m.start_at.slice(0, 10);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(m);
    }
    return {
      groupedArr: Array.from(grouped.entries()).sort(),
      upcoming: meetings.filter((m) => new Date(m.start_at).getTime() >= now && m.status === "confirmed").length,
      cancelled: meetings.filter((m) => m.status === "cancelled").length,
      aiBooked: meetings.filter((m) => m.source === "ai_call").length,
      publicBooked: meetings.filter((m) => m.source === "public_page").length,
    };
  }, [meetings, programFilter, statusFilter]);

  return (
    <div className="px-8 pt-10 pb-32">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-headline text-4xl italic text-on-surface mb-1">Sales-Kalender</h1>
          <p className="font-label text-xs text-outline">
            Termine aus Cal.com — KI-gebucht oder direkt vom Lead.
          </p>
        </div>
      </div>

      {/* KPI-Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Anstehend" value={upcoming.toString()} />
        <Stat label="KI-gebucht" value={aiBooked.toString()} />
        <Stat label="Selbst gebucht" value={publicBooked.toString()} />
        <Stat label="Abgesagt" value={cancelled.toString()} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 font-label text-xs text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="upcoming">Anstehend</option>
          <option value="past">Vergangen</option>
          <option value="all">Alle</option>
          <option value="confirmed">Nur bestätigt</option>
          <option value="cancelled">Nur abgesagt</option>
          <option value="rescheduled">Nur verschoben</option>
        </select>
        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2 font-label text-xs text-on-surface focus:outline-none focus:border-primary"
        >
          <option value="all">Alle Programme</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Cal.com-Hint */}
      <div className="bg-tertiary-container/15 border border-tertiary-container/40 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
        <span className="material-symbols-outlined text-tertiary text-base flex-shrink-0 mt-0.5">info</span>
        <div className="flex-1">
          <p className="font-body text-sm text-on-surface">
            Verfügbarkeit pflegst du auf{" "}
            <a
              href="https://app.cal.com/availability"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              app.cal.com/availability
            </a>
            . Termine landen über Webhook automatisch hier.
          </p>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-3xl text-outline animate-spin">progress_activity</span>
        </div>
      ) : groupedArr.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-3 block">event_busy</span>
          <p className="font-body text-on-surface-variant">Keine Termine im aktuellen Filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedArr.map(([dateKey, items]) => (
            <div key={dateKey}>
              <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-3">
                {formatDate(items[0].start_at)}
              </h3>
              <div className="space-y-2">
                {items.map((m) => {
                  const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.confirmed;
                  return (
                    <div
                      key={m.id}
                      className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_16px_-4px_rgba(45,52,51,0.04)] flex items-center gap-4"
                    >
                      <div className="flex-shrink-0 w-20 text-right">
                        <div className="font-headline text-xl text-on-surface leading-none">
                          {formatTime(m.start_at)}
                        </div>
                        <div className="font-label text-xs text-outline mt-0.5">
                          {m.cal_event_type_slug ?? "—"}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {m.sales_lead_id ? (
                            <Link
                              href={`/sales/leads/${m.sales_lead_id}`}
                              className="font-body text-sm font-semibold text-on-surface hover:text-primary truncate"
                            >
                              {leadName(m)}
                            </Link>
                          ) : (
                            <span className="font-body text-sm font-semibold text-on-surface truncate">
                              {leadName(m)}
                            </span>
                          )}
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-label text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {cfg.icon}
                            </span>
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 font-label text-xs text-outline">
                          {m.sales_program?.name && (
                            <span>
                              <Link
                                href={`/sales/programs/${m.sales_program_id}`}
                                className="hover:text-primary"
                              >
                                {m.sales_program.name}
                              </Link>
                            </span>
                          )}
                          <span>·</span>
                          <span>{SOURCE_LABEL[m.source] ?? m.source}</span>
                          {m.attendee_email && (
                            <>
                              <span>·</span>
                              <a href={`mailto:${m.attendee_email}`} className="hover:text-primary">
                                {m.attendee_email}
                              </a>
                            </>
                          )}
                          {m.sales_call_id && (
                            <>
                              <span>·</span>
                              <Link href={`/sales/calls/${m.sales_call_id}`} className="hover:text-primary">
                                Call ansehen
                              </Link>
                            </>
                          )}
                        </div>
                        {m.notes && (
                          <p className="font-body text-xs text-on-surface-variant mt-1 italic truncate">
                            {m.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0_4px_16px_-4px_rgba(45,52,51,0.04)]">
      <div className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-1">{label}</div>
      <div className="font-headline text-2xl text-on-surface leading-none">{value}</div>
    </div>
  );
}
