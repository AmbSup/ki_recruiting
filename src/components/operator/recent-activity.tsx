const activities: {
  icon: string;
  iconBg: string;
  text: string;
  sub: string;
  time: string;
}[] = [
  { icon: "person_add",   iconBg: "bg-primary-container",           text: "Neue Bewerbung von Julia Maier",         sub: "Senior UX Designer · TechVision GmbH",       time: "vor 12 min" },
  { icon: "call",         iconBg: "bg-tertiary-container",          text: "KI-Interview abgeschlossen — Score 87%",  sub: "Markus Berger · Backend-Entwickler",           time: "vor 34 min" },
  { icon: "check_circle", iconBg: "bg-secondary-container",         text: "Bewerber freigegeben für Kundenportal",   sub: "Anna Schmidt · Projektmanagerin",              time: "vor 1 Std" },
  { icon: "campaign",     iconBg: "bg-primary-container/50",        text: "Kampagne «PM Wien» aktiviert",            sub: "Facebook · Budget € 45 / Tag",                time: "vor 2 Std" },
  { icon: "description",  iconBg: "bg-surface-container-high",      text: "CV-Analyse abgeschlossen — 92 % Match",   sub: "Thomas Klein · Fullstack-Entwickler",          time: "vor 3 Std" },
  { icon: "phone_missed", iconBg: "bg-error-container/30",          text: "Anruf nicht abgehoben — Retry geplant",   sub: "Sarah Müller · Marketing Manager",             time: "vor 4 Std" },
];

export function RecentActivity() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] h-full">
      <div className="flex items-center justify-between mb-6">
        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
          Letzte Aktivitäten
        </span>
        <span className="material-symbols-outlined text-outline-variant text-xl">history</span>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">
            inbox
          </span>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-outline">
            Noch keine Aktivitäten
          </p>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Aktivitäten erscheinen hier sobald Bewerbungen eingehen.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((item, i) => (
            <div key={i} className="flex items-start gap-3 group">
              <div className={`w-8 h-8 rounded-full ${item.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="material-symbols-outlined text-sm">{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-on-surface leading-snug">{item.text}</p>
                <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mt-0.5">
                  {item.sub}
                </p>
              </div>
              <span className="font-label text-[10px] text-outline flex-shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
