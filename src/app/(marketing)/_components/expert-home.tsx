import Link from "next/link";
import {
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
import { EXPERTS, expertSlug, type Area } from "../_lib/experts";
import { LogoCloud } from "./logo-cloud";
import { Faq } from "./faq";
import { FaqJsonLd } from "./json-ld";
import { CTAFooter } from "./cta-footer";

// Startseite als KI-Expert:innen-Netzwerk (Aufbau angelehnt an klassische
// KI-Beratungs-Sites: Hero mit Kennzahlen → Logos → Leistungen → Angebot im
// Detail (mit verlinkten Berater:innen) → Warum → Netzwerk → Ablauf → Zielgruppen → eigene Produkte → FAQ → CTA).
// Wird von "/", "/home" und "/en" geteilt; Copy liegt in dict.expert_home.

const CAL_HREF = "https://cal.com/martin-amon-l2hybo/30min";

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

// Tags in experts.ts sind meist Eigennamen; nur die deutschen Begriffe übersetzen.
const TAG_EN: Record<string, string> = {
  Strategie: "Strategy",
  Ethik: "Ethics",
  Architektur: "Architecture",
  "Open-Source-LLMs": "Open-source LLMs",
};

// "Dr.-Ing. Derek M." → "DM": Titel (enthalten einen Punkt, kein Initial) überspringen.
function initials(name: string): string {
  return name
    .split(" ")
    .filter((part) => !/\.\S/.test(part) && !/^(Dr|Prof)\.?$/.test(part))
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Stat = { value: string; label: string };
type OfferGroup = { area: Area; title: string; body: string; items: string[] };
type Card = { icon?: string; title: string; body: string; href?: string };
type Step = { title: string; body: string };

function SectionHead({ eyebrow, headline, sub }: { eyebrow: string; headline: string; sub?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-3 font-label text-[15.6px] font-bold uppercase tracking-widest" style={{ color: BRAND_COLOR }}>
        {eyebrow}
      </p>
      <h2 className="font-headline text-3xl leading-tight text-slate-900 sm:text-4xl text-balance">{headline}</h2>
      {sub && <p className="mt-4 font-body leading-relaxed text-slate-600">{sub}</p>}
    </div>
  );
}

export function ExpertHome({ lang }: { lang: Lang }) {
  const c = dict[lang].expert_home;
  const hero = c.hero;

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="mb-4 font-label text-sm font-bold uppercase tracking-widest" style={{ color: BRAND_COLOR }}>
              {hero.eyebrow}
            </p>
            <h1 className="mb-6 font-headline text-[clamp(2.75rem,6vw,5rem)] font-semibold leading-[1.02] tracking-[-0.025em] text-[#101820] text-balance">
              {hero.headline}
              <br />
              <span style={{ color: BRAND_COLOR }}>{hero.headline_accent}</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl font-body text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
              {hero.sub}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <a
                href={CAL_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {hero.primary_cta}
              </a>
              <a
                href="#expertise"
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-slate-500 hover:text-slate-950"
              >
                {hero.secondary_cta}
              </a>
            </div>
            <ul className="mx-auto mt-8 max-w-xl space-y-2 text-left lg:mx-0">
              {(hero.trust as string[]).map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: BRAND_COLOR }} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-[#0A1A1F] p-7 text-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.6)] sm:p-9">
            <p className="font-label text-xs font-bold uppercase tracking-widest text-white/60">{hero.card_title}</p>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8">
              {(hero.stats as Stat[]).map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span className="block font-headline text-5xl font-semibold tracking-tight" style={{ color: "#5FD4EA" }}>
                      {s.value}
                    </span>
                    <span className="mt-1 block text-sm text-white/70">{s.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 border-t border-white/10 pt-5 text-sm text-white/70">{hero.card_note}</p>
          </div>
        </div>
      </section>

      <LogoCloud lang={lang} sectionKey="shared.clients" />

      {/* Leistungen */}
      <section id="expertise" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
        <SectionHead eyebrow={c.expertise.eyebrow} headline={c.expertise.headline} sub={c.expertise.sub} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(c.expertise.items as Card[]).map((item) => {
            const Icon = ICONS[item.icon ?? ""] ?? Sparkles;
            return (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <span
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${BRAND_COLOR}14`, color: BRAND_COLOR }}
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

      {/* Angebot im Detail: alle Angebote aus der Berater-Liste, je Block die passenden Berater:innen verlinkt */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow={c.stack.eyebrow} headline={c.stack.headline} sub={c.stack.sub} />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {(c.stack.groups as OfferGroup[]).map((group) => {
            const experts = EXPERTS.filter((e) => e.areas.includes(group.area));
            return (
              <div key={group.area} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-headline text-xl font-semibold text-slate-900">{group.title}</h3>
                <p className="mt-1 font-body text-sm leading-relaxed text-slate-600">{group.body}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <li key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
                {experts.length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="mb-2 font-label text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      {c.stack.experts_label} ({experts.length})
                    </p>
                    <p className="text-sm leading-relaxed">
                      {experts.map((e, i) => (
                        <span key={e.name}>
                          <a
                            href={`#expert-${expertSlug(e.name)}`}
                            className="text-slate-700 underline decoration-slate-300 underline-offset-2 hover:text-slate-950"
                                          >
                            {e.name}
                          </a>
                          {i < experts.length - 1 && <span className="text-slate-300"> · </span>}
                        </span>
                      ))}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Warum */}
      <section className="bg-white/70 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead eyebrow={c.why.eyebrow} headline={c.why.headline} />
          <div className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2">
            {(c.why.items as Card[]).map((item, i) => (
              <div key={item.title} className="flex gap-5">
                <span className="font-headline text-3xl font-semibold" style={{ color: BRAND_COLOR }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="mb-2 font-headline text-xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="font-body leading-relaxed text-slate-600">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Netzwerk (Vorname + Initial, keine Kontaktdaten — siehe _lib/experts.ts) */}
      <section id="netzwerk" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
        <SectionHead eyebrow={c.network.eyebrow} headline={c.network.headline} sub={c.network.sub} />
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERTS.map((expert) => (
            <li
              key={expert.name}
              id={`expert-${expertSlug(expert.name)}`}
              className="flex scroll-mt-28 gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-shadow target:border-primary target:ring-2 target:ring-primary/40"
            >
              <span
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full font-headline text-sm font-semibold"
                style={{ backgroundColor: `${BRAND_COLOR}14`, color: BRAND_COLOR }}
                aria-hidden
              >
                {initials(expert.name)}
              </span>
              <div className="min-w-0">
                <p className="font-headline font-semibold text-slate-900">
                  {expert.name}
                  <span className="ml-2 text-xs font-normal text-slate-400">{c.network.country[expert.country]}</span>
                </p>
                <p className="mt-1 text-sm leading-snug text-slate-600">{expert.focus[lang]}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {expert.tags.map((tag) => (
                    <li key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                      {lang === "en" ? (TAG_EN[tag] ?? tag) : tag}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-sm text-slate-600">
          {c.network.join}{" "}
          <a href="mailto:office@neuronic-automation.ai" className="font-medium underline-offset-2 hover:underline" style={{ color: BRAND_COLOR }}>
            {c.network.join_cta}
          </a>
        </p>
      </section>

      <LogoCloud lang={lang} sectionKey="shared.competence" />

      {/* Ablauf */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow={c.process.eyebrow} headline={c.process.headline} />
        <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {(c.process.steps as Step[]).map((step, i) => (
            <li key={step.title} className="relative rounded-2xl border border-slate-200 bg-white p-6 pt-8">
              <span
                className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full font-headline text-base font-semibold text-white"
                style={{ backgroundColor: BRAND_COLOR }}
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
              <Check className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: BRAND_COLOR }} aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Eigene Produkte */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow={c.products.eyebrow} headline={c.products.headline} sub={c.products.sub} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {(c.products.items as Card[]).map((item) => (
            <Link
              key={item.title}
              href={item.href ?? "/"}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-slate-300 hover:shadow-[0_12px_32px_-8px_rgba(15,23,42,0.15)]"
            >
              <h3 className="mb-2 font-headline text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mb-4 flex-1 font-body text-sm leading-relaxed text-slate-600">{item.body}</p>
              <span className="text-sm font-medium" style={{ color: BRAND_COLOR }}>
                {c.products.cta}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Faq lang={lang} sectionKey="expert_home.faq" />
      <FaqJsonLd lang={lang} sectionKey="expert_home.faq" />
      <CTAFooter lang={lang} sectionKey="expert_home.final_cta" href={CAL_HREF} />
    </>
  );
}
