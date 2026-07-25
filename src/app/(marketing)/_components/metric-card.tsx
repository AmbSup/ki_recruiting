import { t, type Lang } from "../_lib/t";
import { BRAND_COLOR } from "../_lib/brand";

type MetricCardProps = {
  lang: Lang;
  labelKey: string;
  valueKey: string;
  afterKey?: string;
  noteKey?: string;
  color?: string;
};

// Große Zahl-Metrik (Speed-to-Lead / Time-to-Screen). Zentriert, Serif-italic
// Value in Accent-Farbe, kleiner After-Text daneben.
export function MetricCard({
  lang,
  labelKey,
  valueKey,
  afterKey,
  noteKey,
  color = "#1A3A6E",
}: MetricCardProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14 text-center">
      <p
        className="font-label text-[15.6px] font-bold uppercase tracking-widest mb-3"
        style={{ color: BRAND_COLOR }}
      >
        {t(lang, labelKey)}
      </p>
      <div className="flex items-baseline justify-center gap-3 mb-4">
        <span
          className="font-headline italic text-6xl sm:text-7xl leading-none"
          style={{ color }}
        >
          {t(lang, valueKey)}
        </span>
        {afterKey && (
          <span className="font-body text-lg text-slate-400">
            {t(lang, afterKey)}
          </span>
        )}
      </div>
      {noteKey && (
        <p className="font-body text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          {t(lang, noteKey)}
        </p>
      )}
    </div>
  );
}
