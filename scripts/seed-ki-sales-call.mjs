// One-off seed: legt das Sales-Program "KI Sales Call" für Neuronic an.
// Nutzung: node scripts/seed-ki-sales-call.mjs
// Erwartet .env mit NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

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

const supabase = createClient(url, key, { auth: { persistSession: false } });

const program = {
  name: "KI Sales Call",
  status: "draft",
  program_type: "generic",
  product_pitch:
    "KI-Automatisierung wiederkehrender Aufgaben für KMU im DACH-Raum, " +
    "Fokus auf 80–90 % Zeit-Reduktion bei mechanischen, repetitiven Workflows.",
  value_proposition:
    "Konkrete Stunden-pro-Monat-Einsparung in 4–6 Wochen umsetzbar — " +
    "ohne IT-Großprojekt, mit messbarem ROI ab Monat 2.",
  target_persona:
    "Geschäftsführer oder Abteilungsleiter, 10–200 Mitarbeiter, hat KI " +
    "auf dem Schirm aber noch nicht systematisch eingeführt. Pain: gute " +
    "Mitarbeiter sitzen vor Routine-Aufgaben.",
  script_guidelines:
    "Eine Frage pro Turn — niemals Doppelfragen. Erst Erlaubnis abholen " +
    "(\"passt es jetzt für zwei Minuten?\"), dann Discovery, dann Qualifying, " +
    "dann Termin-Vorschlag. Niemals Cheerleading (\"Spitze!\", \"Klassisch!\"). " +
    "Pause nach jeder Frage — turn-detection läuft sonst über Lead-Antwort.",
  call_strategy: {
    hook_promise:
      "Eine konkrete Tätigkeit identifizieren, die wir messbar entlasten können.",
    opener_mode: "permission_based",
    reverse_qualify: true,
    hard_qualifier_questions: [
      "Welche eine Tätigkeit kostet aktuell am meisten Zeit, obwohl sie immer gleich abläuft?",
      "Wie oft pro Woche fällt das an?",
      "Wie viele Stunden gehen Ihrem Team dafür im Monat etwa weg?",
      "Wer würde so eine Automatisierung umsetzen — intern oder extern?",
      "Wer müsste mit am Tisch sitzen, um das Thema zu entscheiden?",
    ],
    require_file_upload: false,
    verbal_commitment_required: true,
    show_rate_confirmation_phrase:
      "Bevor wir den Termin fixieren — Sie würden sich den Termin auch wirklich freihalten, ja?",
    on_disqualify: "send_resource_sms_then_end",
    fallback_resource_url: "https://neuronic-automation.ai/ressourcen/ki-quickstart",
  },
  vapi_assistant_id: "998f169b-6a78-4eb0-a516-350a64968a8e",
  auto_dial: false,
};

async function main() {
  // 1. Companies finden — Neuronic bevorzugen, sonst erste verfügbare.
  const { data: companies, error: cErr } = await supabase
    .from("companies")
    .select("id, name")
    .order("created_at", { ascending: true });
  if (cErr) throw cErr;
  if (!companies || companies.length === 0) {
    throw new Error("Keine Company in DB — bitte erst in /companies anlegen.");
  }
  const neuronic = companies.find((c) =>
    typeof c.name === "string" && c.name.toLowerCase().includes("neuronic"),
  );
  const company = neuronic ?? companies[0];
  console.log(
    `Verwende Company: ${company.name} (${company.id})${neuronic ? "" : " — Neuronic nicht gefunden, fallback auf erste Company"}`,
  );

  // 2. Existiert das Program schon? (Idempotenz)
  const { data: existing } = await supabase
    .from("sales_programs")
    .select("id")
    .eq("company_id", company.id)
    .eq("name", program.name)
    .maybeSingle();

  if (existing) {
    console.log(`Program existiert bereits — UPDATE auf id=${existing.id}`);
    const { error: uErr } = await supabase
      .from("sales_programs")
      .update(program)
      .eq("id", existing.id);
    if (uErr) throw uErr;
    console.log(`Updated: ${existing.id}`);
    return;
  }

  // 3. Insert
  const { data: created, error: iErr } = await supabase
    .from("sales_programs")
    .insert({ company_id: company.id, ...program })
    .select("id")
    .single();
  if (iErr) throw iErr;
  console.log(`Created sales_program: ${created.id}`);
}

main().catch((e) => {
  console.error("Failed:", e.message ?? e);
  process.exit(1);
});
