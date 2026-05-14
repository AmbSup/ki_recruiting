-- /register erlaubt offene Selbst-Registrierung. Bisheriger Default `operator`
-- bedeutete: jeder Signup mit verifizierter E-Mail bekam Operator-Vollrechte.
-- Default wird auf `customer` umgestellt — neue Signups landen ohne
-- Dashboard-Zugriff (RLS-Policies erlauben Operator/Admin/Viewer-Rollen
-- nur auf Backoffice-Tabellen). Operator-Promotion erfolgt manuell via
-- UPDATE profiles SET role = 'operator' WHERE id = '<uuid>'.
alter table profiles
  alter column role set default 'customer';
