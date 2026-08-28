"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NavItem = { href: string; icon: string; label: string };

const primaryItems: NavItem[] = [
  { href: "/dashboard", icon: "space_dashboard", label: "Überblick" },
  { href: "/applicants", icon: "people", label: "Bewerber" },
  { href: "/funnels", icon: "filter_alt", label: "Funnels" },
  { href: "/sales-dashboard", icon: "trending_up", label: "Sales" },
  { href: "/analytics", icon: "monitoring", label: "Analytics" },
];

const secondaryGroups: Array<{ label: string; items: NavItem[] }> = [
  { label: "Recruiting", items: [
    { href: "/companies", icon: "domain", label: "Firmen" },
    { href: "/jobs", icon: "work", label: "Jobs" },
    { href: "/calls", icon: "call", label: "Anrufe" },
  ] },
  { label: "Marketing & Sales", items: [
    { href: "/ads-setup", icon: "ads_click", label: "Werbeanzeigen" },
    { href: "/campaigns", icon: "campaign", label: "Kampagnen" },
    { href: "/sales/bulk-calls", icon: "phone_in_talk", label: "Massenanrufe" },
    { href: "/sales/calendar", icon: "event", label: "Kalender" },
  ] },
  { label: "Verwaltung", items: [
    { href: "/showcase-feedback", icon: "graphic_eq", label: "Feedback" },
    { href: "/invoices", icon: "receipt_long", label: "Abrechnung" },
    { href: "/users", icon: "manage_accounts", label: "Benutzer" },
    { href: "/settings", icon: "settings", label: "Einstellungen" },
  ] },
];

function NavLink({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  return (
    <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 font-label text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"}`}>
      <span className="material-symbols-outlined text-xl" aria-hidden="true" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountOpen(false);
        setMobileOpen(false);
      }
    }
    function closeOnOutsideClick(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const allSecondaryItems = secondaryGroups.flatMap((group) => group.items);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-outline-variant/20 bg-surface-container-lowest lg:flex">
        <BrandLink />
        <nav aria-label="Hauptnavigation" className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">{primaryItems.map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} />)}</div>
          <details className="group mt-4" open={allSecondaryItems.some((item) => isActive(item.href))}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-3 font-label text-sm font-semibold text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              Mehr Bereiche
              <span className="material-symbols-outlined text-lg transition-transform group-open:rotate-180" aria-hidden="true">expand_more</span>
            </summary>
            <div className="mt-2 space-y-4 border-l border-outline-variant/20 pl-2">
              {secondaryGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1 px-3 font-label text-xs font-bold text-outline">{group.label}</p>
                  <div className="space-y-1">{group.items.map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} />)}</div>
                </div>
              ))}
            </div>
          </details>
        </nav>
        <div ref={accountRef} className="relative border-t border-outline-variant/20 p-3">
          <button type="button" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-controls="account-menu" className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container font-label text-xs font-bold text-on-primary-container">{email ? email.slice(0, 2).toUpperCase() : "OP"}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-label text-xs font-bold text-on-surface">Operator</span>
              <span className="block truncate font-label text-xs text-outline">{email ?? "Wird geladen …"}</span>
            </span>
            <span className="material-symbols-outlined text-lg text-outline" aria-hidden="true">{accountOpen ? "expand_less" : "expand_more"}</span>
          </button>
          {accountOpen && (
            <div id="account-menu" className="absolute bottom-full left-3 right-3 mb-2 overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0_16px_40px_-12px_rgba(45,52,51,0.28)]">
              <Link href="/settings" onClick={() => setAccountOpen(false)} className="flex min-h-11 items-center gap-3 px-4 font-label text-sm text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"><span className="material-symbols-outlined text-lg" aria-hidden="true">settings</span>Einstellungen</Link>
              <button type="button" onClick={handleLogout} className="flex min-h-11 w-full items-center gap-3 px-4 font-label text-sm font-semibold text-error hover:bg-error-container/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-error"><span className="material-symbols-outlined text-lg" aria-hidden="true">logout</span>Abmelden</button>
              <DeployStamp />
            </div>
          )}
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest px-4 lg:hidden">
        <BrandLink compact />
        <button type="button" onClick={() => setMobileOpen(true)} aria-expanded={mobileOpen} aria-controls="mobile-navigation" className="flex h-11 w-11 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="material-symbols-outlined" aria-hidden="true">menu</span><span className="sr-only">Alle Bereiche öffnen</span></button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" className="absolute inset-0 bg-inverse-surface/45" onClick={() => setMobileOpen(false)} aria-label="Navigation schließen" />
          <aside id="mobile-navigation" className="absolute inset-y-0 right-0 w-[min(88vw,22rem)] overflow-y-auto bg-surface-container-lowest p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><strong className="font-body text-base">Alle Bereiche</strong><button type="button" onClick={() => setMobileOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="material-symbols-outlined" aria-hidden="true">close</span><span className="sr-only">Schließen</span></button></div>
            <nav aria-label="Alle Bereiche" className="space-y-5">
              {secondaryGroups.map((group) => <div key={group.label}><p className="mb-1 px-3 font-label text-xs font-bold text-outline">{group.label}</p><div className="space-y-1">{group.items.map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} onNavigate={() => setMobileOpen(false)} />)}</div></div>)}
            </nav>
          </aside>
        </div>
      )}

      <nav aria-label="Mobile Hauptnavigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-outline-variant/20 bg-surface-container-lowest px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 lg:hidden">
        {primaryItems.slice(0, 4).map((item) => {
          const active = isActive(item.href);
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg font-label text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? "text-primary" : "text-on-surface-variant"}`}><span className="material-symbols-outlined text-xl" aria-hidden="true" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>{item.label}</Link>;
        })}
        <button type="button" onClick={() => setMobileOpen(true)} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg font-label text-[11px] font-semibold text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="material-symbols-outlined text-xl" aria-hidden="true">apps</span>Mehr</button>
      </nav>
    </>
  );
}

function BrandLink({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className={`flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${compact ? "" : "min-h-20 border-b border-outline-variant/20 px-5"}`}>
      <Image src="/branding/neuronic-logo.png" width={36} height={36} alt="" className={`${compact ? "h-8 w-8" : "h-9 w-9"} rounded-lg object-contain`} />
      <span className="min-w-0"><strong className="block truncate font-body text-sm font-bold text-on-surface">Neuronic</strong>{!compact && <span className="block truncate font-label text-xs text-outline">AI Funnel Expert</span>}</span>
    </Link>
  );
}

function DeployStamp() {
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME;
  const sha = process.env.NEXT_PUBLIC_COMMIT_SHA;
  if (!buildTime) return null;
  const date = new Date(buildTime);
  const formatted = Number.isNaN(date.getTime()) ? buildTime : date.toLocaleString("de-AT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const shortSha = sha && sha !== "local" ? sha.slice(0, 7) : null;
  return <div className="border-t border-outline-variant/10 bg-surface-container-low/50 px-4 py-2.5"><span className="block font-label text-[10px] text-outline">Bereitgestellt</span><span className="font-label text-xs text-on-surface-variant">{formatted}{shortSha && ` · ${shortSha}`}</span></div>;
}
