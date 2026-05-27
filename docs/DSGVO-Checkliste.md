# DSGVO-Compliance-Checkliste (Österreich)

> ⚠️ **Disclaimer:** „100% DSGVO-konform" ist keine reine Software-Frage und kann
> nicht allein durch Code erreicht werden. Dieses Dokument listet auf, was die
> Plattform **technisch** bereits erfüllt und was noch fehlt — aber die
> **rechtliche Verbindlichkeit** (Datenschutzerklärung, AVV-Verträge, DPIA,
> Verarbeitungsverzeichnis) muss ein **Anwalt für IT-Recht oder ein/e
> Datenschutzbeauftragte/r (DSB)** prüfen und freigeben. Dieses Dokument ersetzt
> keine Rechtsberatung.

Stand: 2026-05-27 · Plattform: KI-Telefonie für Recruiting + Sales (Vapi/Twilio/Supabase/Anthropic)

---

## ✅ Bereits umgesetzt (technisch)

| Anforderung | Artikel | Status |
|---|---|---|
| KI-Transparenz: Anrufer wird zu Beginn gesagt, dass er mit einer KI spricht | EU-AI-Act Art. 50 | ✅ First-Message-Disclosure (DE+EN) in `base-prompt.ts` |
| Einwilligungs-Checkboxen im Funnel (Datenschutz + separate KI-Anruf-Einwilligung) | Art. 6, 7 | ✅ Pflicht vor Submit, `funnel-player.tsx` |
| Einwilligungs-Audit-Trail (exakter Wortlaut + Timestamp gespeichert) | Art. 7(1) Nachweisbarkeit | ✅ `ai_consent` JSONB in custom_fields/funnel_responses |
| Consent-Gate vor Sales-Anruf (403 wenn kein Opt-In) | Art. 6 | ✅ `/api/sales/trigger-call` |
| Rollen-/Zugriffskontrolle (RLS auf allen Personendaten-Tabellen) | Art. 32 | ✅ `supabase/rls.sql` |
| **Recht auf Löschung (Cascade + Storage + Audit-Log)** | **Art. 17** | ✅ `/api/{sales/leads,applicants}/[id]/erase` + `gdpr_erasure_log` |
| **Recht auf Auskunft/Portabilität (JSON-Export)** | **Art. 15/20** | ✅ `/api/{sales/leads,applicants}/[id]/export` |

---

## ⚠️ Technische Follow-ups (nächste PRs — Code möglich)

Priorisiert. Jeder Punkt ist ein abgrenzbares Software-Ticket:

1. **Aufzeichnung explizit im Disclosure benennen** — aktuell sagt die KI „dieses
   Gespräch wird verarbeitet und ausgewertet". Für AT/DE rechtssicherer:
   explizit „…und **aufgezeichnet**". → `base-prompt.ts` First-Message DE+EN.
2. **Datenschutz- + Impressum-Link im Funnel-Footer** — aktuell nur Checkbox-Text
   ohne klickbaren Link. Pflicht: verlinkte Datenschutzerklärung auf jeder
   öffentlichen Funnel-Seite. → `funnel-player.tsx` Footer.
3. **Recruiting-Consent server-seitig erzwingen** — Funnel-Submit prüft Consent
   nur clientseitig (umgehbar). → 422 in `/api/apply` wenn `consent != true`.
4. **Aufbewahrungsfristen / Auto-Purge** (Art. 5 (1)(e) Speicherbegrenzung):
   - Cron-Job: Recordings/Transkripte/Leads älter als X Monate automatisch löschen
     (X = im Verarbeitungsverzeichnis definierte Frist, z.B. 6 Monate nach
     letztem Kontakt).
   - `sales_lead_uploads.expires_at` (24h) wird gesetzt aber nicht durchgesetzt —
     Cleanup-Trigger/Cron nachrüsten.
5. **`applicants`-Consent-Schema angleichen** — Recruiting speichert nur
   `consent_given_at` (Timestamp), Sales hat 3 Felder (given/source/timestamp).
   Für konsistenten Nachweis: Recruiting auf gleiches Schema heben.
6. **Self-Service für Betroffene (optional, V2)** — Link per E-Mail, über den ein
   Lead/Bewerber selbst Auskunft/Löschung anstößt. Aktuell operator-getriggert
   (erfüllt Art. 15/17 innerhalb der 1-Monats-Frist, aber manuell).

---

## ❌ Rechtlich/organisatorisch — MUSS durch Anwalt/DSB (kein Code)

### 1. Datenschutzerklärung + Impressum
- Vollständige Datenschutzerklärung (Art. 13/14): welche Daten, Zweck,
  Rechtsgrundlage, Empfänger (Sub-Prozessoren!), Speicherdauer, Betroffenenrechte,
  Beschwerderecht bei der **Datenschutzbehörde (DSB Österreich)**.
- Impressum nach § 5 ECG / § 25 MedienG.
- Muss auf Funnel + Website verlinkt sein (siehe Tech-Follow-up #2).

### 2. Auftragsverarbeitungs-Verträge (AVV/DPA) — Art. 28
Mit **jedem** Sub-Prozessor ein AVV abschließen + ablegen:

| Dienst | Zweck | Sitz | AVV nötig | 3rd-Country (Art. 44) |
|---|---|---|---|---|
| Supabase | DB + Storage | 🇪🇺/🇸🇬* | ✅ | je nach Region prüfen |
| Vapi | KI-Voice + Recording | 🇺🇸 | ✅ | SCC / DPF prüfen |
| Twilio | Telefonie/SMS | 🇺🇸 | ✅ | SCC / DPF (Twilio ist DPF-zertifiziert) |
| Anthropic (Claude) | Transcript-/CV-Analyse | 🇺🇸 | ✅ | SCC / DPF prüfen |
| Meta | Ads + Leadgen | 🇺🇸 | ✅ | DPF |
| Vercel | Hosting | 🇺🇸 | ✅ | SCC / DPF |
| Replicate | Bildgenerierung | 🇺🇸 | ✅ | SCC prüfen |
| Cal.com | Terminbuchung | 🇺🇸/EU* | ✅ | prüfen |
| n8n | Workflow-Automation | **self-hosted (AT)** | intern | kein Transfer ✅ |

\* Region/Sitz konkret verifizieren — Supabase + Cal.com bieten EU-Regionen.

### 3. US-Datentransfer absichern — Art. 44 ff.
- Für jeden US-Dienst: entweder **EU-US Data Privacy Framework (DPF)**-Zertifizierung
  des Anbieters nachweisen ODER **Standardvertragsklauseln (SCC)** abschließen +
  Transfer-Impact-Assessment (TIA).

### 4. Verarbeitungsverzeichnis — Art. 30
- Formales Verzeichnis aller Verarbeitungstätigkeiten (Recruiting-Calls,
  Sales-Calls, Funnel-Leads, Aufzeichnungen, KI-Analyse). Pflicht.

### 5. Datenschutz-Folgenabschätzung (DPIA) — Art. 35
- **Sehr wahrscheinlich Pflicht**: KI-gestützte Sprachanalyse + automatisierte
  Bewertung von Bewerbern/Leads = „systematische umfangreiche Bewertung
  persönlicher Aspekte" + neue Technologie. DPIA durchführen + dokumentieren.

### 6. Telefon-Marketing — TKG 2021 § 174 (AT)
- **Werbe-Anrufe ohne vorherige Einwilligung sind verboten** (§ 174 Abs. 1 TKG
  2021). Gilt für **Sales-Cold-Calls**. Die Bulk-Call-Funktion darf NUR Nummern
  anrufen, für die ein dokumentiertes Opt-In vorliegt — die Consent-Checkbox bei
  Import deckt das ab, ABER: der Operator muss das Opt-In real besitzen (nicht nur
  die Checkbox ankreuzen). Hohe Strafen.
- Recruiting-Anrufe an Bewerber, die sich aktiv beworben haben → i.d.R. zulässig
  (berechtigtes Interesse / Vertragsanbahnung), aber im Verzeichnis dokumentieren.

### 7. Aufzeichnungs-Einwilligung
- Gesprächsaufzeichnung braucht eine eigene Rechtsgrundlage. Die KI-Disclosure +
  Funnel-Consent sollten die Aufzeichnung **ausdrücklich** abdecken (siehe
  Tech-Follow-up #1).

---

## Verifikation der technischen Maßnahmen

- **Löschung testen:** Test-Lead mit Call + Recording → „DSGVO-Löschung" →
  prüfen dass `sales_leads`/`sales_calls`/`sales_call_analyses`/Storage leer sind +
  `gdpr_erasure_log` einen Eintrag hat.
- **Export testen:** „Daten exportieren" → JSON enthält alle Stammdaten + Calls +
  Analysen + Consent.
- **Audit-Nachweis:** `select * from gdpr_erasure_log` zeigt wer/wann/was gelöscht hat.
