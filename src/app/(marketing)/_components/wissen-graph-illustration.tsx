// Abstrakte GraphRAG-Illustration: Knoten + Kanten, ein Knoten hervorgehoben
// als "gefundene Antwort". Reines Linien-SVG (currentColor), damit es auf
// jeder Container-Farbe (primary/tertiary/secondary) funktioniert.
export function WissenGraphIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 200"
      className={`w-44 sm:w-56 h-auto ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.45">
        <path d="M120 100 L52 48" />
        <path d="M120 100 L34 112" />
        <path d="M120 100 L58 162" />
        <path d="M120 100 L150 40" />
        <path d="M120 100 L206 70" />
        <path d="M120 100 L196 150" />
        <path d="M150 40 L206 70" />
        <path d="M34 112 L58 162" />
      </g>
      <circle cx="52" cy="48" r="7" fill="currentColor" opacity="0.35" />
      <circle cx="34" cy="112" r="9" fill="currentColor" opacity="0.35" />
      <circle cx="58" cy="162" r="6" fill="currentColor" opacity="0.35" />
      <circle cx="150" cy="40" r="8" fill="currentColor" opacity="0.35" />
      <circle cx="206" cy="70" r="6" fill="currentColor" opacity="0.35" />
      <circle cx="196" cy="150" r="9" fill="currentColor" opacity="0.35" />
      <circle cx="120" cy="100" r="13" fill="currentColor" />
      <circle cx="120" cy="100" r="20" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
