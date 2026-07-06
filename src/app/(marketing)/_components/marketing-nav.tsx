import Link from "next/link";
import Image from "next/image";
import { LangSwitcher } from "./lang-switcher";
import { t, type Lang } from "../_lib/t";

// Sticky Top Nav. Logo (Home), 2 Vertikal-Links, LangSwitcher, Login.
// Bewusst schmal + weiß — konkurriert nicht mit dem Hero visuell.

export function MarketingNav({ lang }: { lang: Lang }) {
  const salesHref = lang === "de" ? "/sales" : "/en/sales";
  const recruitingHref = lang === "de" ? "/recruiting" : "/en/recruiting";
  const handwerkHref = "/handwerk"; // DE-only, EN-Version ist Backlog
  const pricingHref = lang === "de" ? "/pricing" : "/en/pricing";
  const homeHref = lang === "de" ? "/" : "/en";

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
            AI Funnel Expert
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-4">
          <Link
            href={salesHref}
            className="hidden sm:inline-flex text-sm text-slate-600 hover:text-slate-900 transition px-2 py-1"
          >
            {t(lang, "nav.sales")}
          </Link>
          <Link
            href={recruitingHref}
            className="hidden sm:inline-flex text-sm text-slate-600 hover:text-slate-900 transition px-2 py-1"
          >
            {t(lang, "nav.recruiting")}
          </Link>
          {lang === "de" && (
            <Link
              href={handwerkHref}
              className="hidden sm:inline-flex text-sm text-slate-600 hover:text-slate-900 transition px-2 py-1"
            >
              {t(lang, "nav.handwerk")}
            </Link>
          )}
          <Link
            href={pricingHref}
            className="hidden sm:inline-flex text-sm text-slate-600 hover:text-slate-900 transition px-2 py-1"
          >
            {t(lang, "nav.pricing")}
          </Link>
          <Link
            href="/showcase"
            className="hidden md:inline-flex text-sm text-slate-600 hover:text-slate-900 transition px-2 py-1"
          >
            {t(lang, "nav.showcase")}
          </Link>

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
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 transition"
          >
            {t(lang, "nav.demo_cta")}
          </a>
        </div>
      </div>
    </nav>
  );
}
