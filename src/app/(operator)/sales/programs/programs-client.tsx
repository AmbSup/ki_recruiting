"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ProgramModal } from "./program-modal";

type Program = {
  id: string;
  name: string;
  status: string;
  auto_dial: boolean;
  vapi_assistant_id: string | null;
  booking_link: string | null;
  created_at: string;
  company: { id: string; name: string };
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  draft:   { label: "Entwurf",  bg: "bg-surface-container-high",  text: "text-outline" },
  active:  { label: "Aktiv",    bg: "bg-primary-container/40",    text: "text-primary" },
  paused:  { label: "Pausiert", bg: "bg-tertiary-container/40",   text: "text-tertiary" },
  closed:  { label: "Geschl.",  bg: "bg-error-container/20",      text: "text-error" },
};

export function ProgramsClient() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("sales_programs")
      .select("id, name, status, auto_dial, vapi_assistant_id, booking_link, created_at, company:companies(id, name)")
      .order("created_at", { ascending: false });
    setPrograms((data ?? []) as unknown as Program[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = programs.filter((p) => {
    const s = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(s) || p.company.name.toLowerCase().includes(s);
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="px-8 pt-10 pb-32">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
            <Link href="/sales" className="hover:text-primary transition-colors">Sales</Link> ·
            Programs
          </p>
          <h1 className="font-headline text-5xl italic text-on-surface leading-none">Sales Programs</h1>
          <p className="font-body text-on-surface-variant mt-2">
            {loading ? "Lädt…" : `${programs.length} Programs verwaltet`}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Neues Program
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-2.5 flex-1 max-w-xs">
          <span className="material-symbols-outlined text-outline text-sm">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Program oder Firma suchen…"
            className="bg-transparent font-body text-sm text-on-surface placeholder:text-outline focus:outline-none w-full"
          />
        </div>
        {["all", "active", "draft", "paused", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-5 py-2 rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors ${
              statusFilter === s
                ? "bg-primary text-on-primary"
                : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {s === "all" ? "Alle" : (statusConfig[s]?.label ?? s)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 font-label text-outline">Lädt…</div>
      ) : filtered.length === 0 ? (
        <EmptyState onCreate={() => setModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/sales/programs/${p.id}`}
              className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] hover:shadow-[0_16px_40px_-4px_rgba(45,52,51,0.1)] hover:-translate-y-0.5 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">trending_up</span>
                  <span className={`px-2.5 py-1 rounded-full font-label text-xs font-bold uppercase tracking-wider ${statusConfig[p.status]?.bg ?? "bg-surface-container"} ${statusConfig[p.status]?.text ?? "text-outline"}`}>
                    {statusConfig[p.status]?.label ?? p.status}
                  </span>
                </div>
                {p.auto_dial && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-container/40 text-primary font-label text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    Auto-Dial
                  </span>
                )}
              </div>
              <h3 className="font-headline text-2xl text-on-surface mb-1 group-hover:italic transition-all">{p.name}</h3>
              <p className="font-label text-xs text-outline mb-4">{p.company.name}</p>
              <div className="pt-4 border-t border-outline-variant/10 space-y-1.5">
                <InfoRow icon="support_agent" label="Vapi-Assistant">{p.vapi_assistant_id ? "konfiguriert" : "fehlt"}</InfoRow>
                <InfoRow icon="calendar_month" label="Booking-Link">{p.booking_link ? "gesetzt" : "–"}</InfoRow>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ProgramModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={load} />
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between font-label text-xs">
      <span className="flex items-center gap-1.5 text-outline">
        <span className="material-symbols-outlined text-sm">{icon}</span>
        {label}
      </span>
      <span className="text-on-surface-variant font-bold">{children}</span>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-16 text-center shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
      <span className="material-symbols-outlined text-6xl text-outline-variant mb-4 block">trending_up</span>
      <h3 className="font-headline text-2xl italic text-on-surface mb-2">Noch kein Sales Program</h3>
      <p className="font-body text-sm text-outline max-w-md mx-auto mb-6">
        Ein Program definiert Pitch, Value Prop, Vapi-Assistant und Buchungs-Link — die Vorlage, mit der der KI-Agent die Leads anruft.
      </p>
      <button
        onClick={onCreate}
        className="bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
      >
        Erstes Program anlegen
      </button>
    </div>
  );
}
