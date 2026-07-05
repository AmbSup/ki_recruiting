import { dict, type Lang } from "../_lib/dict";
import { t } from "../_lib/t";

type FaqItem = { q: string; a: string };

// Preis-FAQ direkt unter der Tier-Table. Native <details> statt Client-JS,
// SEO-freundlich (Google zeigt FAQ-Rich-Snippets aus dem HTML).
export function PricingFAQ({ lang }: { lang: Lang }) {
  const section = ((dict[lang] as { pricing?: { faq?: { items?: FaqItem[] } } })?.pricing?.faq ?? {}) as {
    items?: FaqItem[];
  };
  const items = (section.items ?? []) as FaqItem[];

  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <h2 className="font-headline text-3xl sm:text-4xl italic text-slate-900 text-center mb-10">
        {t(lang, "pricing.faq.heading")}
      </h2>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <details
            key={idx}
            className="group rounded-xl border border-slate-200 bg-white p-5 open:shadow-sm transition-shadow"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
              <h3 className="font-body font-semibold text-base text-slate-900">
                {item.q}
              </h3>
              <span className="flex-shrink-0 text-slate-400 group-open:rotate-45 transition-transform text-xl leading-none">
                +
              </span>
            </summary>
            <p className="font-body text-sm text-slate-600 leading-relaxed mt-3">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
