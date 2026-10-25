import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { dict } from "../_lib/dict";
import { BRAND_COLOR } from "../_lib/brand";
import { Faq } from "./faq";
import { FaqJsonLd } from "./json-ld";
import { CTAFooter } from "./cta-footer";
import { CAL_HREF, SectionHead } from "./expert-shared";

// SEO-Themenseiten (/ki-agenten, /ki-schulung, /ai-act) — nur DE.
// Inhalt kommt aus dict.de.topics.<topic>; die Blöcke werden generisch nach `type` gerendert.

export type TopicKey = "ki_agenten" | "ki_schulung" | "ai_act";

type Item = { title: string; body: string; date?: string };
type Block =
  | { type: "cards" | "steps" | "timeline"; id?: string; eyebrow: string; headline: string; sub?: string; items: Item[] }
  | { type: "chips" | "bullets"; id?: string; eyebrow: string; headline: string; sub?: string; items: string[] }
  | { type: "text"; id?: string; eyebrow: string; headline: string; paragraphs: string[] };

const RELATED: { key: TopicKey; href: string; label: string }[] = [
  { key: "ki_agenten", href: "/ki-agenten", label: "KI-Agenten für Unternehmen" },
  { key: "ki_schulung", href: "/ki-schulung", label: "KI-Schulung & Workshops" },
  { key: "ai_act", href: "/ai-act", label: "AI Act für KMU" },
];

const ACCENTS = ["#1A3A6E", "#006B80", "#0E6E5A", "#5B21B6", "#9A3412", "#0B3440"];

export function TopicPage({ topic }: { topic: TopicKey }) {
  const c = dict.de.topics[topic];
  const blocks = c.blocks as Block[];
  const firstAnchor = blocks.find((b) => b.id)?.id;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full opacity-25 blur-3xl"
          style={{ background: `radial-gradient(circle, ${BRAND_COLOR}, transparent 70%)` }}
        />
        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-16 text-center sm:pt-20">
          <p
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-label text-xs font-bold uppercase tracking-[0.16em] text-white"
            style={{ backgroundColor: "#006B80" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#5FD4EA]" aria-hidden />
            {c.eyebrow}
          </p>
          <h1 className="mb-6 font-headline text-[clamp(2.4rem,5vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#101820] text-balance">
            {c.headline}{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(90deg, ${BRAND_COLOR}, #5B21B6)` }}
            >
              {c.headline_accent}
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl font-body text-lg leading-relaxed text-slate-600">{c.sub}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={CAL_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(0,149,179,0.8)] transition hover:-translate-y-0.5 hover:bg-primary-dim"
            >
              {c.primary_cta}
            </a>
            {firstAnchor && (
              <a
                href={`#${firstAnchor}`}
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
              >
                {c.secondary_cta}
              </a>
            )}
          </div>
        </div>
      </section>

      {blocks.map((block, bi) => (
        <section
          key={block.headline}
          id={block.id}
          className={`scroll-mt-24 py-16 ${bi % 2 === 1 ? "bg-slate-100/70" : ""}`}
        >
          <div className="mx-auto max-w-6xl px-6">
            <SectionHead
              eyebrow={block.eyebrow}
              headline={block.headline}
              sub={"sub" in block ? block.sub : undefined}
            />
            <BlockBody block={block} />
          </div>
        </section>
      ))}

      {"disclaimer" in c && (
        <p className="mx-auto max-w-3xl px-6 pt-4 text-center text-sm italic text-slate-500">{c.disclaimer as string}</p>
      )}

      <Faq lang="de" sectionKey={`topics.${topic}.faq`} />
      <FaqJsonLd lang="de" sectionKey={`topics.${topic}.faq`} />

      {/* Verwandte Themen + Startseite (interne Verlinkung) */}
      <section className="mx-auto max-w-4xl px-6 pb-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {RELATED.filter((r) => r.key !== topic).map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            >
              {r.label}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ))}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            Alle Leistungen der KI-Beratung
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </section>

      <CTAFooter lang="de" sectionKey={`topics.${topic}.final_cta`} href={CAL_HREF} />
    </>
  );
}

function BlockBody({ block }: { block: Block }) {
  switch (block.type) {
    case "cards":
      return (
        <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${block.items.length === 4 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
          {block.items.map((item, i) => (
            <div key={item.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <span className="block h-1.5" style={{ backgroundColor: ACCENTS[i % ACCENTS.length] }} aria-hidden />
              <div className="p-6">
                <h3 className="mb-2 font-headline text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="font-body text-sm leading-relaxed text-slate-600">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case "steps":
      return (
        <ol className="mx-auto grid max-w-4xl grid-cols-1 gap-4">
          {block.items.map((item, i) => (
            <li key={item.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <span
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-headline text-base font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${BRAND_COLOR}, #006B80)` }}
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-headline text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 font-body text-sm leading-relaxed text-slate-600">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      );
    case "timeline":
      return (
        <ol className="relative mx-auto max-w-3xl border-l-2 border-slate-200 pl-8">
          {block.items.map((item) => (
            <li key={item.title} className="relative mb-8 last:mb-0">
              <span
                className="absolute -left-[41px] top-1 h-4 w-4 rounded-full ring-4 ring-white"
                style={{ backgroundColor: BRAND_COLOR }}
                aria-hidden
              />
              <p className="font-label text-xs font-bold uppercase tracking-widest" style={{ color: "#006B80" }}>
                {item.date}
              </p>
              <h3 className="mt-1 font-headline text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 font-body text-sm leading-relaxed text-slate-600">{item.body}</p>
            </li>
          ))}
        </ol>
      );
    case "chips":
      return (
        <ul className="flex flex-wrap justify-center gap-2">
          {block.items.map((item, i) => (
            <li
              key={item}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: ACCENTS[i % ACCENTS.length] }}
            >
              {item}
            </li>
          ))}
        </ul>
      );
    case "bullets":
      return (
        <ul className="mx-auto grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2">
          {block.items.map((item) => (
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
      );
    case "text":
      return (
        <div className="mx-auto max-w-3xl space-y-5">
          {block.paragraphs.map((p) => (
            <p key={p.slice(0, 40)} className="font-body text-lg leading-relaxed text-slate-700">
              {p}
            </p>
          ))}
        </div>
      );
  }
}
