import Image from "next/image";

// Foto-Banner direkt unter dem Hero. Bewusst als eigene Section statt
// Hero-Umbau, damit der zentrierte Hero-Text auf allen Pages unverändert
// bleibt und nur Pages mit echtem Foto diese Section einbinden.
export function HeroPhoto({
  src,
  alt,
  slogan,
  accentColor = "#1A3A6E",
  priority = false,
}: {
  src: string;
  alt: string;
  slogan?: string;
  accentColor?: string;
  priority?: boolean;
}) {
  return (
    <section className="relative mx-auto max-w-5xl px-6 pb-16">
      <div
        aria-hidden
        style={{ backgroundColor: accentColor }}
        className="pointer-events-none absolute -top-8 -right-8 sm:-top-10 sm:-right-10 w-40 h-40 sm:w-56 sm:h-56 rounded-full blur-3xl opacity-30 -z-10"
      />
      <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-xl shadow-black/5">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
          priority={priority}
        />
        {slogan && (
          <>
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
            />
            <p className="absolute inset-x-0 bottom-6 sm:bottom-8 px-6 sm:px-10 text-center font-body font-bold text-lg sm:text-2xl text-white leading-snug drop-shadow-md">
              {slogan}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
