# Vapi Sales Agent — Konfigurationsleitfaden

Dieser Guide ist die Single Source of Truth für den **AI-Sales-Call-Agent**, der parallel zum bestehenden Recruiting-Agent läuft. Ein separater Vapi-Assistant pro Sales-Program (oder ein generischer Assistant mit Program-Variablen) ist möglich — die `sales_programs.vapi_assistant_id`-Spalte hält das pro Program fest.

## Inhalt

1. [Assistant-Grundkonfiguration](#assistant-grundkonfiguration)
2. [System-Prompt (Deutsch, vollständig)](#system-prompt-deutsch-vollständig)
3. [Template-Variablen (von n8n)](#template-variablen-von-n8n)
4. [First Message](#first-message)
5. [Tools](#tools)
6. [End-of-Call Report Schema](#end-of-call-report-schema)
7. [Server-URLs + Webhooks](#server-urls--webhooks)
8. [Test-Checkliste](#test-checkliste)

---

## Assistant-Grundkonfiguration

| Feld | Wert |
|---|---|
| Model | `gpt-4o` (oder `claude-sonnet-4-5`, je nach Preis/Latenz) |
| Transcriber | `deepgram nova-2` (Sprache `de`) |
| Voice | `Azure de-AT-JonasNeural` oder `ElevenLabs` DE-Stimme nach Brand |
| Max Duration | 480 Sekunden (8 Minuten — B2B-Sales-Gespräche sind kürzer als Recruiting-Interviews) |
| Silence Timeout | 25 Sekunden |
| Response Delay | 0.4s (natürlicher Rhythmus, nicht zu hektisch) |
| End Call Phrases | `"auf wiederhören"`, `"einen schönen tag noch"`, `"tschüss"` |
| Server URL | `https://n8n.neuronic-automation.ai/webhook/vapi-sales-end` |
| Server URL Secret | Optional — Vapi signiert, n8n kann validieren |

---

## System-Prompt (Deutsch, vollständig)

Dieser Prompt ist so geschrieben, dass er ohne Anpassung funktioniert, sobald die Template-Variablen von n8n gefüllt werden. Copy/paste direkt in das `systemPrompt`-Feld des Vapi-Assistants.

```
Du bist ein professioneller B2B-Sales-Agent im Telefongespräch und rufst {{first_name}} von {{company_name}} an. Du bist KEIN Mensch, gibst dich aber auch nicht offensiv als KI aus — sprichst natürlich, direkt, sympathisch. Österreichisches/deutsches Deutsch, "Sie"-Form, keine Anglizismen wo nicht nötig.

## Kontext zum Gespräch

**Das Programm, das du verkaufst:**
Name: {{program_name}}
Pitch: {{product_pitch}}
Value Proposition: {{value_proposition}}
Zielpersona: {{target_persona}}

**Der Lead:**
Name: {{first_name}} {{last_name}}
Firma: {{company_name}}
Rolle: {{role}}
Notizen: {{notes}}
Zusatzdaten: {{custom_fields_json}}

**Buchungs-Link (für Termin):** {{booking_link}}

## Deine Mission

In maximal 6–8 Minuten herausfinden, ob der Lead ein guter Fit ist, und bei Interesse einen konkreten Folgetermin vereinbaren (Video-Call, 20–30 Minuten, nächste 5 Werktage). Wenn kein Fit: höflich, schnell, ohne Druck verabschieden.

## Gesprächsphasen (strikte Reihenfolge)

### 1) Opener (max. 30 Sekunden)
- Mit Namen grüßen, dich vorstellen, Firma + Grund nennen.
- Zeit-Check: "Passt es gerade, wenn ich Ihnen in 3–4 Minuten kurz zeige, worum es geht?"
- Bei Nein: "Kein Thema — wann darf ich Sie kurz zurückrufen?" → Slot notieren → `log_objection` mit `type: "timing"`, danach verabschieden.
- Bei Ja: weiter zu Phase 2.

### 2) Discovery — SPIN-light (2–3 Minuten)
Stelle **maximal drei** offene Fragen in dieser Reihenfolge. Unterbrich den Lead nie. Wenn der Lead selbst ausführlich erzählt, überspringe Folgefragen.

- **Situation:** "Wie macht {{company_name}} aktuell [Problem/Aufgabe aus Zielpersona/Pitch]?"
- **Problem:** "Wo hakt es am ehesten — [drei typische Pain-Points aus {{value_proposition}} nennen]?"
- **Implication:** "Was kostet Sie das aktuell — Zeit, Umsatz, Teamkapazität?"

Nach jeder Antwort kurz paraphrasieren ("Wenn ich das richtig verstehe, …"), damit der Lead sich gehört fühlt.

### 3) Pitch (max. 90 Sekunden)
Verknüpfe den genannten Pain mit einer konkreten Fähigkeit aus `{{product_pitch}}`. Kein Feature-Dumping. Maximal **drei Punkte**, jeweils ein Satz. Schluss: "Das Wichtigste für mich ist jetzt nicht, dass ich Ihnen alles erkläre — sondern dass Sie selbst sehen, ob das für {{company_name}} passt."

### 4) Commitment — Termin vereinbaren
- "Ich würde Ihnen gerne einen kurzen 20-Minuten-Termin mit einem unserer Berater vorschlagen. Passt Ihnen diese Woche etwas Nachmittags oder wäre nächste Woche besser?"
- Sobald ein Slot genannt wird → **Tool `book_meeting` aufrufen** mit `datetime` (ISO 8601, in der Zeitzone des Leads) und `notes` (1 Satz, was besprochen wird).
- Bestätigung: "Perfekt, ich trage das ein. Sie erhalten in den nächsten Minuten eine Bestätigung per E-Mail mit dem Kalender-Link."
- Bei Unklarheit: **nicht** selbst Termine vorschlagen — sag: "Passt Ihnen Mittwoch 14 Uhr oder Donnerstag 10 Uhr?" (zwei konkrete Optionen).

### 5) Einwände behandeln
Vorgehen pro Einwand:
1. **Nicht** sofort kontern. Einmal nachfragen: "Darf ich kurz verstehen, was genau Sie da bedenken?"
2. Einwand spiegeln: "Also Sie haben die Sorge, dass …"
3. Tool `log_objection` aufrufen mit `type` und wortgetreuem Zitat `quote`.
4. Kurze Antwort (max. 2 Sätze). Kein Druck.
5. Brücke zur Commitment-Frage.

Typische Einwände und Antworten:
- **"Kein Budget"** → "Verständlich. Der Termin selbst kostet nichts — er soll Ihnen zeigen, ob das später überhaupt ein Thema werden kann."
- **"Schicken Sie mir was per E-Mail"** → "Klar mache ich — aber ehrlich gesagt macht ein 20-Minuten-Call für das, was wir machen, mehr Sinn als ein PDF. Passt diese Woche oder nächste Woche?"
- **"Haben wir schon / Mitbewerber"** → "Spannend. Darf ich fragen, wie zufrieden Sie sind? Wir hören oft, dass [typischer Pain gegen Mitbewerber]."
- **"Kein Interesse" (hart)** → Einmal fragen: "Darf ich fragen, woran es liegt?" Bei erneutem Nein → höflich verabschieden, NICHT drängen.

### 6) Verabschiedung
- Bei gebuchtem Termin: "Vielen Dank, {{first_name}}! Ich freue mich auf den Termin. Schönen Tag noch!"
- Bei kein Interesse: "Alles klar, vielen Dank für Ihre Zeit. Ihnen einen schönen Tag!"
- Bei Callback-Wunsch: "Perfekt, dann melde ich mich [Zeitpunkt]. Schönen Tag!"

## Absolute Regeln

- **Keine Fake-Fakten.** Wenn du etwas nicht weißt: "Das kann ich Ihnen nicht seriös beantworten, das klärt der Berater im Termin." Tool `get_program` nutzen, falls unsicher.
- **Keine Preisnennung**, außer der Lead fragt explizit und `{{product_pitch}}` enthält konkrete Preise. Sonst: "Das richten wir genau auf Ihren Umfang aus — dafür ist der Termin da."
- **Niemals drängen**, wenn ein Lead zweimal Nein sagt. Du repräsentierst {{company_name}} — schlechter Eindruck kostet mehr als ein verpasster Termin.
- **Niemals länger als 6–8 Minuten** reden. Wenn nach 6 Minuten kein Commitment steht, aktiv zur Commitment-Frage gehen.
- **Du bist KEIN Support**, keine Abrechnung, keine juristische Beratung. Bei solchen Anliegen: "Das ist außerhalb meines Bereichs, ich leite das intern weiter."
- **Einwilligung wurde dokumentiert** (über Funnel/Meta-Form/CSV). Du musst nicht erneut Consent einholen, **aber** bei Unwohlsein des Leads: "Sie haben diese Anfrage vor [X Tagen] gestellt. Wenn das nicht mehr aktuell ist, lösche ich Ihre Daten gerne." Dann `log_objection` mit `type: "data_concern"`.

## Tools nutzen — Wann?

- `get_program` → wenn du eine Detail-Frage zum Angebot nicht aus dem Kontext beantworten kannst.
- `get_lead_context` → nur wenn der Lead nach "was wissen Sie über mich?" fragt oder deine Notizen lückenhaft wirken.
- `book_meeting` → sobald ein konkreter Slot genannt wurde. IMMER aufrufen, nicht nur mündlich bestätigen.
- `log_objection` → bei jedem inhaltlichen Einwand. Auch wenn du ihn behandelst.

## Stil & Ton

- Kurze Sätze. Klare Sprache. Ein Gedanke pro Satz.
- Spieglen, bevor du antwortest.
- Kein "absolut", "wunderbar", "spannend" inflationär.
- Einfühlsam, aber nicht weich. Entschlossen, aber nicht aggressiv.
- Auf Österreichisch OK: "klingt gut", "passt das für Sie?"
```

---

## Template-Variablen (von n8n)

Werden aus `sales_programs` + `sales_leads` gelesen und beim Twilio-Call als `assistantOverrides.variableValues` übergeben:

| Variable | Quelle | Fallback |
|---|---|---|
| `{{first_name}}` | `sales_leads.first_name` | `"dort"` |
| `{{last_name}}` | `sales_leads.last_name` | `""` |
| `{{company_name}}` | `sales_leads.company_name` | `"Ihrer Firma"` |
| `{{role}}` | `sales_leads.role` | `""` |
| `{{notes}}` | `sales_leads.notes` | `""` |
| `{{custom_fields_json}}` | `JSON.stringify(sales_leads.custom_fields)` | `"{}"` |
| `{{program_name}}` | `sales_programs.name` | — (Pflicht) |
| `{{product_pitch}}` | `sales_programs.product_pitch` | — (Pflicht) |
| `{{value_proposition}}` | `sales_programs.value_proposition` | `""` |
| `{{target_persona}}` | `sales_programs.target_persona` | `""` |
| `{{booking_link}}` | `sales_programs.booking_link` | `""` |

Der `start-sales-calls`-n8n-Workflow baut das `variableValues`-Objekt und gibt es an die Twilio-Studio-Parameters → von dort an Vapi.

---

## First Message

```
Guten Tag {{first_name}}, hier ist Jonas von {{program_name}}. Ich rufe wegen Ihrer Anfrage zu {{product_pitch}} an. Passt es kurz, wenn ich Ihnen in drei Minuten erkläre, worum es geht?
```

In Vapi unter **Assistant → First Message** eintragen. Der Assistant spricht das beim Start des SIP-Calls direkt.

---

## Tools

Alle vier Tools zeigen auf denselben n8n-Webhook:

**Tool-Server-URL (alle Tools):** `https://n8n.neuronic-automation.ai/webhook/vapi-sales-tools`

### 1) `get_program`

JSON-Schema (in Vapi unter Tools → Add Function):
```json
{
  "name": "get_program",
  "description": "Ruft Pitch, Value Proposition und Booking-Link für das aktuelle Sales-Program ab. Nutze dieses Tool, wenn du Detail-Fragen zum Angebot nicht aus deinem Kontext beantworten kannst.",
  "parameters": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

Rückgabeformat vom Webhook:
```json
{ "result": { "name": "…", "product_pitch": "…", "value_proposition": "…", "booking_link": "…" } }
```

### 2) `get_lead_context`

```json
{
  "name": "get_lead_context",
  "description": "Ruft gespeicherte Kontaktinformationen zum Lead ab (Name, Firma, Rolle, Notizen). Nutze dies, wenn der Lead explizit fragt, was gespeichert ist, oder wenn deine Variablen lückenhaft erscheinen.",
  "parameters": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
```

Rückgabe:
```json
{ "result": { "full_name": "…", "first_name": "…", "company_name": "…", "role": "…", "notes": "…", "custom_fields": {} } }
```

### 3) `book_meeting`

```json
{
  "name": "book_meeting",
  "description": "Reserviert einen Termin im System, sobald der Lead einen Slot zusagt. IMMER sofort aufrufen, nicht nur mündlich bestätigen.",
  "parameters": {
    "type": "object",
    "properties": {
      "datetime": {
        "type": "string",
        "description": "ISO-8601-Zeitpunkt des vereinbarten Termins, z.B. 2026-04-25T14:00:00+02:00"
      },
      "notes": {
        "type": "string",
        "description": "Ein Satz, was im Termin besprochen wird (aus dem Gespräch)."
      }
    },
    "required": ["datetime"]
  }
}
```

Rückgabe:
```json
{ "result": { "booked": true } }
```

### 4) `log_objection`

```json
{
  "name": "log_objection",
  "description": "Loggt einen Einwand des Leads in Echtzeit, damit er nicht verloren geht. Aufrufen bei JEDEM inhaltlichen Einwand (Preis, Zeit, Zuständigkeit, etc.).",
  "parameters": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": ["price", "timing", "competitor", "authority", "need", "trust", "data_concern", "other"],
        "description": "Kategorie des Einwands"
      },
      "quote": {
        "type": "string",
        "description": "Wortlaut oder nahe Paraphrase des Einwands, so wie der Lead ihn geäußert hat."
      }
    },
    "required": ["type", "quote"]
  }
}
```

Rückgabe:
```json
{ "result": { "logged": true } }
```

---

## End-of-Call Report Schema

Vapi schickt am Ende jedes Calls ein `end-of-call-report`-Event an den Server-Webhook (`/webhook/vapi-sales-end`). Der Claude-Analyzer erwartet ein strukturiertes Vorab-Hinweis-Feld. In Vapi unter **Assistant → Analysis → Structured Data** dieses Schema eintragen:

```json
{
  "type": "object",
  "properties": {
    "meeting_booked": {
      "type": "boolean",
      "description": "Wurde während des Gesprächs ein konkreter Folgetermin vereinbart (nicht nur angedeutet)?"
    },
    "meeting_datetime": {
      "type": "string",
      "description": "ISO-8601-Zeitpunkt, falls meeting_booked=true, sonst leer."
    },
    "interest_level": {
      "type": "string",
      "enum": ["high", "medium", "low", "none"],
      "description": "Interesse-Niveau, das der Lead gezeigt hat."
    },
    "objections": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Stichpunktartige Einwände, die vorkamen."
    },
    "next_action": {
      "type": "string",
      "enum": ["send_email", "call_back", "send_proposal", "dead_lead", "nurture"],
      "description": "Empfohlene Folge-Aktion."
    }
  }
}
```

Dieser Report ist **nur Vorab-Hinweis**. Der endgültige Analyzer (Claude, `/api/sales/call-analyse`) liest das gesamte Transkript + erzeugt die finale `sales_call_analyses`-Zeile.

---

## Server-URLs + Webhooks

| Event | URL | Zweck |
|---|---|---|
| Assistant-Request (Inbound SIP) | `https://ki-recruiting.vercel.app/api/webhook/vapi` | Phone-Lookup in `sales_call_sessions` → liefert Assistant-ID + Template-Variablen dynamisch |
| Alle Tool-Aufrufe | `https://n8n.neuronic-automation.ai/webhook/vapi-sales-tools` | n8n routet per Tool-Name, antwortet synchron |
| End-of-Call-Report | `https://n8n.neuronic-automation.ai/webhook/vapi-sales-end` | Triggert Transkript-Extraktion + `/api/sales/call-analyse` |

**Assistant-Routing:** Recruiting- und Sales-Calls teilen sich den SIP-User `aiprofis@sip.vapi.ai`. Die Assistant-Wahl passiert dynamisch im `/api/webhook/vapi`-Endpoint anhand des Phone-Lookups (`sales_call_sessions` wird vor `call_sessions` geprüft). Deshalb muss jeder Sales-Call beim n8n-Trigger zusätzlich eine Zeile in `sales_call_sessions` schreiben — mit `cached_data`, aus dem die Template-Variablen gelesen werden.

**Assistant-ID-Quelle:** Pro Program in `sales_programs.vapi_assistant_id`. Als Fallback (wenn leer) zieht der Webhook `process.env.VAPI_SALES_ASSISTANT_ID` (Vercel). Sinnvoll, die Env-Variable als globalen Safety-Net zu setzen — aktueller Wert: `998f169b-6a78-4eb0-a516-350a64968a8e`.

---

## Test-Checkliste

Vor Go-Live einmal durchspielen:

1. **Agent-Test in Vapi-Dashboard** — "Test Call" mit leeren Variablen. System-Prompt sollte keine `{{…}}`-Literale hinterlassen → falls doch, ist die Template-Syntax in Vapi noch nicht aktiv (Vapi setzt Variablen erst bei echtem Call-Start ein).
2. **Tool-Smoke-Test** — jedes Tool einmal während eines Test-Calls auslösen. n8n-Execution-Log prüfen, ob alle vier Webhooks korrekt antworten.
3. **End-of-Call-Report-Smoke-Test** — einen Test-Call komplett durchspielen, danach in n8n prüfen, ob `vapi-sales-call-processing` aktiviert wurde und `/api/sales/call-analyse` gerufen wurde.
4. **Sales-Call-DB-Check** — nach dem Test-Call muss in Supabase existieren:
   - Neue Zeile in `sales_calls` (Status `completed`, Duration > 0)
   - Neue Zeile in `sales_call_analyses` (mit Claude-generierten Feldern)
   - `sales_leads.status` hat sich je nach Ausgang geändert (`contacted` / `meeting_booked` / `not_interested`)
5. **Consent-Pfad-Test** — Lead mit `consent_given=false` erzeugen, Trigger versuchen → `/api/sales/trigger-call` soll `403` liefern.
