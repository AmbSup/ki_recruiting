"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type TeamUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: "admin" | "operator" | "viewer" | "customer";
  company_id: string | null;
  company?: { name: string } | null;
  created_at: string;
};

const roleConfig = {
  admin:    { label: "Admin",    bg: "bg-error-container/30",        text: "text-error",      icon: "shield_person" },
  operator: { label: "Operator", bg: "bg-primary-container/40",      text: "text-primary",    icon: "manage_accounts" },
  viewer:   { label: "Betrachter", bg: "bg-secondary-container/40",  text: "text-secondary",  icon: "visibility" },
  customer: { label: "Kunde",    bg: "bg-tertiary-container/40",     text: "text-tertiary",   icon: "person" },
};

function formatDate(s: string | null | undefined) {
  if (!s) return "Noch nie";
  return new Date(s).toLocaleDateString("de-AT", { day: "2-digit", month: "short", year: "numeric" });
}

function getInitials(name: string | null, email: string | null) {
  if (name) return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (email ?? "??").slice(0, 2).toUpperCase();
}

const avatarColors = [
  "bg-primary-container text-on-primary-container",
  "bg-secondary-container text-on-secondary-container",
  "bg-tertiary-container text-on-tertiary-container",
];

export default function UsersPage() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select(`
        id, name, email, role, company_id, created_at,
        company:companies(name)
      `)
      .order("created_at", { ascending: false });
    setUsers((data ?? []) as unknown as TeamUser[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (u.name?.toLowerCase().includes(q) ?? false) || (u.email?.toLowerCase().includes(q) ?? false);
    return matchRole && matchSearch;
  });

  const operatorCount = users.filter((u) => u.role === "admin" || u.role === "operator" || u.role === "viewer").length;
  const customerCount = users.filter((u) => u.role === "customer").length;

  return (
    <div className="px-8 pt-10 pb-32">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">Operator Panel</p>
          <h1 className="font-headline text-5xl italic text-on-surface leading-none">Team & Zugänge</h1>
          <p className="font-body text-on-surface-variant mt-2">
            {loading ? "Lädt…" : `${operatorCount} Interne · ${customerCount} Kunden-Zugänge`}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
          <span className="material-symbols-outlined text-sm">person_add</span>
          Nutzer einladen
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {[
          { label: "Gesamt",    value: users.length,                                                    icon: "group" },
          { label: "Admins",    value: users.filter((u) => u.role === "admin").length,                  icon: "shield_person" },
          { label: "Operatoren",value: users.filter((u) => u.role === "operator").length,               icon: "manage_accounts" },
          { label: "Kunden",    value: users.filter((u) => u.role === "customer").length,               icon: "person" },
        ].map((k) => (
          <div key={k.label} className="bg-surface-container-lowest rounded-xl p-5 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">{k.label}</span>
              <span className="material-symbols-outlined text-outline-variant text-xl">{k.icon}</span>
            </div>
            <div className="font-headline text-3xl text-on-surface">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">search</span>
          <input
            type="text"
            placeholder="Name oder E-Mail suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-highest rounded-xl font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          {["all", "admin", "operator", "viewer", "customer"].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-5 py-2 rounded-full font-label text-xs font-bold uppercase tracking-widest transition-colors ${
                roleFilter === r
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
              }`}>
              {r === "all" ? "Alle" : roleConfig[r as keyof typeof roleConfig]?.label ?? r}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">group</span>
          <h3 className="font-headline text-2xl italic text-on-surface mb-2">Keine Nutzer gefunden</h3>
          <p className="font-body text-on-surface-variant mb-6">Lade dein Team ein oder erstelle Kunden-Zugänge.</p>
          <button className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
            <span className="material-symbols-outlined text-sm">person_add</span>
            Ersten Nutzer einladen
          </button>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] overflow-hidden">
          {/* Sections: Internal team */}
          {["Internes Team", "Kunden-Zugänge"].map((section) => {
            const isInternal = section === "Internes Team";
            const sectionUsers = filtered.filter((u) =>
              isInternal
                ? u.role === "admin" || u.role === "operator" || u.role === "viewer"
                : u.role === "customer"
            );
            if (sectionUsers.length === 0) return null;

            return (
              <div key={section}>
                <div className="px-6 py-3 bg-surface-container border-b border-outline-variant/10">
                  <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">{section}</span>
                </div>
                {sectionUsers.map((user, idx) => {
                  const rc = roleConfig[user.role];
                  const colorClass = avatarColors[idx % avatarColors.length];
                  return (
                    <div key={user.id} className="flex items-center gap-4 px-6 py-4 border-b border-outline-variant/10 hover:bg-surface-bright transition-colors">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${colorClass}`}>
                        {getInitials(user.name, user.email)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-label text-sm font-bold text-on-surface">
                            {user.name ?? "—"}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs font-label font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${rc.bg} ${rc.text}`}>
                            <span className="material-symbols-outlined text-xs">{rc.icon}</span>
                            {rc.label}
                          </span>
                        </div>
                        <div className="font-label text-xs text-outline mt-0.5">{user.email}</div>
                        {user.company && (
                          <div className="font-label text-xs text-outline-variant">{user.company.name}</div>
                        )}
                      </div>

                      {/* Member since */}
                      <div className="text-right flex-shrink-0 w-28">
                        <div className="font-label text-xs text-on-surface-variant">Dabei seit</div>
                        <div className="font-label text-xs font-bold text-on-surface">{formatDate(user.created_at)}</div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          className="material-symbols-outlined text-outline hover:text-primary text-xl p-1 transition-colors"
                          title="Bearbeiten"
                        >
                          edit
                        </button>
                        <button
                          className="material-symbols-outlined text-outline hover:text-error text-xl p-1 transition-colors"
                          title="Entfernen"
                        >
                          person_remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
