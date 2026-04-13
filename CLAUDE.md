# KI Recruiting Tool — Claude Code Guide

## Project Overview
AI-powered recruiting platform. Candidates apply via funnels → CV analysis → AI phone screening via Vapi/Twilio → pipeline management.

**Stack:** Next.js 15 (App Router), Supabase (Postgres + Auth + Storage), Vercel, n8n (self-hosted), Vapi (AI voice calls), Twilio (telephony), Meta Ads API, Claude AI (Anthropic)

## Infrastructure
- **Frontend/API:** Next.js on Vercel — `d:/KI Recruting Tool/ki-recruiting/`
- **Database:** Supabase — project ref `frsobblncygkmdtrarhq`
- **Automation:** n8n at `https://n8n.neuronic-automation.ai`
- **AI Calls:** Vapi → Twilio SIP → candidate phone
- **n8n local:** Docker via `docker-compose.yml`, data in `n8n_data/`

## Key n8n Workflows
| ID | Name | Purpose |
|----|------|---------|
| `ohoAhUYqenWBAFLL` | Start calls | Triggers outbound calls, stores resume URL, handles Vapi tool webhooks |
| `7m3tzAadFtgcrphe` | Vapi Call Processing | Processes end-of-call reports, resumes n8n Wait node |
| `oGQSqZsJKqx74wR9` | Twilio Call Status | Handles Twilio call status callbacks |

**n8n API key:** in `.mcp.json`

## Call Flow
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

## Supabase Tables (key ones)
- `jobs` — job postings
- `companies` — companies
- `applications` — candidate applications
- `cv_analyses` — CV analysis results (structured_data JSON)
- `call_sessions` — stores `{application_id, resume_url}` for Wait node resume

## Source Structure
```
src/
  agents/           — Claude AI agents (cv-analyzer, call-analyzer, etc.)
  app/
    (operator)/     — Admin dashboard pages
      applicants/   — Pipeline & applicant detail
      calls/        — Call history & detail
      companies/    — Company management
      funnels/      — Funnel builder & editor
      jobs/         — Job management
      dashboard/    — KPIs & overview
    [slug]/         — Public funnel player (candidate-facing)
    api/
      apply/        — Handles funnel submissions
      cv-analyse/   — Triggers CV analysis (maxDuration: 60)
      call-analyse/ — Triggers call analysis
      upload-cv/    — CV file upload
      webhook/
        vapi/       — Vapi end-of-call webhook
        involveme/  — involveme.io webhook
      meta/         — Meta Ads API endpoints
  components/
    operator/       — Dashboard UI components
    ui/             — Base UI components (Button, ImageUpload)
  lib/
    supabase/       — client.ts / server.ts / admin.ts
    utils.ts
  services/
    claude/         — Claude API client
    meta/           — Meta Ads API (campaigns, adsets, ads, insights)
  types/
    meta-ads.ts
```

## API Routes
- `POST /api/apply` — submit funnel application, triggers CV analysis
- `POST /api/cv-analyse` — run CV analysis for application_id (maxDuration: 60s)
- `POST /api/call-analyse` — run call analysis for call_id
- `POST /api/upload-cv` — upload CV PDF to Supabase Storage
- `POST /api/webhook/vapi` — Vapi end-of-call report handler
- `GET/POST /api/meta/*` — Meta Ads management

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
- Twilio SIP URI limit: ~1024 chars → only pass minimal IDs, not full job data
- Vapi tool webhooks: args come as JS object (already parsed), not JSON string
- Vercel hobby plan: `maxDuration = 60` max for API routes
