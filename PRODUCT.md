# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary customers and users are SME owners. They use the product to respond to incoming applicants and sales leads quickly, qualify them consistently, and manage the resulting pipeline without requiring continuous manual availability.

## Product Purpose

The product automatically calls and qualifies new applicants or leads within 30 seconds, 24/7, then helps the user manage the resulting pipeline. Success means reducing response time and manual qualification work while giving SME owners a clear operational view of each applicant or lead.

## Positioning

Neuronic combines near-immediate automated calling, qualification, and downstream pipeline management in one product for SMEs. Its central promise is that a new applicant or lead can be contacted and qualified within 30 seconds at any time of day.

## Operating Context

The product supports recruiting and sales workflows. The repository contains applicant pipelines, calls, funnels, campaigns, analytics, sales programs, advertisements, and operator dashboards. It also contains integrations and workflows involving Supabase, Vapi, Meta lead ads, Cal.com, Twilio, and n8n; these are implementation evidence rather than commitments that every customer workflow must use every integration.

## Capabilities and Constraints

- Automatically call and qualify new applicants or leads within 30 seconds.
- Operate continuously, 24/7.
- Manage applicants and leads after qualification through a pipeline.
- Meet applicable GDPR/DSGVO requirements throughout data collection, calling, storage, access, retention, export, and erasure workflows.
- Treat German as the primary product language; English may be supported secondarily.
- Preserve Neuronic branding.
- Do not invent performance claims, customer outcomes, consent language, or compliance guarantees beyond evidence that has been reviewed and approved.

## Brand Commitments

The product uses Neuronic branding. German is the primary language. Existing brand assets include `public/branding/neuronic-logo.png` and marketing imagery under `public/marketing/`.

## Evidence on Hand

- Neuronic logo: `public/branding/neuronic-logo.png`
- Existing German and English marketing surfaces: `src/app/(marketing)/`
- Recruiting and sales operator workflows: `src/app/(operator)/`
- GDPR documentation and implementation evidence: `docs/DSGVO-Checkliste.md`, `docs/datenschutzerklaerung-template.md`, and `src/lib/gdpr/`
- Database schema, RLS policies, migrations, and consent-related fields: `supabase/`
- Existing visual reference: `design.md`
- No customer outcome figures, testimonials, or independently verified performance benchmarks were confirmed during initialization; future work must not fabricate them.

## Product Principles

1. Respond while intent is fresh: contact every new applicant or lead as close to submission as possible.
2. Automate without losing operational clarity: SME owners must be able to understand and manage what the system did.
3. Make qualification consistent across hours, channels, and use cases.
4. Treat privacy, consent, and data lifecycle controls as core product behavior.
5. Lead in German while preserving a coherent path for secondary-language support.

## Accessibility & Inclusion

No product-specific accessibility standard was confirmed during initialization. Accessibility requirements remain an explicit open decision; future surfaces should at minimum follow established web accessibility practices and must not rely on language, color, or motion alone to communicate critical state.
