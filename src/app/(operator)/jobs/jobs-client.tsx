"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { JobModal } from "./job-modal";
import { createClient } from "@/lib/supabase/client";

type Job = {
  id: string;
  title: string;
  location: string | null;
  employment_type: string;
  status: "draft" | "active" | "paused" | "closed" | "filled";
  created_at: string;
  company: { id: string; name: string };
  _count?: { funnels: number; applications: number };
};

const statusConfig = {
  draft:   { label: "Entwurf",   bg: "bg-surface-container-high",     text: "text-outline" },
  active:  { label: "Aktiv",     bg: "bg-primary-container/40",        text: "text-primary" },
  paused:  { label: "Pausiert",  bg: "bg-tertiary-container/40",       text: "text-tertiary" },
  closed:  { label: "Geschl.",   bg: "bg-error-container/20",          text: "text-error" },
  filled:  { label: "Besetzt",   bg: "bg-secondary-container",         text: "text-secondary" },
};

const employmentLabels: Record<string, string> = {
  fulltime:    "Vollzeit",
  parttime:    "Teilzeit",
  minijob:     "Minijob",
  internship:  "Praktikum",
  freelance:   "Freelance",
};

export function JobsClient() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("jobs")
      .select(`
        id, title, location, employment_type, status, created_at,
        company:companies(id, name),
        funnels:funnels(count),
        applications:applications(count)
      `)
      .order("created_at", { ascending: false });

    const mapped = (data ?? []).map((j) => {
      const row = j as unknown as Record<string, unknown>;
      return {
        ...j,
        _count: {
          funnels: (row.funnels as { count: number }[])?.[0]?.count ?? 0,
          applications: (row.applications as { count: number }[])?.[0]?.count ?? 0,
        },
      };
    });
    setJobs(mapped as unknown as Job[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = jobs.filter((j) => {
    const matchSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="px-8 pt-10 pb-32">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-2">
            Operator Panel
          </p>
          <h1 className="font-headline text-5xl italic text-on-surface leading-none">Jobs</h1>
          <p className="font-body text-on-surface-variant mt-2">{loading ? "Lädt…" : `${jobs.length} Stellen verwaltet`}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Neuer Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-2.5 flex-1 max-w-xs">
          <span className="material-symbols-outlined text-outline text-sm">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Job oder Firma suchen…"
            className="bg-transparent font-body text-sm text-on-surface placeholder:text-outline focus:outline-none w-full"
          />
        </div>
        {["all", "active", "draft", "paused", "closed"].map((s) => (
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

      {/* Jobs Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">work</span>
          <h3 className="font-headline text-2xl italic text-on-surface mb-2">Noch keine Jobs</h3>
          <p className="font-body text-on-surface-variant mb-6">Lege deinen ersten Job an.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Ersten Job anlegen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {filtered.map((job) => {
            const st = statusConfig[job.status];
            return (
              <div
                key={job.id}
                className="md:col-span-6 xl:col-span-4 bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] hover:bg-surface-bright transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className={`text-[10px] font-label font-bold uppercase tracking-widest px-3 py-1 rounded-full ${st.bg} ${st.text}`}>
                    {st.label}
                  </span>
                  <button className="material-symbols-outlined text-outline hover:text-on-surface transition-colors text-xl">
                    more_horiz
                  </button>
                </div>

                <h3 className="font-headline text-2xl text-on-surface mb-1 group-hover:italic transition-all">
                  {job.title}
                </h3>
                <p className="font-label text-xs text-outline mb-4">{job.company.name}</p>

                <div className="flex flex-wrap gap-2 mb-5">
                  {job.location && (
                    <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-outline-variant text-sm">location_on</span>
                      {job.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-outline-variant text-sm">schedule</span>
                    {employmentLabels[job.employment_type] ?? job.employment_type}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/10">
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-outline-variant text-sm">filter_alt</span>
                    <span>{job._count?.funnels ?? 0} Funnels</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-outline-variant text-sm">people</span>
                    <span>{job._count?.applications ?? 0} Bewerber</span>
                  </div>
                  <button
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="ml-auto font-label text-[10px] font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                  >
                    Details
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <JobModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={load} />
    </div>
  );
}
