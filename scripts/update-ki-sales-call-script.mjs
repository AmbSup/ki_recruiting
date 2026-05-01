// One-off: aktualisiert das "KI Sales Call"-Sales-Program mit dem user-spezifischen
// Discovery-Script (verbatim) + caller_name "Andrea" + first_message_override
// (cold-call-tauglicher Opener ohne "Anfrage"-Annahme).

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

const PROGRAM_NAME = "KI Sales Call";

async function main() {
  const { data: programs, error } = await supabase
    .from("sales_programs")
    .select("id, name, call_strategy")
    .eq("name", PROGRAM_NAME);
  if (error) throw error;
  if (!programs || programs.length === 0) {
    console.error(`Program "${PROGRAM_NAME}" nicht gefunden.`);
    process.exit(1);
  }

  // User-spezifisches Discovery-Script (verbatim).
  // Basierend auf Niels-Style-Cold-Outreach + User-Korrektur aus Live-Test.
  const callStrategy = {
    ...((programs[0].call_strategy ?? {})),
    caller_name: "Andrea",
    hook_one_liner:
      "Wir helfen Unternehmen, mechanisch-repetitive Aufgaben mit KI zu automatisieren — typisch 80–90 % Zeitersparnis pro Prozess.",
    discovery_questions: [
      "Ich gehe sicher recht in der Annahme, dass Sie das Thema KI bereits auf dem Schirm haben oder intern schon erste Tools nutzen, richtig?",
      "Wenn Sie sich Ihren Arbeitsalltag oder den Ihrer Abteilung anschauen — wo sitzen gute Mitarbeiter vor Aufgaben, die eigentlich rein mechanisch oder wiederholend sind und Zeit fressen?",
      "Und wo glauben Sie, verlieren Sie außerdem Zeit?",
      "Was würde es für Sie bedeuten, wenn wir genau das zu 90% automatisieren könnten?",
    ],
    // Old key kept for backward-compat with use-cases that still reference it
    hard_qualifier_questions: [
      "Wo sitzen gute Mitarbeiter vor Aufgaben, die rein mechanisch oder wiederholend sind?",
      "Wie oft pro Woche fällt das an?",
      "Wer entscheidet bei Ihnen, ob ein KI-Tool eingeführt wird?",
    ],
    on_disqualify: "send_resource_sms_then_end",
    fallback_resource_url: "https://neuronic-automation.ai/ressourcen/ki-quickstart",
    verbal_commitment_required: true,
    show_rate_confirmation_phrase:
      "Bevor wir den Termin fixieren — Sie würden sich den Termin auch wirklich freihalten, ja?",
    opener_mode: "permission_based",
    tone_formality: "formell",
    tone_warmth: "warm",
    success_definition:
      "Verbal bestätigter 20-Minuten-Termin in den nächsten 5 Werktagen mit dem Entscheider.",
    top_objections: [
      { objection: "Haben kein Budget", response: "Verstehe — der Termin kostet nichts. Wir schauen erst, ob wir überhaupt Wert für Sie haben." },
      { objection: "Haben schon Tools", response: "Spannend — wir bauen oft drauf auf, wir konkurrieren nicht. Lassen Sie uns 20 Minuten schauen, ob wir Lücken sehen." },
      { objection: "Schicken Sie was", response: "Mach ich, gerne. Ich schicke einen Buchungslink per SMS — wenn was dabei interessant ist, klicken Sie einfach drauf." },
    ],
  };

  // First-Message-Override: Cold-Call-tauglich, KEIN "Ihrer Anfrage zu …".
  // Generic-Template feuert sonst "wegen Ihrer Anfrage" — was bei Cold-Calls falsch ist.
  // Per-Program-Override > Use-Case-Default.
  const firstMessageOverride =
    "Guten Tag {{first_name}}, hier ist {{caller_name}} von {{caller_company}}. Grüße Sie. Darf ich gleich zum Punkt kommen — passt es kurz?";

  const updatePayload = {
    call_strategy: callStrategy,
    first_message_override: firstMessageOverride,
    script_guidelines:
      "EINE Frage pro Turn. Nach jeder Frage 3 Sekunden Pause — der Lead muss antworten BEVOR du weitermachst. Discovery-Fragen wortgetreu nutzen, nicht paraphrasieren. Niemals 'Spitze!' oder 'Klassisch!' — klingt verkäuferisch. Bestätige Aussagen knapp ('Verstehe.', 'Nachvollziehbar.'), dann nächste Frage. EINEN Slot vorschlagen vor dem `book_meeting`-Tool, niemals erfinden — immer vorher `get_available_slots` aufrufen.",
  };

  for (const p of programs) {
    const { error: upErr } = await supabase
      .from("sales_programs")
      .update(updatePayload)
      .eq("id", p.id);
    if (upErr) {
      console.error(`Update fehlgeschlagen: ${upErr.message}`);
      continue;
    }
    console.log(`✓ Updated ${p.name} (${p.id})`);
    console.log(`  caller_name: Andrea`);
    console.log(`  discovery_questions: ${callStrategy.discovery_questions.length} Stück, verbatim`);
    console.log(`  first_message_override gesetzt (cold-call ohne "Anfrage")`);
  }
}

main().catch((e) => {
  console.error("Failed:", e.message ?? e);
  process.exit(1);
});
