import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Brain,
  Briefcase,
  Check,
  Compass,
  Cpu,
  GraduationCap,
  Scale,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { dict, type Lang } from "../_lib/dict";
import { BRAND_COLOR } from "../_lib/brand";
import { LogoCloud } from "./logo-cloud";
import { Faq } from "./faq";
import { FaqJsonLd } from "./json-ld";
import { CTAFooter } from "./cta-footer";
import { AREA_STYLE, CAL_HREF, SectionHead, type OfferGroup } from "./expert-shared";

// Startseite als KI-Beratung (angelehnt an klassische KI-Beratungs-Sites):
// Hero mit Schwerpunkten → Logos → Leistungen → Leistungsspektrum → Warum →
// Team-Teaser (Link /netzwerk) → Ablauf → Zielgruppen → eigene Produkte → FAQ → CTA.
// Bewusst ohne Personen/Namen — die stehen auf /netzwerk (NetworkPage).
// Wird von "/", "/home" und "/en" geteilt; Copy liegt in dict.expert_home.

const ICONS: Record<string, LucideIcon> = {
  compass: Compass,
  scale: Scale,
  sparkles: Sparkles,
  bot: Bot,
  workflow: Workflow,
  brain: Brain,
  cpu: Cpu,
  graduation: GraduationCap,
  briefcase: Briefcase,
};

const PRODUCT_COLORS = ["#1A3A6E", "#0E6E5A", "#006B80", "#5B21B6", "#9A3412"];

type Card = { icon?: string; title: string; body: string; href?: string };
type Step = { title: string; body: string };

export function ExpertHome({ lang }: { lang: Lang }) {
  const c = dict[lang].expert_home;
  const hero = c.hero;
  const groups = c.stack.groups as OfferGroup[];
  const networkHref = lang === "de" ? "/netzwerk" : "/en/netzwerk";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-25 blur-3xl"
          style={{ background: `radial-gradient(circle, ${BRAND_COLOR}, transparent 70%)` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-1/2 h-[380px] w-[380px] rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #5B21B6, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
            <div className="text-center lg:text-left">
              <p
                className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-label text-xs font-bold uppercase tracking-[0.16em] text-white"
                style={{ backgroundColor: "#006B80" }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#5FD4EA]" aria-hidden />
                {hero.eyebrow}
              </p>
              <h1 className="mb-6 font-headline text-[clamp(2.5rem,5.2vw,4.5rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-[#101820] text-balance">
                {hero.headline}{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(90deg, ${BRAND_COLOR}, #5B21B6)` }}
                >
                  {hero.headline_accent}
                </span>
              </h1>
              <p className="mx-auto mb-8 max-w-xl font-body text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
                {hero.sub}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <a
                  href={CAL_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(0,149,179,0.8)] transition hover:-translate-y-0.5 hover:bg-primary-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {hero.primary_cta}
                </a>
                <a
                  href="#leistungen"
                  className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
                >
                  {hero.secondary_cta}
                </a>
              </div>
              <ul className="mx-auto mt-8 max-w-xl space-y-2.5 text-left lg:mx-0">
                {(hero.trust as string[]).map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span
                      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: "#0E6E5A" }}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Schwerpunkte statt Kennzahlen — verlinkt auf die Blöcke im Leistungsspektrum */}
            <div
              className="relative overflow-hidden rounded-3xl p-7 text-white shadow-[0_30px_70px_-30px_rgba(10,26,31,0.75)] sm:p-9"
              style={{ background: "linear-gradient(145deg, #0A1A1F 0%, #0B3440 60%, #1E1B4B 100%)" }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-30 blur-2xl"
                style={{ backgroundColor: BRAND_COLOR }}
              />
              <p className="relative font-label text-xs font-bold uppercase tracking-[0.16em] text-white/60">{hero.card_title}</p>
              <ul className="relative mt-5 space-y-2.5">
                {groups.map((group) => {
                  const { color, icon: Icon } = AREA_STYLE[group.area];
                  return (
                    <li key={group.area}>
                      <a
                        href={`#area-${group.area}`}
                        className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
                      >
                        <span
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white"
                          style={{ backgroundColor: color }}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="flex-1 text-sm font-medium text-white">{group.title}</span>
                        <ArrowRight className="h-4 w-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white" aria-hidden />
                      </a>
                    </li>
                  );
                })}
              </ul>
              <p className="relative mt-6 border-t border-white/10 pt-5 text-sm text-white/75">{hero.card_note}</p>
            </div>
          </div>
        </div>
      </section>

      <LogoCloud lang={lang} sectionKey="shared.clients" />

      {/* Leistungen */}
      <section id="leistungen" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
        <SectionHead eyebrow={c.expertise.eyebrow} headline={c.expertise.headline} sub={c.expertise.sub} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(c.expertise.items as Card[]).map((item) => {
            const Icon = ICONS[item.icon ?? ""] ?? Sparkles;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.3)]"
              >
                <span
                  className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${BRAND_COLOR}, #006B80)` }}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mb-2 font-headline text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="font-body text-sm leading-relaxed text-slate-600">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Leistungsspektrum: Blöcke je Themenbereich, Link zu den passenden Expert:innen auf /netzwerk */}
      <section className="bg-slate-100/70 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead eyebrow={c.stack.eyebrow} headline={c.stack.headline} sub={c.stack.sub} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {groups.map((group) => {
              const { color, icon: Icon } = AREA_STYLE[group.area];
              return (
                <div
                  key={group.area}
                  id={`area-${group.area}`}
                  className="flex scroll-mt-28 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_32px_-20px_rgba(15,23,42,0.35)] ring-1 ring-slate-200"
                >
                  <div className="flex items-center gap-3 px-6 py-4 text-white" style={{ backgroundColor: color }}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h3 className="flex-1 font-headline text-lg font-semibold text-white">{group.title}</h3>
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">{group.items.length}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="font-body text-sm leading-relaxed text-slate-600">{group.body}</p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <li
                          key={item}
                          className="rounded-full px-3 py-1 text-xs font-medium text-white"
                          style={{ backgroundColor: color }}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-6">
                      <Link
                        href={`${networkHref}#area-${group.area}`}
                        className="inline-flex items-center gap-1.5 border-t border-slate-100 pt-4 text-sm font-semibold transition hover:gap-2.5"
                        style={{ color }}
                      >
                        {c.stack.network_link}
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Warum */}
      <section className="py-20" style={{ background: "linear-gradient(160deg, #0A1A1F 0%, #0B3440 100%)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead eyebrow={c.why.eyebrow} headline={c.why.headline} dark />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {(c.why.items as Card[]).map((item, i) => (
              <div key={item.title} className="flex gap-5 rounded-2xl border border-white/10 bg-white/5 p-6">
                <span className="font-headline text-4xl font-semibold leading-none text-[#5FD4EA]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="mb-2 font-headline text-xl font-semibold text-white">{item.title}</h3>
                  <p className="font-body leading-relaxed text-white/70">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team-Teaser → /netzwerk */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-10 overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-3 font-label text-[13px] font-bold uppercase tracking-[0.18em]" style={{ color: BRAND_COLOR }}>
              {c.team.eyebrow}
            </p>
            <h2 className="font-headline text-3xl font-semibold leading-tight tracking-[-0.02em] text-slate-900 text-balance sm:text-[2.4rem]">
              {c.team.headline}
            </h2>
            <p className="mt-4 font-body text-lg leading-relaxed text-slate-600">{c.team.sub}</p>
            <Link
              href={networkHref}
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#0A1A1F] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#0B3440]"
            >
              {c.team.cta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-3 lg:justify-end" aria-hidden>
            {groups.map((group) => {
              const { color, icon: Icon } = AREA_STYLE[group.area];
              return (
                <span
                  key={group.area}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-md sm:h-20 sm:w-20"
                  style={{ backgroundColor: color }}
                >
                  <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                </span>
              );
            })}
          </div>
        </div>
      </section>

      <LogoCloud lang={lang} sectionKey="shared.competence" />

      {/* Ablauf */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHead eyebrow={c.process.eyebrow} headline={c.process.headline} />
        <ol className="relative grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          <span
            aria-hidden
            className="pointer-events-none absolute left-[10%] right-[10%] top-0 hidden h-0.5 lg:block"
            style={{ background: `linear-gradient(90deg, ${BRAND_COLOR}, #5B21B6)` }}
          />
          {(c.process.steps as Step[]).map((step, i) => (
            <li key={step.title} className="relative rounded-2xl border border-slate-200 bg-white p-6 pt-9">
              <span
                className="absolute -top-5 left-6 flex h-10 w-10 items-center justify-center rounded-full font-headline text-base font-semibold text-white shadow-md ring-4 ring-white"
                style={{ background: `linear-gradient(135deg, ${BRAND_COLOR}, #006B80)` }}
              >
                {i + 1}
              </span>
              <h3 className="mb-2 font-headline text-lg font-semibold text-slate-900">{step.title}</h3>
              <p className="font-body text-sm leading-relaxed text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Zielgruppen */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow={c.audience.eyebrow} headline={c.audience.headline} />
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(c.audience.items as string[]).map((item) => (
            <li key={item} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-slate-700">
              <span
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-white"
                style={{ backgroundColor: "#0E6E5A" }}
              >
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Eigene Produkte */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHead eyebrow={c.products.eyebrow} headline={c.products.headline} sub={c.products.sub} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {(c.products.items as Card[]).map((item, i) => {
            const color = PRODUCT_COLORS[i % PRODUCT_COLORS.length];
            return (
              <Link
                key={item.title}
                href={item.href ?? "/"}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.3)]"
              >
                <span className="h-1.5" style={{ backgroundColor: color }} aria-hidden />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="mb-2 font-headline text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mb-5 flex-1 font-body text-sm leading-relaxed text-slate-600">{item.body}</p>
                  <span
                    className="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {c.products.cta}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <Faq lang={lang} sectionKey="expert_home.faq" />
      <FaqJsonLd lang={lang} sectionKey="expert_home.faq" />
      <CTAFooter lang={lang} sectionKey="expert_home.final_cta" href={CAL_HREF} />
    </>
  );
}
