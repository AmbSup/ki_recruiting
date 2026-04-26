"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LeadModal } from "../../leads/lead-modal";

type CallStrategy = {
  hook_one_liner?: string;
  pain_points?: string[];
  discovery_questions?: string[];
  disqualification_criteria?: string;
  top_objections?: { objection: string; response: string }[];
  success_definition?: string;
  on_disqualify?: "hangup" | "redirect_resource" | "";
  fallback_resource_url?: string;
  verbal_commitment_required?: boolean;
  caller_name?: string;
  tone_formality?: "formell" | "locker" | "";
  tone_warmth?: "sachlich" | "warm" | "";
  urgency_trigger?: string;
  llm_model?: string;
  // Legacy / unverändert mitgeführt
  hook_promise?: string;
  hard_qualifier_questions?: string[];
  show_rate_confirmation_phrase?: string;
  require_consent?: boolean;
  llm_provider?: string;
  [key: string]: unknown;
};

type PipelineStats = {
  funnels: { id: string; name: string; slug: string; status: string | null }[];
  leads_count: number;
  leads_30d: number;
  leads_recent: { id: string; full_name: string | null; first_name: string | null; status: string; source: string; created_at: string }[];
  calls_count: number;
  calls_recent: { id: string; status: string; sales_lead_id: string; created_at: string; lead_name: string | null; rating: number | null }[];
  meetings_30d: number;
};

type Program = {
  id: string;
  company_id: string;
  name: string;
  product_pitch: string | null;
  value_proposition: string | null;
  target_persona: string | null;
  script_guidelines: string | null;
  vapi_assistant_id: string | null;
  vapi_phone_number_id: string | null;
  caller_phone_number: string | null;
  booking_link: string | null;
  meta_form_ids: string[];
  auto_dial: boolean;
  status: string;
  call_strategy: CallStrategy | null;
  system_prompt_override: string | null;
  first_message_override: string | null;
  created_at: string;
  company: { id: string; name: string };
};

const statusOptions = [
  { value: "draft",  label: "Entwurf" },
  { value: "active", label: "Aktiv" },
  { value: "paused", label: "Pausiert" },
  { value: "closed", label: "Geschlossen" },
];

export default function ProgramEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [program, setProgram] = useState<Program | null>(null);
  const [form, setForm] = useState<Partial<Program>>({});
  const [strategy, setStrategy] = useState<CallStrategy>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [metaFormInput, setMetaFormInput] = useState("");
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [stats, setStats] = useState<PipelineStats | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sales_programs")
      .select("*, company:companies(id, name)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          const p = data as unknown as Program;
          setProgram(p);
          setForm(p);
          // Backward-Compat-Mapping bei Erst-Load: alte Keys → neue Keys, damit
          // die UI sauber rendert ohne dass der User nichts sieht.
          const cs = (p.call_strategy ?? {}) as CallStrategy;
          const migrated: CallStrategy = { ...cs };
          if (!migrated.hook_one_liner && cs.hook_promise) migrated.hook_one_liner = cs.hook_promise;
          if (!migrated.discovery_questions && Array.isArray(cs.hard_qualifier_questions)) {
            migrated.discovery_questions = cs.hard_qualifier_questions;
          }
          setStrategy(migrated);
        }
        setLoading(false);
      });
  }, [id]);

  // Pipeline-Stats: 4 parallele Queries (Funnels-Liste, Leads-Count + recent,
  // Calls-Count + recent, Meetings-30d-Count). Eigener useEffect, damit Edit-Form
  // und Stats unabhängig laden.
  useEffect(() => {
    const supabase = createClient();
    const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    Promise.all([
      supabase.from("funnels").select("id, name, slug, status").eq("sales_program_id", id),
      supabase.from("sales_leads").select("id", { count: "exact", head: true }).eq("sales_program_id", id),
      supabase.from("sales_leads").select("id", { count: "exact", head: true }).eq("sales_program_id", id).gte("created_at", cutoff30d),
      supabase.from("sales_leads").select("id, full_name, first_name, status, source, created_at").eq("sales_program_id", id).order("created_at", { ascending: false }).limit(5),
      supabase.from("sales_calls").select("id", { count: "exact", head: true }).eq("sales_program_id", id),
      supabase.from("sales_calls").select("id, status, sales_lead_id, created_at, lead:sales_leads(full_name, first_name), analysis:sales_call_analyses(call_rating)").eq("sales_program_id", id).order("created_at", { ascending: false }).limit(5),
      supabase.from("sales_call_analyses").select("id, sales_call:sales_calls!inner(sales_program_id)", { count: "exact", head: true }).eq("meeting_booked", true).eq("sales_call.sales_program_id", id).gte("created_at", cutoff30d),
    ]).then(([funnelsRes, leadsCountRes, leads30dRes, leadsRecentRes, callsCountRes, callsRecentRes, meetings30dRes]) => {
      const callsRecentRaw = (callsRecentRes.data ?? []) as Array<{
        id: string; status: string; sales_lead_id: string; created_at: string;
        lead: { full_name: string | null; first_name: string | null } | { full_name: string | null; first_name: string | null }[] | null;
        analysis: { call_rating: number | null } | { call_rating: number | null }[] | null;
      }>;
      const callsRecent = callsRecentRaw.map((c) => {
        const leadObj = Array.isArray(c.lead) ? c.lead[0] : c.lead;
        const analysisObj = Array.isArray(c.analysis) ? c.analysis[0] : c.analysis;
        return {
          id: c.id,
          status: c.status,
          sales_lead_id: c.sales_lead_id,
          created_at: c.created_at,
          lead_name: leadObj?.full_name ?? leadObj?.first_name ?? null,
          rating: analysisObj?.call_rating ?? null,
        };
      });
      setStats({
        funnels: (funnelsRes.data ?? []) as PipelineStats["funnels"],
        leads_count: leadsCountRes.count ?? 0,
        leads_30d: leads30dRes.count ?? 0,
        leads_recent: (leadsRecentRes.data ?? []) as PipelineStats["leads_recent"],
        calls_count: callsCountRes.count ?? 0,
        calls_recent: callsRecent,
        meetings_30d: meetings30dRes.count ?? 0,
      });
    }).catch((err) => {
      console.error("[programs/[id]] pipeline stats failed:", err);
    });
  }, [id]);

  function update<K extends keyof Program>(field: K, value: Program[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  function updateStrategy<K extends keyof CallStrategy>(field: K, value: CallStrategy[K]) {
    setStrategy((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  function addMetaFormId() {
    const trimmed = metaFormInput.trim();
    if (!trimmed) return;
    const cur = (form.meta_form_ids ?? []) as string[];
    if (cur.includes(trimmed)) return;
    update("meta_form_ids", [...cur, trimmed] as Program["meta_form_ids"]);
    setMetaFormInput("");
  }

  function removeMetaFormId(v: string) {
    const cur = (form.meta_form_ids ?? []) as string[];
    update("meta_form_ids", cur.filter((x) => x !== v) as Program["meta_form_ids"]);
  }

  async function save() {
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: form.name,
      product_pitch: form.product_pitch,
      value_proposition: form.value_proposition,
      target_persona: form.target_persona,
      script_guidelines: form.script_guidelines,
      vapi_assistant_id: form.vapi_assistant_id,
      vapi_phone_number_id: form.vapi_phone_number_id,
      caller_phone_number: form.caller_phone_number,
      booking_link: form.booking_link,
      meta_form_ids: form.meta_form_ids ?? [],
      auto_dial: form.auto_dial ?? false,
      status: form.status,
      system_prompt_override: form.system_prompt_override,
      first_message_override: form.first_message_override,
      // call_strategy wird server-seitig mit existierendem JSONB gemerget,
      // damit unbekannte Keys (z.B. von Migrationen) erhalten bleiben.
      call_strategy: strategy,
    };
    const res = await fetch(`/api/sales/programs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) setDirty(false);
    setSaving(false);
  }

  async function del() {
    if (!confirm("Program wirklich löschen? Alle Leads und Calls bleiben erhalten, werden aber vom Program getrennt (ON DELETE CASCADE auf Leads).")) return;
    await fetch(`/api/sales/programs/${id}`, { method: "DELETE" });
    window.location.href = "/sales/programs";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-3xl text-outline animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="px-8 pt-10">
        <p className="font-body text-on-surface-variant">Program nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div className="px-8 pt-10 pb-32 max-w-[1200px]">
      <Link
        href="/sales/programs"
        className="inline-flex items-center gap-1.5 text-outline hover:text-on-surface transition-colors mb-8"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest">Alle Programs</span>
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">
            {program.company.name}
          </p>
          <h1 className="font-headline text-4xl italic text-on-surface leading-none mb-1">
            {form.name || program.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {dirty && (
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-sm">{saving ? "progress_activity" : "save"}</span>
              {saving ? "Speichert…" : "Speichern"}
            </button>
          )}
          <button
            onClick={() => setLeadModalOpen(true)}
            className="flex items-center gap-1.5 border border-primary/30 text-primary px-4 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-container/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            Test-Lead anlegen
          </button>
          <button
            onClick={del}
            className="flex items-center gap-1.5 border border-error/30 text-error px-4 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-error-container/20 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Löschen
          </button>
        </div>
      </div>

      {/* Pipeline-KPIs + Verknüpfungen — vor dem Edit-Form, weil das die wichtigste Übersicht ist. */}
      <div className="space-y-5 mb-6">
        <Card label="Pipeline" icon="account_tree">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCell label="Funnels" value={stats?.funnels.length ?? "—"} icon="quiz" />
            <KpiCell
              label="Leads"
              value={stats?.leads_count ?? "—"}
              icon="person"
              sub={stats ? `+${stats.leads_30d} (30d)` : undefined}
            />
            <KpiCell label="Calls" value={stats?.calls_count ?? "—"} icon="call" />
            <KpiCell
              label="Termine 30d"
              value={stats?.meetings_30d ?? "—"}
              icon="event_available"
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card label="Funnels" icon="quiz">
            {stats === null ? (
              <p className="font-body text-xs text-outline">Lädt…</p>
            ) : stats.funnels.length === 0 ? (
              <p className="font-body text-xs text-outline italic">Noch kein Funnel auf dieses Program gerichtet.</p>
            ) : (
              <ul className="space-y-1.5">
                {stats.funnels.slice(0, 5).map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/funnels/${f.id}/editor`}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors group"
                    >
                      <span className="font-body text-sm text-on-surface truncate group-hover:text-primary">{f.name}</span>
                      {f.status && (
                        <span className="font-label text-[10px] text-outline uppercase tracking-wider flex-shrink-0">{f.status}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card label="Letzte Leads" icon="person">
            {stats === null ? (
              <p className="font-body text-xs text-outline">Lädt…</p>
            ) : stats.leads_recent.length === 0 ? (
              <p className="font-body text-xs text-outline italic">Noch keine Leads.</p>
            ) : (
              <ul className="space-y-1.5">
                {stats.leads_recent.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/sales/leads/${l.id}`}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-outline text-xs flex-shrink-0">{l.source === "funnel" ? "quiz" : l.source === "meta_form" ? "ads_click" : l.source === "csv" ? "table_chart" : l.source === "test" ? "science" : "edit"}</span>
                        <span className="font-body text-sm text-on-surface truncate group-hover:text-primary">{l.full_name ?? l.first_name ?? "(unbenannt)"}</span>
                      </div>
                      <span className="font-label text-[10px] text-outline uppercase tracking-wider flex-shrink-0">{l.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {stats && stats.leads_count > 5 && (
              <Link href={`/sales/leads?program=${id}`} className="block mt-2 font-label text-xs font-bold text-primary hover:underline">
                Alle {stats.leads_count} Leads →
              </Link>
            )}
          </Card>

          <Card label="Letzte Calls" icon="call">
            {stats === null ? (
              <p className="font-body text-xs text-outline">Lädt…</p>
            ) : stats.calls_recent.length === 0 ? (
              <p className="font-body text-xs text-outline italic">Noch kein Call.</p>
            ) : (
              <ul className="space-y-1.5">
                {stats.calls_recent.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/sales/calls/${c.id}`}
                      className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-container-low transition-colors group"
                    >
                      <span className="font-body text-sm text-on-surface truncate group-hover:text-primary">{c.lead_name ?? "(unbenannt)"}</span>
                      <span className="font-label text-[10px] text-outline uppercase tracking-wider flex-shrink-0">
                        {c.status}{c.rating != null ? ` · ${c.rating}/10` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 space-y-5">
          <Card label="Grunddaten" icon="trending_up">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" value={form.name ?? ""} onChange={(v) => update("name", v)} className="col-span-2" />
              <Select label="Status" value={form.status ?? "draft"} options={statusOptions} onChange={(v) => update("status", v)} />
              <ToggleField
                label="Auto-Dial"
                value={!!form.auto_dial}
                onChange={(v) => update("auto_dial", v)}
                hint="Neue Leads sofort anrufen"
              />
            </div>
          </Card>

          <Card label="Pitch & Targeting" icon="record_voice_over">
            <TextArea label="Produkt-Pitch (1-2 Sätze: Was bieten wir an?)" value={form.product_pitch ?? ""} onChange={(v) => update("product_pitch", v)} rows={4} />
            <TextArea label="Zielpersona (Wer ist die Zielperson?)" value={form.target_persona ?? ""} onChange={(v) => update("target_persona", v)} rows={4} />
          </Card>

          <Card label="Sales-Strategie" icon="psychology">
            <p className="font-body text-xs text-outline -mt-2 mb-1">
              Strukturierte Steuerung dessen, was die KI im Call tun soll. Wird automatisch in den System-Prompt gerendert.
            </p>

            <Field
              label="Hook (1 Satz, der Aufmerksamkeit erzeugt)"
              value={strategy.hook_one_liner ?? ""}
              onChange={(v) => updateStrategy("hook_one_liner", v)}
              placeholder="z.B. „Wussten Sie, dass Photovoltaik-Anlagen sich aktuell in unter 7 Jahren amortisieren?“"
            />

            <DynamicList
              label="Pain Points, die wir lösen"
              hint="2-5 konkrete Schmerzen der Zielpersona"
              items={strategy.pain_points ?? []}
              onChange={(items) => updateStrategy("pain_points", items)}
              placeholder="z.B. Hohe Stromkosten von >150€/Monat"
            />

            <DynamicList
              label="Discovery-Fragen (Must-Ask vor dem Pitch)"
              hint="3-5 Fragen, mit denen die KI qualifiziert"
              items={strategy.discovery_questions ?? []}
              onChange={(items) => updateStrategy("discovery_questions", items)}
              placeholder="z.B. Wie hoch sind Ihre monatlichen Stromkosten aktuell?"
            />

            <TextArea
              label="Disqualifikations-Kriterien"
              value={strategy.disqualification_criteria ?? ""}
              onChange={(v) => updateStrategy("disqualification_criteria", v)}
              rows={3}
              placeholder="z.B. Mietwohnung, kein Eigentum, keine Entscheidungsbefugnis"
            />

            <ObjectionsList
              objections={strategy.top_objections ?? []}
              onChange={(items) => updateStrategy("top_objections", items)}
            />

            <TextArea
              label="Erfolgs-Definition (was zählt als gewonnener Call?)"
              value={strategy.success_definition ?? ""}
              onChange={(v) => updateStrategy("success_definition", v)}
              rows={3}
              placeholder="z.B. Beratungstermin im Kalender gebucht, Lead bestätigt verbal"
            />

            <Field
              label="Verknappung / Dringlichkeit (warum JETZT?)"
              value={strategy.urgency_trigger ?? ""}
              onChange={(v) => updateStrategy("urgency_trigger", v)}
              placeholder='z.B. "nur noch 12 Förderplätze in Q1 2026" oder "KfW-Förderung läuft Ende März aus"'
            />

            <div>
              <label className="font-label text-xs text-outline block mb-1.5">Bei Disqualifikation</label>
              <div className="flex gap-2">
                {[
                  { v: "hangup", l: "Auflegen" },
                  { v: "redirect_resource", l: "Resource per SMS" },
                  { v: "", l: "—" },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => updateStrategy("on_disqualify", o.v as CallStrategy["on_disqualify"])}
                    className={`px-3 py-1.5 rounded-lg font-label text-xs font-bold transition-colors ${
                      (strategy.on_disqualify ?? "") === o.v
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
              {strategy.on_disqualify === "redirect_resource" && (
                <Field
                  label=""
                  value={strategy.fallback_resource_url ?? ""}
                  onChange={(v) => updateStrategy("fallback_resource_url", v)}
                  type="url"
                  placeholder="https://… (Link, der in der SMS landet)"
                  className="mt-2"
                />
              )}
            </div>

            <ToggleField
              label="Verbale Bestätigung erforderlich"
              value={strategy.verbal_commitment_required ?? false}
              onChange={(v) => updateStrategy("verbal_commitment_required", v)}
              hint="KI fordert vor jedem Termin EXPLIZITES „Ja“"
            />
          </Card>

          <Card label="Tonalität" icon="campaign">
            <Field
              label="Caller-Name (welchen Namen nennt die KI?)"
              value={strategy.caller_name ?? ""}
              onChange={(v) => updateStrategy("caller_name", v)}
              placeholder="Jonas"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-label text-xs text-outline block mb-1.5">Formalität</label>
                <div className="flex gap-2">
                  {[{ v: "formell", l: "Formell" }, { v: "locker", l: "Locker" }].map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => updateStrategy("tone_formality", o.v as CallStrategy["tone_formality"])}
                      className={`flex-1 px-3 py-1.5 rounded-lg font-label text-xs font-bold transition-colors ${
                        (strategy.tone_formality ?? "") === o.v
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-label text-xs text-outline block mb-1.5">Wärme</label>
                <div className="flex gap-2">
                  {[{ v: "sachlich", l: "Sachlich" }, { v: "warm", l: "Warm" }].map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => updateStrategy("tone_warmth", o.v as CallStrategy["tone_warmth"])}
                      className={`flex-1 px-3 py-1.5 rounded-lg font-label text-xs font-bold transition-colors ${
                        (strategy.tone_warmth ?? "") === o.v
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Select
              label="LLM-Modell"
              value={strategy.llm_model ?? "gpt-4o"}
              options={[
                { value: "gpt-4o", label: "GPT-4o (default)" },
                { value: "gpt-4o-mini", label: "GPT-4o-mini (schneller, günstiger)" },
                { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
              ]}
              onChange={(v) => updateStrategy("llm_model", v)}
            />
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-5">
          <Card label="Vapi & Telefonie" icon="support_agent">
            <Field label="Vapi Assistant ID" value={form.vapi_assistant_id ?? ""} onChange={(v) => update("vapi_assistant_id", v)} placeholder="asst_abc123…" />
            <Field label="Vapi Phone-Number ID" value={form.vapi_phone_number_id ?? ""} onChange={(v) => update("vapi_phone_number_id", v)} placeholder="phn_abc123…" />
            <Field label="Caller-Nummer (E.164)" value={form.caller_phone_number ?? ""} onChange={(v) => update("caller_phone_number", v)} placeholder="+4315551234" />
            <Field label="Booking-Link" type="url" value={form.booking_link ?? ""} onChange={(v) => update("booking_link", v)} placeholder="https://cal.com/…" />
          </Card>

          <Card label="Meta-Leadgen-Formulare" icon="ads_click">
            <p className="font-body text-xs text-outline mb-3">
              Form-IDs von Meta-Lead-Ads, die in dieses Program einlaufen. Der Matcher-Workflow ordnet Leads darüber zu.
            </p>
            <div className="flex gap-2">
              <input
                value={metaFormInput}
                onChange={(e) => setMetaFormInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMetaFormId(); } }}
                placeholder="Form-ID eingeben + Enter"
                className={inputClass + " flex-1"}
              />
              <button
                type="button"
                onClick={addMetaFormId}
                className="bg-primary text-on-primary px-4 py-2.5 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors"
              >
                Hinzufügen
              </button>
            </div>
            {(form.meta_form_ids ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {(form.meta_form_ids as string[]).map((fid) => (
                  <span key={fid} className="flex items-center gap-1.5 bg-surface-container-low rounded-lg px-3 py-1.5 font-label text-xs">
                    <span className="font-mono text-on-surface">{fid}</span>
                    <button
                      onClick={() => removeMetaFormId(fid)}
                      className="material-symbols-outlined text-outline hover:text-error text-sm"
                    >
                      close
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)]">
            <h3 className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-4">Details</h3>
            <div className="space-y-3">
              {[
                { label: "Program-ID", value: id.slice(0, 8) + "…" },
                { label: "Erstellt", value: new Date(program.created_at).toLocaleDateString("de-AT", { day: "2-digit", month: "long", year: "numeric" }) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">{label}</span>
                  <span className="font-body text-xs text-on-surface-variant">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced — komplett-Override des System-Prompts und der ersten Nachricht.
          Nur nutzen wenn die strukturierten Strategie-Felder oben nicht reichen. */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 font-label text-xs font-bold uppercase tracking-widest text-outline hover:text-on-surface transition-colors"
        >
          <span className={`material-symbols-outlined text-sm transition-transform ${showAdvanced ? "rotate-90" : ""}`}>chevron_right</span>
          Advanced — Prompt-Overrides
        </button>
        {showAdvanced && (
          <div className="mt-3 space-y-5">
            <Card label="System-Prompt-Override" icon="code">
              <p className="font-body text-xs text-outline -mt-2 mb-1">
                Ersetzt den Use-Case-Template-Body komplett. Strategie-Block (oben) und Context-Block werden weiter automatisch angehängt. Nur nutzen wenn die strukturierten Felder oben nicht reichen.
              </p>
              <TextArea
                label="System-Prompt-Body"
                value={form.system_prompt_override ?? ""}
                onChange={(v) => update("system_prompt_override", v)}
                rows={10}
                placeholder="Leer lassen → Use-Case-Template wird verwendet."
              />
              <TextArea
                label="First-Message-Override (Opener)"
                value={form.first_message_override ?? ""}
                onChange={(v) => update("first_message_override", v)}
                rows={3}
                placeholder="Leer lassen → Use-Case-Opener wird verwendet."
              />
            </Card>
            <Card label="Legacy" icon="archive">
              <TextArea
                label="Value Proposition (deprecated)"
                value={form.value_proposition ?? ""}
                onChange={(v) => update("value_proposition", v)}
                rows={3}
                placeholder="Wurde durch Pain Points ersetzt — nur noch hier sichtbar für Bestandsdaten."
              />
              <TextArea
                label="Script-Guidelines (intern)"
                value={form.script_guidelines ?? ""}
                onChange={(v) => update("script_guidelines", v)}
                rows={3}
                placeholder="Optionaler interner Hinweis-Text."
              />
            </Card>
          </div>
        )}
      </div>

      <LeadModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        defaultProgramId={id}
      />
    </div>
  );
}

function DynamicList({ label, hint, items, onChange, placeholder }: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="font-label text-xs text-outline block mb-1">{label}</label>
      {hint && <p className="font-body text-[10px] text-outline mb-1.5">{hint}</p>}
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="material-symbols-outlined text-outline hover:text-error text-sm flex-shrink-0"
            >
              close
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="flex items-center gap-1 font-label text-xs font-bold text-primary hover:underline"
        >
          <span className="material-symbols-outlined text-xs">add</span> Hinzufügen
        </button>
      </div>
    </div>
  );
}

function ObjectionsList({ objections, onChange }: {
  objections: { objection: string; response: string }[];
  onChange: (items: { objection: string; response: string }[]) => void;
}) {
  // Render mindestens 3 Slots, damit der User eine Vorlage hat.
  const slots = objections.length < 3
    ? [...objections, ...Array(3 - objections.length).fill({ objection: "", response: "" })]
    : objections;
  return (
    <div>
      <label className="font-label text-xs text-outline block mb-1">Top Einwände + Antworten</label>
      <p className="font-body text-[10px] text-outline mb-1.5">Häufigste Einwände der Zielpersona — KI nutzt deine Antwort 1:1.</p>
      <div className="space-y-2">
        {slots.map((o, i) => (
          <div key={i} className="bg-surface-container-low rounded-xl p-2.5 space-y-1.5">
            <input
              value={o.objection}
              onChange={(e) => {
                const next = [...slots];
                next[i] = { ...next[i], objection: e.target.value };
                onChange(next);
              }}
              placeholder={`Einwand ${i + 1} (z.B. "Zu teuer")`}
              className={inputClass}
            />
            <input
              value={o.response}
              onChange={(e) => {
                const next = [...slots];
                next[i] = { ...next[i], response: e.target.value };
                onChange(next);
              }}
              placeholder="Deine Antwort"
              className={inputClass}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCell({ label, value, icon, sub }: {
  label: string;
  value: string | number;
  icon: string;
  sub?: string;
}) {
  return (
    <div className="bg-surface-container-low rounded-xl p-3 flex items-start gap-3">
      <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <div className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">{label}</div>
        <div className="font-headline text-2xl text-on-surface leading-none mt-0.5">{value}</div>
        {sub && <div className="font-label text-[10px] text-outline mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function Card({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(45,52,51,0.06)] space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-primary text-base">{icon}</span>
        <span className="font-label text-sm font-bold uppercase tracking-widest text-primary">{label}</span>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, className = "" }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="font-label text-sm text-on-surface-variant block mb-1.5">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 4, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  rows?: number; placeholder?: string;
}) {
  return (
    <div>
      {label && <label className="font-label text-sm text-on-surface-variant block mb-1.5">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={inputClass + " resize-y min-h-[88px] leading-relaxed"}
      />
    </div>
  );
}

function Select({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="font-label text-sm text-on-surface-variant block mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, value, onChange, hint }: {
  label: string; value: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <div>
      <label className="font-label text-sm text-on-surface-variant block mb-1.5">{label}</label>
      <label className="flex items-center gap-3 bg-surface-container-low rounded-xl px-4 py-3 cursor-pointer">
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        <span className="font-body text-sm text-on-surface-variant">{hint ?? (value ? "Aktiv" : "Inaktiv")}</span>
      </label>
    </div>
  );
}

const inputClass = "w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-base text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
