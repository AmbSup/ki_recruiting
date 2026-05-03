"use client";

import { useState, useEffect, useCallback } from "react";
import { FunnelModal } from "./funnel-modal";
import Link from "next/link";
import { ExternalFunnelModal } from "./external-funnel-modal";
import { createClient } from "@/lib/supabase/client";
import { getFunnelPublicUrl } from "@/lib/funnel-url";

type Funnel = {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "active" | "paused" | "archived";
  funnel_type: "internal" | "external";
  external_url: string | null;
  views: number;
  submissions: number;
  published_at: string | null;
  created_at: string;
  // Polymorph: genau eines gesetzt (DB-XOR)
  job_id: string | null;
  sales_program_id: string | null;
  job: { id: string; title: string; selected_ad_image_url: string | null; company: { name: string } } | null;
  sales_program: { id: string; name: string; company: { name: string } } | null;
};

function funnelPurpose(f: Funnel): "recruiting" | "sales" {
  return f.sales_program_id ? "sales" : "recruiting";
}

const statusConfig = {
  draft:    { label: "Entwurf",  bg: "bg-surface-container-high",   text: "text-outline",    icon: "draft" },
  active:   { label: "Live",     bg: "bg-primary-container/40",      text: "text-primary",    icon: "wifi_tethering" },
  paused:   { label: "Pausiert", bg: "bg-tertiary-container/40",     text: "text-tertiary",   icon: "pause_circle" },
  archived: { label: "Archiv",   bg: "bg-secondary-container",       text: "text-secondary",  icon: "archive" },
};

export function FunnelsClient() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [externalModalOpen, setExternalModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [duplicateFunnel, setDuplicateFunnel] = useState<Funnel | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("funnels")
      .select(`
        id, name, slug, status, funnel_type, external_url, views, submissions, published_at, created_at,
        job_id, sales_program_id,
        job:jobs(id, title, selected_ad_image_url, company:companies(name)),
        sales_program:sales_programs(id, name, company:companies(name))
      `)
      .order("created_at", { ascending: false });
    setFunnels((data ?? []) as unknown as Funnel[]);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- legacy pattern; load() updates funnels list on mount
  useEffect(() => { load(); }, [load]);

  async function deleteFunnel(id: string) {
    if (!confirm("Funnel wirklich löschen?")) return;
    const supabase = createClient();
    await supabase.from("funnel_pages").delete().eq("funnel_id", id);
    await supabase.from("funnels").delete().eq("id", id);
    setFunnels((prev) => prev.filter((f) => f.id !== id));
  }

  const internalFunnels = funnels.filter((f) => f.funnel_type !== "external");
  const externalFunnels = funnels.filter((f) => f.funnel_type === "external");

  const filtered = internalFunnels.filter((f) => {
    const s = search.toLowerCase();
    const matchSearch =
      f.name.toLowerCase().includes(s) ||
      (f.job?.title ?? "").toLowerCase().includes(s) ||
      (f.sales_program?.name ?? "").toLowerCase().includes(s);
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const conversionRate = (f: Funnel) =>
    f.views > 0 ? Math.round((f.submissions / f.views) * 100) : 0;

  return (
    <div className="px-8 pt-10 pb-32">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
            Operator Panel
          </p>
          <h1 className="font-headline text-5xl italic text-on-surface leading-none">Funnels</h1>
          <p className="font-body text-on-surface-variant mt-2">{loading ? "Lädt…" : `${internalFunnels.length} eigene · ${externalFunnels.length} extern`}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExternalModalOpen(true)}
            className="flex items-center gap-2 bg-surface-container-highest text-on-surface-variant px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high border border-outline-variant/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add_link</span>
            Externer Funnel
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Neuer Funnel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-2.5 flex-1 max-w-xs">
          <span className="material-symbols-outlined text-outline text-sm">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Funnel oder Job suchen…"
            className="bg-transparent font-body text-sm text-on-surface placeholder:text-outline focus:outline-none w-full"
          />
        </div>
        {["all", "active", "draft", "paused", "archived"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-5 py-2 rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors ${
              statusFilter === s
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {s === "all" ? "Alle" : statusConfig[s as keyof typeof statusConfig]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Funnels */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">filter_alt</span>
          <h3 className="font-headline text-2xl italic text-on-surface mb-2">Noch keine Funnels</h3>
          <p className="font-body text-on-surface-variant mb-6">
            Erstelle deinen ersten Bewerbungs-Funnel für einen Job.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Ersten Funnel erstellen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {filtered.map((funnel) => {
            const st = statusConfig[funnel.status];
            const cr = conversionRate(funnel);
            return (
              <div
                key={funnel.id}
                className="md:col-span-6 xl:col-span-4 bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] hover:bg-surface-bright transition-all group"
              >
                {/* Ad image banner */}
                {funnel.job?.selected_ad_image_url && (
                  <div className="relative h-28 bg-surface-container-high overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={funnel.job.selected_ad_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-primary/90 rounded-full px-2 py-0.5">
                      <span className="material-symbols-outlined text-on-primary text-xs">campaign</span>
                      <span className="font-label text-[9px] font-bold text-on-primary uppercase tracking-widest">Ad Bild</span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                {/* Status + Actions */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-sm ${st.text}`}
                      style={funnel.status === "active" ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {st.icon}
                    </span>
                    <span className={`text-xs font-label font-bold uppercase tracking-widest px-3 py-1 rounded-full ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/ads-setup?funnel_id=${funnel.id}`}
                      className="material-symbols-outlined text-outline hover:text-[#1877F2] transition-colors text-xl p-1"
                      title="Funnel bewerben mit Meta Ads">
                      campaign
                    </Link>
                    <a
                      href={`/funnels/${funnel.id}/analytics`}
                      className="material-symbols-outlined text-outline hover:text-primary transition-colors text-xl p-1"
                      title="Analytics öffnen"
                    >
                      analytics
                    </a>
                    <a
                      href={`/funnels/${funnel.id}/editor`}
                      className="material-symbols-outlined text-outline hover:text-primary transition-colors text-xl p-1"
                      title="Editor öffnen"
                    >
                      edit
                    </a>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDuplicateFunnel(funnel); }}
                      className="material-symbols-outlined text-outline hover:text-primary transition-colors text-xl p-1"
                      title="Funnel duplizieren"
                    >
                      content_copy
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteFunnel(funnel.id); }}
                      className="material-symbols-outlined text-outline hover:text-error transition-colors text-xl p-1"
                      title="Funnel löschen"
                    >
                      delete
                    </button>
                  </div>
                </div>

                {/* Target Badge (Job oder Sales-Program) */}
                {funnel.job && (
                  <Link href={`/jobs/${funnel.job.id}`}
                    className="flex items-center gap-2 bg-primary-container/20 hover:bg-primary-container/40 rounded-lg px-3 py-2 mb-3 transition-colors"
                    onClick={(e) => e.stopPropagation()}>
                    <span className="material-symbols-outlined text-primary text-sm">work</span>
                    <span className="font-label text-xs font-bold text-on-surface truncate">{funnel.job.title}</span>
                    <span className="font-label text-xs text-outline">·</span>
                    <span className="font-label text-xs text-outline truncate">{funnel.job.company.name}</span>
                  </Link>
                )}
                {funnel.sales_program && (
                  <Link href={`/sales/programs/${funnel.sales_program.id}`}
                    className="flex items-center gap-2 bg-tertiary-container/30 hover:bg-tertiary-container/50 rounded-lg px-3 py-2 mb-3 transition-colors"
                    onClick={(e) => e.stopPropagation()}>
                    <span className="material-symbols-outlined text-tertiary text-sm">trending_up</span>
                    <span className="font-label text-xs font-bold text-on-surface truncate">{funnel.sales_program.name}</span>
                    <span className="font-label text-xs text-outline">·</span>
                    <span className="font-label text-xs text-outline truncate">{funnel.sales_program.company.name}</span>
                  </Link>
                )}

                {/* Title */}
                <h3 className="font-headline text-2xl text-on-surface mb-4 group-hover:italic transition-all">
                  {funnel.name}
                </h3>

                {/* URL */}
                <a
                  href={getFunnelPublicUrl(funnel)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 bg-surface-container hover:bg-surface-container-high rounded-lg px-3 py-2 mb-5 transition-colors group/url"
                >
                  <span className="material-symbols-outlined text-outline-variant text-sm">link</span>
                  <span className="font-label text-xs text-outline group-hover/url:text-primary truncate transition-colors">
                    {getFunnelPublicUrl(funnel)}
                  </span>
                  <span className="material-symbols-outlined text-primary text-sm ml-auto flex-shrink-0">open_in_new</span>
                </a>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Views",       value: funnel.views,       icon: "visibility" },
                    { label: "Bewerbungen", value: funnel.submissions,  icon: "send" },
                    { label: "Conversion",  value: `${cr}%`,           icon: "percent" },
                  ].map((m) => (
                    <div key={m.label} className="text-center">
                      <div className="font-headline text-2xl text-on-surface">{m.value}</div>
                      <div className="font-label text-xs text-outline uppercase tracking-widest">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div className="w-full bg-outline-variant/20 h-1 rounded-full">
                  <div
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ width: `${Math.min(cr, 100)}%` }}
                  />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/10">
                  <span className="font-label text-xs text-outline">
                    {funnel.published_at
                      ? `Live seit ${new Date(funnel.published_at).toLocaleDateString("de-AT", { day: "2-digit", month: "short" })}`
                      : `Erstellt ${new Date(funnel.created_at).toLocaleDateString("de-AT", { day: "2-digit", month: "short" })}`}
                  </span>
                  <a
                    href={`/funnels/${funnel.id}/editor`}
                    className="font-label text-xs font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                  >
                    Editor
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </a>
                </div>
                </div>{/* /p-6 */}
              </div>
            );
          })}
        </div>
      )}

      {/* External Funnels Section */}
      {externalFunnels.length > 0 && (
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-outline-variant text-lg">add_link</span>
            <div>
              <h2 className="font-headline text-2xl italic text-on-surface leading-none">Externe Funnels</h2>
              <p className="font-body text-xs text-on-surface-variant mt-0.5">{externalFunnels.length} verknüpfte externe Bewerbungsseiten</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {externalFunnels.map((funnel) => (
              <div
                key={funnel.id}
                className="md:col-span-6 xl:col-span-4 bg-surface-container-lowest rounded-xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] border border-outline-variant/10 hover:bg-surface-bright transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-secondary-container flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-secondary text-sm">open_in_new</span>
                    </span>
                    <span className="font-label text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-secondary-container/50 text-secondary">
                      Extern
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <a
                      href={funnel.external_url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="material-symbols-outlined text-outline hover:text-primary transition-colors text-xl p-1"
                      title="Externen Funnel öffnen"
                    >
                      open_in_new
                    </a>
                  </div>
                </div>

                <h3 className="font-headline text-xl text-on-surface mb-1 group-hover:italic transition-all">
                  {funnel.name}
                </h3>
                {funnel.job && (
                  <p className="font-label text-xs text-outline mb-1">{funnel.job.title}</p>
                )}
                {funnel.sales_program && (
                  <p className="font-label text-xs text-outline mb-1">
                    <span className="material-symbols-outlined text-xs align-middle mr-1">trending_up</span>
                    {funnel.sales_program.name}
                  </p>
                )}

                <div className="flex items-center gap-2 bg-surface-container rounded-lg px-3 py-2 mt-3">
                  <span className="material-symbols-outlined text-outline-variant text-sm">link</span>
                  <span className="font-label text-xs text-outline truncate flex-1">
                    {funnel.external_url}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant/10">
                  <span className="font-label text-xs text-outline">
                    {new Date(funnel.created_at).toLocaleDateString("de-AT", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                  <a
                    href={funnel.external_url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-label text-xs font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                  >
                    Öffnen
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </a>
                </div>
              </div>
            ))}

            {/* Add external funnel card */}
            <button
              onClick={() => setExternalModalOpen(true)}
              className="md:col-span-6 xl:col-span-4 border-2 border-dashed border-outline-variant/30 rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary-container/5 transition-colors min-h-[160px] group"
            >
              <span className="material-symbols-outlined text-3xl text-outline-variant group-hover:text-primary transition-colors">add_link</span>
              <span className="font-label text-xs font-bold uppercase tracking-widest text-outline-variant group-hover:text-primary transition-colors">
                Externen Funnel hinzufügen
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Show add-external card even if no external funnels yet */}
      {externalFunnels.length === 0 && (
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-outline-variant text-lg">add_link</span>
            <div>
              <h2 className="font-headline text-2xl italic text-on-surface leading-none">Externe Funnels</h2>
              <p className="font-body text-xs text-on-surface-variant mt-0.5">Verknüpfe externe Bewerbungsseiten (involve.me, Typeform, etc.)</p>
            </div>
          </div>
          <button
            onClick={() => setExternalModalOpen(true)}
            className="border-2 border-dashed border-outline-variant/30 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary-container/5 transition-colors w-full max-w-sm group"
          >
            <span className="material-symbols-outlined text-4xl text-outline-variant group-hover:text-primary transition-colors">add_link</span>
            <span className="font-label text-xs font-bold uppercase tracking-widest text-outline-variant group-hover:text-primary transition-colors">
              Externen Funnel hinzufügen
            </span>
            <span className="font-body text-xs text-outline-variant text-center">
              involve.me · Typeform · Google Forms und mehr
            </span>
          </button>
        </div>
      )}

      <FunnelModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={load} />
      <ExternalFunnelModal open={externalModalOpen} onClose={() => setExternalModalOpen(false)} onSuccess={load} />
      {duplicateFunnel && (
        <DuplicateFunnelModal
          key={duplicateFunnel.id}
          funnel={duplicateFunnel}
          onClose={() => setDuplicateFunnel(null)}
          onSuccess={() => { setDuplicateFunnel(null); load(); }}
        />
      )}
    </div>
  );
}

// ─── Duplicate-Modal: wählt Anchor (Job oder Sales-Program) für Klon ─────────

function DuplicateFunnelModal({
  funnel,
  onClose,
  onSuccess,
}: {
  funnel: Funnel;
  onClose: () => void;
  onSuccess: (newFunnelId: string, slug: string) => void;
}) {
  // Initial-State direkt aus funnel ableiten — der Modal mountet pro Funnel-ID neu (key=funnel.id),
  // daher kein useEffect-State-Sync nötig.
  const initialPurpose: "recruiting" | "sales" = funnel.sales_program_id ? "sales" : "recruiting";

  const [jobs, setJobs] = useState<Array<{ id: string; title: string; company: { name: string } }>>([]);
  const [programs, setPrograms] = useState<Array<{ id: string; name: string; company: { name: string } }>>([]);
  const [purpose, setPurpose] = useState<"recruiting" | "sales">(initialPurpose);
  const [jobId, setJobId] = useState(initialPurpose === "recruiting" ? (funnel.job_id ?? "") : "");
  const [programId, setProgramId] = useState(initialPurpose === "sales" ? (funnel.sales_program_id ?? "") : "");
  const [newName, setNewName] = useState(`${funnel.name} (Kopie)`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("jobs")
      .select("id, title, status, company:companies(name)")
      .in("status", ["active", "draft", "paused"])
      .then(({ data }) => { if (data) setJobs(data as unknown as typeof jobs); });
    supabase
      .from("sales_programs")
      .select("id, name, status, company:companies(name)")
      .in("status", ["active", "draft", "paused"])
      .then(({ data }) => { if (data) setPrograms(data as unknown as typeof programs); });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!funnel) return;
    if (purpose === "recruiting" && !jobId) { setError("Bitte Job auswählen"); return; }
    if (purpose === "sales" && !programId) { setError("Bitte Sales-Program auswählen"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/funnels/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: { type: "funnel", funnel_id: funnel.id },
          target_anchor: purpose === "recruiting" ? { job_id: jobId } : { sales_program_id: programId },
          new_name: newName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        setLoading(false);
        return;
      }
      onSuccess(data.funnel_id, data.slug);
      // Ähnlich wie funnel-modal: optional zum Editor öffnen.
      if (data.edit_url) window.location.href = data.edit_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Netzwerkfehler");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
          <div>
            <h2 className="font-headline text-2xl italic text-on-surface">Funnel duplizieren</h2>
            <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mt-0.5">
              Quelle: {funnel.name}
            </p>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface transition-colors">close</button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5">Ziel-Zweck</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPurpose("recruiting")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 font-label text-xs font-bold uppercase tracking-widest transition-colors ${
                  purpose === "recruiting" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-sm">work</span>
                Recruiting
              </button>
              <button
                type="button"
                onClick={() => setPurpose("sales")}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 font-label text-xs font-bold uppercase tracking-widest transition-colors ${
                  purpose === "sales" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-sm">trending_up</span>
                Sales
              </button>
            </div>
          </div>

          {purpose === "recruiting" ? (
            <div>
              <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5">Ziel-Job *</label>
              <select required value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm">
                <option value="">Job auswählen…</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} · {j.company.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5">Ziel-Sales-Program *</label>
              <select required value={programId} onChange={(e) => setProgramId(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm">
                <option value="">Program auswählen…</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.company.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5">Neuer Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Klon-Name"
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 font-body text-sm"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-error-container/20 border border-error-container/40 rounded-xl px-4 py-3">
              <span className="material-symbols-outlined text-error text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <span className="font-body text-sm text-error">{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-outline-variant/30 text-on-surface-variant rounded-xl py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors">Abbrechen</button>
            <button type="submit" disabled={loading} className="flex-1 bg-primary text-on-primary rounded-xl py-3 font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> : <span className="material-symbols-outlined text-sm">content_copy</span>}
              Duplizieren & öffnen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
