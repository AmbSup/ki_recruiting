"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { LangSwitcher } from "./lang-switcher";
import { t, type Lang } from "../_lib/t";
import { BRAND_COLOR } from "../_lib/brand";

// Sticky Top Nav. Logo (Home), zwei Dropdown-Gruppen (Lösungen, Ressourcen),
// Live-Funnels, LangSwitcher, Login, Demo-CTA. Mit 10+ Links passt
// eine flache Leiste nicht in max-w-6xl — daher gruppiert ab lg, darunter
// Burger-Menü mit allen Links. Aktive Seite (bzw. Gruppe mit aktiver Seite)
// bekommt einen Unterstrich in Markenfarbe.

type NavItem = { href: string; labelKey: string };
type NavGroup = { id: string; labelKey: string; items: NavItem[] };

export function MarketingNav({ lang }: { lang: Lang }) {
  const pathname = usePathname() ?? "/";
  const homeHref = lang === "de" ? "/" : "/en";
  const p = (path: string) => (lang === "de" ? path : `/en${path}`);

  const groups: NavGroup[] = [
    {
      id: "solutions",
      labelKey: "nav.group_solutions",
      items: [
        { href: p("/sales"), labelKey: "nav.sales" },
        { href: p("/recruiting"), labelKey: "nav.recruiting" },
        { href: p("/kmu"), labelKey: "nav.kmu" },
        { href: p("/wissen"), labelKey: "nav.wissen" },
        { href: p("/aria"), labelKey: "nav.aria" },
        // /video existiert nur auf Deutsch — kein /en-Präfix.
        { href: "/video", labelKey: "nav.video" },
      ],
    },
    {
      id: "resources",
      labelKey: "nav.group_resources",
      items: [
        { href: p("/blog"), labelKey: "nav.blog" },
        { href: p("/pilot-30-tage"), labelKey: "nav.pilot" },
        { href: p("/innovations-werkzeuge"), labelKey: "nav.tools" },
      ],
    },
  ];

  const topItems: NavItem[] = [
    { href: p("/netzwerk"), labelKey: "nav.network" },
    { href: "/showcase", labelKey: "nav.showcase" },
  ];

  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Bei Navigation alles schließen (State-Reset während Render statt Effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpenGroup(null);
    setMobileOpen(false);
  }

  // Klick außerhalb / Escape schließt Dropdowns + Mobile-Menü.
  useEffect(() => {
    function onPointer(e: PointerEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
        setMobileOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenGroup(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function isActive(href: string): boolean {
    if (href === homeHref) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const underline = (active: boolean) => ({ borderColor: active ? BRAND_COLOR : "transparent" });

  return (
    <nav ref={navRef} className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between gap-4">
        <Link href={homeHref} className="flex items-center gap-2 flex-shrink-0">
          <Image
            src="/branding/neuronic-logo.png"
            alt="Neuronic Automation"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="hidden font-headline text-lg font-semibold tracking-[-0.02em] text-[#101820] sm:inline">
            NEURONIC
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-6">
          {groups.map((group) => {
            const open = openGroup === group.id;
            const active = group.items.some((i) => isActive(i.href));
            return (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => setOpenGroup(group.id)}
                onMouseLeave={() => setOpenGroup((g) => (g === group.id ? null : g))}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  aria-haspopup="true"
                  onClick={() => setOpenGroup(open ? null : group.id)}
                  className={`inline-flex items-center gap-1 whitespace-nowrap text-sm px-1 pb-1 border-b-2 transition-colors ${
                    active ? "text-slate-900 font-medium" : "text-slate-600 hover:text-slate-900"
                  }`}
                  style={underline(active)}
                >
                  {t(lang, group.labelKey)}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {open && (
                  // pt-2 als unsichtbare Brücke, damit Hover beim Runterfahren nicht abreißt.
                  <div className="absolute left-0 top-full pt-2">
                    <ul className="min-w-[220px] rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg">
                      {group.items.map((item) => {
                        const itemActive = isActive(item.href);
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              aria-current={itemActive ? "page" : undefined}
                              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                                itemActive
                                  ? "bg-slate-50 font-medium text-slate-900"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                              }`}
                            >
                              {t(lang, item.labelKey)}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}

          {topItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap text-sm px-1 pb-1 border-b-2 transition-colors ${
                  active ? "text-slate-900 font-medium" : "text-slate-600 hover:text-slate-900"
                }`}
                style={underline(active)}
              >
                {t(lang, item.labelKey)}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3">
            <LangSwitcher current={lang} />
            <Link
              href="/login"
              className="text-sm text-slate-500 hover:text-slate-800 transition px-2 py-1"
            >
              {t(lang, "nav.login")}
            </Link>
          </div>

          <a
            href="https://cal.com/martin-amon-l2hybo/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center whitespace-nowrap rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t(lang, "nav.demo_cta")}
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="marketing-mobile-menu"
            aria-label={t(lang, mobileOpen ? "nav.menu_close" : "nav.menu_open")}
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet */}
      {mobileOpen && (
        <div
          id="marketing-mobile-menu"
          className="lg:hidden max-h-[calc(100dvh-65px)] overflow-y-auto border-t border-slate-100 bg-white"
        >
          <div className="mx-auto max-w-6xl px-6 py-4 space-y-5">
            {groups.map((group) => (
              <div key={group.id}>
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t(lang, group.labelKey)}
                </p>
                <ul>
                  {group.items.map((item) => (
                    <MobileLink key={item.href} item={item} lang={lang} active={isActive(item.href)} />
                  ))}
                </ul>
              </div>
            ))}

            <ul className="border-t border-slate-100 pt-4">
              {topItems.map((item) => (
                <MobileLink key={item.href} item={item} lang={lang} active={isActive(item.href)} />
              ))}
              <MobileLink item={{ href: "/login", labelKey: "nav.login" }} lang={lang} active={false} />
            </ul>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <LangSwitcher current={lang} />
              <a
                href="https://cal.com/martin-amon-l2hybo/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center whitespace-nowrap rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dim"
              >
                {t(lang, "nav.demo_cta")}
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function MobileLink({ item, lang, active }: { item: NavItem; lang: Lang; active: boolean }) {
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`block rounded-lg px-3 py-2.5 text-base transition-colors ${
          active ? "bg-slate-50 font-medium text-slate-900" : "text-slate-700 hover:bg-slate-50"
        }`}
        style={active ? { boxShadow: `inset 3px 0 0 ${BRAND_COLOR}` } : undefined}
      >
        {t(lang, item.labelKey)}
      </Link>
    </li>
  );
}
