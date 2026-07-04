import { t, type Lang } from "../_lib/t";

// Final Call-to-Action mit Cal.com-Booking-Link.
// Auf jeder Page einmalig als Abschluss.
export function CTAFooter({
  lang,
  sectionKey,
  accentColor = "#0F172A",
}: {
  lang: Lang;
  sectionKey: string;
  accentColor?: string;
}) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16 text-center">
      <p
        className="font-label text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: accentColor }}
      >
        {t(lang, `${sectionKey}.eyebrow`)}
      </p>
      <h2 className="font-headline text-3xl sm:text-5xl italic text-slate-900 leading-tight mb-4 max-w-2xl mx-auto">
        {t(lang, `${sectionKey}.headline`)}
      </h2>
      <p className="font-body text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
        {t(lang, `${sectionKey}.sub`)}
      </p>
      <a
        href="https://cal.com/martin-amon-l2hybo/30min"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center rounded-full bg-slate-900 px-8 py-4 text-base font-medium text-white hover:bg-slate-800 transition shadow-md"
      >
        {t(lang, `${sectionKey}.cta`)}
      </a>
    </section>
  );
}
