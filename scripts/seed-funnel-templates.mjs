// Seed-Script für funnel_templates: 5 V1-Niche-Templates.
// Idempotent über `slug`-UNIQUE-Constraint — re-run aktualisiert via upsert.
//
// Nutzung:  node scripts/seed-funnel-templates.mjs
// Erwartet: .env mit NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY,
// Migration `20260501_funnel_templates.sql` muss angewendet sein.

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
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

const uid = () => randomUUID();

// ─── Block-Builders (kompakte Helper, halten den Template-Code lesbar) ────────

const blockText = (headline, subtext) => ({
  id: uid(),
  type: "text",
  content: { headline, ...(subtext ? { content: subtext } : {}) },
});

const blockProfileHeader = ({ headline, subtext, cta_text, name, title_text }) => ({
  id: uid(),
  type: "profile_header",
  content: {
    headline,
    subtext: subtext ?? "",
    cta_text: cta_text ?? "Jetzt loslegen →",
    name: name ?? "",
    title_text: title_text ?? "",
    image_url: "",
  },
});

const blockVerticalTiles = (question, items, cta = "Weiter →") => ({
  id: uid(),
  type: "vertical_tiles",
  content: {
    question,
    selection: "single",
    items: items.map((it) => ({ id: uid(), label: it.label, value: it.value, sublabel: it.sublabel ?? "" })),
    cta,
  },
});

const blockMultipleChoice = (question, items, selection = "single", cta = "Weiter →") => ({
  id: uid(),
  type: "multiple_choice",
  content: {
    question,
    selection,
    items: items.map((it) => ({ id: uid(), label: it.label, value: it.value, icon: it.icon ?? "" })),
    cta,
  },
});

const blockImageChoice = (question, items, cta = "Weiter →") => ({
  id: uid(),
  type: "image_choice",
  content: {
    question,
    selection: "single",
    items: items.map((it) => ({ id: uid(), label: it.label, value: it.value, icon: it.icon ?? "", image_url: it.image_url ?? "" })),
    cta,
  },
});

const blockFreeText = (question, placeholder, cta = "Weiter →") => ({
  id: uid(),
  type: "free_text",
  content: { question, placeholder, cta },
});

const blockContactForm = (headline, cta_text, opts = {}) => ({
  id: uid(),
  type: "contact_form",
  content: {
    headline,
    cta_text,
    show_cv_upload: opts.show_cv_upload ?? false,
    show_city: opts.show_city ?? false,
  },
});

const blockThankYou = (headline, subtext) => ({
  id: uid(),
  type: "thank_you",
  content: { headline, subtext },
});

// VSL-Block: leere URL = Operator füllt im Editor (Properties-Panel) einen
// YouTube-/Vimeo-Link ein. Im Player wird der Block übersprungen wenn URL leer
// ist, also stört nichts solange der Operator es nicht customisiert hat.
const blockVideo = ({ video_url = "", aspect = "16/9", max_width = "100%" } = {}) => ({
  id: uid(),
  type: "video",
  content: {
    video_url,
    video_provider: video_url ? "youtube" : "youtube",
    video_aspect: aspect,
    video_max_width: max_width,
  },
});

// ─── Templates ────────────────────────────────────────────────────────────────

const templates = [
  // ── 1. Bäckerei-Recruiting ──────────────────────────────────────────────
  {
    slug: "baeckerei-recruiting",
    name: "Bäckerei Recruiting",
    description: "Quiz-Funnel für Bäckereien — qualifiziert Bewerber nach Schicht, Erfahrung und Wohnort.",
    category: "recruiting",
    niche: "baeckerei",
    intro_headline: "Werde Teil unseres Bäckerei-Teams 🥨",
    intro_subtext: "Beantworte 5 Fragen — wir melden uns innerhalb von 24h.",
    consent_text:
      "Mit dem Absenden deiner Bewerbung stimmst du der Verarbeitung deiner Daten gemäß unserer Datenschutzerklärung zu.",
    pages: [
      {
        page_order: 1,
        is_required: true,
        blocks: [
          // VSL: Operator paste hier YouTube-/Vimeo-Link mit 60-90s Recruiting-
          // Video (Backstube zeigen, Team vorstellen, "Bewerbe dich heute")
          blockVideo({ aspect: "16/9" }),
          blockProfileHeader({
            headline: "Wir suchen dich für unsere Backstube!",
            subtext: "Faires Gehalt · familiäres Team · Entwicklungsmöglichkeiten",
            cta_text: "Bewerbung starten →",
          }),
        ],
      },
      {
        page_order: 2,
        is_required: true,
        blocks: [
          blockVerticalTiles("Welche Schicht würde dir am besten passen?", [
            { label: "Frühschicht (3:00–11:00)", value: "frueh" },
            { label: "Mittelschicht (10:00–18:00)", value: "mittel" },
            { label: "Spätschicht (14:00–22:00)", value: "spaet" },
            { label: "Wochenende", value: "wochenende" },
          ]),
        ],
      },
      {
        page_order: 3,
        is_required: true,
        blocks: [
          blockMultipleChoice("Wie ist dein Erfahrungsstand?", [
            { label: "Keine Erfahrung — möchte lernen", value: "none", icon: "school" },
            { label: "Praktikum / Aushilfe", value: "praktikum", icon: "work" },
            { label: "Ausbildung abgeschlossen", value: "ausbildung", icon: "verified" },
            { label: "Meister / langjährige Erfahrung", value: "meister", icon: "star" },
          ]),
        ],
      },
      {
        page_order: 4,
        is_required: true,
        blocks: [
          blockFreeText("In welcher Stadt / PLZ wohnst du?", "z.B. 1010 Wien"),
        ],
      },
      {
        page_order: 5,
        is_required: true,
        blocks: [
          blockContactForm("So erreichen wir dich", "Bewerbung absenden →", { show_cv_upload: true }),
        ],
      },
      {
        page_order: 6,
        is_required: false,
        blocks: [
          blockThankYou(
            "Danke für deine Bewerbung! 🎉",
            "Wir melden uns innerhalb von 24 Stunden bei dir.",
          ),
        ],
      },
    ],
  },

  // ── 2. Pflege-Recruiting ────────────────────────────────────────────────
  {
    slug: "pflege-recruiting",
    name: "Pflege Recruiting",
    description: "Quiz-Funnel für Krankenhäuser, Altenheime und ambulante Dienste — qualifiziert nach Qualifikation und Bereich.",
    category: "recruiting",
    niche: "pflege",
    intro_headline: "Pflege mit Sinn — werde Teil unseres Teams 💙",
    intro_subtext: "Faires Gehalt, planbare Schichten und ein Team, das zusammenhält.",
    consent_text:
      "Mit dem Absenden deiner Bewerbung stimmst du der Verarbeitung deiner Daten gemäß unserer Datenschutzerklärung zu.",
    pages: [
      {
        page_order: 1,
        is_required: true,
        blocks: [
          blockProfileHeader({
            headline: "Pflege mit Herz und Struktur.",
            subtext: "Wir suchen Menschen, die sich für andere engagieren — und sich selbst dabei nicht verlieren.",
            cta_text: "Loslegen →",
          }),
        ],
      },
      {
        page_order: 2,
        is_required: true,
        blocks: [
          blockVerticalTiles("Welche Qualifikation hast du?", [
            { label: "Diplomierte/r Krankenpfleger/in (DGKP)", value: "dgkp" },
            { label: "Pflegefachassistent/in (PFA)", value: "pfa" },
            { label: "Pflegeassistent/in (PA)", value: "pa" },
            { label: "Quereinsteiger/in — interessiert", value: "quereinstieg" },
          ]),
        ],
      },
      {
        page_order: 3,
        is_required: true,
        blocks: [
          blockImageChoice("In welchem Bereich möchtest du arbeiten?", [
            { label: "Krankenhaus", value: "krankenhaus", icon: "local_hospital" },
            { label: "Altenheim", value: "altenheim", icon: "elderly" },
            { label: "Ambulanter Dienst", value: "ambulant", icon: "directions_car" },
            { label: "Egal — bin offen", value: "offen", icon: "all_inclusive" },
          ]),
        ],
      },
      {
        page_order: 4,
        is_required: true,
        blocks: [
          blockMultipleChoice("Welche Schichten gehen für dich klar?", [
            { label: "Tag", value: "tag", icon: "wb_sunny" },
            { label: "Nacht", value: "nacht", icon: "nights_stay" },
            { label: "Wochenende", value: "wochenende", icon: "weekend" },
            { label: "Nur Tag, kein Wochenende", value: "tag_nur", icon: "schedule" },
          ], "multiple"),
        ],
      },
      {
        page_order: 5,
        is_required: true,
        blocks: [
          blockContactForm("So erreichen wir dich", "Bewerbung absenden →", { show_cv_upload: true, show_city: true }),
        ],
      },
      {
        page_order: 6,
        is_required: false,
        blocks: [
          blockThankYou(
            "Vielen Dank — wir melden uns. 🤝",
            "Du hörst innerhalb von 24h von uns. Wir freuen uns auf das Gespräch!",
          ),
        ],
      },
    ],
  },

  // ── 3. Photovoltaik-Lead ───────────────────────────────────────────────
  {
    slug: "photovoltaik-lead",
    name: "Photovoltaik Lead-Funnel",
    description: "Quiz-Funnel für PV-Anbieter — qualifiziert nach Eigentum, Dach-Lage und Stromverbrauch.",
    category: "sales",
    niche: "photovoltaik",
    intro_headline: "Bis zu 70% Stromkosten sparen ☀️",
    intro_subtext: "Erhalte deine kostenlose Dachprüfung mit Stromertrag-Analyse in 2 Min.",
    consent_text:
      "Mit dem Absenden willige ich ein, dass mich der Anbieter telefonisch und per E-Mail kontaktiert, um mein Anliegen zu besprechen. Die Einwilligung kann jederzeit widerrufen werden. Details in der Datenschutzerklärung.",
    pages: [
      {
        page_order: 1,
        is_required: true,
        blocks: [
          blockProfileHeader({
            headline: "Lohnt sich PV für dein Dach?",
            subtext: "Beantworte 4 Fragen und erhalte eine kostenlose Erstanalyse.",
            cta_text: "Dachprüfung starten →",
          }),
        ],
      },
      {
        page_order: 2,
        is_required: true,
        blocks: [
          blockVerticalTiles("Was beschreibt deine Situation am besten?", [
            { label: "Ich habe ein Einfamilienhaus", value: "efh" },
            { label: "Ich habe ein Mehrfamilienhaus", value: "mfh" },
            { label: "Ich plane einen Neubau", value: "neubau" },
            { label: "Ich bin Mieter/in", value: "mieter", sublabel: "Leider können wir hier nicht weiterhelfen" },
          ]),
        ],
      },
      {
        page_order: 3,
        is_required: true,
        blocks: [
          blockImageChoice("Wie ist dein Dach ungefähr beschaffen?", [
            { label: "Süddach / viel Sonne", value: "sued", icon: "wb_sunny" },
            { label: "Ost-/Westdach", value: "ostwest", icon: "wb_twilight" },
            { label: "Norddach / wenig Sonne", value: "nord", icon: "cloud" },
            { label: "Flachdach", value: "flach", icon: "home" },
          ]),
        ],
      },
      {
        page_order: 4,
        is_required: true,
        blocks: [
          blockMultipleChoice("Wie hoch ist dein aktueller Stromverbrauch?", [
            { label: "Bis 100 € / Monat", value: "low", icon: "battery_low" },
            { label: "100–200 € / Monat", value: "mid", icon: "battery_5_bar" },
            { label: "Über 200 € / Monat", value: "high", icon: "battery_full" },
            { label: "Weiß ich nicht", value: "unknown", icon: "help" },
          ]),
        ],
      },
      {
        page_order: 5,
        is_required: true,
        blocks: [
          blockContactForm("Wo dürfen wir die Analyse hinschicken?", "Analyse anfordern →", { show_city: true }),
        ],
      },
      {
        page_order: 6,
        is_required: false,
        blocks: [
          blockThankYou(
            "Top — deine Analyse ist unterwegs! ☀️",
            "Wir rufen dich innerhalb von 24h an, um die Ergebnisse durchzugehen.",
          ),
        ],
      },
    ],
  },

  // ── 4. Coaching-Discovery ──────────────────────────────────────────────
  {
    slug: "coaching-discovery",
    name: "Coaching Discovery",
    description: "Quiz-Funnel für Coaches — hartes Qualifying nach Umsatz, Ziel und Budget.",
    category: "sales",
    niche: "coaching",
    intro_headline: "Skaliere dein Business — strukturiert, nicht zufällig.",
    intro_subtext: "4 Fragen, dann sehen wir, ob ein Erstgespräch Sinn macht.",
    consent_text:
      "Mit dem Absenden willige ich ein, dass mich der Anbieter telefonisch und per E-Mail kontaktiert, um mein Anliegen zu besprechen. Die Einwilligung kann jederzeit widerrufen werden. Details in der Datenschutzerklärung.",
    pages: [
      {
        page_order: 1,
        is_required: true,
        blocks: [
          blockProfileHeader({
            headline: "Bereit, dein Business zu skalieren?",
            subtext: "Discovery-Call nur für ernsthafte Selbstständige mit klarem Ziel.",
            cta_text: "Qualifizierungs-Quiz starten →",
          }),
        ],
      },
      {
        page_order: 2,
        is_required: true,
        blocks: [
          blockVerticalTiles("Wo stehst du aktuell mit deinem Umsatz?", [
            { label: "Unter 5.000 € / Monat", value: "lt5k" },
            { label: "5.000 – 15.000 € / Monat", value: "5_15k" },
            { label: "15.000 – 50.000 € / Monat", value: "15_50k" },
            { label: "Über 50.000 € / Monat", value: "gt50k" },
          ]),
        ],
      },
      {
        page_order: 3,
        is_required: true,
        blocks: [
          blockMultipleChoice("Was ist dein Hauptziel in den nächsten 6 Monaten?", [
            { label: "Umsatz verdoppeln", value: "double", icon: "trending_up" },
            { label: "Strukturen aufbauen / delegieren", value: "structure", icon: "account_tree" },
            { label: "Premium-Angebot launchen", value: "premium", icon: "diamond" },
            { label: "Team aufbauen", value: "team", icon: "groups" },
          ]),
        ],
      },
      {
        page_order: 4,
        is_required: true,
        blocks: [
          blockVerticalTiles(
            "Welches Budget hast du für die Begleitung über 3 Monate eingeplant?",
            [
              { label: "Unter 3.000 €", value: "lt3k", sublabel: "Für unser Programm zu niedrig — wir senden dir Selbstlern-Ressourcen." },
              { label: "3.000 – 8.000 €", value: "3_8k" },
              { label: "Über 8.000 €", value: "gt8k" },
              { label: "Budget noch unklar", value: "unclear" },
            ],
          ),
        ],
      },
      {
        page_order: 5,
        is_required: true,
        blocks: [
          blockContactForm("So vereinbaren wir den Discovery-Call", "Termin anfragen →"),
        ],
      },
      {
        page_order: 6,
        is_required: false,
        blocks: [
          blockThankYou(
            "Danke! 🚀",
            "Wir prüfen deine Angaben und melden uns innerhalb von 24h, ob ein Discovery-Call passt.",
          ),
        ],
      },
    ],
  },

  // ── 5. Handwerk-Anfrage ────────────────────────────────────────────────
  {
    slug: "handwerk-anfrage",
    name: "Handwerk Anfrage",
    description: "Quiz-Funnel für Handwerker — Gewerk, Adresse, Dringlichkeit. Kompatibel mit Foto-Upload-Tool.",
    category: "sales",
    niche: "handwerk",
    intro_headline: "Handwerker-Termin in unter 60 Sekunden anfragen 🔧",
    intro_subtext: "Kostenlos & unverbindlich. Wir melden uns mit einem konkreten Vorschlag.",
    consent_text:
      "Mit dem Absenden willige ich ein, dass mich der Handwerker telefonisch und per E-Mail kontaktiert, um meine Anfrage zu besprechen. Die Einwilligung kann jederzeit widerrufen werden. Details in der Datenschutzerklärung.",
    pages: [
      {
        page_order: 1,
        is_required: true,
        blocks: [
          blockProfileHeader({
            headline: "Welches Gewerk brauchst du?",
            subtext: "Wir bringen den richtigen Handwerker — pünktlich, sauber, fair.",
            cta_text: "Anfrage starten →",
          }),
        ],
      },
      {
        page_order: 2,
        is_required: true,
        blocks: [
          blockImageChoice("Welches Gewerk?", [
            { label: "Elektro", value: "elektro", icon: "bolt" },
            { label: "Sanitär & Heizung", value: "sanitaer", icon: "plumbing" },
            { label: "Boden & Fliesen", value: "boden", icon: "grid_view" },
            { label: "Maler & Trockenbau", value: "maler", icon: "format_paint" },
          ]),
        ],
      },
      {
        page_order: 3,
        is_required: true,
        blocks: [
          blockFreeText(
            "Beschreibe kurz, worum es geht — und gib uns die Adresse.",
            "z.B. 'Heizung ausgefallen, 1010 Wien, Mariahilferstraße 12'",
          ),
        ],
      },
      {
        page_order: 4,
        is_required: true,
        blocks: [
          blockVerticalTiles("Wie dringend ist der Termin?", [
            { label: "Notfall — heute oder morgen", value: "notfall" },
            { label: "Diese Woche", value: "woche" },
            { label: "Nächste 2-4 Wochen", value: "monat" },
            { label: "Flexibel", value: "flex" },
          ]),
        ],
      },
      {
        page_order: 5,
        is_required: true,
        blocks: [
          blockContactForm("Wir rufen zur Terminklärung an", "Anfrage abschicken →"),
        ],
      },
      {
        page_order: 6,
        is_required: false,
        blocks: [
          blockThankYou(
            "Danke! 👷",
            "Wir melden uns innerhalb von 4 Stunden mit einem konkreten Terminvorschlag.",
          ),
        ],
      },
    ],
  },
];

// ─── Insert/Upsert ────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding ${templates.length} funnel templates…`);
  for (const t of templates) {
    const payload = {
      slug: t.slug,
      name: t.name,
      description: t.description,
      category: t.category,
      niche: t.niche,
      intro_headline: t.intro_headline,
      intro_subtext: t.intro_subtext,
      consent_text: t.consent_text,
      pages: t.pages,
      default_branding: {},
      is_built_in: true,
    };
    const { error } = await supabase
      .from("funnel_templates")
      .upsert(payload, { onConflict: "slug" });
    if (error) {
      console.error(`  ✗ ${t.slug}: ${error.message}`);
      continue;
    }
    console.log(`  ✓ ${t.slug} (${t.pages.length} pages)`);
  }
  const { data: all } = await supabase.from("funnel_templates").select("slug, name, category").order("category");
  console.log(`\nIn DB: ${all?.length ?? 0} templates`);
  for (const r of all ?? []) console.log(`  ${r.category.padEnd(10)} ${r.slug.padEnd(28)} ${r.name}`);
}

main().catch((e) => {
  console.error("Failed:", e.message ?? e);
  process.exit(1);
});
