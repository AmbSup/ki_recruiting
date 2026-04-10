const alerts: {
  type: "warning" | "error" | "info";
  title: string;
  description: string;
  action?: string;
}[] = [
  { type: "error",   title: "Rechnung überfällig",          description: "Rechnung #INV-2026-011 von TechVision GmbH ist seit 8 Tagen überfällig (€ 2.400).",      action: "Anzeigen" },
  { type: "warning", title: "Kampagnen-Budget fast erreicht",description: "«UX Designer Wien» hat 91 % des Monatsbudgets verbraucht. Noch € 120 verfügbar.",       action: "Budget erhöhen" },
  { type: "info",    title: "3 Bewerber warten auf Freigabe",description: "Anna Schmidt, Lukas Bauer und Eva Huber wurden bewertet und sind bereit für das Kundenportal.", action: "Jetzt freigeben" },
];

const alertStyles = {
  warning: {
    bg: "bg-tertiary-container/30",
    border: "border-tertiary-fixed-dim/40",
    icon: "warning",
    iconColor: "text-tertiary",
  },
  error: {
    bg: "bg-error-container/20",
    border: "border-error-container/40",
    icon: "error",
    iconColor: "text-error",
  },
  info: {
    bg: "bg-primary-container/20",
    border: "border-primary-container/40",
    icon: "info",
    iconColor: "text-primary",
  },
};

export function AlertsPanel() {
  if (alerts.length === 0) {
    return (
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/20">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-outline-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <div>
            <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">
              Keine Alerts
            </span>
            <p className="font-body text-sm text-on-surface-variant mt-0.5">
              Alle Systeme laufen normal. Budget-Alerts und Performance-Warnungen erscheinen hier.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">
        Alerts
      </span>
      {alerts.map((alert, i) => {
        const style = alertStyles[alert.type];
        return (
          <div
            key={i}
            className={`${style.bg} border ${style.border} rounded-xl p-5 flex items-start justify-between gap-4`}
          >
            <div className="flex items-start gap-3">
              <span className={`material-symbols-outlined ${style.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {style.icon}
              </span>
              <div>
                <p className="font-label text-sm font-bold text-on-surface">{alert.title}</p>
                <p className="font-body text-sm text-on-surface-variant mt-0.5">{alert.description}</p>
              </div>
            </div>
            {alert.action && (
              <button className="flex-shrink-0 font-label text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                {alert.action}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
