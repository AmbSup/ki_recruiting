"use client";

import { useState } from "react";

type SettingsSection = "general" | "ai" | "calls" | "notifications" | "integrations" | "security";

const sections: { id: SettingsSection; icon: string; label: string; description: string }[] = [
  { id: "general",       icon: "tune",             label: "Allgemein",         description: "Firmenname, Branding, Zeitzone" },
  { id: "ai",            icon: "psychology",        label: "KI & Analyse",      description: "Prompts, Scoring-Gewichtung, Modelle" },
  { id: "calls",         icon: "call",              label: "Voice Calls",       description: "Vapi-Konfiguration, Begrüßungstext" },
  { id: "notifications", icon: "notifications",     label: "Benachrichtigungen",description: "E-Mail-Alerts, Webhook-Events" },
  { id: "integrations",  icon: "extension",         label: "Integrationen",     description: "n8n, Meta Ads, LinkedIn Ads" },
  { id: "security",      icon: "lock",              label: "Sicherheit",        description: "2FA, Session-Timeout, Audit-Log" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-primary" : "bg-outline-variant/40"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-4 pb-3 border-b border-outline-variant/10">{title}</h3>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Field({
  label, description, children,
}: {
  label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-8">
      <div className="flex-1 min-w-0">
        <div className="font-label text-sm font-bold text-on-surface">{label}</div>
        {description && <div className="font-body text-xs text-outline mt-0.5">{description}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-72 px-4 py-2.5 bg-surface-container-highest rounded-xl font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  );
}

function TextareaInput({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-72 px-4 py-2.5 bg-surface-container-highest rounded-xl font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
    />
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  // General
  const [companyName, setCompanyName] = useState("KI Recruit GmbH");
  const [timezone, setTimezone] = useState("Europe/Vienna");
  const [language, setLanguage] = useState("de");

  // AI
  const [cvModel, setCvModel] = useState("gpt-4o");
  const [cvSystemPrompt, setCvSystemPrompt] = useState("");
  const [weightSkills, setWeightSkills] = useState("40");
  const [weightExperience, setWeightExperience] = useState("35");
  const [weightEducation, setWeightEducation] = useState("25");

  // Calls
  const [vapiApiKey, setVapiApiKey] = useState("");
  const [vapiGreeting, setVapiGreeting] = useState("Hallo {{name}}, ich bin Mia, deine KI-Recruiterin. Hast du kurz Zeit für ein kurzes Interview?");
  const [callTimeout, setCallTimeout] = useState("30");
  const [maxRetries, setMaxRetries] = useState("2");

  // Notifications
  const [notifyNewApplicant, setNotifyNewApplicant] = useState(true);
  const [notifyCallCompleted, setNotifyCallCompleted] = useState(true);
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState("operator@kirecruit.at");
  const [webhookUrl, setWebhookUrl] = useState("");

  // Integrations
  const [n8nUrl, setN8nUrl] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [linkedinToken, setLinkedinToken] = useState("");

  // Security
  const [require2fa, setRequire2fa] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("480");
  const [auditLog, setAuditLog] = useState(true);

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return (
          <>
            <Section title="Workspace">
              <Field label="Firmenname" description="Wird in Rechnungen und E-Mails verwendet">
                <TextInput value={companyName} onChange={setCompanyName} />
              </Field>
              <Field label="Zeitzone" description="Standard-Zeitzone für Scheduling">
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                  className="w-72 px-4 py-2.5 bg-surface-container-highest rounded-xl font-body text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="Europe/Vienna">Europe/Vienna (CET)</option>
                  <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                  <option value="UTC">UTC</option>
                </select>
              </Field>
              <Field label="Sprache" description="Systemsprache für E-Mails und Berichte">
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="w-72 px-4 py-2.5 bg-surface-container-highest rounded-xl font-body text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="de">Deutsch</option>
                  <option value="en">English</option>
                </select>
              </Field>
            </Section>
          </>
        );

      case "ai":
        return (
          <>
            <Section title="CV-Analyse">
              <Field label="KI-Modell" description="Wird für CV-Analyse und Scoring verwendet">
                <select value={cvModel} onChange={(e) => setCvModel(e.target.value)}
                  className="w-72 px-4 py-2.5 bg-surface-container-highest rounded-xl font-body text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o mini</option>
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                </select>
              </Field>
              <Field label="System-Prompt" description="Basis-Instruktionen für die CV-Analyse">
                <TextareaInput value={cvSystemPrompt} onChange={setCvSystemPrompt} placeholder="Du bist ein erfahrener Recruiter…" rows={5} />
              </Field>
            </Section>
            <Section title="Scoring-Gewichtung">
              <p className="font-body text-xs text-outline -mt-2 mb-2">Summe muss 100 ergeben</p>
              <Field label="Skills & Kompetenzen" description={`Aktuell: ${weightSkills}%`}>
                <input type="range" min="0" max="100" value={weightSkills} onChange={(e) => setWeightSkills(e.target.value)}
                  className="w-48 accent-primary" />
              </Field>
              <Field label="Berufserfahrung" description={`Aktuell: ${weightExperience}%`}>
                <input type="range" min="0" max="100" value={weightExperience} onChange={(e) => setWeightExperience(e.target.value)}
                  className="w-48 accent-primary" />
              </Field>
              <Field label="Ausbildung" description={`Aktuell: ${weightEducation}%`}>
                <input type="range" min="0" max="100" value={weightEducation} onChange={(e) => setWeightEducation(e.target.value)}
                  className="w-48 accent-primary" />
              </Field>
              <div className={`text-right font-label text-sm font-bold ${Number(weightSkills) + Number(weightExperience) + Number(weightEducation) === 100 ? "text-primary" : "text-error"}`}>
                Summe: {Number(weightSkills) + Number(weightExperience) + Number(weightEducation)}%
              </div>
            </Section>
          </>
        );

      case "calls":
        return (
          <>
            <Section title="Vapi-Konfiguration">
              <Field label="API Key" description="Dein Vapi Public API Key">
                <TextInput value={vapiApiKey} onChange={setVapiApiKey} placeholder="vapi_..." />
              </Field>
              <Field label="Max. Klingeldauer (Sek.)" description="Nach dieser Zeit gilt der Anruf als nicht abgehoben">
                <TextInput value={callTimeout} onChange={setCallTimeout} placeholder="30" />
              </Field>
              <Field label="Max. Wiederholungsversuche" description="Wie oft wird bei Nicht-Abheben nachgeklingelt">
                <TextInput value={maxRetries} onChange={setMaxRetries} placeholder="2" />
              </Field>
            </Section>
            <Section title="Gesprächsskript">
              <Field label="Begrüßung" description="Verfügbare Variablen: {{name}}, {{job_title}}, {{company_name}}">
                <TextareaInput value={vapiGreeting} onChange={setVapiGreeting} rows={4} />
              </Field>
            </Section>
          </>
        );

      case "notifications":
        return (
          <>
            <Section title="E-Mail-Alerts">
              <Field label="Empfänger-E-Mail" description="Alert-E-Mails werden an diese Adresse gesendet">
                <TextInput value={notifyEmail} onChange={setNotifyEmail} placeholder="operator@example.com" />
              </Field>
              <Field label="Neuer Bewerber" description="Wenn ein neuer Bewerber den Funnel abschließt">
                <Toggle checked={notifyNewApplicant} onChange={setNotifyNewApplicant} />
              </Field>
              <Field label="Call abgeschlossen" description="Nach jedem abgeschlossenen KI-Interview">
                <Toggle checked={notifyCallCompleted} onChange={setNotifyCallCompleted} />
              </Field>
              <Field label="Überfällige Rechnungen" description="7 Tage vor Fälligkeit">
                <Toggle checked={notifyOverdue} onChange={setNotifyOverdue} />
              </Field>
            </Section>
            <Section title="Webhook">
              <Field label="Webhook URL" description="Empfängt Events in Echtzeit (z.B. für n8n)">
                <TextInput value={webhookUrl} onChange={setWebhookUrl} placeholder="https://..." />
              </Field>
            </Section>
          </>
        );

      case "integrations":
        return (
          <>
            <Section title="Workflow-Automatisierung">
              <Field label="n8n Basis-URL" description="Deine n8n-Instanz für Automatisierungen">
                <TextInput value={n8nUrl} onChange={setN8nUrl} placeholder="https://n8n.example.com" />
              </Field>
            </Section>
            <Section title="Ad-Plattformen">
              <Field label="Meta Ads Access Token" description="Für Facebook & Instagram Kampagnen-Sync">
                <TextInput value={metaAccessToken} onChange={setMetaAccessToken} placeholder="EAAx..." />
              </Field>
              <Field label="LinkedIn API Token" description="Für LinkedIn Kampagnen-Sync">
                <TextInput value={linkedinToken} onChange={setLinkedinToken} placeholder="AQX..." />
              </Field>
            </Section>
            <Section title="Verbundene Dienste">
              {[
                { name: "Supabase",   icon: "storage",    status: "Verbunden",    color: "text-primary" },
                { name: "OpenAI",     icon: "psychology",  status: "Konfigurieren", color: "text-outline" },
                { name: "Vapi",       icon: "call",        status: "Konfigurieren", color: "text-outline" },
                { name: "n8n",        icon: "account_tree",status: "Konfigurieren", color: "text-outline" },
              ].map((svc) => (
                <div key={svc.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-outline text-base">{svc.icon}</span>
                    </div>
                    <span className="font-label text-sm font-bold text-on-surface">{svc.name}</span>
                  </div>
                  <span className={`font-label text-xs font-bold ${svc.color}`}>{svc.status}</span>
                </div>
              ))}
            </Section>
          </>
        );

      case "security":
        return (
          <>
            <Section title="Authentifizierung">
              <Field label="Zwei-Faktor-Authentifizierung" description="TOTP für alle Admin/Operator-Accounts verpflichtend">
                <Toggle checked={require2fa} onChange={setRequire2fa} />
              </Field>
              <Field label="Session-Timeout (Minuten)" description="Inaktive Sessions werden nach dieser Zeit beendet">
                <TextInput value={sessionTimeout} onChange={setSessionTimeout} placeholder="480" />
              </Field>
            </Section>
            <Section title="Protokollierung">
              <Field label="Audit-Log" description="Alle Aktionen werden protokolliert (DSGVO-konform)">
                <Toggle checked={auditLog} onChange={setAuditLog} />
              </Field>
            </Section>
            <Section title="Gefahrenzone">
              <div className="p-4 rounded-xl border border-error/20 bg-error-container/10">
                <div className="font-label text-sm font-bold text-error mb-1">Workspace zurücksetzen</div>
                <div className="font-body text-xs text-outline mb-3">Alle Daten werden unwiderruflich gelöscht.</div>
                <button className="px-4 py-2 rounded-lg border border-error/30 text-error font-label text-xs font-bold hover:bg-error/10 transition-colors">
                  Workspace löschen
                </button>
              </div>
            </Section>
          </>
        );
    }
  };

  return (
    <div className="px-8 pt-10 pb-32">
      {/* Header */}
      <div className="mb-10">
        <p className="font-label text-[10px] font-bold uppercase tracking-widest text-outline mb-2">Operator Panel</p>
        <h1 className="font-headline text-5xl italic text-on-surface leading-none">Einstellungen</h1>
        <p className="font-body text-on-surface-variant mt-2">Konfiguriere deinen KI-Recruit Workspace</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Nav */}
        <div className="w-56 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                  activeSection === s.id
                    ? "bg-primary-container text-on-primary-container"
                    : "hover:bg-surface-container-high text-on-surface-variant"
                }`}
              >
                <span className={`material-symbols-outlined text-xl mt-0.5 flex-shrink-0 ${activeSection === s.id ? "" : "text-outline"}`}
                  style={activeSection === s.id ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {s.icon}
                </span>
                <div>
                  <div className="font-label text-sm font-bold">{s.label}</div>
                  <div className={`font-label text-[10px] mt-0.5 ${activeSection === s.id ? "text-on-primary-container/70" : "text-outline"}`}>
                    {s.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-headline text-2xl italic text-on-surface">
                  {sections.find((s) => s.id === activeSection)?.label}
                </h2>
                <p className="font-body text-sm text-outline mt-1">
                  {sections.find((s) => s.id === activeSection)?.description}
                </p>
              </div>
              <button className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
                <span className="material-symbols-outlined text-sm">save</span>
                Speichern
              </button>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
