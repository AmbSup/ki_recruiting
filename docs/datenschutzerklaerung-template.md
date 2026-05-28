# Datenschutzerklärung (TEMPLATE)

> ⚠️ **WICHTIG — Rechtsprüfung erforderlich:** Dieses Dokument ist ein
> Code-basiertes Template auf Stand 2026-05-28. Es spiegelt wider, was die
> Plattform technisch tut. Bevor du es publizierst, **muss** ein Anwalt für
> IT-Recht oder ein/e Datenschutzbeauftragte/r (DSB) prüfen und freigeben.
> Alle `[PLATZHALTER]` durch deine konkreten Angaben ersetzen.

---

## 1. Verantwortlicher (Art. 13 (1)(a) DSGVO)

Verantwortlich für die Datenverarbeitung auf dieser Website / in dieser
Anwendung ist:

> **[FIRMENNAME — z.B. Neuronic Automation GmbH]**
> [Strasse Hausnummer]
> [PLZ] [Ort], Österreich
> Tel: [Telefonnummer]
> E-Mail: [datenschutz@deine-domain.at]
> Geschäftsführer/in: [Name]

[Datenschutzbeauftragte/r — falls bestellt:]
> [Name DSB]
> [Kontakt DSB]

---

## 2. Welche Daten verarbeiten wir, und wofür?

Wir verarbeiten personenbezogene Daten ausschließlich für die folgenden klar
definierten Zwecke:

### a) Bewerbungs- und Recruiting-Prozess (Pipeline „Recruiting")
**Daten:** Vor- und Nachname, E-Mail-Adresse, Telefonnummer, Wohnort,
Lebenslauf-Datei (PDF/DOC/JPG/PNG), Antworten auf Funnel-Fragen, optionale
Profilangaben (LinkedIn, aktueller Job/Arbeitgeber, Skills, Sprachen).
**Zweck:** Beurteilung der Eignung für ausgeschriebene Stellen,
KI-gestützte Vorauswahl, automatisiertes Erst-Telefongespräch durch einen
KI-Assistenten, Übergabe an einen menschlichen Recruiter bei Eignung.
**Rechtsgrundlage:** Art. 6 (1)(b) DSGVO (Anbahnung Beschäftigungsverhältnis)
+ Art. 6 (1)(a) DSGVO (Einwilligung für KI-Telefonie + Aufzeichnung).

### b) Sales-/Lead-Prozess (Pipeline „Sales")
**Daten:** Vor- und Nachname, E-Mail, Telefonnummer, Firma, Rolle,
Funnel-Antworten, ggf. Foto-/Dokument-Uploads.
**Zweck:** Bedarfsanalyse und Produktvorstellung per KI-Telefongespräch,
optional Terminvereinbarung mit einem Vertriebsmitarbeiter.
**Rechtsgrundlage:** Art. 6 (1)(a) DSGVO (Einwilligung).

### c) Telefongespräch + Aufzeichnung
**Daten:** Audio-Aufzeichnung des Gesprächs, Transkript (Text), KI-generierte
Analyse (Themen, Stimmung, Termin-Wünsche).
**Zweck:** Qualitätssicherung, Nachvollziehbarkeit von Terminvereinbarungen,
Verbesserung der KI-Modelle (nur in aggregierter, anonymisierter Form).
**Rechtsgrundlage:** Art. 6 (1)(a) DSGVO (Einwilligung — bestätigt zu
Gesprächsbeginn durch DTMF „1" oder verbales „Ja").

---

## 3. Einsatz von KI-gestützter Telefonie und automatisierter Entscheidung

Wir setzen einen **KI-Sprachassistenten** ein, der ausgehende Telefonate führt.
Zu Beginn jedes Gesprächs werden Sie ausdrücklich darauf hingewiesen, dass
Sie mit einer Künstlichen Intelligenz sprechen und das Gespräch **aufgezeichnet,
verarbeitet und ausgewertet** wird (EU AI Act Art. 50 Transparenz).

Sie können das Gespräch jederzeit beenden (Auflegen), die Einwilligung zu
Beginn verweigern (Auflegen oder keine Bestätigung) oder Ihren späteren
Widerruf per E-Mail an [datenschutz@deine-domain.at] kommunizieren.

Eine **rein automatisierte Entscheidung mit rechtlicher Wirkung gemäß Art. 22
DSGVO** findet **nicht** statt — die KI-Analyse dient nur als Vorbereitung
für eine menschliche Entscheidung durch unsere Recruiter / Sales-Mitarbeiter.

---

## 4. Empfänger / Auftragsverarbeiter (Art. 28 DSGVO)

Wir setzen folgende Dienstleister als **Auftragsverarbeiter** ein, mit denen
jeweils ein Auftragsverarbeitungsvertrag (AVV) gemäß Art. 28 DSGVO abgeschlossen
wurde:

| Dienst | Zweck | Sitz | Übermittelte Daten |
|---|---|---|---|
| **Supabase** | Datenbank + Datei-Speicher (Aufzeichnungen, Lebensläufe) | EU/Singapur | Alle personenbezogenen Daten |
| **Vapi** | KI-Voice-Agent + Anruf-Aufzeichnung | USA | Telefonnummer, Audio, Transkript |
| **Twilio** | Telefonie + SMS-Versand | USA | Telefonnummer, ausgehende Anrufe |
| **Anthropic** (Claude) | KI-Analyse von Transkripten und Lebensläufen | USA | Transkript, CV-Text |
| **Vercel** | Hosting (Server-Infrastruktur) | USA | technische Logs, Request-Daten |
| **Meta Platforms** | Online-Werbung + Reichweitenmessung (Meta-Pixel) | USA / Irland | Pixel-Events (Seitenaufruf, Lead) |
| **Cal.com** | Online-Terminbuchung | USA / EU | Name, E-Mail, Wunschtermin |
| **Replicate** | Bildgenerierung für Stellenanzeigen (kein personenbezogener Inhalt) | USA | keine Bewerber-/Lead-Daten |
| **n8n** | Workflow-Automatisierung | **selbst gehostet (AT)** | alle obigen Daten (intern) |

---

## 5. Datenübermittlung in Drittstaaten (Art. 44 ff. DSGVO)

Mehrere oben genannte Dienste haben ihren Sitz in den USA. Für diese Übermittlung
stützen wir uns auf:

- die **EU-US Data Privacy Framework**-Zertifizierung des jeweiligen Anbieters
  (sofern vorhanden), oder
- **Standardvertragsklauseln (SCC)** der EU-Kommission gemäß Art. 46 DSGVO, und
- ein dokumentiertes **Transfer-Impact-Assessment (TIA)**.

Eine Liste der jeweils aktuellen Absicherungen können Sie unter
[datenschutz@deine-domain.at] anfordern.

---

## 6. Speicherdauer

| Datenkategorie | Speicherdauer |
|---|---|
| Bewerber- und Lead-Stammdaten | maximal **12 Monate** nach letzter Aktivität — danach automatische, vollständige Löschung inkl. aller verbundenen Daten (täglicher automatischer Lösch-Job) |
| Gesprächsaufzeichnungen + Transkripte | identisch — gehen mit dem Personen-Datensatz automatisch unter |
| Audit-Log der Löschungen (DSGVO Art. 17 Nachweis) | unbegrenzt (enthält keine Klartext-Personendaten, nur minimal-pseudonymisierter Hinweis + Zeitstempel) |
| Einwilligungs-Audit-Trail (exakter Wortlaut + Zeitpunkt) | bis zum Widerruf bzw. bis zur Löschung der zugehörigen Person |

Eine Verlängerung im Einzelfall erfolgt nur, wenn gesetzliche Aufbewahrungs-
pflichten (z.B. Steuerrecht, Buchhaltung — 7 Jahre nach BAO) bestehen.

---

## 7. Ihre Rechte als betroffene Person (Art. 15-22 DSGVO)

Sie haben uns gegenüber folgende Rechte:

- **Auskunft** (Art. 15) — welche Daten wir über Sie gespeichert haben
- **Berichtigung** (Art. 16) — Korrektur fehlerhafter Daten
- **Löschung / „Recht auf Vergessenwerden"** (Art. 17) — Löschung Ihrer Daten
- **Einschränkung der Verarbeitung** (Art. 18)
- **Datenübertragbarkeit** (Art. 20) — Daten in einem maschinenlesbaren Format
- **Widerspruch** (Art. 21) gegen die Verarbeitung
- **Widerruf der Einwilligung** (Art. 7 (3)) — jederzeit für die Zukunft

Zur Ausübung dieser Rechte genügt eine formlose E-Mail an
**[datenschutz@deine-domain.at]**. Wir antworten innerhalb der gesetzlichen
Frist von einem Monat (Art. 12 (3)).

**Beschwerderecht:** Sie haben das Recht, sich bei der zuständigen
Aufsichtsbehörde zu beschweren. Für Österreich:

> **Österreichische Datenschutzbehörde**
> Barichgasse 40-42, 1030 Wien
> [www.dsb.gv.at](https://www.dsb.gv.at)

---

## 8. Cookies und Tracking-Technologien

### a) Technisch notwendige Cookies
Diese Website nutzt technisch notwendige Cookies (Authentifizierungs-Session,
CSRF-Schutz). Rechtsgrundlage: Art. 6 (1)(f) DSGVO (berechtigtes Interesse am
Betrieb der Website).

### b) Meta-Pixel (Facebook Pixel)
Auf öffentlichen Funnel-Seiten ist optional das **Meta-Pixel** der Meta
Platforms Ireland Ltd. integriert. Es misst, ob ein Klick auf eine Werbeanzeige
zu einer Bewerbung/Anfrage führt (Conversion-Tracking) und ermöglicht
zielgerichtete Werbung.

**Welche Daten:** Browser-/Geräteinformationen, IP-Adresse, Klick-Ereignis,
ggf. ein pseudonymer Identifier.
**Empfänger:** Meta Platforms Ireland Ltd. (Irland) → Meta Platforms Inc. (USA).
**Rechtsgrundlage:** Art. 6 (1)(a) DSGVO (Einwilligung über den Cookie-Banner).
**Speicherdauer bei Meta:** siehe Meta-Datenrichtlinie (typisch bis zu 2 Jahre).
**Opt-out:** [Cookie-Einstellungen ändern] / [Meta-Werbung Einstellungen](https://www.facebook.com/adpreferences).

> Hinweis Operator: Wenn `NEXT_PUBLIC_META_PIXEL_ID` nicht gesetzt ist, lädt
> das Pixel **nicht**. In dem Fall diesen Abschnitt aus der Datenschutzerklärung
> entfernen.

### Andere Tracker
Wir verwenden **kein Google Analytics, kein Hotjar, kein Mixpanel, kein
Plausible, kein Sentry** und keinen weiteren externen Analytics-/Tracking-Dienst.

---

## 9. Sicherheit der Verarbeitung (Art. 32 DSGVO)

Wir setzen technische und organisatorische Maßnahmen (TOMs) ein, darunter:
- Transport-Verschlüsselung (TLS) für alle Verbindungen
- Verschlüsselung at-rest in der Datenbank (Supabase)
- Rollen- und Zugriffskontrolle (Row Level Security auf allen Personendaten-Tabellen)
- Server-seitige Erzwingung der Einwilligung vor Speicherung
- Audit-Logging aller Löschungen
- Regelmäßige Sicherheits-Updates der eingesetzten Komponenten

---

## 10. Änderungen dieser Datenschutzerklärung

Wir behalten uns vor, diese Datenschutzerklärung an geänderte Rechtslage oder
geänderte Verarbeitungsvorgänge anzupassen. Die jeweils aktuelle Fassung ist
auf [https://deine-domain.at/datenschutz] abrufbar.

**Stand:** [Datum eintragen, z.B. 28.05.2026]

---

## Operator-Checkliste vor Veröffentlichung

1. ☐ Alle `[PLATZHALTER]` ersetzt
2. ☐ Sub-Prozessoren-Liste mit AVV-Status abgeglichen — nicht-genutzte Dienste entfernt
3. ☐ Meta-Pixel-Abschnitt nur drinlassen, wenn `NEXT_PUBLIC_META_PIXEL_ID` gesetzt ist
4. ☐ Cookie-Banner mit Opt-In für Meta-Pixel integriert (sonst kein Einsatz!)
5. ☐ Datenschutz-URL im Funnel-Editor → Design-Panel → "DSGVO-Footer-Links" eingetragen
6. ☐ E-Mail-Adresse für Betroffenenanfragen eingerichtet (z.B. datenschutz@…)
7. ☐ **Anwalt/DSB-Review eingeholt und schriftlich freigegeben**
