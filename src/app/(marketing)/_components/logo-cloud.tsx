import Image from "next/image";
import { dict, type Lang } from "../_lib/dict";

type Logo = { src: string; alt: string };
type Variant = "default" | "compact";

// Trust-Bar für Kunden- bzw. Kompetenz-Logos. Jedes Logo bekommt eine
// eigene weiße Karte mit fester Höhe — normalisiert die sehr
// unterschiedlichen Quell-Assets (transparente Wordmarks neben massiven
// Farbflächen wie DHL/Siemens) zu einer ruhigen, einheitlichen Reihe statt
// sie freizustellen (was ohne Bildbearbeitung nicht robust möglich ist).
//
// "compact" ist der schmale Balken für die Produkt-Pages (Wissen/KMU/
// Recruiting/Sales) — "default" ist die große Home-Ausführung.
export function LogoCloud({
  lang,
  sectionKey,
  variant = "default",
}: {
  lang: Lang;
  sectionKey: string;
  variant?: Variant;
}) {
  const section = getNested(dict[lang], sectionKey);
  const eyebrow = section?.eyebrow ?? "";
  const logos = section?.logos ?? [];

  if (logos.length === 0) return null;

  const compact = variant === "compact";

  return (
    <section className={`mx-auto max-w-6xl px-6 ${compact ? "py-8" : "py-12"}`}>
      <p
        className={`text-center font-label text-xs font-bold uppercase tracking-widest text-slate-500 ${
          compact ? "mb-4" : "mb-8"
        }`}
      >
        {eyebrow}
      </p>
      <div className={`flex flex-wrap justify-center ${compact ? "gap-2" : "gap-4"}`}>
        {logos.map((logo) => (
          <div
            key={logo.src}
            className={
              compact
                ? "flex items-center justify-center w-24 sm:w-28 h-14 sm:h-16 rounded-lg bg-white border border-slate-200 p-2"
                : "flex items-center justify-center w-36 sm:w-40 h-20 sm:h-24 rounded-xl bg-white border border-slate-200 p-3"
            }
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={160}
              height={64}
              className={`max-w-full w-auto object-contain ${
                compact ? "max-h-8 sm:max-h-9" : "max-h-14 sm:max-h-16"
              }`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function getNested(obj: unknown, path: string): { eyebrow?: string; logos?: Logo[] } | null {
  const parts = path.split(".");
  let cursor: unknown = obj;
  for (const p of parts) {
    if (cursor && typeof cursor === "object" && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
    } else return null;
  }
  return cursor as { eyebrow?: string; logos?: Logo[] };
}
