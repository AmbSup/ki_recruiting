"use client";

import { useState, useEffect, useCallback } from "react";
import { CompanyModal } from "./company-modal";
import { CompanyDetailModal } from "./company-detail-modal";
import { createClient } from "@/lib/supabase/client";

type Company = {
  id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  status: "active" | "paused" | "churned";
  billing_plan: "per_job" | "monthly" | "custom";
  created_at: string;
};

const statusConfig = {
  active:  { label: "Aktiv",     bg: "bg-primary-container/30",    text: "text-primary" },
  paused:  { label: "Pausiert",  bg: "bg-tertiary-container/30",   text: "text-tertiary" },
  churned: { label: "Inaktiv",   bg: "bg-error-container/20",      text: "text-error" },
};

const planConfig = {
  per_job:  "Pro Job",
  monthly:  "Monatlich",
  custom:   "Custom",
};

export function CompaniesClient() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailCompanyId, setDetailCompanyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("companies")
      .select("id, name, contact_name, contact_email, status, billing_plan, created_at")
      .order("created_at", { ascending: false });
    setCompanies(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = companies.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.contact_email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="px-8 pt-10 pb-32">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
            Operator Panel
          </p>
          <h1 className="font-headline text-5xl italic text-on-surface leading-none">
            Firmen
          </h1>
          <p className="font-body text-on-surface-variant mt-2">
            {loading ? "Lädt…" : `${companies.length} Kunden verwaltet`}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Neue Firma
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-2.5 flex-1 max-w-xs">
          <span className="material-symbols-outlined text-outline text-sm">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Firma suchen…"
            className="bg-transparent font-body text-sm text-on-surface placeholder:text-outline focus:outline-none w-full"
          />
        </div>

        {["all", "active", "paused", "churned"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-5 py-2 rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors ${
              statusFilter === s
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {s === "all" ? "Alle" : s === "active" ? "Aktiv" : s === "paused" ? "Pausiert" : "Inaktiv"}
          </button>
        ))}
      </div>

      {/* Companies Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">domain</span>
          <h3 className="font-headline text-2xl italic text-on-surface mb-2">Noch keine Firmen</h3>
          <p className="font-body text-on-surface-variant mb-6">
            Lege deine erste Kunden-Firma an, um zu starten.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Erste Firma anlegen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((company) => {
            const status = statusConfig[company.status];
            return (
              <div
                key={company.id}
                className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] hover:bg-surface-bright transition-all group cursor-pointer"
              >
                {/* Company Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-sm font-bold text-on-primary-container">
                      {company.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-label text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        {company.name}
                      </h3>
                      <span className={`text-xs font-label font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <button className="material-symbols-outlined text-outline hover:text-on-surface transition-colors text-xl">
                    more_horiz
                  </button>
                </div>

                {/* Meta */}
                <div className="space-y-2 mb-5">
                  {company.contact_name && (
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm text-outline-variant">person</span>
                      {company.contact_name}
                    </div>
                  )}
                  {company.contact_email && (
                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm text-outline-variant">mail</span>
                      {company.contact_email}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                  <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">
                    {planConfig[company.billing_plan]}
                  </span>
                  <button
                    onClick={() => setDetailCompanyId(company.id)}
                    className="font-label text-xs font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
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

      <CompanyModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={load} />
      <CompanyDetailModal companyId={detailCompanyId} onClose={() => { setDetailCompanyId(null); load(); }} onDeleted={load} />
    </div>
  );
}
