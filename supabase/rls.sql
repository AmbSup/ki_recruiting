-- ============================================================
-- KI Recruiting Tool – RLS Policies (vollständig, korrekt)
-- ============================================================
-- Fix: Infinite Recursion in profiles-Policy vermeiden
-- Lösung: security definer Hilfsfunktion für Role-Check
-- ============================================================

-- ============================================================
-- HILFSFUNKTION: Rolle des eingeloggten Users (ohne Recursion)
-- ============================================================
create or replace function get_my_role()
returns user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

-- ============================================================
-- ALLE BESTEHENDEN POLICIES DROPPEN (sauberer Neustart)
-- ============================================================

-- profiles
drop policy if exists "Eigenes Profil lesen" on profiles;
drop policy if exists "Eigenes Profil updaten" on profiles;
drop policy if exists "Operator sieht alle Profile" on profiles;

-- companies
drop policy if exists "Operator sieht alle Firmen" on companies;
drop policy if exists "Admin/Operator verwaltet Firmen" on companies;
drop policy if exists "Customer sieht eigene Firma" on companies;

-- jobs
drop policy if exists "Operator sieht alle Jobs" on jobs;
drop policy if exists "Admin/Operator verwaltet Jobs" on jobs;
drop policy if exists "Customer sieht Jobs seiner Firma" on jobs;

-- funnels
drop policy if exists "Operator sieht alle Funnels" on funnels;
drop policy if exists "Admin/Operator verwaltet Funnels" on funnels;
drop policy if exists "Funnel öffentlich lesbar wenn aktiv" on funnels;

-- funnel_pages
drop policy if exists "Operator sieht alle Funnel-Seiten" on funnel_pages;
drop policy if exists "Admin/Operator verwaltet Funnel-Seiten" on funnel_pages;
drop policy if exists "Funnel-Seiten öffentlich lesbar" on funnel_pages;

-- applicants
drop policy if exists "Operator sieht alle Bewerber" on applicants;
drop policy if exists "Admin/Operator verwaltet Bewerber" on applicants;
drop policy if exists "Customer sieht Bewerber via freigegebene Applications" on applicants;
drop policy if exists "Bewerber kann eigene Daten sehen" on applicants;

-- applications
drop policy if exists "Operator sieht alle Applications" on applications;
drop policy if exists "Admin/Operator verwaltet Applications" on applications;
drop policy if exists "Customer sieht freigegebene Applications seiner Firma" on applications;

-- cv_analyses
drop policy if exists "Operator sieht CV-Analysen" on cv_analyses;
drop policy if exists "Admin/Operator verwaltet CV-Analysen" on cv_analyses;
drop policy if exists "Customer sieht CV-Analysen freigegebener Applications" on cv_analyses;

-- voice_calls
drop policy if exists "Operator sieht alle Calls" on voice_calls;
drop policy if exists "Admin/Operator verwaltet Calls" on voice_calls;

-- transcripts
drop policy if exists "Operator sieht Transkripte" on transcripts;
drop policy if exists "Admin/Operator verwaltet Transkripte" on transcripts;

-- call_analyses
drop policy if exists "Operator sieht Gesprächsanalysen" on call_analyses;
drop policy if exists "Admin/Operator verwaltet Gesprächsanalysen" on call_analyses;
drop policy if exists "Customer sieht Analysen freigegebener Applications" on call_analyses;

-- invoices
drop policy if exists "Admin/Operator sieht alle Rechnungen" on invoices;
drop policy if exists "Admin verwaltet Rechnungen" on invoices;
drop policy if exists "Customer sieht eigene Rechnungen" on invoices;

-- ============================================================
-- RLS AKTIVIEREN (falls noch nicht geschehen)
-- ============================================================
alter table profiles    enable row level security;
alter table companies   enable row level security;
alter table jobs        enable row level security;
alter table funnels     enable row level security;
alter table funnel_pages enable row level security;
alter table applicants  enable row level security;
alter table applications enable row level security;
alter table cv_analyses enable row level security;
alter table voice_calls enable row level security;
alter table transcripts enable row level security;
alter table call_analyses enable row level security;
alter table invoices    enable row level security;
alter table sales_programs enable row level security;
alter table sales_leads enable row level security;
alter table sales_calls enable row level security;
alter table sales_call_analyses enable row level security;
alter table sales_call_sessions enable row level security;

-- ============================================================
-- PROFILES
-- Fix: eigene Profile direkt per auth.uid(), kein rekursiver Join
-- ============================================================
create policy "profiles_own_select" on profiles
  for select using (auth.uid() = id);

create policy "profiles_own_update" on profiles
  for update using (auth.uid() = id);

-- Admin darf alle Profile sehen (via get_my_role – kein self-join)
create policy "profiles_operator_select" on profiles
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

-- Admin darf Rollen ändern
create policy "profiles_admin_all" on profiles
  for all using (get_my_role() = 'admin');

-- ============================================================
-- COMPANIES
-- ============================================================
create policy "companies_operator_select" on companies
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

create policy "companies_operator_write" on companies
  for all using (get_my_role() in ('admin', 'operator'));

create policy "companies_customer_select" on companies
  for select using (
    get_my_role() = 'customer'
    and exists (
      select 1 from profiles
      where id = auth.uid() and company_id = companies.id
    )
  );

-- ============================================================
-- JOBS
-- ============================================================
create policy "jobs_operator_select" on jobs
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

create policy "jobs_operator_write" on jobs
  for all using (get_my_role() in ('admin', 'operator'));

create policy "jobs_customer_select" on jobs
  for select using (
    get_my_role() = 'customer'
    and exists (
      select 1 from profiles
      where id = auth.uid() and company_id = jobs.company_id
    )
  );

-- ============================================================
-- FUNNELS
-- ============================================================
create policy "funnels_operator_select" on funnels
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

create policy "funnels_operator_write" on funnels
  for all using (get_my_role() in ('admin', 'operator'));

-- Öffentlich lesbar wenn aktiv (für Bewerber-Funnel-Frontend)
create policy "funnels_public_active" on funnels
  for select using (status = 'active');

-- ============================================================
-- FUNNEL PAGES
-- ============================================================
create policy "funnel_pages_operator_select" on funnel_pages
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

create policy "funnel_pages_operator_write" on funnel_pages
  for all using (get_my_role() in ('admin', 'operator'));

-- Öffentlich lesbar (für aktive Funnels)
create policy "funnel_pages_public" on funnel_pages
  for select using (
    exists (
      select 1 from funnels
      where funnels.id = funnel_pages.funnel_id
        and funnels.status = 'active'
    )
  );

-- ============================================================
-- APPLICANTS
-- ============================================================
create policy "applicants_operator_select" on applicants
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

create policy "applicants_operator_write" on applicants
  for all using (get_my_role() in ('admin', 'operator'));

-- Öffentlich einfügen (Bewerber reichen sich selbst ein)
create policy "applicants_public_insert" on applicants
  for insert with check (true);

-- Customer: nur Bewerber deren Application freigegeben wurde
create policy "applicants_customer_select" on applicants
  for select using (
    get_my_role() = 'customer'
    and exists (
      select 1 from applications a
      join jobs j on j.id = a.job_id
      join profiles p on p.company_id = j.company_id
      where a.applicant_id = applicants.id
        and a.customer_decision != 'pending'
        and p.id = auth.uid()
    )
  );

-- ============================================================
-- APPLICATIONS
-- ============================================================
create policy "applications_operator_select" on applications
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

create policy "applications_operator_write" on applications
  for all using (get_my_role() in ('admin', 'operator'));

-- Öffentlich einfügen (Funnel-Submission)
create policy "applications_public_insert" on applications
  for insert with check (true);

-- Customer: nur freigegebene Applications der eigenen Firma
create policy "applications_customer_select" on applications
  for select using (
    get_my_role() = 'customer'
    and customer_decision != 'pending'
    and exists (
      select 1 from jobs j
      join profiles p on p.company_id = j.company_id
      where j.id = applications.job_id
        and p.id = auth.uid()
    )
  );

-- ============================================================
-- CV ANALYSES
-- ============================================================
create policy "cv_analyses_operator_select" on cv_analyses
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

create policy "cv_analyses_operator_write" on cv_analyses
  for all using (get_my_role() in ('admin', 'operator'));

create policy "cv_analyses_customer_select" on cv_analyses
  for select using (
    get_my_role() = 'customer'
    and exists (
      select 1 from applications a
      join jobs j on j.id = a.job_id
      join profiles p on p.company_id = j.company_id
      where a.id = cv_analyses.application_id
        and a.customer_decision != 'pending'
        and p.id = auth.uid()
    )
  );

-- ============================================================
-- VOICE CALLS
-- ============================================================
create policy "voice_calls_operator_select" on voice_calls
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

create policy "voice_calls_operator_write" on voice_calls
  for all using (get_my_role() in ('admin', 'operator'));

-- ============================================================
-- TRANSCRIPTS (nur intern – Customer sieht nur Zusammenfassung)
-- ============================================================
create policy "transcripts_operator_select" on transcripts
  for select using (get_my_role() in ('admin', 'operator'));

create policy "transcripts_operator_write" on transcripts
  for all using (get_my_role() in ('admin', 'operator'));

-- ============================================================
-- CALL ANALYSES
-- ============================================================
create policy "call_analyses_operator_select" on call_analyses
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

create policy "call_analyses_operator_write" on call_analyses
  for all using (get_my_role() in ('admin', 'operator'));

create policy "call_analyses_customer_select" on call_analyses
  for select using (
    get_my_role() = 'customer'
    and exists (
      select 1 from voice_calls vc
      join applications a on a.id = vc.application_id
      join jobs j on j.id = a.job_id
      join profiles p on p.company_id = j.company_id
      where vc.id = call_analyses.voice_call_id
        and a.customer_decision != 'pending'
        and p.id = auth.uid()
    )
  );

-- ============================================================
-- SALES PROGRAMS
-- ============================================================
create policy "sales_programs_operator_select" on sales_programs
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

create policy "sales_programs_operator_write" on sales_programs
  for all using (get_my_role() in ('admin', 'operator'));

create policy "sales_programs_customer_select" on sales_programs
  for select using (
    get_my_role() = 'customer'
    and exists (
      select 1 from profiles
      where id = auth.uid() and company_id = sales_programs.company_id
    )
  );

-- ============================================================
-- SALES LEADS
-- ============================================================
create policy "sales_leads_operator_select" on sales_leads
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

create policy "sales_leads_operator_write" on sales_leads
  for all using (get_my_role() in ('admin', 'operator'));

-- Öffentlich einfügen (Funnel-Submission, analog applicants_public_insert)
create policy "sales_leads_public_insert" on sales_leads
  for insert with check (true);

create policy "sales_leads_customer_select" on sales_leads
  for select using (
    get_my_role() = 'customer'
    and exists (
      select 1 from sales_programs sp
      join profiles p on p.company_id = sp.company_id
      where sp.id = sales_leads.sales_program_id
        and p.id = auth.uid()
    )
  );

-- ============================================================
-- SALES CALLS
-- ============================================================
create policy "sales_calls_operator_select" on sales_calls
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

create policy "sales_calls_operator_write" on sales_calls
  for all using (get_my_role() in ('admin', 'operator'));

create policy "sales_calls_customer_select" on sales_calls
  for select using (
    get_my_role() = 'customer'
    and exists (
      select 1 from sales_programs sp
      join profiles p on p.company_id = sp.company_id
      where sp.id = sales_calls.sales_program_id
        and p.id = auth.uid()
    )
  );

-- ============================================================
-- SALES CALL ANALYSES
-- ============================================================
create policy "sales_call_analyses_operator_select" on sales_call_analyses
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

create policy "sales_call_analyses_operator_write" on sales_call_analyses
  for all using (get_my_role() in ('admin', 'operator'));

create policy "sales_call_analyses_customer_select" on sales_call_analyses
  for select using (
    get_my_role() = 'customer'
    and exists (
      select 1 from sales_calls sc
      join sales_programs sp on sp.id = sc.sales_program_id
      join profiles p on p.company_id = sp.company_id
      where sc.id = sales_call_analyses.sales_call_id
        and p.id = auth.uid()
    )
  );

-- ============================================================
-- SALES CALL SESSIONS (intern, nur Operator/Admin)
-- ============================================================
create policy "sales_call_sessions_operator_all" on sales_call_sessions
  for all using (get_my_role() in ('admin', 'operator'));

-- ============================================================
-- INVOICES
-- ============================================================
create policy "invoices_operator_select" on invoices
  for select using (get_my_role() in ('admin', 'operator', 'viewer'));

create policy "invoices_admin_write" on invoices
  for all using (get_my_role() = 'admin');

create policy "invoices_customer_select" on invoices
  for select using (
    get_my_role() = 'customer'
    and exists (
      select 1 from profiles
      where id = auth.uid() and company_id = invoices.company_id
    )
  );
