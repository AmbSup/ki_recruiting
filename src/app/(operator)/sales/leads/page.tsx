"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LeadModal } from "./lead-modal";

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
  source: string;
  status: string;
  consent_given: boolean;
  next_call_scheduled_at: string | null;
  created_at: string;
  program: { id: string; name: string };
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  new:              { label: "Neu",             icon: "inbox",         bg: "bg-surface-container-high",  text: "text-outline" },
  calling:          { label: "Im Call",         icon: "phone_in_talk", bg: "bg-primary-container/40",    text: "text-primary" },
  contacted:        { label: "Kontaktiert",     icon: "call_log",      bg: "bg-tertiary-container/40",   text: "text-tertiary" },
  meeting_booked:   { label: "Termin gebucht",  icon: "event_available", bg: "bg-primary-container",     text: "text-on-primary-container" },
  not_interested:   { label: "Kein Interesse",  icon: "cancel",        bg: "bg-surface-container",       text: "text-outline" },
  do_not_call:      { label: "DNC",             icon: "block",         bg: "bg-error-container/30",      text: "text-error" },
  failed:           { label: "Fehlgeschlag.",   icon: "error",         bg: "bg-error-container/20",      text: "text-error" },
};

const SOURCE_CONFIG: Record<string, { label: string; icon: string }> = {
  meta_ads:   { label: "Meta",   icon: "ads_click" },
  csv_import: { label: "CSV",    icon: "upload_file" },
  funnel:     { label: "Funnel", icon: "filter_alt" },
  manual:     { label: "Manual", icon: "person_add" },
};

export default function SalesLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("sales_leads")
      .select("id, sales_program_id, first_name, last_name, full_name, email, phone, company_name, role, source, status, consent_given, next_call_scheduled_at, created_at, program:sales_programs(id, name)")
      .order("created_at", { ascending: false });
    setLeads((data ?? []) as unknown as Lead[]);
    const { data: progs } = await supabase.from("sales_programs").select("id, name").order("name");
    setPrograms((progs ?? []) as { id: string; name: string }[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = leads.filter((l) => {
    const s = search.toLowerCase();
    const name = (l.full_name ?? `${l.first_name ?? ""} ${l.last_name ?? ""}`).toLowerCase();
    const matchSearch = !s
      || name.includes(s)
      || (l.email ?? "").toLowerCase().includes(s)
      || l.phone.toLowerCase().includes(s)
      || (l.company_name ?? "").toLowerCase().includes(s);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchSource = sourceFilter === "all" || l.source === sourceFilter;
    const matchProgram = programFilter === "all" || l.sales_program_id === programFilter;
    return matchSearch && matchStatus && matchSource && matchProgram;
  });

  return (
    <div className="px-8 pt-10 pb-32">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
            <Link href="/sales" className="hover:text-primary transition-colors">Sales</Link> · Leads
          </p>
          <h1 className="font-headline text-5xl italic text-on-surface leading-none">Sales Leads</h1>
          <p className="font-body text-on-surface-variant mt-2">
            {loading ? "Lädt…" : `${filtered.length} / ${leads.length} Leads`}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/sales/leads/import"
            className="flex items-center gap-2 border border-outline-variant/30 text-on-surface-variant px-4 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            CSV Import
          </Link>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Neuer Lead
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-2.5 flex-1 min-w-[240px] max-w-sm">
          <span className="material-symbols-outlined text-outline text-sm">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, Email, Telefon, Firma…"
            className="bg-transparent font-body text-sm text-on-surface placeholder:text-outline focus:outline-none w-full"
          />
        </div>

        <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className={selectClass}>
          <option value="all">Alle Programs</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={selectClass}>
          <option value="all">Alle Quellen</option>
          {Object.entries(SOURCE_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="all">Alle Status</option>
          {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 font-label text-outline">Lädt…</div>
      ) : filtered.length === 0 ? (
        <EmptyState onCreate={() => setModalOpen(true)} />
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-container-low border-b border-outline-variant/10">
              <tr>
                <Th>Lead</Th>
                <Th>Firma</Th>
                <Th>Telefon</Th>
                <Th>Program</Th>
                <Th>Quelle</Th>
                <Th>Status</Th>
                <Th>Eingang</Th>
                <Th> </Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const s = STATUS_CONFIG[l.status] ?? STATUS_CONFIG.new;
                const src = SOURCE_CONFIG[l.source] ?? { label: l.source, icon: "help" };
                const displayName = l.full_name
                  ?? [l.first_name, l.last_name].filter(Boolean).join(" ")
                  ?? "–";
                return (
                  <tr key={l.id} className="border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors">
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-tertiary-container/40 flex items-center justify-center text-xs font-bold text-tertiary">
                          {displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-label text-xs font-bold text-on-surface truncate">{displayName}</div>
                          {l.email && <div className="font-label text-xs text-outline truncate">{l.email}</div>}
                        </div>
                        {!l.consent_given && (
                          <span title="Kein Opt-In" className="material-symbols-outlined text-error text-sm">warning</span>
                        )}
                      </div>
                    </Td>
                    <Td><span className="font-body text-xs">{l.company_name ?? "–"}{l.role ? ` · ${l.role}` : ""}</span></Td>
                    <Td><span className="font-mono text-xs text-on-surface-variant">{l.phone}</span></Td>
                    <Td><span className="font-body text-xs">{l.program?.name ?? "–"}</span></Td>
                    <Td>
                      <span className="inline-flex items-center gap-1 bg-surface-container rounded-full px-2 py-0.5 font-label text-xs">
                        <span className="material-symbols-outlined text-xs">{src.icon}</span>
                        {src.label}
                      </span>
                    </Td>
                    <Td>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-label text-xs font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
                        <span className="material-symbols-outlined text-xs">{s.icon}</span>
                        {s.label}
                      </span>
                    </Td>
                    <Td><span className="font-label text-xs text-outline">{formatDateShort(l.created_at)}</span></Td>
                    <Td>
                      <Link href={`/sales/leads/${l.id}`} className="material-symbols-outlined text-outline hover:text-primary text-sm">
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

      <LeadModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={() => load()} />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-3 font-label text-xs font-bold uppercase tracking-widest text-outline">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit" }) + " · "
    + d.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" });
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-16 text-center shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
      <span className="material-symbols-outlined text-6xl text-outline-variant mb-4 block">people</span>
      <h3 className="font-headline text-2xl italic text-on-surface mb-2">Noch keine Leads</h3>
      <p className="font-body text-sm text-outline max-w-md mx-auto mb-6">
        Leads kommen aus vier Quellen: <strong>Meta-Lead-Ads</strong>, <strong>CSV-Import</strong>, <strong>Sales-Funnel</strong>, manueller Eintrag.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          Neuer Lead
        </button>
        <Link
          href="/sales/leads/import"
          className="inline-flex items-center gap-2 border border-outline-variant/30 text-on-surface-variant px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-sm">upload_file</span>
          CSV hochladen
        </Link>
      </div>
    </div>
  );
}

const selectClass = "bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-2 font-label text-xs font-bold uppercase tracking-widest text-on-surface focus:outline-none focus:border-primary transition-colors";
