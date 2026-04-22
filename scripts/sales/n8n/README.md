# Sales — n8n Workflow Skeletons

Four workflows that mirror the Recruiting call-automation, adapted for AI-driven outbound sales.

**Three are already deployed** to the prod n8n instance (2026-04-22) via the n8n MCP — no manual import needed. IDs below.

The fourth (`meta-leadgen-matcher.json`) is **not yet deployed** because it requires a Meta Graph Page Access Token credential that doesn't exist yet. Import manually once that credential is created in n8n.

## Workflows

| File | n8n Workflow ID | Webhook path | Triggered by | Purpose |
|---|---|---|---|---|
| `start-sales-calls.json` | `Jwl2xHatoq1gZlZ4` | `/webhook/start-sales-call` | `/api/sales/trigger-call` (or directly from UI, Meta-matcher, etc.) | Load lead + program, consent + dedupe gates, insert `sales_calls`, upsert `sales_call_sessions` (Phone-Lookup-Kontext für Vapi), outbound via Twilio Studio. |
| `vapi-sales-call-processing.json` | `7MsShq4LLuDbCQVK` | `/webhook/vapi-sales-end` | Vapi end-of-call report | Extract transcript + metadata, POST to `/api/sales/call-analyse`. |
| `vapi-sales-tools.json` | `72ExZxrN1Q4BmiEU` | `/webhook/vapi-sales-tools` | Vapi tool calls during the call | Route by tool name (`get_program`, `get_lead_context`, `book_meeting`, `log_objection`) and respond. |
| `meta-leadgen-matcher.json` | — (not deployed) | `/webhook/meta-leadgen-matcher` | `/api/webhook/meta-leadgen` after raw insert | Fetch lead fields via Meta Graph API, decide recruiting vs sales target via `ad_campaign`, upsert `sales_leads`, optionally auto-dial. |

## Deployed state (already wired)

The three active workflows reference these n8n credentials:
- Supabase: `ZBhoJp0VDK4YwJ7b` ("Supabase account") — used for all DB ops and for the Prefer-header upserts against `sales_call_sessions` + `sales_call_analyses`
- Twilio: `AGT4eJcf8gZIc8pO` ("Twilio account") — used by the HTTP Request to Twilio Studio

## Still required before activation

1. **Activate the three workflows** in n8n UI (toggle "Active" switch). They are created inactive by the MCP.
2. **Twilio Studio Flow SID** — already set in `start-sales-calls.json` to `FWf3b5573e6cfff5829c85c7a260073154` ("Sales Call" Studio Flow). Make sure the flow's SIP widget routes to the Sales Vapi SIP URI (`sip:aiprofis@sip.vapi.ai` with `X-sales-lead-id`, `X-sales-call-id`, `X-sales-program-id` as SIP parameters).
3. **Vapi-Sales-Assistant-ID** — pro Program in `sales_programs.vapi_assistant_id`, OR als Vercel-Env `VAPI_SALES_ASSISTANT_ID` als Fallback. Verfügbar: `998f169b-6a78-4eb0-a516-350a64968a8e`.

## Meta-Leadgen-Matcher (manual import when ready)

`meta-leadgen-matcher.json` ist nicht deployed, weil die Meta-Graph-Credential in n8n noch fehlt. Sobald der User die Meta-Credential anlegt:
- `REPLACE_META_GRAPH_CREDENTIAL_ID` in der JSON durch die echte Credential-ID ersetzen
- Via n8n UI importieren oder via MCP `n8n_create_workflow` erzeugen

## App URL

Die HTTP-Request-Nodes zeigen auf `https://ki-recruiting.vercel.app`. Bei Domain-Wechsel bzw. Branch-Deploys betroffen:
- `vapi-sales-call-processing.json` → `POST /api/sales/call-analyse`
- `meta-leadgen-matcher.json` → `POST /api/sales/trigger-call`

## Flow summary

```
Funnel-Submit ─┐
CSV-Import ────┤
Manual UI ─────┼──► /api/sales/trigger-call ──► start-sales-calls ──► Twilio Studio ──► Vapi assistant
Meta Leadgen ──┘                                                                         │
                                                                                          ├── tool calls ──► vapi-sales-tools
                                                                                          │
                                                                                          └── end-of-call ──► vapi-sales-call-processing ──► /api/sales/call-analyse ──► Claude analyzer
```

## What's still TODO in these skeletons

- `meta-leadgen-matcher.json`: recruiting branch is a noop (placeholder). When Meta Leads for recruiting becomes a real ingest path, fill in applicant + application upsert.
- `start-sales-calls.json` does not use a Wait node. If you later want server-driven retry logic (e.g., redial on no-answer after N minutes), add a Wait → resume-URL pattern analogous to the recruiting workflow in `booking_nodes.json`.
- `vapi-sales-tools.json` `book_meeting` tool currently persists `meeting_booked=true + meeting_datetime` directly. The Claude analyzer will overwrite these fields when the call ends. If you want earlier UI visibility, this is fine; otherwise remove and let the analyzer own it.
