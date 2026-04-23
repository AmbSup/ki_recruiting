# KI Recruiting Tool — Claude Code Guide

## Project Overview
AI-powered dual-pipeline platform. Two parallel call flows share funnels, Meta ads, Twilio, and a Claude analyzer per side:

- **Recruiting:** candidate applies via funnel → CV analysis → AI screening call → pipeline management (`jobs` anchor).
- **Sales:** lead comes in via Meta-Ads / CSV / Sales-Funnel / manual → AI outbound call → meeting booking (`sales_programs` anchor).

**Stack:** Next.js 15 (App Router), Supabase (Postgres + Auth + Storage), Vercel, n8n (self-hosted), Vapi (AI voice calls), Twilio (telephony), Meta Ads API, Claude AI (Anthropic)

## Dual-Anchor Polymorphism
Three tables target either a Recruiting or a Sales entity — polymorphic via XOR on `job_id` / `sales_program_id`:

| Table | Recruiting side | Sales side | Constraint |
|---|---|---|---|
| `funnels` | `job_id` NOT NULL | `sales_program_id` NOT NULL | strict XOR (exactly one) |
| `ad_campaigns` | `job_id` NOT NULL | `sales_program_id` NOT NULL | strict XOR |
| `ad_leads` | `applicant_id` + `application_id` | `sales_lead_id` | `<= 1` (unmatched state is valid) |

Recruiting null-safety: every read of `funnel.job_id` / `ad_campaign.job_id` must treat null as "the other side owns this row" and skip the recruiting-specific query.

## Infrastructure
- **Frontend/API:** Next.js on Vercel — `d:/KI Recruting Tool/ki-recruiting/`
- **Database:** Supabase — project ref `frsobblncygkmdtrarhq`
- **Automation:** n8n at `https://n8n.neuronic-automation.ai`
- **AI Calls:** Vapi → Twilio SIP → candidate phone
- **n8n local:** Docker via `docker-compose.yml`, data in `n8n_data/`

## Key n8n Workflows

### Recruiting
| ID | Name | Purpose |
|----|------|---------|
| `ohoAhUYqenWBAFLL` | Start calls | Triggers outbound calls, stores resume URL, handles Vapi tool webhooks |
| `7m3tzAadFtgcrphe` | Vapi Call Processing | Processes end-of-call reports, resumes n8n Wait node |
| `oGQSqZsJKqx74wR9` | Twilio Call Status | Handles Twilio call status callbacks |

### Sales
Three workflows deployed + live in n8n (first deploy 2026-04-22, refined through 2026-04-23). One pending Meta-Graph credential. JSON sources in [`scripts/sales/n8n/`](scripts/sales/n8n/) — kept in sync with live state.

| ID | Name | Webhook | Triggered by | Purpose |
|---|---|---|---|---|
| `Jwl2xHatoq1gZlZ4` | Sales — Start Sales Calls | `/webhook/start-sales-call` | `/api/sales/trigger-call`, funnel apply, Meta-matcher | Consent gate, insert `sales_calls`, upsert `sales_call_sessions`, Twilio Studio Execute **form-urlencoded** (flow `FWf3b557…`), `onError`-branch marks `sales_calls.status='failed'` + `end_reason`. No dedupe gate (handled server-side in `/api/sales/trigger-call`). |
| `7MsShq4LLuDbCQVK` | Sales — Vapi Call Processing | `/webhook/vapi-sales-end` | Vapi end-of-call report | IF `end-of-call-report` → extract transcript + 4 identifiers (`sales_call_id`, `sales_lead_id`, `customer_phone`, `vapi_call_id`) → POST `/api/sales/call-analyse`. The call-analyse endpoint does the final ID resolution. |
| `72ExZxrN1Q4BmiEU` | Sales — Vapi Data Tools | `/webhook/vapi-sales-tools` | Vapi tool calls | Extract → **Resolve Lead + Program + recent_calls by phone** (PostgREST embedded-relation join) → Build Context with fallback call ID → Route by Tool → respond in Vapi-compliant `{results:[{toolCallId, result}]}` format. `book_meeting` upserts `sales_call_analyses` with `?on_conflict=sales_call_id`. |
| — | Sales — Meta Leadgen Matcher | `/webhook/meta-leadgen-matcher` | `/api/webhook/meta-leadgen` post-insert | Graph-API fetch → route recruiting vs sales → upsert `sales_leads` → optional auto-dial. **Not yet deployed** — needs Meta Graph credential in n8n first. |

**n8n API key:** in `.mcp.json`

## Call Flows

### Recruiting
```
n8n Start Calls
  → Store resume_url in Supabase call_sessions (keyed by application_id)
  → Twilio API: Make Call with Parameters={application_id, job_id, candidate_id}
  → Twilio Studio: plays "press 1" consent → if pressed → SIP to Vapi
  → Vapi assistant starts, calls tools via webhook:
      POST https://n8n.neuronic-automation.ai/webhook/vapi-data-tools
      → Get_job / Get_company / Get_CV_analysis → Supabase
  → Call ends → Vapi Call Processing reads resume_url from call_sessions → resumes Wait node
```

### Sales
No Wait-Node pattern — fire-and-analyze flow:
```
Trigger (Funnel apply / CSV / Meta-matcher / manual UI "Call starten")
  → POST /api/sales/trigger-call
      ├─ consent gate (403 if no consent_given)
      ├─ auto-cleanup: stale 'initiated' rows >30s old → 'failed'
      ├─ status-lock: 409 if active ringing/in_progress call
      └─ POST n8n /webhook/start-sales-call

  → n8n "Start Sales Calls":
      ├─ fetch lead + program
      ├─ consent IF-gate (belt-and-suspenders)
      ├─ insert sales_calls (status=initiated)
      ├─ build + upsert sales_call_sessions (phone → cached_data{lead, program})
      ├─ Twilio Studio Execute (FWf3b557…) with form-urlencoded body
      │    From=caller_phone_number, To=lead.phone,
      │    Parameters={sales_lead_id, sales_call_id, sales_program_id, vapi_assistant_id}
      ├─ success → update sales_leads.status='calling'
      └─ error   → update sales_calls.status='failed' + end_reason

  → Twilio Studio "Sales Call" Flow
      → SIP URI: sip:neuronic-sales@sip.vapi.ai
                 ;X-sales-lead-id={{trigger.parameters.sales_lead_id}}
                 ;X-sales-call-id={{trigger.parameters.sales_call_id}}
                 ;X-sales-program-id={{trigger.parameters.sales_program_id}}

  → Vapi (SIP credential neuronic-sales, statically bound to Sales-Assistant)
      ├─ Assistant spricht mit Lead
      └─ Tool-Calls → POST n8n /webhook/vapi-sales-tools
          (phone-based lookup, returns {results:[{toolCallId, result}]})

  → Call-Ende → Vapi POST /webhook/vapi-sales-end
      → extract (sales_call_id | sales_lead_id | customer_phone | vapi_call_id)
      → POST /api/sales/call-analyse

  → /api/sales/call-analyse resolves sales_call_id server-side:
      explicit → vapi_call_id match → phone → latest active sales_calls
      → runSalesCallAnalysis:
          ├─ fetch(vapi recording_url) → upload to Supabase Storage "sales-recordings/<id>.wav"
          ├─ update sales_calls (status=completed, transcript, recording_storage_path)
          └─ Claude-Analyzer → upsert sales_call_analyses
              + update sales_leads.status (contacted/meeting_booked/not_interested/...)

  → UI /sales/calls/[id]:
      <audio src="/api/sales/calls/[id]/recording">
        → Signed URL redirect (Supabase Storage) — Vapi fallback for pre-migration calls
```

**Consent** must be documented at ingest time (`sales_leads.consent_given = true`, `consent_source ∈ funnel_checkbox | meta_form | manual_import`). **Terminal statuses** (`contacted`, `meeting_booked`, `not_interested`, `do_not_call`) never regress to `new` on re-submission.

**Twilio Studio body format:** The HTTP call to Studio Executions API must be `application/x-www-form-urlencoded`, NOT JSON — Twilio silently rejects JSON with 400 "Missing required parameter". The n8n node uses `contentType: "form-urlencoded"` + keypair `bodyParameters` (`specifyBody: "form"` is not valid in HTTP Request v4.2).

## Supabase Tables (key ones)

### Recruiting
- `jobs` — job postings (anchor)
- `companies` — companies (shared anchor)
- `applicants` — person-level record, **new row per submission** (same email can apply multiple times with different names)
- `applications` — `applicant × job × funnel`, unique on `(applicant_id, job_id)`
- `cv_analyses` — CV analysis results (`structured_data` JSON)
- `voice_calls` / `transcripts` / `call_analyses` — Recruiting call chain
- `call_sessions` — stores `{application_id, resume_url}` for Wait-node resume

### Sales
- `sales_programs` — Sales anchor, parallel to `jobs` (pitch, value prop, `target_persona`, `vapi_assistant_id`, `caller_phone_number` (Twilio-owned E.164!), `booking_link`, `meta_form_ids`, `auto_dial`)
- `sales_leads` — per-program, dedupe via `unique(sales_program_id, phone)`. Normalized phone via `src/lib/phone.ts`.
- `sales_calls` — outbound call chain. `recording_url` points at Vapi storage (original); `recording_storage_path` points at Supabase Storage bucket `sales-recordings` (mirrored by analyzer).
- `sales_call_analyses` — Claude output (meeting_booked, meeting_datetime, interest_level, call_rating, sentiment, summary, objections[], pain_points[], next_action, next_action_at, key_quotes[]). Unique on `sales_call_id` → upserts via PostgREST `?on_conflict=sales_call_id` + `Prefer: resolution=merge-duplicates`.
- `sales_call_sessions` — phone → Vapi-assistant-request context. `sales_lead_id` PK, `cached_data` JSONB with lead + program snapshot (first_name, company_name, product_pitch, booking_link, …). Written by n8n Start-Sales-Calls after insert. `resume_url` nullable — Sales doesn't use Wait nodes.

### Supabase Storage
- **Bucket `sales-recordings`** (private, 50 MB file limit, `audio/*` mime whitelist)
  - Created by migration `20260423_sales_calls_recording_storage`
  - RLS: `admin`, `operator`, `viewer` roles can SELECT from `storage.objects` for this bucket
  - Path format: `<sales_call_id>.<ext>` where ext ∈ wav/mp3/ogg/m4a based on upstream content-type
  - Analyzer mirrors on end-of-call (Vapi → Supabase); if upload fails, analysis still proceeds and UI falls back to Vapi URL via the proxy
  - Retrieval: `/api/sales/calls/[id]/recording` creates 1h signed URL + `307` redirects — browser streams from Supabase CDN with full Range support

### Polymorphic
- `funnels`, `ad_campaigns`, `ad_leads` — see Dual-Anchor-Polymorphism above

### Legacy (dropped)
- `campaigns` — v1 platform-agnostic ad table, superseded by `ad_campaigns` hierarchy. Dropped in migration `20260421_sales_anchor_and_xor_polymorphism` along with its enums `campaign_status` + `ad_platform`.

## Source Structure
```
src/
  agents/
    cv-analyzer/          — Recruiting: CV → structured analysis
    call-analyzer/        — Recruiting: transcript → interview analysis
    sales-call-analyzer/  — Sales: transcript → meeting_booked + SalesCallAnalysis
    campaign-creator/ audience-optimizer/ performance-analyzer/ kill-switch/
  app/
    (operator)/     — Admin dashboard pages
      applicants/   — Recruiting pipeline & applicant detail
      calls/        — Recruiting call history & detail
      companies/ jobs/ funnels/ ads-setup/ campaigns/ dashboard/ invoices/
      sales/        — Sales section
        page.tsx                 — Sales dashboard (KPIs + section tiles)
        programs/
          page.tsx               — Programs list (with ProgramModal for create)
          [id]/page.tsx          — Program edit + "Test-Lead anlegen" button
          program-modal.tsx      — Shared create-modal
        leads/
          page.tsx               — Leads table (filters, "Neuer Lead" button)
          [id]/page.tsx          — Detail with Call-trigger + structured error banner
          import/page.tsx        — CSV upload
          lead-modal.tsx         — Manual create with all Vapi template-vars + custom_fields + consent
        calls/
          page.tsx               — Call list with mini-stats
          [id]/page.tsx          — Detail (Lead-Info, Analyse-Kennzahlen, Audio player, Analyse/Transkript tabs)
    [slug]/         — Public funnel player (Recruiting + Sales submissions)
    api/
      apply/        — Funnel submissions, branches on job_id vs sales_program_id
      cv-analyse/   — Recruiting CV analysis (maxDuration: 60)
      call-analyse/ — Recruiting call analysis
      upload-cv/    — CV file upload
      sales/
        programs/   — GET list + POST create, [id] GET/PATCH/DELETE
        leads/      — CRUD + /import (CSV with dedupe)
        trigger-call/    — Consent + stale-cleanup + status-lock + n8n hand-off
        call-analyse/    — Sales call analysis via Claude (with ID-resolution fallback)
        calls/      — GET list + [id] detail (with analysis join) + [id]/recording (audio proxy)
      webhook/
        vapi/            — Vapi assistant-request handler: checks sales_call_sessions
                           (SIP header X-sales-lead-id > phone lookup) first, then
                           falls back to Recruiting call_sessions. Returns
                           {assistant:{id, variableValues:{...}}} for whichever side matches.
        involveme/       — involve.me webhook (Recruiting only)
        meta-leadgen/    — Meta Leadgen signature-verify + raw insert + n8n hand-off
      meta/         — Meta Ads API endpoints
  components/
    operator/       — Dashboard UI components (KpiCard, sidebar, etc.)
    ui/             — Base UI components (Button, ImageUpload)
  lib/
    supabase/       — client.ts / server.ts / admin.ts
    phone.ts        — E.164 normalization + isTerminalSalesStatus
    csv.ts          — Minimal RFC 4180 parser (no dep)
    utils.ts
  services/
    claude/         — Claude API client
    meta/           — Meta Ads API (campaigns, adsets, ads, insights)
  types/
    meta-ads.ts
scripts/sales/n8n/  — Sales workflow skeletons (see README there)
docs/
  vapi-sales-agent.md  — Full Vapi Sales-Assistant configuration + prompt
```

## API Routes

### Recruiting
- `POST /api/apply` — funnel submission; branches to Recruiting (create applicant+application) or Sales (upsert sales_lead) based on payload
- `POST /api/cv-analyse` — run CV analysis for `application_id` (maxDuration: 60s)
- `POST /api/call-analyse` — run call analysis for `application_id`
- `POST /api/upload-cv` — upload CV PDF to Supabase Storage
- `POST /api/webhook/vapi` — Recruiting Vapi end-of-call handler
- `POST /api/webhook/involveme` — involve.me webhook (Recruiting only; rejects Sales funnels with 400)
- `GET/POST /api/meta/*` — Meta Ads management

### Sales
- `GET/POST /api/sales/programs` + `[id]` — Programs CRUD
- `GET/POST /api/sales/leads` + `[id]` — Leads CRUD
- `POST /api/sales/leads/import` — CSV import (multipart/form-data, `consent_confirmed=true` required)
- `POST /api/sales/trigger-call` — consent + stale-cleanup (>30s `initiated` → `failed`) + status-lock (409 with `{error, sales_call_id, status}` if active `ringing`/`in_progress`) + n8n hand-off
- `POST /api/sales/call-analyse` — Claude analyzer (maxDuration: 60s). Resolves `sales_call_id` via fallback chain: body → `vapi_call_id` lookup → `customer_phone` → latest active sales_calls for that lead. Returns 422 only if none resolves.
- `GET /api/sales/calls` + `[id]` — Sales calls list + detail with analysis
- `GET /api/sales/calls/[id]/recording` — Audio proxy: Supabase signed URL + 307 redirect, falls back to Vapi storage streaming for pre-migration calls
- `POST /api/webhook/vapi` — Shared Vapi assistant-request handler (Sales-first, Recruiting fallback)
- `GET/POST /api/webhook/meta-leadgen` — GET = Meta subscription challenge, POST = signature-verify + raw insert + n8n matcher hand-off

## Vapi Configuration

Vapi serves both pipelines via **two SIP credentials** on the same Vapi account. The Next.js webhook `/api/webhook/vapi` receives `assistant-request` only if the SIP credential has NO static assistant bound.

| SIP Credential | Server URL | Assistant binding | Pipeline |
|---|---|---|---|
| `sip:aiprofis@sip.vapi.ai` | `https://n8n.neuronic-automation.ai/webhook/vapi-end-of-call` | static: Recruiting-Assistant | Recruiting (unchanged, end-of-call only) |
| `sip:neuronic-sales@sip.vapi.ai` | `https://ki-recruiting.vercel.app/api/webhook/vapi` | static: Sales-Caller (`998f169b-6a78-4eb0-a516-350a64968a8e`) | Sales |

**Assistant-level Server URL** (per assistant) is set on the Sales-Assistant: `https://n8n.neuronic-automation.ai/webhook/vapi-sales-end` — receives `end-of-call-report`.

**Custom Tools** on the Sales-Assistant all point at `https://n8n.neuronic-automation.ai/webhook/vapi-sales-tools`:
- `get_program` (no args) — pitch, value_prop, booking_link
- `get_lead_context` (no args) — name, company, role, notes, custom_fields
- `book_meeting` ({datetime, notes}) — upserts `sales_call_analyses.meeting_booked/meeting_datetime`
- `log_objection` ({type, quote}) — noop (Claude analyzer reconstructs from transcript)

Schemas in [docs/vapi-sales-agent.md](docs/vapi-sales-agent.md).

**Static-binding side-effect:** With `neuronic-sales` statically bound to the Sales-Assistant, Vapi skips the assistant-request webhook → `variableValues` stays empty → the Vapi system prompt's `{{first_name}}`/`{{company_name}}` etc. don't get substituted. The agent talks with literal placeholders. Mitigations:
- Tools (`get_lead_context`, `get_program`) populate context on-demand mid-conversation.
- n8n tools + call-processing workflows resolve the call via `call.customer.number` + `call.customer.sipHeaders['x-sales-lead-id']` (headers forwarded from the Twilio Studio SIP URI).
- To fully fix: clear the Assistant/Workflow selection on the SIP credential in Vapi so the webhook fires. Vapi UI sometimes requires clicking an X-chip or refreshing to allow empty selection.

## Development
```bash
cd "d:/KI Recruting Tool/ki-recruiting"
npm run dev        # Next.js dev server
docker-compose up  # Local n8n instance (separate from production)
```

## n8n Workflow Updates
Always download fresh before modifying — scripts in `C:/Users/marti/.claude/projects/d--KI-Recruting-Tool/`:
```bash
# Download
curl -H "X-N8N-API-KEY: ..." https://n8n.neuronic-automation.ai/api/v1/workflows/ID > workflow.json
# Build PUT payload with a build_*.js script
node build_*.js
# Upload
curl -X PUT -H "..." .../workflows/ID -d @workflow_put.json
```

## Environment Variables (Vercel)

### Pre-existing (Recruiting + general)
`ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `N8N_BASE_URL`, `N8N_WEBHOOK_SECRET`, `VAPI_ASSISTANT_ID`, `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_PAGE_ID`, `META_PIXEL_ID`, `NEXT_PUBLIC_META_APP_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_META_AD_ACCOUNT_ID`, `NEXT_PUBLIC_FUNNEL_BASE_URL`, `INVOLVEME_WEBHOOK_SECRET`, `REPLICATE_API_TOKEN`

### Sales-new

| Var | Required? | Purpose |
|---|---|---|
| `VAPI_SALES_ASSISTANT_ID` | **Optional fallback** | Vapi assistant used if `sales_programs.vapi_assistant_id` is null when `/api/webhook/vapi` resolves an incoming SIP call. Current known Sales-Assistant ID: `998f169b-6a78-4eb0-a516-350a64968a8e`. Recommended: set this as a global safety net in Vercel. |
| `META_APP_SECRET` | **Required only** if `/api/webhook/meta-leadgen` is wired in Meta | Used to verify the `x-hub-signature-256` HMAC of incoming Meta Leadgen events. If not set, route returns 500. |
| `META_VERIFY_TOKEN` | **Required only** if subscribing the webhook in Meta Developer console | Must match the `hub.verify_token` query string Meta sends during the subscription-challenge handshake. User-chosen string, copy into both Meta app + Vercel. |

Until Meta Leadgen ingest is turned on, the two `META_*` vars can stay unset — the route only errors when actually invoked.

## Important Constraints

### General / Infra
- Vercel hobby plan: `maxDuration = 60` max for API routes
- Supabase `schema.sql` has pre-existing drift (`ad_campaigns`, `ad_sets`, `ads`, `ad_performance`, `ad_leads`, `call_sessions` not in file). Apply new migrations via `mcp__supabase__apply_migration` directly to prod; optionally regen `schema.sql` from prod after.

### n8n
- n8n expressions: `.arguments` is blocked (reserved keyword) → use Code nodes to extract tool-call args
- n8n tmpl engine does **not** support optional chaining (`?.`) or nullish coalescing (`??`) in expressions. Use `$json.x && $json.x.y` / `|| ''` instead. Code nodes (real JS) do support them.
- n8n Supabase node v1 has **no `upsert` operation** (only create/get/getAll/update/delete) and mangles PostgREST `in.(…)` filters (treats inner commas as logic-tree separators). Both cases → use HTTP Request with `nodeCredentialType: "supabaseApi"` instead:
  - Upsert: `POST /rest/v1/<table>` + header `Prefer: resolution=merge-duplicates` (+ `?on_conflict=<col>` if the conflict column isn't the PK)
  - Arrays in filters: build URL manually with `?col=in.(a,b,c)` syntax
- HTTP Request v4.2 form body: set `contentType: "form-urlencoded"` + keypair `bodyParameters.parameters` (the dropdown value `"form"` for `specifyBody` is **not valid**).
- When sending URL-query values that contain reserved chars (e.g. phone `+`), wrap interpolations in `encodeURIComponent(...)` — `+` becomes space otherwise.

### Twilio
- Twilio SIP URI limit: ~1024 chars → only pass minimal IDs, not full job/program data
- Twilio Studio Executions API requires **form-encoded** bodies (`application/x-www-form-urlencoded`), NOT JSON. `Parameters` field itself is a JSON-stringified value within the form body.
- Twilio requires `From` to be a **Twilio-owned** phone number in E.164 format (`+43…`, not `0043…`). Lead's phone goes in `To`.
- Phone numbers can only be bound to **one inbound Studio Flow** — irrelevant for outbound (n8n calls flows by SID). For Sales outbound calls on the Recruiting phone number, no re-binding needed; "Connected phone numbers" = `--` on the Sales Flow is correct.

### Sales-specific
- `sales_leads` dedupe on `(sales_program_id, phone)` — every ingest path (Funnel, CSV, Meta-match, manual) must lookup-or-update, never blind-insert. Catch PG `23505` and retry as update for race-safety.
- Terminal statuses (`contacted`, `meeting_booked`, `not_interested`, `do_not_call`) are never regressed to `new` on re-submission — prevents re-dialing a lead that already said no.
- Consent is mandatory: `/api/sales/trigger-call` returns 403 if `consent_given=false`. CSV import requires `consent_confirmed=true` form field. LeadModal disables Submit until the consent checkbox is ticked.
- Phone normalization: `normalizePhone()` in `src/lib/phone.ts` — default country AT, handles `00` → `+`, bare leading `0` → `+43`.
- Meta Leadgen signature: HMAC-SHA256 of raw body verified against `META_APP_SECRET`. GET challenge needs `META_VERIFY_TOKEN` match.
- `sales_call_id` resolution is multi-path: variableValues → SIP header `X-sales-call-id` → server-side fallback via phone → latest active `sales_calls` row. Always emit the `customer_phone` and `vapi_call_id` from n8n so the server can resolve even when the static-binding swallows variableValues.
- `sales_call_analyses` has UNIQUE on `sales_call_id` (not PK). PostgREST upsert needs `?on_conflict=sales_call_id` explicitly; `merge-duplicates` alone targets the PK.
- Claude Sales-Analyzer prompt must pin the current date (`HEUTE: <weekday>, YYYY-MM-DD`) with explicit "Zukunft"-instruction for `meeting_datetime` and `next_action_at` — without it the model hallucinates past dates.
- Vapi tool responses must follow `{results:[{toolCallId, result: "<stringified>"}]}` — the older `{result: {…}}` envelope causes "No result returned" in Vapi dashboard.
- Vapi tool webhooks: args come as JS object (already parsed), not JSON string.

### Recording retention
- Vapi storage has plan-bound retention (30–90 days depending on tier). The Sales analyzer mirrors each recording into Supabase Storage bucket `sales-recordings` on end-of-call, so playback survives Vapi purges.
- The `<audio>` element in the UI always points at `/api/sales/calls/[id]/recording` (same-origin). The proxy prefers Supabase Storage and only falls back to Vapi if `recording_storage_path` is null (pre-migration calls).
