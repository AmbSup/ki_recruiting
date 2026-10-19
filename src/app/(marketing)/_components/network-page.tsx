import { ArrowRight } from "lucide-react";
import { dict, type Lang } from "../_lib/dict";
import { BRAND_COLOR } from "../_lib/brand";
import { EXPERTS, expertSlug } from "../_lib/experts";
import { AREA_STYLE, CAL_HREF, SectionHead, TAG_EN, initials, type OfferGroup } from "./expert-shared";

// /netzwerk: die Personen hinter der Beratung. Oben je Themenbereich die
// Expert:innen (Anker #area-<area>, verlinkt von der Startseite), darunter alle
// Profilkarten (Anker #expert-<slug>). Nur Vorname + Initial — siehe _lib/experts.ts.
export function NetworkPage({ lang }: { lang: Lang }) {
  const c = dict[lang].network_page;
  const groups = dict[lang].expert_home.stack.groups as OfferGroup[];

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${BRAND_COLOR}, transparent 70%)` }}
        />
        <div className="relative mx-auto max-w-6xl px-6 pb-10 pt-16 sm:pt-20">
          <SectionHead as="h1" eyebrow={c.eyebrow} headline={c.headline} sub={c.sub} />
        </div>
      </section>

      {/* Nach Thema */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="mb-6 font-label text-[13px] font-bold uppercase tracking-[0.18em] text-slate-500">{c.by_area}</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {groups.map((group) => {
            const { color, icon: Icon } = AREA_STYLE[group.area];
            const experts = EXPERTS.filter((e) => e.areas.includes(group.area));
            return (
              <div
                key={group.area}
                id={`area-${group.area}`}
                className="scroll-mt-28 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 target:ring-4 target:ring-primary/30"
              >
                <div className="flex items-center gap-3 px-5 py-3.5 text-white" style={{ backgroundColor: color }}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <h3 className="flex-1 font-headline text-base font-semibold text-white">{group.title}</h3>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">{experts.length}</span>
                </div>
                <ul className="flex flex-wrap gap-1.5 p-5">
                  {experts.map((e) => (
                    <li key={e.name}>
                      <a
                        href={`#expert-${expertSlug(e.name)}`}
                        className="inline-flex items-center gap-1.5 rounded-full border bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                        style={{ borderColor: `${color}55` }}
                      >
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white"
                          style={{ backgroundColor: color }}
                          aria-hidden
                        >
                          {initials(e.name)}
                        </span>
                        {e.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Alle Profile */}
      <section className="bg-slate-100/70 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-6 font-label text-[13px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {c.all} · {EXPERTS.length}
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EXPERTS.map((expert) => {
              const color = AREA_STYLE[expert.areas[0]].color;
              return (
                <li
                  key={expert.name}
                  id={`expert-${expertSlug(expert.name)}`}
                  className="flex scroll-mt-28 gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-18px_rgba(15,23,42,0.35)] target:border-primary target:ring-4 target:ring-primary/30"
                >
                  <span
                    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full font-headline text-sm font-semibold text-white shadow-sm"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  >
                    {initials(expert.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-headline font-semibold text-slate-900">{expert.name}</p>
                    <p className="text-xs text-slate-500">{c.country[expert.country]}</p>
                    <p className="mt-2 text-sm leading-snug text-slate-700">{expert.focus[lang]}</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {expert.tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: color }}
                        >
                          {lang === "en" ? (TAG_EN[tag] ?? tag) : tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Abschluss: Projekt + Mitmachen */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <a
          href={CAL_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-primary-dim"
        >
          {c.cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </a>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-5 sm:flex-row">
          <p className="text-sm text-slate-700">{c.join}</p>
          <a
            href="mailto:office@neuronic-automation.ai"
            className="inline-flex items-center rounded-full bg-primary-dim px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#00586a]"
          >
            {c.join_cta}
          </a>
        </div>
      </section>
    </>
  );
}
