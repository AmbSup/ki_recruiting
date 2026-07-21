import type { ReactNode } from "react";

type Variant = "primary" | "tertiary" | "secondary";

// Farbiger Pull-Quote-Block im Claude-2.0-Look: satte Container-Farbe aus
// dem Design-System (primary/tertiary/secondary), großes Zitat + optionale
// Illustration. Bewusst eigenständig statt in bestehende Grid-Components
// eingebaut, damit andere Pages (Sales/Recruiting/KMU) unverändert bleiben.
const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary-container text-on-primary-container",
  tertiary: "bg-tertiary-container text-on-tertiary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
};

export function ColorBlock({
  variant,
  eyebrow,
  text,
  illustration,
}: {
  variant: Variant;
  eyebrow?: string;
  text: string;
  illustration?: ReactNode;
}) {
  return (
    <div
      className={`rounded-3xl ${VARIANT_CLASSES[variant]} p-8 sm:p-12 grid gap-8 md:grid-cols-[1.3fr_1fr] items-center`}
    >
      <div>
        {eyebrow && (
          <p className="font-label text-xs font-bold uppercase tracking-widest opacity-70 mb-3">
            {eyebrow}
          </p>
        )}
        <p className="font-headline italic text-2xl sm:text-3xl leading-snug">{text}</p>
      </div>
      {illustration && (
        <div className="flex justify-center md:justify-end opacity-90">{illustration}</div>
      )}
    </div>
  );
}
