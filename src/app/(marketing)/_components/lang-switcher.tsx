"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Lang } from "../_lib/t";

// Mapt DE ↔ EN URLs. Standard: "/" ↔ "/en", "/sales" ↔ "/en/sales" etc.
// Wenn wir eine EN-Route ohne DE-Pendant hätten (nicht der Fall aktuell),
// fällt der Switcher auf Home zurück.
export function LangSwitcher({ current }: { current: Lang }) {
  const pathname = usePathname() ?? "/";
  const target: Lang = current === "de" ? "en" : "de";
  const targetHref = mapPath(pathname, current, target);

  return (
    <Link
      href={targetHref}
      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 transition"
      aria-label={`Switch to ${target.toUpperCase()}`}
    >
      <span className={current === "de" ? "font-semibold text-slate-900" : "text-slate-500"}>DE</span>
      <span className="text-slate-300">/</span>
      <span className={current === "en" ? "font-semibold text-slate-900" : "text-slate-500"}>EN</span>
    </Link>
  );
}

// DE-only Routen ohne EN-Pendant → Switcher fällt auf EN-Home zurück.
const DE_ONLY = ["/video", "/ki-agenten", "/ki-schulung", "/ai-act"];

function mapPath(pathname: string, from: Lang, to: Lang): string {
  if (to === "en") {
    // /  → /en, /sales → /en/sales
    if (pathname === "/") return "/en";
    if (DE_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return "/en";
    return `/en${pathname}`;
  }
  // to === "de"
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  return "/";
}
