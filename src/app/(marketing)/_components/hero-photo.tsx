import Image from "next/image";

// Foto-Banner direkt unter dem Hero. Bewusst als eigene Section statt
// Hero-Umbau, damit der zentrierte Hero-Text auf allen Pages unverändert
// bleibt und nur Pages mit echtem Foto diese Section einbinden.
export function HeroPhoto({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-16">
      <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-xl shadow-black/5">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
          priority={priority}
        />
      </div>
    </section>
  );
}
