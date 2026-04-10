"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard",    icon: "grid_view",      label: "Dashboard" },
  { href: "/companies",    icon: "domain",         label: "Firmen" },
  { href: "/jobs",         icon: "work",           label: "Jobs" },
  { href: "/funnels",      icon: "filter_alt",     label: "Funnels" },
  { href: "/ads-setup",    icon: "ads_click",      label: "Ads Setup" },
  { href: "/applicants",   icon: "people",         label: "Bewerber" },
  { href: "/campaigns",    icon: "campaign",       label: "Kampagnen" },
  { href: "/calls",        icon: "call",           label: "Calls" },
  { href: "/invoices",     icon: "receipt_long",   label: "Abrechnung" },
];

const bottomItems = [
  { href: "/users",        icon: "manage_accounts", label: "User" },
  { href: "/settings",     icon: "settings",        label: "Einstellungen" },
];

function getInitials(email: string | null | undefined) {
  if (!email) return "OP";
  return email.slice(0, 2).toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-outline-variant/20">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-base">psychology</span>
          </div>
          <span className="font-headline text-xl italic font-semibold text-on-surface">
            KI Recruit
          </span>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="mb-1">
          <span className="px-3 text-[10px] font-label font-bold uppercase tracking-widest text-outline mb-2 block">
            Hauptmenü
          </span>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all group ${
                  active
                    ? "bg-primary-container text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="font-label text-sm font-semibold">{item.label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"></span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Nav */}
      <div className="px-3 py-4 border-t border-outline-variant/20">
        {bottomItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all ${
                active
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="font-label text-sm font-semibold">{item.label}</span>
            </Link>
          );
        })}

        {/* User Avatar + Logout Menu */}
        <div className="relative mt-2" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-surface-container transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container flex-shrink-0">
              {getInitials(email)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-label text-xs font-bold text-on-surface truncate">Operator</div>
              <div className="font-label text-[10px] text-outline truncate">{email ?? "Lädt…"}</div>
            </div>
            <span className="material-symbols-outlined text-outline text-base flex-shrink-0">
              {menuOpen ? "expand_less" : "expand_more"}
            </span>
          </button>

          {/* Popup Menu */}
          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-outline-variant/10">
                <div className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-0.5">Eingeloggt als</div>
                <div className="font-body text-sm text-on-surface truncate">{email ?? "—"}</div>
              </div>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-base">settings</span>
                <span className="font-label text-sm">Einstellungen</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-error hover:bg-error-container/10 transition-colors"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span className="font-label text-sm font-semibold">Abmelden</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
