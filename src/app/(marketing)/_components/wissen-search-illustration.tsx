// Abstrakte "Frage → Antwort"-Illustration: Dokumentenstapel gebündelt zu
// einer Suchlupe mit hervorgehobenem Treffer. Reines Linien-SVG.
export function WissenSearchIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 200"
      className={`w-44 sm:w-56 h-auto ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.4">
        <rect x="26" y="34" width="60" height="76" rx="6" />
        <rect x="42" y="50" width="60" height="76" rx="6" />
        <line x1="56" y1="72" x2="94" y2="72" />
        <line x1="56" y1="86" x2="94" y2="86" />
        <line x1="56" y1="100" x2="82" y2="100" />
      </g>
      <g stroke="currentColor" strokeWidth="4" strokeLinecap="round">
        <circle cx="150" cy="96" r="38" opacity="0.9" />
        <line x1="177" y1="123" x2="210" y2="156" />
      </g>
      <circle cx="150" cy="96" r="10" fill="currentColor" />
      <path
        d="M150 78 L154 92 L168 92 L157 100 L161 114 L150 106 L139 114 L143 100 L132 92 L146 92 Z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}
