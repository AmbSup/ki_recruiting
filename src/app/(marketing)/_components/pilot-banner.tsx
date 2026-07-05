import { t, type Lang } from "../_lib/t";

// Pilot-Partner-Deal-Banner. Wird auf der Pricing-Page direkt unter der
// Table gezeigt: Setup-Preis halbiert gegen Case-Study-Rechte für die
// ersten 3-5 Kunden. Verschwindet später ohne UI-Rewrite: Dict-Copy leeren.
export function PilotBanner({
  lang,
  accentColor = "#1A3A6E",
}: {
  lang: Lang;
  accentColor?: string;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-6">
      <div
        className="rounded-2xl p-8 md:p-10 text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accentColor} 0%, #0f1e3d 100%)`,
        }}
      >
        <p className="font-label text-[10px] font-bold uppercase tracking-widest text-white/70 mb-3">
          {t(lang, "pricing.pilot.eyebrow")}
        </p>
        <h2 className="font-headline text-2xl md:text-3xl italic mb-4 leading-tight">
          {t(lang, "pricing.pilot.headline")}
        </h2>
        <p className="font-body text-sm md:text-base text-white/80 leading-relaxed mb-6 max-w-2xl">
          {t(lang, "pricing.pilot.sub")}
        </p>
        <a
          href="https://cal.com/martin-amon-l2hybo/30min"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100 transition"
        >
          {t(lang, "pricing.pilot.cta")}
        </a>
      </div>
    </section>
  );
}
