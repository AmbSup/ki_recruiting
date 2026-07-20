import Link from "next/link";
import Image from "next/image";
import { t, type Lang } from "../_lib/t";

// Legal-Footer. Impressum + Datenschutz (Link auf existierendes
// neuronic-automation.ai/datenschutz), Kontakt, Copyright.
export function MarketingFooter({ lang }: { lang: Lang }) {
  const salesHref = lang === "de" ? "/sales" : "/en/sales";
  const recruitingHref = lang === "de" ? "/recruiting" : "/en/recruiting";
  const pricingHref = lang === "de" ? "/pricing" : "/en/pricing";
  const email = t(lang, "footer.contact.email");

  return (
    <footer className="border-t border-slate-100 bg-white/50 mt-24">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Image
                src="/branding/neuronic-logo.png"
                alt="Neuronic Automation"
                width={28}
                height={28}
                className="rounded"
              />
              <span className="font-headline italic text-slate-900">AI Funnel Expert</span>
            </div>
            <p className="font-body text-xs text-slate-500 leading-relaxed max-w-[24ch]">
              {t(lang, "footer.tagline")}
            </p>
          </div>

          <div>
            <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Product
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={salesHref} className="text-slate-600 hover:text-slate-900">
                  {t(lang, "footer.links.sales")}
                </Link>
              </li>
              <li>
                <Link href={recruitingHref} className="text-slate-600 hover:text-slate-900">
                  {t(lang, "footer.links.recruiting")}
                </Link>
              </li>
              {lang === "de" && (
                <li>
                  <Link href="/kmu" className="text-slate-600 hover:text-slate-900">
                    {t(lang, "footer.links.kmu")}
                  </Link>
                </li>
              )}
              {lang === "de" && (
                <li>
                  <Link href="/wissen" className="text-slate-600 hover:text-slate-900">
                    {t(lang, "footer.links.wissen")}
                  </Link>
                </li>
              )}
              {lang === "de" && (
                <li>
                  <Link href="/blog" className="text-slate-600 hover:text-slate-900">
                    {t(lang, "footer.links.blog")}
                  </Link>
                </li>
              )}
              <li>
                <Link href={pricingHref} className="text-slate-600 hover:text-slate-900">
                  {t(lang, "footer.links.pricing")}
                </Link>
              </li>
              <li>
                <Link href="/showcase" className="text-slate-600 hover:text-slate-900">
                  {t(lang, "footer.links.showcase")}
                </Link>
              </li>
              <li>
                <a
                  href="https://cal.com/martin-amon-l2hybo/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-slate-900"
                >
                  {t(lang, "footer.links.demo")}
                </a>
              </li>
              <li>
                <Link href="/login" className="text-slate-500 hover:text-slate-800">
                  {t(lang, "footer.links.login")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              {t(lang, "footer.legal.heading")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.neuronic-automation.ai/datenschutz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-slate-900"
                >
                  {t(lang, "footer.legal.privacy")}
                </a>
              </li>
              <li>
                <a
                  href="https://www.neuronic-automation.ai/impressum"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-slate-900"
                >
                  {t(lang, "footer.legal.imprint")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              {t(lang, "footer.contact.heading")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={`mailto:${email}`}
                  className="text-slate-600 hover:text-slate-900 break-all"
                >
                  {email}
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/neuronic-automation/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-slate-900"
                >
                  {t(lang, "footer.contact.linkedin")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} {t(lang, "footer.copyright")}</span>
        </div>
      </div>
    </footer>
  );
}
