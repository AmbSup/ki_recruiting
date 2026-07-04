import { tList, t, type Lang } from "../_lib/t";

// Nur für Recruiting-Page: DSGVO-Vertrauens-Strip mit 4 Compliance-Bullets.
export function ComplianceStrip({ lang }: { lang: Lang }) {
  const bullets = tList(lang, "recruiting.compliance.bullets");

  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="rounded-2xl bg-emerald-50/40 border border-emerald-100 p-8">
        <p className="font-label text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">
          {t(lang, "recruiting.compliance.eyebrow")}
        </p>
        <h2 className="font-headline text-2xl italic text-slate-900 mb-5">
          {t(lang, "recruiting.compliance.headline")}
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-0.5 text-emerald-600 flex-shrink-0">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
