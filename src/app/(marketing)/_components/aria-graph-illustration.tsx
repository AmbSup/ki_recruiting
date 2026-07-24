// Abstrakte "verteilte Intelligenz"-Illustration für die ARIA-Seite: mehrere
// Quell-Knoten verbinden sich zu einer zentralen, hervorgehobenen Antwort.
// Reines Linien-SVG (currentColor), funktioniert auf jeder Container-Farbe.
export function AriaGraphIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 200"
      className={`w-44 sm:w-56 h-auto ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.45">
        <path d="M120 100 L44 56" />
        <path d="M120 100 L40 128" />
        <path d="M120 100 L76 168" />
        <path d="M120 100 L164 36" />
        <path d="M120 100 L204 88" />
        <path d="M120 100 L180 156" />
        <path d="M44 56 L164 36" />
        <path d="M40 128 L76 168" />
      </g>
      <circle cx="44" cy="56" r="6" fill="currentColor" opacity="0.35" />
      <circle cx="40" cy="128" r="8" fill="currentColor" opacity="0.35" />
      <circle cx="76" cy="168" r="6" fill="currentColor" opacity="0.35" />
      <circle cx="164" cy="36" r="7" fill="currentColor" opacity="0.35" />
      <circle cx="204" cy="88" r="9" fill="currentColor" opacity="0.35" />
      <circle cx="180" cy="156" r="6" fill="currentColor" opacity="0.35" />
      <circle cx="120" cy="100" r="14" fill="currentColor" />
      <circle cx="120" cy="100" r="22" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
