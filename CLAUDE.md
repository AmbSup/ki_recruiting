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
Skeleton JSONs in [`scripts/sales/n8n/`](scripts/sales/n8n/) (import into n8n, then fill credentials). Webhook paths:

| Workflow | Webhook | Triggered by | Purpose |
|---|---|---|---|
| Start Sales Calls | `/webhook/start-sales-call` | `/api/sales/trigger-call`, funnel apply, Meta-matcher | Consent + dedupe gates, insert `sales_calls`, Twilio Studio outbound |
| Vapi Sales-End | `/webhook/vapi-sales-end` | Vapi end-of-call report | Extract transcript, POST to `/api/sales/call-analyse` |
| Vapi Sales-Tools | `/webhook/vapi-sales-tools` | Vapi tool calls | Routes `get_program`, `get_lead_context`, `book_meeting`, `log_objection` |
| Meta Leadgen Matcher | `/webhook/meta-leadgen-matcher` | `/api/webhook/meta-leadgen` post-insert | Graph-API fetch → route recruiting vs sales → upsert `sales_leads` → optional auto-dial |

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
No Wait-Node pattern — simpler fire-and-analyze flow:
```
Trigger (Funnel apply / CSV / Meta-matcher / manual UI)
  → POST /api/sales/trigger-call (consent + status-lock)
  → n8n start-sales-calls: insert sales_calls, Twilio Studio outbound
  → Twilio Studio → SIP to Vapi Sales-Assistant (per-program assistant_id)
  → Vapi calls tools via /webhook/vapi-sales-tools (get_program, get_lead_context,
     book_meeting, log_objection)
  → End-of-call report → /webhook/vapi-sales-end → POST /api/sales/call-analyse
  → Claude Sales-Analyzer: sales_call_analyses + update sales_leads.status
```

Consent must be documented at ingest time (`sales_leads.consent_given = true`, `consent_source ∈ funnel_checkbox|meta_form|manual_import`). Terminal statuses (`contacted`, `meeting_booked`, `not_interested`, `do_not_call`) are never regressed to `new` on re-submission.

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
- `sales_programs` — Sales anchor, parallel to `jobs` (pitch, value prop, `vapi_assistant_id`, `booking_link`, `meta_form_ids`, `auto_dial`)
- `sales_leads` — per-program, dedupe via `unique(sales_program_id, phone)`
- `sales_calls` — outbound Sales call chain
- `sales_call_analyses` — Claude output (meeting_booked, interest_level, objections, pain_points, next_action, key_quotes)
- `sales_call_sessions` — Wait-node-resume mirror (currently unused; Sales flow doesn't use Wait)

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
        page.tsx           — Sales dashboard (KPIs + section tiles)
        programs/          — Programs CRUD (anchor)
        leads/             — Leads table, detail with Call-trigger, /import CSV
        calls/             — Sales call list + detail (Analyse + Transkript tabs)
    [slug]/         — Public funnel player (Recruiting + Sales submissions)
    api/
      apply/        — Funnel submissions, branches on job_id vs sales_program_id
      cv-analyse/   — Recruiting CV analysis (maxDuration: 60)
      call-analyse/ — Recruiting call analysis
      upload-cv/    — CV file upload
      sales/
        programs/   — GET list + POST create, [id] GET/PATCH/DELETE
        leads/      — CRUD + /import (CSV with dedupe)
        trigger-call/    — Consent + status-lock + n8n hand-off
        call-analyse/    — Sales call analysis via Claude
        calls/      — GET list + [id] detail (with analysis join)
      webhook/
        vapi/            — Recruiting Vapi end-of-call webhook
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
- `POST /api/sales/trigger-call` — consent + status-lock gate, hands off to n8n
- `POST /api/sales/call-analyse` — Claude analyzer (maxDuration: 60s)
- `GET /api/sales/calls` + `[id]` — Sales calls list + detail with analysis
- `GET/POST /api/webhook/meta-leadgen` — GET = Meta subscription challenge, POST = signature-verify + raw insert + n8n matcher hand-off

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

## Important Constraints
- n8n expressions: `.arguments` is blocked (reserved keyword) → use Code nodes to extract tool call args
- Twilio SIP URI limit: ~1024 chars → only pass minimal IDs, not full job/program data
- Vapi tool webhooks: args come as JS object (already parsed), not JSON string
- Vercel hobby plan: `maxDuration = 60` max for API routes
- Sales `sales_leads` dedupe on `(sales_program_id, phone)` — every ingest path (Funnel, CSV, Meta-match, manual) must lookup-or-update, never blind-insert. Catch PG `23505` and retry as update for race-safety.
- Sales terminal statuses (`contacted`, `meeting_booked`, `not_interested`, `do_not_call`) are never regressed to `new` on re-submission — prevents re-dialing a lead that already said no.
- Sales consent is mandatory: `/api/sales/trigger-call` returns 403 if `consent_given=false`. CSV import requires `consent_confirmed=true` form field.
- Phone normalization: `normalizePhone()` in `src/lib/phone.ts` — default country AT, handles `00` → `+`, bare leading `0` → `+43`.
- Meta Leadgen signature: HMAC-SHA256 of raw body verified against `META_APP_SECRET`. GET challenge needs `META_VERIFY_TOKEN` match.
- Supabase `schema.sql` has pre-existing drift (`ad_campaigns`, `ad_sets`, `ads`, `ad_performance`, `ad_leads`, `call_sessions` not in file). Apply new migrations via `mcp__supabase__apply_migration` directly to prod; optionally regen `schema.sql` from prod after.
