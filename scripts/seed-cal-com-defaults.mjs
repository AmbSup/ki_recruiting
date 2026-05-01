// One-off seed: setzt cal_username + cal_event_type_slug auf alle bestehenden
// Sales-Programs, falls noch nicht gesetzt. Idempotent.
//
// Nutzung: node scripts/seed-cal-com-defaults.mjs
// Erwartet .env mit NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Optional: CAL_COM_DEFAULT_USERNAME + CAL_COM_DEFAULT_EVENT_TYPE_SLUG (sonst
// werden 'martinamon' + '30min' verwendet).

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const DEFAULT_USERNAME = process.env.CAL_COM_DEFAULT_USERNAME ?? "martin-amon-l2hybo";
const DEFAULT_EVENT_TYPE = process.env.CAL_COM_DEFAULT_EVENT_TYPE_SLUG ?? "30min";
const DEFAULT_TZ = "Europe/Vienna";

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: programs, error } = await supabase
    .from("sales_programs")
    .select("id, name, cal_username, cal_event_type_slug, cal_timezone");
  if (error) throw error;
  if (!programs || programs.length === 0) {
    console.log("Keine sales_programs in DB.");
    return;
  }
  console.log(`Gefunden: ${programs.length} Program(s).`);

  let updated = 0;
  for (const p of programs) {
    const patch = {};
    if (!p.cal_username) patch.cal_username = DEFAULT_USERNAME;
    if (!p.cal_event_type_slug) patch.cal_event_type_slug = DEFAULT_EVENT_TYPE;
    if (!p.cal_timezone) patch.cal_timezone = DEFAULT_TZ;
    if (Object.keys(patch).length === 0) {
      console.log(`Skip ${p.name} (alle cal_* gesetzt)`);
      continue;
    }
    const { error: upErr } = await supabase.from("sales_programs").update(patch).eq("id", p.id);
    if (upErr) {
      console.error(`Fehler bei ${p.name}: ${upErr.message}`);
      continue;
    }
    console.log(`Updated ${p.name}: ${JSON.stringify(patch)}`);
    updated += 1;
  }
  console.log(`Fertig: ${updated} Program(s) aktualisiert.`);
}

main().catch((e) => {
  console.error("Failed:", e.message ?? e);
  process.exit(1);
});
