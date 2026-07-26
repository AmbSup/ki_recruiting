import type { Metadata } from "next";
import { t, tList } from "../../_lib/t";
import { MarketingNav } from "../../_components/marketing-nav";
import { Hero } from "../../_components/hero";
import { ColorBlock } from "../../_components/color-block";
import { Checklist } from "../../_components/checklist";
import { BenefitGrid } from "../../_components/benefit-grid";
import { ProcessTimeline } from "../../_components/process-timeline";
import { UseCaseList } from "../../_components/use-case-list";
import { Faq } from "../../_components/faq";
import { FaqJsonLd } from "../../_components/json-ld";
import { CTAFooter } from "../../_components/cta-footer";
import { MarketingFooter } from "../../_components/marketing-footer";
import { PageViewBeacon } from "../../_components/page-view-beacon";
import { BRAND_COLOR } from "../../_lib/brand";

const ACCENT = "#4338CA";

export const metadata: Metadata = {
  title: "AI Pilot in 30 Days: From Use Case to Business Case",
  description:
    "From AI idea to working pilot in 30 days: process analysis, prototype, real-world test, and business case — for companies ready to implement a concrete AI use case.",
  alternates: {
    canonical: "https://app.neuronic-automation.ai/en/pilot-30-tage",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.neuronic-automation.ai/en/pilot-30-tage",
    title: "AI Pilot in 30 Days: From Use Case to Business Case",
    description:
      "From AI idea to working pilot in 30 days: process analysis, prototype, real-world test, and business case — for companies ready to implement a concrete AI use case.",
  },
  twitter: {
    card: "summary",
    title: "AI Pilot in 30 Days: From Use Case to Business Case",
    description:
      "From AI idea to working pilot in 30 days: process analysis, prototype, real-world test, and business case — for companies ready to implement a concrete AI use case.",
  },
};

export default function PilotPageEn() {
  const lang = "en" as const;
  const teams = tList(lang, "pilot.audience.teams");
  const midCtaItems = tList(lang, "pilot.mid_cta.items");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <PageViewBeacon slug="en/pilot-30-tage" />
      <MarketingNav lang={lang} />
      <main>
        <Hero
          lang={lang}
          eyebrowKey="pilot.eyebrow"
          headlineKey="pilot.headline"
          headlineAccentKey="pilot.headline_accent"
          subKey="pilot.sub"
          primaryCtaKey="pilot.primary_cta"
          primaryHref="https://cal.com/martin-amon-l2hybo/30min"
          accentColor={ACCENT}
        />

        <section className="mx-auto max-w-5xl px-6 pb-16">
          <ColorBlock variant="primary" text={t(lang, "pilot.claim")} />
        </section>

        <Checklist lang={lang} sectionKey="pilot.why" accentColor={ACCENT} columns={2} />
        <BenefitGrid lang={lang} sectionKey="pilot.deliverables" accentColor={ACCENT} />
        <ProcessTimeline lang={lang} sectionKey="pilot.timeline" accentColor={ACCENT} />
        <UseCaseList lang={lang} sectionKey="pilot.use_cases" accentColor={ACCENT} />

        <Checklist lang={lang} sectionKey="pilot.audience" accentColor={ACCENT} columns={1} />
        <section className="mx-auto max-w-4xl px-6 pb-16 -mt-10 text-center">
          <p className="font-body text-sm text-slate-500 mb-4">
            {t(lang, "pilot.audience.teams_intro")}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {teams.map((team, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium bg-white text-slate-600 border border-slate-200"
              >
                {team}
              </span>
            ))}
          </div>
        </section>

        <BenefitGrid lang={lang} sectionKey="pilot.not_this" accentColor={ACCENT} />

        <section className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p
            className="font-label text-[15.6px] font-bold uppercase tracking-widest mb-3"
            style={{ color: BRAND_COLOR }}
          >
            {t(lang, "pilot.tech.eyebrow")}
          </p>
          <h2 className="font-headline text-3xl sm:text-4xl italic text-slate-900 leading-tight mb-4 max-w-2xl mx-auto">
            {t(lang, "pilot.tech.headline")}
          </h2>
          <p className="font-body text-slate-600 max-w-2xl mx-auto text-sm mb-6">
            {t(lang, "pilot.tech.intro")}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 mb-6">
            {tList(lang, "pilot.tech.items").map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium bg-slate-50 text-slate-600 border border-slate-100"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="font-body text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
            {t(lang, "pilot.tech.closing")}
          </p>
        </section>

        <Checklist lang={lang} sectionKey="pilot.results" accentColor={ACCENT} columns={2} />
        <Checklist lang={lang} sectionKey="pilot.why_pilot" accentColor={ACCENT} columns={1} />

        <section className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p
            className="font-label text-[15.6px] font-bold uppercase tracking-widest mb-3"
            style={{ color: BRAND_COLOR }}
          >
            {t(lang, "pilot.mid_cta.eyebrow")}
          </p>
          <h2 className="font-headline text-3xl sm:text-4xl italic text-slate-900 leading-tight mb-5">
            {t(lang, "pilot.mid_cta.headline")}
          </h2>
          <p className="font-body text-slate-600 leading-relaxed mb-6">
            {t(lang, "pilot.mid_cta.intro")}
          </p>
          <p className="font-body text-sm font-semibold text-slate-800 mb-3">
            {t(lang, "pilot.mid_cta.list_intro")}
          </p>
          <ul className="text-left inline-block mx-auto mb-8 space-y-2">
            {midCtaItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span className="mt-0.5 flex-shrink-0 font-bold" style={{ color: ACCENT }}>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div>
            <a
              href="https://cal.com/martin-amon-l2hybo/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-slate-900 px-8 py-4 text-base font-medium text-white hover:bg-slate-800 transition shadow-md"
            >
              {t(lang, "pilot.mid_cta.cta")}
            </a>
          </div>
          <p className="font-headline italic text-lg text-slate-700 mt-6">
            {t(lang, "pilot.mid_cta.tagline")}
          </p>
        </section>

        <Faq lang={lang} sectionKey="pilot.faq" />
        <FaqJsonLd lang={lang} sectionKey="pilot.faq" />

        <CTAFooter lang={lang} sectionKey="pilot.final_cta" accentColor={ACCENT} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  );
}
