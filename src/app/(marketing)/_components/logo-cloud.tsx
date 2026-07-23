import Image from "next/image";
import { dict, type Lang } from "../_lib/dict";

type Logo = { src: string; alt: string };

// Trust-Bar für Kunden- bzw. Kompetenz-Logos. Jedes Logo bekommt eine
// eigene weiße Karte mit fester Höhe — normalisiert die sehr
// unterschiedlichen Quell-Assets (transparente Wordmarks neben massiven
// Farbflächen wie DHL/Siemens) zu einer ruhigen, einheitlichen Reihe statt
// sie freizustellen (was ohne Bildbearbeitung nicht robust möglich ist).
export function LogoCloud({ lang, sectionKey }: { lang: Lang; sectionKey: string }) {
  const section = getNested(dict[lang], sectionKey);
  const eyebrow = section?.eyebrow ?? "";
  const logos = section?.logos ?? [];

  if (logos.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-center font-label text-xs font-bold uppercase tracking-widest text-slate-500 mb-8">
        {eyebrow}
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {logos.map((logo) => (
          <div
            key={logo.src}
            className="flex items-center justify-center w-36 sm:w-40 h-20 sm:h-24 rounded-xl bg-white border border-slate-200 p-3"
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={160}
              height={64}
              className="max-h-14 sm:max-h-16 max-w-full w-auto object-contain"
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
