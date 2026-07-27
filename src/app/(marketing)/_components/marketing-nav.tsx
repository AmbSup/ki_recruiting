"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LangSwitcher } from "./lang-switcher";
import { t, type Lang } from "../_lib/t";
import { BRAND_COLOR } from "../_lib/brand";

// Sticky Top Nav. Logo (Home), Content-Links, Preise/Showcase, LangSwitcher,
// Login, Demo-CTA. Aktive Seite bekommt einen Unterstrich in Markenfarbe
// statt nur Hover-Farbe — sonst verliert man bei 9+ Links die Orientierung,
// wo man gerade ist.

type NavItem = { href: string; labelKey: string; breakpoint: "sm" | "md" | "lg" };

const BREAKPOINT_CLASS: Record<NavItem["breakpoint"], string> = {
  sm: "hidden sm:inline-flex",
  md: "hidden md:inline-flex",
  lg: "hidden lg:inline-flex",
};

export function MarketingNav({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const homeHref = lang === "de" ? "/" : "/en";

  const contentItems: NavItem[] = [
    { href: lang === "de" ? "/sales" : "/en/sales", labelKey: "nav.sales", breakpoint: "sm" },
    { href: lang === "de" ? "/recruiting" : "/en/recruiting", labelKey: "nav.recruiting", breakpoint: "sm" },
    { href: lang === "de" ? "/kmu" : "/en/kmu", labelKey: "nav.kmu", breakpoint: "sm" },
    { href: lang === "de" ? "/wissen" : "/en/wissen", labelKey: "nav.wissen", breakpoint: "sm" },
    { href: lang === "de" ? "/aria" : "/en/aria", labelKey: "nav.aria", breakpoint: "sm" },
    { href: lang === "de" ? "/blog" : "/en/blog", labelKey: "nav.blog", breakpoint: "sm" },
    { href: lang === "de" ? "/pilot-30-tage" : "/en/pilot-30-tage", labelKey: "nav.pilot", breakpoint: "md" },
    { href: lang === "de" ? "/innovations-werkzeuge" : "/en/innovations-werkzeuge", labelKey: "nav.tools", breakpoint: "lg" },
  ];

  const commerceItems: NavItem[] = [
    { href: lang === "de" ? "/pricing" : "/en/pricing", labelKey: "nav.pricing", breakpoint: "sm" },
    { href: "/showcase", labelKey: "nav.showcase", breakpoint: "md" },
  ];

  function isActive(href: string): boolean {
    if (href === homeHref) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function NavLink({ href, labelKey, breakpoint }: NavItem) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`${BREAKPOINT_CLASS[breakpoint]} whitespace-nowrap text-sm px-1 pb-1 border-b-2 transition-colors ${
          active ? "text-slate-900 font-medium" : "border-transparent text-slate-600 hover:text-slate-900"
        }`}
        style={{ borderColor: active ? BRAND_COLOR : "transparent" }}
      >
        {t(lang, labelKey)}
      </Link>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between gap-6">
        <Link href={homeHref} className="flex items-center gap-2 flex-shrink-0">
          <Image
            src="/branding/neuronic-logo.png"
            alt="Neuronic Automation"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="font-headline text-lg italic text-slate-900 hidden sm:inline">
            NEURONIC
          </span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-5">
          {contentItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}

          <span className="hidden sm:block h-4 w-px bg-slate-200" aria-hidden />

          {commerceItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}

          <LangSwitcher current={lang} />

          <Link
            href="/login"
            className="text-sm text-slate-500 hover:text-slate-800 transition px-2 py-1"
          >
            {t(lang, "nav.login")}
          </Link>

          <a
            href="https://cal.com/martin-amon-l2hybo/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 transition whitespace-nowrap"
          >
            {t(lang, "nav.demo_cta")}
          </a>
        </div>
      </div>
    </nav>
  );
}
