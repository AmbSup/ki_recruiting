type ProductPathProps = {
  heading: string;
  intro: string;
  steps: Array<{ title: string; body: string }>;
  accentColor: string;
};

export function ProductPath({ heading, intro, steps, accentColor }: ProductPathProps) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="max-w-md font-headline text-3xl font-medium leading-tight tracking-[-0.02em] text-slate-950 sm:text-4xl">
            {heading}
          </h2>
          <p className="mt-4 max-w-md font-body text-base leading-relaxed text-slate-600">{intro}</p>
        </div>
        <ol className="divide-y divide-slate-200 border-y border-slate-200">
          {steps.map((step, index) => (
            <li key={step.title} className="grid gap-3 py-6 sm:grid-cols-[3rem_1fr] sm:gap-5 sm:py-8">
              <span className="font-headline text-2xl font-medium tabular-nums" style={{ color: accentColor }} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-body text-base font-bold text-slate-950">{step.title}</h3>
                <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-slate-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
