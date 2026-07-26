import { dict, type Lang } from "../_lib/dict";
import { t } from "../_lib/t";

type FaqItem = { q: string; a: string };

// Generische FAQ-Section (Native <details>, SEO-freundlich). Gleiches Muster
// wie PricingFAQ, aber sectionKey-parametrisiert statt fix auf "pricing.faq"
// — für andere Pages mit eigenem FAQ-Block. Pair mit <FaqJsonLd sectionKey=.../>.
export function Faq({ lang, sectionKey }: { lang: Lang; sectionKey: string }) {
  const section = getNested(dict[lang], sectionKey);
  const items = (section?.items ?? []) as FaqItem[];

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h2 className="font-headline text-3xl sm:text-4xl italic text-slate-900 text-center mb-10">
        {t(lang, `${sectionKey}.heading`)}
      </h2>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <details
            key={idx}
            className="group rounded-xl border border-slate-200 bg-white p-5 open:shadow-sm transition-shadow"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
              <h3 className="font-body font-semibold text-base text-slate-900">{item.q}</h3>
              <span className="flex-shrink-0 text-slate-400 group-open:rotate-45 transition-transform text-xl leading-none">
                +
              </span>
            </summary>
            <p className="font-body text-sm text-slate-600 leading-relaxed mt-3">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function getNested(obj: unknown, path: string): { items?: FaqItem[] } | null {
  const parts = path.split(".");
  let cursor: unknown = obj;
  for (const p of parts) {
    if (cursor && typeof cursor === "object" && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else return null;
  }
  return cursor as { items?: FaqItem[] };
}
