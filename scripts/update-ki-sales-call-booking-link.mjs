// One-off: setzt booking_link + (falls Migration angewendet) cal_username +
// cal_event_type_slug auf das "KI Sales Call"-Program.
// Idempotent — re-run kostet nichts.

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const BOOKING_LINK = "https://cal.com/martin-amon-l2hybo/30min?overlayCalendar=true";
const CAL_USERNAME = "martin-amon-l2hybo";
const CAL_EVENT_TYPE_SLUG = "30min";
const CAL_TIMEZONE = "Europe/Vienna";

const PROGRAM_NAME = "KI Sales Call";

async function main() {
  const { data: programs, error } = await supabase
    .from("sales_programs")
    .select("id, name, booking_link")
    .eq("name", PROGRAM_NAME);
  if (error) throw error;
  if (!programs || programs.length === 0) {
    console.error(`Program "${PROGRAM_NAME}" nicht gefunden.`);
    process.exit(1);
  }
  for (const p of programs) {
    // Erst nur booking_link versuchen — funktioniert ohne Migration.
    let patch = { booking_link: BOOKING_LINK };
    let { error: e1 } = await supabase.from("sales_programs").update(patch).eq("id", p.id);
    if (e1) { console.error(`booking_link update failed: ${e1.message}`); continue; }
    console.log(`Updated booking_link for ${p.name} (${p.id})`);

    // Dann cal_*-Felder. Wenn Migration noch nicht angewendet, schlägt das fehl
    // → das ist OK, dann hast du noch booking_link aber keine Cal-Identity.
    patch = {
      cal_username: CAL_USERNAME,
      cal_event_type_slug: CAL_EVENT_TYPE_SLUG,
      cal_timezone: CAL_TIMEZONE,
    };
    const { error: e2 } = await supabase.from("sales_programs").update(patch).eq("id", p.id);
    if (e2) {
      console.warn(
        `cal_* update fehlgeschlagen (vermutlich Migration noch nicht angewendet): ${e2.message}`,
      );
    } else {
      console.log(`Updated cal_username/slug/timezone for ${p.name}`);
    }
  }
}

main().catch((e) => {
  console.error("Failed:", e.message ?? e);
  process.exit(1);
});
