"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Invoice = {
  id: string;
  invoice_number: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  subtotal: number;
  vat_amount: number;
  total: number;
  sent_at: string | null;
  paid_at: string | null;
  period_start: string | null;
  period_end: string | null;
  line_items: { description: string; quantity: number; unit_price: number }[];
  created_at: string;
  company: { name: string; contact_email: string | null };
};

const statusConfig = {
  draft:     { label: "Entwurf",    icon: "draft",         bg: "bg-surface-container-high",  text: "text-outline" },
  sent:      { label: "Versendet",  icon: "send",          bg: "bg-primary-container/30",     text: "text-primary" },
  paid:      { label: "Bezahlt",    icon: "check_circle",  bg: "bg-secondary-container/40",   text: "text-secondary" },
  overdue:   { label: "Überfällig", icon: "warning",       bg: "bg-error-container/20",       text: "text-error" },
  cancelled: { label: "Storniert",  icon: "cancel",        bg: "bg-surface-container-highest", text: "text-outline" },
};

function formatCurrency(n: number) {
  return `€ ${n.toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("de-AT", { day: "2-digit", month: "short", year: "numeric" });
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("invoices")
      .select(`
        id, invoice_number, status, subtotal, vat_amount, total,
        sent_at, paid_at, period_start, period_end, line_items, created_at,
        company:companies(name, contact_email)
      `)
      .order("created_at", { ascending: false });
    setInvoices((data ?? []) as unknown as Invoice[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = invoices.filter(
    (inv) => statusFilter === "all" || inv.status === statusFilter
  );

  const totalPaid = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((s, inv) => s + inv.total, 0);

  const totalOpen = invoices
    .filter((inv) => inv.status === "sent" || inv.status === "overdue")
    .reduce((s, inv) => s + inv.total, 0);

  const overdueCount = invoices.filter((inv) => inv.status === "overdue").length;

  return (
    <div className="px-8 pt-10 pb-32">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">Operator Panel</p>
          <h1 className="font-headline text-5xl italic text-on-surface leading-none">Abrechnung</h1>
          <p className="font-body text-on-surface-variant mt-2">
            {loading ? "Lädt…" : `${invoices.length} Rechnungen${overdueCount > 0 ? ` · ${overdueCount} überfällig` : ""}`}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
          <span className="material-symbols-outlined text-sm">add</span>
          Neue Rechnung
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          { label: "Einnahmen (gesamt)", value: formatCurrency(totalPaid),  icon: "payments",       highlight: true },
          { label: "Offen",              value: formatCurrency(totalOpen),   icon: "pending_actions", highlight: false },
          { label: "Überfällig",         value: overdueCount,                icon: "warning",        highlight: false },
          { label: "Rechnungen gesamt",  value: invoices.length,             icon: "receipt_long",   highlight: false },
        ].map((k) => (
          <div key={k.label} className={`rounded-xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] ${k.highlight ? "bg-primary-container/20 border border-primary/10" : "bg-surface-container-lowest"}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">{k.label}</span>
              <span className={`material-symbols-outlined text-xl ${k.highlight ? "text-primary" : "text-outline-variant"}`}>{k.icon}</span>
            </div>
            <div className={`font-headline text-3xl ${k.highlight ? "text-primary" : "text-on-surface"}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {["all", "draft", "sent", "paid", "overdue", "cancelled"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-5 py-2 rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors ${
              statusFilter === s
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
            }`}>
            {s === "all" ? "Alle" : statusConfig[s as keyof typeof statusConfig]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">receipt_long</span>
          <h3 className="font-headline text-2xl italic text-on-surface mb-2">Keine Rechnungen</h3>
          <p className="font-body text-on-surface-variant mb-6">Erstelle deine erste Rechnung für einen Kunden.</p>
          <button className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
            <span className="material-symbols-outlined text-sm">add</span>
            Erste Rechnung erstellen
          </button>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-outline-variant/10 bg-surface-container">
            {["Rechnungsnr.", "Kunde", "Zeitraum", "Betrag", "Fällig am", "Status", ""].map((h) => (
              <div key={h} className={`font-label text-xs font-bold uppercase tracking-widest text-outline ${h === "Betrag" ? "col-span-2 text-right" : h === "" ? "col-span-1" : "col-span-2"}`}>
                {h}
              </div>
            ))}
          </div>

          {/* Table Rows */}
          {filtered.map((inv) => {
            const st = statusConfig[inv.status];
            return (
              <div key={inv.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-outline-variant/10 hover:bg-surface-bright transition-colors items-center">
                {/* Invoice Number */}
                <div className="col-span-2">
                  <div className="font-label text-sm font-bold text-on-surface">{inv.invoice_number}</div>
                  <div className="font-label text-xs text-outline">{formatDate(inv.sent_at ?? inv.created_at)}</div>
                </div>

                {/* Company */}
                <div className="col-span-2">
                  <div className="font-label text-sm text-on-surface">{inv.company.name}</div>
                  {inv.company.contact_email && (
                    <div className="font-label text-xs text-outline truncate">{inv.company.contact_email}</div>
                  )}
                </div>

                {/* Period */}
                <div className="col-span-2">
                  {inv.period_start && inv.period_end ? (
                    <div className="font-label text-xs text-on-surface-variant">
                      {formatDate(inv.period_start)} – {formatDate(inv.period_end)}
                    </div>
                  ) : (
                    <span className="text-outline text-xs">—</span>
                  )}
                </div>

                {/* Amount */}
                <div className="col-span-2 text-right">
                  <div className="font-headline text-lg text-on-surface">{formatCurrency(inv.total)}</div>
                  <div className="font-label text-xs text-outline">inkl. {formatCurrency(inv.vat_amount)} MwSt.</div>
                </div>

                {/* Sent / Paid */}
                <div className="col-span-2">
                  <div className={`font-label text-sm ${inv.status === "overdue" ? "text-error font-bold" : "text-on-surface"}`}>
                    {inv.sent_at ? `Versendet ${formatDate(inv.sent_at)}` : "—"}
                  </div>
                  {inv.paid_at && (
                    <div className="font-label text-xs text-outline">Bezahlt: {formatDate(inv.paid_at)}</div>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <span className={`inline-flex items-center gap-1 text-xs font-label font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${st.bg} ${st.text}`}>
                    <span className="material-symbols-outlined text-xs">{st.icon}</span>
                    {st.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button className="material-symbols-outlined text-outline hover:text-primary text-xl p-1 transition-colors" title="PDF herunterladen">
                    download
                  </button>
                  {inv.status === "draft" && (
                    <button className="material-symbols-outlined text-outline hover:text-primary text-xl p-1 transition-colors" title="Versenden">
                      send
                    </button>
                  )}
                  <button className="material-symbols-outlined text-outline hover:text-on-surface text-xl p-1 transition-colors" title="Mehr">
                    more_vert
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
