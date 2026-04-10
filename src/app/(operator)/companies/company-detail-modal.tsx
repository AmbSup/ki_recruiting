"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type CompanyDetail = {
  id: string;
  name: string;
  industry: string | null;
  company_size: string | null;
  website: string | null;
  address: string | null;
  description: string | null;
  primary_color: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  recruiting_goals: string | null;
  meta_ad_account_id: string | null;
  linkedin_ad_account_id: string | null;
  billing_plan: string;
  monthly_budget: number | null;
  contract_start: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  _count?: { jobs: number };
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  active:  { label: "Aktiv",    bg: "bg-primary-container/30",  text: "text-primary" },
  paused:  { label: "Pausiert", bg: "bg-tertiary-container/30", text: "text-tertiary" },
  churned: { label: "Inaktiv",  bg: "bg-error-container/20",    text: "text-error" },
};

const planLabels: Record<string, string> = {
  per_job: "Pro Job",
  monthly: "Monatlich",
  custom:  "Custom",
};

type Props = { companyId: string | null; onClose: () => void };

export function CompanyDetailModal({ companyId, onClose }: Props) {
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    setCompany(null);
    setLoading(true);
    const supabase = createClient();
    Promise.all([
      supabase
        .from("companies")
        .select(`
          id, name, industry, company_size, website, address, description,
          primary_color, contact_name, contact_email, contact_phone,
          recruiting_goals, meta_ad_account_id, linkedin_ad_account_id,
          billing_plan, monthly_budget, contract_start, notes, status, created_at
        `)
        .eq("id", companyId)
        .single(),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("company_id", companyId),
    ]).then(([{ data }, { count }]) => {
      if (data) {
        setCompany({ ...(data as unknown as CompanyDetail), _count: { jobs: count ?? 0 } });
      }
      setLoading(false);
    });
  }, [companyId]);

  if (!companyId) return null;

  const st = company ? (statusConfig[company.status] ?? statusConfig.active) : null;
  const initials = company?.name.slice(0, 2).toUpperCase() ?? "??";
  const accentColor = company?.primary_color ?? "#9a442d";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-inverse-surface/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              {loading ? "…" : initials}
            </div>
            <div className="min-w-0">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-surface-container-high rounded-lg animate-pulse" />
                  <div className="h-3 w-24 bg-surface-container-high rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {st && (
                      <span className={`text-[10px] font-label font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    )}
                    {company?.industry && (
                      <span className="text-[10px] font-label font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                        {company.industry}
                      </span>
                    )}
                  </div>
                  <h2 className="font-headline text-2xl italic text-on-surface leading-tight">{company?.name}</h2>
                  {company?.company_size && (
                    <p className="font-label text-xs text-outline mt-0.5">{company.company_size} Mitarbeitende</p>
                  )}
                </>
              )}
            </div>
          </div>
          <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface transition-colors flex-shrink-0">
            close
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="space-y-3">
              {[100, 80, 60, 100, 70].map((w, i) => (
                <div key={i} className="h-4 bg-surface-container-high rounded animate-pulse" style={{ width: `${w}%` }} />
              ))}
            </div>
          ) : company ? (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard icon="work" label="Jobs" value={String(company._count?.jobs ?? 0)} />
                <StatCard icon="payments" label="Budget/Monat" value={company.monthly_budget ? `€${company.monthly_budget.toLocaleString("de-AT")}` : "–"} />
                <StatCard icon="receipt_long" label="Abrechnung" value={planLabels[company.billing_plan] ?? company.billing_plan} />
              </div>

              {/* Beschreibung */}
              {company.description && (
                <Section icon="info" label="Über das Unternehmen">
                  <p className="font-body text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{company.description}</p>
                </Section>
              )}

              {/* Kontakt */}
              <Section icon="contacts" label="Ansprechpartner">
                <div className="space-y-2">
                  {company.contact_name && (
                    <Row icon="person">{company.contact_name}</Row>
                  )}
                  {company.contact_email && (
                    <Row icon="mail">
                      <a href={`mailto:${company.contact_email}`} className="text-primary hover:underline">
                        {company.contact_email}
                      </a>
                    </Row>
                  )}
                  {company.contact_phone && (
                    <Row icon="phone">
                      <a href={`tel:${company.contact_phone}`} className="hover:underline">
                        {company.contact_phone}
                      </a>
                    </Row>
                  )}
                  {company.website && (
                    <Row icon="language">
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {company.website.replace(/^https?:\/\//, "")}
                      </a>
                    </Row>
                  )}
                  {company.address && (
                    <Row icon="location_on">{company.address}</Row>
                  )}
                </div>
              </Section>

              {/* Recruiting-Ziele */}
              {company.recruiting_goals && (
                <Section icon="flag" label="Recruiting-Ziele">
                  <BulletList text={company.recruiting_goals} />
                </Section>
              )}

              {/* Ad Accounts */}
              {(company.meta_ad_account_id || company.linkedin_ad_account_id) && (
                <Section icon="campaign" label="Ad Accounts">
                  <div className="space-y-2">
                    {company.meta_ad_account_id && (
                      <Row icon="ads_click">
                        <span className="text-outline mr-1">Meta:</span> {company.meta_ad_account_id}
                      </Row>
                    )}
                    {company.linkedin_ad_account_id && (
                      <Row icon="ads_click">
                        <span className="text-outline mr-1">LinkedIn:</span> {company.linkedin_ad_account_id}
                      </Row>
                    )}
                  </div>
                </Section>
              )}

              {/* Vertrag */}
              <Section icon="handshake" label="Vertrag & Abrechnung">
                <div className="space-y-2">
                  <Row icon="receipt_long">{planLabels[company.billing_plan] ?? company.billing_plan}</Row>
                  {company.monthly_budget != null && (
                    <Row icon="payments">€{company.monthly_budget.toLocaleString("de-AT")} / Monat</Row>
                  )}
                  {company.contract_start && (
                    <Row icon="calendar_today">
                      Vertragsstart: {new Date(company.contract_start).toLocaleDateString("de-AT", {
                        day: "2-digit", month: "long", year: "numeric",
                      })}
                    </Row>
                  )}
                </div>
              </Section>

              {/* Notizen */}
              {company.notes && (
                <Section icon="sticky_note_2" label="Interne Notizen">
                  <p className="font-body text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{company.notes}</p>
                </Section>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-outline-variant/10">
                <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
                  Kunde seit {new Date(company.created_at).toLocaleDateString("de-AT", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-3 text-center">
      <span className="material-symbols-outlined text-primary text-base block mb-1">{icon}</span>
      <p className="font-headline text-lg text-on-surface leading-none mb-0.5">{value}</p>
      <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">{label}</p>
    </div>
  );
}

function Section({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">{label}</span>
      </div>
      {children}
    </div>
  );
}

function Row({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 font-body text-sm text-on-surface">
      <span className="material-symbols-outlined text-outline-variant text-sm mt-0.5 flex-shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function BulletList({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <ul className="space-y-1">
      {lines.map((line, i) => (
        <li key={i} className="flex items-start gap-2 font-body text-sm text-on-surface leading-relaxed">
          <span className="mt-2 w-1 h-1 rounded-full bg-primary flex-shrink-0" />
          {line}
        </li>
      ))}
    </ul>
  );
}
