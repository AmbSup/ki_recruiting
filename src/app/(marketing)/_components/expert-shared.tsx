import { Bot, Brain, Cloud, Scale, Workflow, type LucideIcon } from "lucide-react";
import { BRAND_COLOR } from "../_lib/brand";
import type { Area } from "../_lib/experts";

// Gemeinsame Bausteine für Startseite (ExpertHome) und /netzwerk (NetworkPage).

export const CAL_HREF = "https://cal.com/martin-amon-l2hybo/30min";

// Farbe je Themenbereich. Alle Töne dunkel genug für weiße Schrift (WCAG AA ≥ 4.5:1).
export const AREA_STYLE: Record<Area, { color: string; icon: LucideIcon }> = {
  consulting: { color: "#1A3A6E", icon: Scale },
  agents: { color: "#006B80", icon: Bot },
  automation: { color: "#0E6E5A", icon: Workflow },
  ml: { color: "#5B21B6", icon: Brain },
  cloud: { color: "#9A3412", icon: Cloud },
};

export type OfferGroup = { area: Area; title: string; body: string; items: string[] };

// Tags in experts.ts sind meist Eigennamen; nur die deutschen Begriffe übersetzen.
export const TAG_EN: Record<string, string> = {
  Strategie: "Strategy",
  Ethik: "Ethics",
  Architektur: "Architecture",
  "Open-Source-LLMs": "Open-source LLMs",
};

// "Dr.-Ing. Derek M." → "DM": Titel (enthalten einen Punkt, kein Initial) überspringen.
export function initials(name: string): string {
  return name
    .split(" ")
    .filter((part) => !/\.\S/.test(part) && !/^(Dr|Prof)\.?$/.test(part))
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function SectionHead({
  eyebrow,
  headline,
  sub,
  dark = false,
  as: Heading = "h2",
}: {
  eyebrow: string;
  headline: string;
  sub?: string;
  dark?: boolean;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p
        className="mb-3 font-label text-[13px] font-bold uppercase tracking-[0.18em]"
        style={{ color: dark ? "#5FD4EA" : BRAND_COLOR }}
      >
        {eyebrow}
      </p>
      <Heading
        className={`font-headline font-semibold leading-tight tracking-[-0.02em] text-balance ${
          Heading === "h1" ? "text-4xl sm:text-6xl" : "text-3xl sm:text-[2.6rem]"
        } ${dark ? "text-white" : "text-slate-900"}`}
      >
        {headline}
      </Heading>
      {sub && (
        <p className={`mt-4 font-body text-lg leading-relaxed ${dark ? "text-white/70" : "text-slate-600"}`}>{sub}</p>
      )}
    </div>
  );
}
