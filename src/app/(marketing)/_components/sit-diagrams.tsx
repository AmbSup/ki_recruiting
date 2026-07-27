// Kleine Technik-Diagramme, die die 5 SIT-Operationen abstrakt zeigen
// (Rechtecke/Kreise statt Icons) — sprachunabhängig, daher getrennt von
// sit-tools-data.ts. `s` ist das CSS-Modul-Klassenobjekt von sit-tool.module.css,
// als Prop durchgereicht statt global importiert, damit die SVG-Farben mit
// dem Theme-Token-System des Moduls mitziehen.

import type { JSX } from "react";

type ClassMap = { [key: string]: string };

function SubtractionDiagram({ s }: { s: ClassMap }) {
  return (
    <svg className={s.diagram} viewBox="0 0 120 46" aria-hidden="true">
      <rect className={s.fill} x="8" y="14" width="18" height="18" />
      <rect className={s.dash} x="51" y="14" width="18" height="18" />
      <rect className={s.fill} x="94" y="14" width="18" height="18" />
      <line className={s.stroke} x1="30" y1="23" x2="47" y2="23" />
      <line className={s.stroke} x1="73" y1="23" x2="90" y2="23" />
    </svg>
  );
}

function DivisionDiagram({ s }: { s: ClassMap }) {
  return (
    <svg className={s.diagram} viewBox="0 0 120 46" aria-hidden="true">
      <rect className={s.fill} x="18" y="14" width="30" height="18" />
      <line className={s.stroke} x1="33" y1="14" x2="33" y2="32" />
      <line className={s.stroke} x1="48" y1="23" x2="62" y2="23" />
      <rect className={s.dash} x="64" y="14" width="12" height="18" />
      <rect className={s.fillAccent} x="82" y="14" width="18" height="18" />
    </svg>
  );
}

function MultiplicationDiagram({ s }: { s: ClassMap }) {
  return (
    <svg className={s.diagram} viewBox="0 0 120 46" aria-hidden="true">
      <rect className={s.dash} x="16" y="16" width="18" height="18" transform="rotate(-8 25 25)" />
      <rect className={s.dash} x="30" y="14" width="18" height="18" transform="rotate(4 39 23)" />
      <rect className={s.fillAccent} x="44" y="14" width="18" height="18" />
      <line className={s.stroke} x1="66" y1="23" x2="80" y2="23" />
      <rect className={s.fill} x="82" y="10" width="14" height="26" />
    </svg>
  );
}

function UnificationDiagram({ s }: { s: ClassMap }) {
  return (
    <svg className={s.diagram} viewBox="0 0 120 46" aria-hidden="true">
      <rect className={s.fill} x="14" y="14" width="18" height="18" />
      <circle className={s.dash} cx="45" cy="23" r="9" />
      <line className={s.stroke} x1="34" y1="23" x2="36" y2="23" />
      <line className={s.stroke} x1="54" y1="23" x2="66" y2="23" />
      <rect className={s.fillAccent} x="68" y="12" width="30" height="22" rx="1" />
      <line className={s.stroke} x1="83" y1="17" x2="83" y2="29" />
      <line className={s.stroke} x1="77" y1="23" x2="89" y2="23" />
    </svg>
  );
}

function DependencyDiagram({ s }: { s: ClassMap }) {
  return (
    <svg className={s.diagram} viewBox="0 0 120 46" aria-hidden="true">
      <line className={s.stroke} x1="22" y1="10" x2="22" y2="36" />
      <circle className={s.fillAccent} cx="22" cy="18" r="3.4" />
      <line className={s.dash} x1="22" y1="18" x2="98" y2="28" />
      <line className={s.stroke} x1="98" y1="10" x2="98" y2="36" />
      <circle className={s.fillAccent} cx="98" cy="28" r="3.4" />
    </svg>
  );
}

export const SIT_DIAGRAM_BY_ID: Record<string, (props: { s: ClassMap }) => JSX.Element> = {
  subtraction: SubtractionDiagram,
  division: DivisionDiagram,
  multiplication: MultiplicationDiagram,
  unification: UnificationDiagram,
  dependency: DependencyDiagram,
};
