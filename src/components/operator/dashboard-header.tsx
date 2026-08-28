function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-AT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("de-AT", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function DashboardHeader({ refreshedAt }: { refreshedAt: string }) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-headline text-4xl font-medium leading-none text-on-surface sm:text-5xl">Heute im Blick</h1>
        <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-on-surface-variant sm:text-base">
          Behalten Sie Reaktionszeit, Anrufstatus und offene Entscheidungen im Blick.
        </p>
      </div>
      <p className="font-label text-xs text-outline">
        {formatDate(refreshedAt)} · aktualisiert um {formatTime(refreshedAt)}
      </p>
    </header>
  );
}
