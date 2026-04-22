# Sales — n8n Workflow Skeletons

Four workflows that mirror the Recruiting call-automation, adapted for AI-driven outbound sales. Import into n8n via **Workflows → Import from File**.

## Workflows

| File | Webhook path | Triggered by | Purpose |
|---|---|---|---|
| `start-sales-calls.json` | `/webhook/start-sales-call` | `/api/sales/trigger-call` (or directly from UI, Meta-matcher, etc.) | Load lead + program, consent + dedupe gates, insert `sales_calls`, outbound via Twilio Studio. |
| `vapi-sales-call-processing.json` | `/webhook/vapi-sales-end` | Vapi end-of-call report (configured on the Sales assistant in Vapi) | Extract transcript + metadata, POST to `/api/sales/call-analyse`. |
| `vapi-sales-tools.json` | `/webhook/vapi-sales-tools` | Vapi tool calls during the call | Route by tool name (`get_program`, `get_lead_context`, `book_meeting`, `log_objection`) and respond. |
| `meta-leadgen-matcher.json` | `/webhook/meta-leadgen-matcher` | `/api/webhook/meta-leadgen` after raw insert | Fetch lead fields via Meta Graph API, decide recruiting vs sales target via `ad_campaign`, upsert `sales_leads`, optionally auto-dial. |

## Setup before activation

1. **Supabase credential** — create once in n8n (`Credentials → New → Supabase`), supply URL + service-role key. Replace every occurrence of `REPLACE_SUPABASE_CREDENTIAL_ID` in the imported workflows with the actual credential ID (n8n also shows a "Select credential" dropdown after import).
2. **Twilio credential** (HTTP Basic Auth — Account SID + Auth Token). Used in `start-sales-calls.json`. Replace `REPLACE_TWILIO_CREDENTIAL_ID`.
3. **Twilio Studio Flow SID** — already set in `start-sales-calls.json` to `FWf3b5573e6cfff5829c85c7a260073154` ("Sales Call" Studio Flow). Flow plays consent prompt and routes to Vapi SIP for the Sales-Assistant.
4. **Meta Graph credential** (HTTP Header Auth — `Authorization: Bearer <PAGE_ACCESS_TOKEN>`). Used in `meta-leadgen-matcher.json`. Replace `REPLACE_META_GRAPH_CREDENTIAL_ID`.
5. **App URL** — the HTTP Request nodes currently hardcode `https://ki-recruiting.vercel.app`. If you move off Vercel or use a branch deploy URL, update the three matching URLs:
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
