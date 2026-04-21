-- ============================================================
-- KI Recruiting Automation Platform – Vollständiges Schema v2
-- Version 2.0 | April 2026
-- Korrekte Architektur: Applicant → Application → Job
-- ============================================================

-- Enum Typen
create type user_role as enum ('admin', 'operator', 'viewer', 'customer');
create type billing_plan as enum ('per_job', 'monthly', 'custom');
create type company_status as enum ('active', 'paused', 'churned');
create type employment_type as enum ('fulltime', 'parttime', 'minijob', 'internship', 'freelance');
create type job_status as enum ('draft', 'active', 'paused', 'closed', 'filled');
create type funnel_status as enum ('draft', 'active', 'paused', 'archived');
create type page_type as enum ('intro', 'question_tiles', 'question_images', 'contact_form', 'loading', 'thank_you');
create type selection_type as enum ('single', 'multiple');
create type applicant_source as enum ('facebook', 'instagram', 'linkedin', 'direct', 'referral');
create type pipeline_stage as enum ('new', 'cv_analyzed', 'call_scheduled', 'call_completed', 'evaluated', 'presented', 'accepted', 'rejected');
create type customer_decision as enum ('pending', 'interested', 'rejected');
create type call_status as enum ('scheduled', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer');
create type call_recommendation as enum ('strong_yes', 'yes', 'maybe', 'no', 'strong_no');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');
create type auth_provider as enum ('email_password', 'magic_link', 'google_oauth');

-- ============================================================
-- PROFILES (erweitert auth.users)
-- ============================================================
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email varchar(255),
  name varchar(255),
  role user_role not null default 'operator',
  company_id uuid,  -- NULL für admin/operator/viewer; gesetzt für customer
  auth_provider auth_provider not null default 'email_password',
  mfa_enabled boolean not null default false,
  last_login_at timestamptz,
  status varchar(20) not null default 'active',
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- COMPANIES (Kunden / Firmen)
-- ============================================================
create table companies (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  logo_url text,
  primary_color varchar(7),
  industry varchar(100),
  company_size varchar(50),
  website varchar(255),
  description text,
  contact_name varchar(255),
  contact_email varchar(255),
  contact_phone varchar(50),
  address text,
  recruiting_goals text,
  billing_plan billing_plan not null default 'per_job',
  monthly_budget decimal(10,2),
  contract_start date,
  meta_ad_account_id varchar(100),
  linkedin_ad_account_id varchar(100),
  status company_status not null default 'active',
  notes text,
  created_at timestamptz not null default now()
);

alter table profiles add constraint profiles_company_id_fkey
  foreign key (company_id) references companies(id) on delete set null;

-- ============================================================
-- JOBS (Stellen)
-- ============================================================
create table jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  -- 1. Jobtitel
  title varchar(255) not null,
  -- 2. Jobkategorie
  category varchar(100),
  -- 3. Kurzbeschreibung der Rolle
  description text,
  -- 4. Hauptaufgaben
  main_tasks text,
  -- 5. Muss-Qualifikationen
  must_qualifications text,
  -- 6. Nice-to-Have-Qualifikationen
  nice_to_have_qualifications text,
  -- 7. KO-Kriterien
  ko_criteria text,
  -- 8. Hard Skills
  hard_skills text,
  -- 9. Soft Skills
  soft_skills text,
  -- 10. Standort
  location varchar(255),
  -- 11. Arbeitsmodell
  employment_type employment_type not null default 'fulltime',
  -- 12. Gehaltsrahmen
  salary_range varchar(100),
  -- 13. Benefits
  benefits text,
  -- 14. Zielkandidatenprofil
  ideal_candidate text,
  -- 15. Bewerbungsprozess
  application_process text,
  -- KI-Scoring (intern)
  requirements text,
  interview_questions text[],
  scoring_criteria jsonb default '[]'::jsonb,
  status job_status not null default 'draft',
  daily_budget decimal(10,2),
  target_audience jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

-- ============================================================
-- FUNNELS
-- ============================================================
create table funnels (
  id uuid primary key default gen_random_uuid(),
  -- Polymorph: genau EINES von job_id oder sales_program_id gesetzt (XOR)
  job_id uuid references jobs(id) on delete cascade,
  sales_program_id uuid references sales_programs(id) on delete set null,
  name varchar(255) not null,
  slug varchar(100) not null unique,
  branding jsonb default '{}'::jsonb,
  intro_headline text,
  intro_subtext text,
  intro_image_url text,
  thank_you_text text,
  consent_text text,
  status funnel_status not null default 'draft',
  views integer not null default 0,
  submissions integer not null default 0,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  constraint funnels_target_xor check (
    (job_id is not null) <> (sales_program_id is not null)
  )
);

-- ============================================================
-- FUNNEL PAGES
-- ============================================================
create table funnel_pages (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references funnels(id) on delete cascade,
  page_order integer not null,
  page_type page_type not null,
  question_text text,
  selection_type selection_type default 'single',
  options jsonb default '[]'::jsonb,
  is_required boolean not null default true
);

-- ============================================================
-- APPLICANTS (Bewerber – Personenstammdaten)
-- Kein job_id/funnel_id – das gehört zur Application
-- ============================================================
create table applicants (
  id uuid primary key default gen_random_uuid(),
  full_name varchar(255) not null,
  email varchar(255) not null,
  phone varchar(50),
  cv_file_url text,
  cv_file_type varchar(10),
  -- DSGVO Consent
  consent_given_at timestamptz,
  consent_version varchar(20),
  gdpr_delete_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_applicants_email on applicants(email);

-- ============================================================
-- APPLICATIONS (Bewerbungs-Event: Applicant × Job × Funnel)
-- Herzstück: verbindet Bewerber mit Job-Bewerbung
-- ============================================================
create table applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references applicants(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete restrict,
  funnel_id uuid references funnels(id) on delete set null,
  -- Funnel-Daten (job-spezifisch)
  funnel_responses jsonb default '{}'::jsonb,
  source applicant_source default 'direct',
  utm_params jsonb default '{}'::jsonb,
  -- Pipeline & Bewertung
  pipeline_stage pipeline_stage not null default 'new',
  overall_score decimal(5,2),
  score_breakdown jsonb default '{}'::jsonb,
  -- Kunden-Entscheid
  customer_decision customer_decision not null default 'pending',
  operator_notes text,
  -- Timestamps
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Ein Bewerber kann sich nur einmal pro Job bewerben
  unique(applicant_id, job_id)
);

create index idx_applications_applicant_id on applications(applicant_id);
create index idx_applications_job_id on applications(job_id);
create index idx_applications_pipeline_stage on applications(pipeline_stage);
create index idx_applications_customer_decision on applications(customer_decision);

-- ============================================================
-- CV ANALYSES (Auswertung des Lebenslaufs)
-- Gebunden an Application (nicht Applicant direkt)
-- ============================================================
create table cv_analyses (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  raw_text text,
  structured_data jsonb default '{}'::jsonb,  -- Skills, Erfahrungsjahre, Ausbildung, Sprachen
  match_score decimal(5,2),
  strengths text[],
  gaps text[],
  summary text,
  model_version varchar(50),
  analyzed_at timestamptz not null default now()
);

create index idx_cv_analyses_application_id on cv_analyses(application_id);

-- ============================================================
-- VOICE CALLS (Telefonate via Vapi)
-- Gebunden an Application – mehrere Calls pro Application möglich
-- ============================================================
create table voice_calls (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  vapi_call_id varchar(100),
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  recording_url text,
  consent_audio_marker decimal(10,3),  -- Sekunde im Audio wo Consent gegeben wurde
  status call_status not null default 'scheduled',
  vapi_metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_voice_calls_application_id on voice_calls(application_id);

-- ============================================================
-- TRANSCRIPTS (Verschriftlichung des Calls via Whisper)
-- ============================================================
create table transcripts (
  id uuid primary key default gen_random_uuid(),
  voice_call_id uuid not null references voice_calls(id) on delete cascade,
  full_text text,
  segments jsonb default '[]'::jsonb,  -- [{start, end, speaker, text}]
  language varchar(10),
  model_version varchar(50),
  transcribed_at timestamptz not null default now()
);

-- ============================================================
-- CALL ANALYSES (KI-Bewertung des Interviews)
-- ============================================================
create table call_analyses (
  id uuid primary key default gen_random_uuid(),
  voice_call_id uuid not null references voice_calls(id) on delete cascade,
  transcript_id uuid references transcripts(id) on delete set null,
  interview_score decimal(5,2),
  criteria_scores jsonb default '[]'::jsonb,  -- [{criterion, score, reasoning}]
  key_insights text[],
  red_flags text[],
  summary text,
  recommendation call_recommendation,
  model_version varchar(50),
  analyzed_at timestamptz not null default now()
);

-- ============================================================
-- SALES PROGRAMS (Sales-Anker, parallel zu jobs)
-- ============================================================
create table sales_programs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete restrict,
  name varchar(255) not null,
  product_pitch text,
  value_proposition text,
  target_persona text,
  script_guidelines text,
  vapi_assistant_id varchar(255),
  caller_phone_number varchar(50),
  booking_link text,
  meta_form_ids jsonb not null default '[]'::jsonb,
  auto_dial boolean not null default false,
  status varchar(20) not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sales_programs_company_id on sales_programs(company_id);
create index idx_sales_programs_status on sales_programs(status);

-- ============================================================
-- SALES LEADS (per-program, nicht global — im Gegensatz zu applicants)
-- Dedupe via unique(sales_program_id, phone)
-- ============================================================
create table sales_leads (
  id uuid primary key default gen_random_uuid(),
  sales_program_id uuid not null references sales_programs(id) on delete cascade,
  first_name text,
  last_name text,
  full_name text,
  email text,
  phone text not null,
  company_name text,
  role text,
  linkedin_url text,
  source text not null,               -- meta_ads | csv_import | funnel | manual
  source_ref text,
  funnel_responses jsonb not null default '{}'::jsonb,
  custom_fields jsonb not null default '{}'::jsonb,
  consent_given boolean not null default false,
  consent_source text,
  consent_timestamp timestamptz,
  notes text,
  status text not null default 'new', -- new|calling|contacted|meeting_booked|not_interested|do_not_call|failed
  next_call_scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sales_leads_program_id on sales_leads(sales_program_id);
create index idx_sales_leads_status on sales_leads(status);
create unique index uq_sales_leads_program_phone on sales_leads(sales_program_id, phone);

-- ============================================================
-- SALES CALLS (parallel zu voice_calls)
-- ============================================================
create table sales_calls (
  id uuid primary key default gen_random_uuid(),
  sales_lead_id uuid not null references sales_leads(id) on delete cascade,
  sales_program_id uuid not null references sales_programs(id) on delete restrict,
  vapi_call_id varchar(255),
  twilio_call_sid varchar(255),
  status varchar(20) not null default 'initiated', -- initiated|ringing|in_progress|completed|no_answer|failed
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  transcript jsonb,
  recording_url text,
  end_reason text,
  vapi_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_sales_calls_lead_id on sales_calls(sales_lead_id);
create index idx_sales_calls_program_id on sales_calls(sales_program_id);
create index idx_sales_calls_status on sales_calls(status);

-- ============================================================
-- SALES CALL ANALYSES (parallel zu call_analyses)
-- ============================================================
create table sales_call_analyses (
  id uuid primary key default gen_random_uuid(),
  sales_call_id uuid not null unique references sales_calls(id) on delete cascade,
  meeting_booked boolean not null default false,
  meeting_datetime timestamptz,
  interest_level text,                -- high|medium|low|none
  call_rating integer,                -- 1..10
  sentiment text,                     -- positive|neutral|negative
  summary text,
  objections jsonb not null default '[]'::jsonb,
  pain_points jsonb not null default '[]'::jsonb,
  next_action text,                   -- send_email|call_back|send_proposal|dead_lead|nurture
  next_action_at timestamptz,
  key_quotes jsonb not null default '[]'::jsonb,
  structured_data jsonb not null default '{}'::jsonb,
  model_version varchar(100),
  analyzed_at timestamptz not null default now()
);

-- ============================================================
-- SALES CALL SESSIONS (Wait-Node-Resume, parallel zu call_sessions)
-- ============================================================
create table sales_call_sessions (
  sales_lead_id uuid primary key references sales_leads(id) on delete cascade,
  sales_call_id uuid references sales_calls(id) on delete set null,
  resume_url text not null,
  phone_number text,
  cached_data jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);

-- ============================================================
-- INVOICES (Rechnungen)
-- ============================================================
create table invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete restrict,
  invoice_number varchar(50) not null unique,
  period_start date not null,
  period_end date not null,
  line_items jsonb default '[]'::jsonb,
  subtotal decimal(10,2) not null default 0,
  vat_rate decimal(5,4) not null default 0.20,
  vat_amount decimal(10,2) not null default 0,
  total decimal(10,2) not null default 0,
  status invoice_status not null default 'draft',
  pdf_url text,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_invoices_company_id on invoices(company_id);

-- ============================================================
-- WEITERE INDIZES
-- ============================================================
create index idx_jobs_company_id on jobs(company_id);
create index idx_funnels_job_id on funnels(job_id);
create index idx_funnels_slug on funnels(slug);
create index idx_funnel_pages_funnel_id on funnel_pages(funnel_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql
as $$ begin new.updated_at = now(); return new; end; $$;

create trigger update_applications_updated_at
  before update on applications
  for each row execute procedure update_updated_at();

create trigger update_sales_programs_updated_at
  before update on sales_programs
  for each row execute procedure update_updated_at();

create trigger update_sales_leads_updated_at
  before update on sales_leads
  for each row execute procedure update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: Ist der aktuelle User Operator oder höher?
-- (wird in Policies verwendet)

-- PROFILES
alter table profiles enable row level security;
create policy "Eigenes Profil lesen" on profiles for select
  using (auth.uid() = id);
create policy "Eigenes Profil updaten" on profiles for update
  using (auth.uid() = id);
create policy "Operator sieht alle Profile" on profiles for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'operator', 'viewer')));

-- COMPANIES
alter table companies enable row level security;
create policy "Operator sieht alle Firmen" on companies for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator', 'viewer')));
create policy "Admin/Operator verwaltet Firmen" on companies for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Customer sieht eigene Firma" on companies for select
  using (exists (select 1 from profiles where id = auth.uid() and company_id = companies.id and role = 'customer'));

-- JOBS
alter table jobs enable row level security;
create policy "Operator sieht alle Jobs" on jobs for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator', 'viewer')));
create policy "Admin/Operator verwaltet Jobs" on jobs for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Customer sieht Jobs seiner Firma" on jobs for select
  using (exists (select 1 from profiles where id = auth.uid() and company_id = jobs.company_id and role = 'customer'));

-- FUNNELS
alter table funnels enable row level security;
create policy "Operator sieht alle Funnels" on funnels for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator', 'viewer')));
create policy "Admin/Operator verwaltet Funnels" on funnels for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));

-- FUNNEL PAGES
alter table funnel_pages enable row level security;
create policy "Operator sieht alle Funnel-Seiten" on funnel_pages for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator', 'viewer')));
create policy "Admin/Operator verwaltet Funnel-Seiten" on funnel_pages for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));

-- APPLICANTS
alter table applicants enable row level security;
create policy "Operator sieht alle Bewerber" on applicants for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator', 'viewer')));
create policy "Admin/Operator verwaltet Bewerber" on applicants for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Customer sieht Bewerber via freigegebene Applications" on applicants for select
  using (
    exists (
      select 1 from applications a
      join jobs j on j.id = a.job_id
      join profiles p on p.company_id = j.company_id
      where a.applicant_id = applicants.id
        and a.customer_decision != 'pending'
        and p.id = auth.uid()
        and p.role = 'customer'
    )
  );

-- APPLICATIONS
alter table applications enable row level security;
create policy "Operator sieht alle Applications" on applications for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator', 'viewer')));
create policy "Admin/Operator verwaltet Applications" on applications for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Customer sieht freigegebene Applications seiner Firma" on applications for select
  using (
    customer_decision != 'pending'
    and exists (
      select 1 from jobs j
      join profiles p on p.company_id = j.company_id
      where j.id = applications.job_id
        and p.id = auth.uid()
        and p.role = 'customer'
    )
  );

-- CV ANALYSES
alter table cv_analyses enable row level security;
create policy "Operator sieht CV-Analysen" on cv_analyses for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator', 'viewer')));
create policy "Admin/Operator verwaltet CV-Analysen" on cv_analyses for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Customer sieht CV-Analysen freigegebener Applications" on cv_analyses for select
  using (
    exists (
      select 1 from applications a
      join jobs j on j.id = a.job_id
      join profiles p on p.company_id = j.company_id
      where a.id = cv_analyses.application_id
        and a.customer_decision != 'pending'
        and p.id = auth.uid()
        and p.role = 'customer'
    )
  );

-- VOICE CALLS
alter table voice_calls enable row level security;
create policy "Operator sieht alle Calls" on voice_calls for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator', 'viewer')));
create policy "Admin/Operator verwaltet Calls" on voice_calls for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));

-- TRANSCRIPTS (nur Operator – Customer sieht nur Zusammenfassung via CallAnalysis)
alter table transcripts enable row level security;
create policy "Operator sieht Transkripte" on transcripts for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Admin/Operator verwaltet Transkripte" on transcripts for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));

-- CALL ANALYSES
alter table call_analyses enable row level security;
create policy "Operator sieht Gesprächsanalysen" on call_analyses for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator', 'viewer')));
create policy "Admin/Operator verwaltet Gesprächsanalysen" on call_analyses for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "Customer sieht Analysen freigegebener Applications" on call_analyses for select
  using (
    exists (
      select 1 from voice_calls vc
      join applications a on a.id = vc.application_id
      join jobs j on j.id = a.job_id
      join profiles p on p.company_id = j.company_id
      where vc.id = call_analyses.voice_call_id
        and a.customer_decision != 'pending'
        and p.id = auth.uid()
        and p.role = 'customer'
    )
  );

-- SALES PROGRAMS
alter table sales_programs enable row level security;
create policy "sales_programs_operator_select" on sales_programs for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator', 'viewer')));
create policy "sales_programs_operator_write" on sales_programs for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "sales_programs_customer_select" on sales_programs for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and company_id = sales_programs.company_id and role = 'customer'
    )
  );

-- SALES LEADS
alter table sales_leads enable row level security;
create policy "sales_leads_operator_select" on sales_leads for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator', 'viewer')));
create policy "sales_leads_operator_write" on sales_leads for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "sales_leads_public_insert" on sales_leads for insert with check (true);
create policy "sales_leads_customer_select" on sales_leads for select
  using (
    exists (
      select 1 from sales_programs sp
      join profiles p on p.company_id = sp.company_id
      where sp.id = sales_leads.sales_program_id
        and p.id = auth.uid() and p.role = 'customer'
    )
  );

-- SALES CALLS
alter table sales_calls enable row level security;
create policy "sales_calls_operator_select" on sales_calls for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator', 'viewer')));
create policy "sales_calls_operator_write" on sales_calls for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "sales_calls_customer_select" on sales_calls for select
  using (
    exists (
      select 1 from sales_programs sp
      join profiles p on p.company_id = sp.company_id
      where sp.id = sales_calls.sales_program_id
        and p.id = auth.uid() and p.role = 'customer'
    )
  );

-- SALES CALL ANALYSES
alter table sales_call_analyses enable row level security;
create policy "sales_call_analyses_operator_select" on sales_call_analyses for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator', 'viewer')));
create policy "sales_call_analyses_operator_write" on sales_call_analyses for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));
create policy "sales_call_analyses_customer_select" on sales_call_analyses for select
  using (
    exists (
      select 1 from sales_calls sc
      join sales_programs sp on sp.id = sc.sales_program_id
      join profiles p on p.company_id = sp.company_id
      where sc.id = sales_call_analyses.sales_call_id
        and p.id = auth.uid() and p.role = 'customer'
    )
  );

-- SALES CALL SESSIONS (intern)
alter table sales_call_sessions enable row level security;
create policy "sales_call_sessions_operator_all" on sales_call_sessions for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator')));

-- INVOICES
alter table invoices enable row level security;
create policy "Admin/Operator sieht alle Rechnungen" on invoices for select
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'operator', 'viewer')));
create policy "Admin verwaltet Rechnungen" on invoices for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Customer sieht eigene Rechnungen" on invoices for select
  using (exists (select 1 from profiles where id = auth.uid() and company_id = invoices.company_id and role = 'customer'));
