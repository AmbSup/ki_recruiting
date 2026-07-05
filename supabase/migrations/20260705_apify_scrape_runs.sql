-- Budget-Tracking + Audit-Log für Apify Google-Maps-Scraper-Runs.
-- Wichtig: sales_leads.status und sales_leads.source sind bereits `text`
-- ohne CHECK-Constraint — daher kein ALTER TYPE nötig für die neuen Werte
-- `discovered` (status) und `apify_gmaps` (source). Nur Code-Konsumenten
-- (SOURCE_CONFIG, STATUS_CONFIG) müssen die Labels kennen.

CREATE TABLE IF NOT EXISTS apify_scrape_runs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_run_id      text,                    -- Apify's Run-ID, null bis Actor gestartet
  sales_program_id  uuid REFERENCES sales_programs(id) ON DELETE SET NULL,
  keyword           text NOT NULL,           -- z.B. "Bäckerei"
  location          text NOT NULL,           -- z.B. "Wien, Österreich"
  requested_count   int NOT NULL,
  actual_count      int,                     -- nach Complete
  cost_usd          numeric(10, 4),          -- Apify-Rechnung
  cost_eur          numeric(10, 4),          -- USD × Wechselkurs (Snapshot)
  status            text NOT NULL DEFAULT 'running',
                    -- running | succeeded | failed | budget_blocked
  error_message     text,
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_apify_runs_created_at ON apify_scrape_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_apify_runs_program ON apify_scrape_runs(sales_program_id);

ALTER TABLE apify_scrape_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS apify_runs_operator_select ON apify_scrape_runs;
CREATE POLICY apify_runs_operator_select ON apify_scrape_runs
  FOR SELECT
  USING (get_my_role() = ANY (ARRAY['admin'::user_role, 'operator'::user_role, 'viewer'::user_role]));

DROP POLICY IF EXISTS apify_runs_operator_write ON apify_scrape_runs;
CREATE POLICY apify_runs_operator_write ON apify_scrape_runs
  FOR ALL
  USING (get_my_role() = ANY (ARRAY['admin'::user_role, 'operator'::user_role]));
