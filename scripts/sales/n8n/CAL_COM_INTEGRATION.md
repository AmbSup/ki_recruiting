# n8n: Sales — Vapi Data Tools — Cal.com-Integration-Update

Diese Anleitung beschreibt die Änderungen am n8n-Workflow `72ExZxrN1Q4BmiEU`
("Sales — Vapi Data Tools"), damit die neuen Vapi-Tools `get_available_slots`,
`book_meeting` (umgebaut), `send_booking_link` an unsere Next.js-Endpoints
gehen statt direkt in Supabase zu schreiben.

## Wer macht was

| Layer | Verantwortung |
|---|---|
| **Next.js** (`/api/sales/calendar/{slots,book,send-link}`) | Cal.com-API-Calls + DB-Writes (`sales_meetings`) + SMS-Fallback |
| **n8n** (dieser Workflow) | Routing der Vapi-Tool-Calls + Vapi-konforme Response-Envelope (`{results:[{toolCallId, result:"<stringified>"}]}`) |

n8n ist bewusst dünn gehalten — Cal.com-API-Key bleibt in Vercel-Env.

## Drei neue Routen + 1 Umbau

### 1. NEU `get_available_slots`

**Branch nach `Route by Tool` (Switch-Node) hinzufügen:**

- Condition: `{{ $json.tool_name }} === "get_available_slots"`
- HTTP Request (Method: GET) →
  `https://ki-recruiting.vercel.app/api/sales/calendar/slots?program_id={{$json.sales_program_id}}&date_from={{$json.tool_args.date_from || ''}}&date_to={{$json.tool_args.date_to || ''}}&limit=3`
- Response → Code-Node, der die Response in Vapi-Envelope verpackt:
  ```js
  const slots = $json.slots ?? [];
  const text = slots.length === 0
    ? "Keine freien Slots in den nächsten 14 Tagen."
    : slots.map((s, i) => `Option ${i+1}: ${s.label_de} (start: ${s.start})`).join("\n");
  return [{ json: { results: [{ toolCallId: $('Extract Tool & Args').first().json.tool_call_id, result: text }] } }];
  ```

### 2. UMBAU `book_meeting`

**Bisheriger Branch:** schreibt direkt in `sales_call_analyses` per Supabase HTTP Request.
**Neu:** ruft Next.js auf, bekommt strukturiertes Ergebnis zurück.

- HTTP Request (Method: POST) →
  `https://ki-recruiting.vercel.app/api/sales/calendar/book`
- Body (JSON):
  ```json
  {
    "sales_call_id": "{{$json.sales_call_id}}",
    "start": "{{$json.tool_args.start}}",
    "notes": "{{$json.tool_args.notes || ''}}"
  }
  ```
- Response → Code-Node:
  ```js
  const r = $json;
  let text;
  if (r.ok) {
    text = `Termin gebucht für ${r.start}. Bestätigung kommt per E-Mail.`;
  } else if (r.fallback?.sms_sid) {
    text = "Buchung nicht möglich, ich habe Ihnen den Buchungslink per SMS geschickt.";
  } else {
    text = `Buchung fehlgeschlagen: ${r.reason ?? 'unbekannter Fehler'}.`;
  }
  return [{ json: { results: [{ toolCallId: $('Extract Tool & Args').first().json.tool_call_id, result: text }] } }];
  ```

### 3. NEU `send_booking_link`

- Condition: `{{ $json.tool_name }} === "send_booking_link"`
- HTTP Request (Method: POST) →
  `https://ki-recruiting.vercel.app/api/sales/calendar/send-link`
- Body:
  ```json
  { "sales_call_id": "{{$json.sales_call_id}}" }
  ```
- Response → Code-Node:
  ```js
  const ok = $json.success === true;
  const text = ok
    ? "Buchungslink per SMS gesendet."
    : `SMS-Versand fehlgeschlagen: ${$json.error ?? 'unbekannt'}.`;
  return [{ json: { results: [{ toolCallId: $('Extract Tool & Args').first().json.tool_call_id, result: text }] } }];
  ```

### 4. (Backward-Compat) `book_meeting` mit `datetime` statt `start`

Während der Tool-Schema-Umstellung kann ein laufender Call noch das alte
`datetime`-Param senden. Im `book_meeting`-Branch das Body-Mapping so erweitern:

```json
{
  "sales_call_id": "{{$json.sales_call_id}}",
  "start": "{{$json.tool_args.start || $json.tool_args.datetime}}",
  "notes": "{{$json.tool_args.notes || ''}}"
}
```

## Update-Workflow (per CLAUDE.md-Pattern)

```bash
# 1. Aktuell deployten Workflow ziehen
curl -H "X-N8N-API-KEY: $N8N_API_KEY" \
  https://n8n.neuronic-automation.ai/api/v1/workflows/72ExZxrN1Q4BmiEU \
  > workflow.json

# 2. Im n8n-Editor (https://n8n.neuronic-automation.ai/workflow/72ExZxrN1Q4BmiEU)
#    die 3 neuen Routen + den book_meeting-Umbau klicken — schneller + sicherer
#    als JSON-Surgery. Achtet auf den Switch-Node "Route by Tool":
#      - neue Conditions hinzufügen
#      - alte book_meeting-DB-Writes durch HTTP Request ersetzen
#    Save im Editor reicht; n8n persistiert.

# 3. Updated Workflow erneut ziehen (für Repo-Sync)
curl -H "X-N8N-API-KEY: $N8N_API_KEY" \
  https://n8n.neuronic-automation.ai/api/v1/workflows/72ExZxrN1Q4BmiEU \
  > scripts/sales/n8n/vapi-sales-tools.json

# 4. Commit
git add scripts/sales/n8n/vapi-sales-tools.json
git commit -m "n8n(sales-tools): wire Cal.com routes for get_available_slots, book_meeting, send_booking_link"
```

## Warum NICHT auto-patchen

Der Workflow hat ein gewachsenes Switch-Node-Layout mit Position-Coordinates
(für UI-Lesbarkeit) und mehreren `connections`-Verzweigungen. Ein Build-Script
müsste alle Edges + Switch-Conditions korrekt setzen, was bei einem einzigen
Sync mehr Risiko bringt als Wert. Daher: UI-Edit + Re-Download nach Sync.

## Smoke-Test nach Update

1. Test-Lead anlegen mit eigener Telefon + Email
2. Call starten
3. Im Vapi-Dashboard die Tool-Logs prüfen:
   - `get_available_slots` returnt 3 Slots in DACH-Format
   - `book_meeting` returnt entweder "Termin gebucht" oder "Per SMS gesendet"
4. In `/sales/calendar` prüfen ob die Buchung sichtbar ist
