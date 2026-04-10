"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockType =
  | "profile_header" | "multiple_choice" | "image_choice" | "list_choice"
  | "contact_form" | "text" | "button" | "image" | "divider" | "rating"
  | "welcome" | "loading_screen" | "thank_you";

type ChoiceItem = { id: string; label: string; icon: string; value: string; image_url?: string };

type BlockContent = {
  image_url?: string; name?: string; title_text?: string;
  headline?: string; subtext?: string; cta_text?: string;
  question?: string; selection?: "single" | "multiple";
  items?: ChoiceItem[]; cta?: string;
  show_cv_upload?: boolean; show_city?: boolean;
  content?: string; size?: "sm" | "md" | "lg" | "xl";
  align?: "left" | "center"; bold?: boolean;
  label?: string; style?: "primary" | "outline";
  url?: string; alt?: string; rounded?: boolean;
  stars?: number; count?: string; source_text?: string;
  emoji?: string; spacing?: "sm" | "md" | "lg";
};

type Block = { id: string; type: BlockType; content: BlockContent };

type FunnelPage = {
  id?: string; page_order: number; is_required: boolean; blocks: Block[];
  page_type?: string; question_text?: string; selection_type?: string;
  options?: { label: string; icon: string; value: string }[];
  settings?: Record<string, unknown>;
};

type FunnelBranding = { primary_color: string; button_text_color: string; logo_url?: string };

type Funnel = {
  id: string; name: string; slug: string; status: string;
  funnel_type: string; external_url: string | null;
  branding: FunnelBranding | null; consent_text: string | null;
  job_id: string;
  job: { title: string; company: { name: string } } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10); }

const defaultBranding: FunnelBranding = { primary_color: "#F9BE2A", button_text_color: "#1A1A1A" };

function migratePageToBlocks(page: FunnelPage): Block[] {
  if (page.blocks && page.blocks.length > 0) return page.blocks;
  const pt = page.page_type;
  const qt = page.question_text ?? "";
  const s = (page.settings ?? {}) as Record<string, unknown>;
  if (pt === "intro") return [{ id: uid(), type: "profile_header", content: { headline: qt, subtext: s.subtext as string ?? "", cta_text: s.cta_text as string ?? "Jetzt bewerben →", name: s.profile_name as string ?? "", title_text: s.profile_title as string ?? "", image_url: s.profile_image_url as string ?? "" } }];
  if (pt === "question_tiles") return [{ id: uid(), type: "multiple_choice", content: { question: qt, selection: (page.selection_type ?? "single") as "single" | "multiple", items: (page.options ?? []).map((o) => ({ id: uid(), label: o.label, icon: o.icon, value: o.value })), cta: "Weiter →" } }];
  if (pt === "question_images") return [{ id: uid(), type: "image_choice", content: { question: qt, selection: "single", items: (page.options ?? []).map((o) => ({ id: uid(), label: o.label, icon: "", value: o.value, image_url: "" })), cta: "Weiter →" } }];
  if (pt === "contact_form") return [{ id: uid(), type: "contact_form", content: { headline: qt || "Wie können wir dich erreichen?", cta_text: s.cta_text as string ?? "Bewerbung absenden →", show_cv_upload: s.show_cv_upload as boolean ?? true, show_city: false } }];
  if (pt === "loading") return [{ id: uid(), type: "loading_screen", content: { headline: qt, subtext: s.subtext as string ?? "" } }];
  if (pt === "thank_you") return [{ id: uid(), type: "thank_you", content: { headline: qt, subtext: s.subtext as string ?? "" } }];
  return [];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FunnelPlayer({ funnel, pages: rawPages }: { funnel: Funnel; pages: FunnelPage[] }) {
  const branding: FunnelBranding = { ...defaultBranding, ...(funnel.branding ?? {}) };
  const color = branding.primary_color;
  const textColor = branding.button_text_color;

  const pages = rawPages.map((p) => ({ ...p, blocks: migratePageToBlocks(p) }));

  const [pageIdx, setPageIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "" });
  const [consent, setConsent] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPage = pages[pageIdx];

  // Auto-advance loading screen
  useEffect(() => {
    if (!currentPage) return;
    const hasLoading = currentPage.blocks.some((b) => b.type === "loading_screen");
    if (hasLoading) {
      const t = setTimeout(() => advance(), 2500);
      setAutoAdvance(t);
      return () => clearTimeout(t);
    }
  }, [pageIdx]);

  function advance() {
    if (autoAdvance) clearTimeout(autoAdvance);
    if (pageIdx < pages.length - 1) {
      setPageIdx((i) => i + 1);
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function toggleChoice(blockId: string, value: string, selection: "single" | "multiple") {
    setAnswers((prev) => {
      const current = prev[blockId] ?? [];
      if (selection === "single") {
        return { ...prev, [blockId]: [value] };
      }
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [blockId]: next };
    });
  }

  async function handleSubmit() {
    if (!form.name || !form.email || !form.phone) return;
    if (!consent) return;
    setSubmitting(true);

    // Advance immediately for good UX
    setSubmitted(true);
    advance();
    setSubmitting(false);

    // Upload CV to Supabase Storage (if provided), then call API
    (async () => {
      let cv_url: string | null = null;
      if (cvFile) {
        try {
          const supabase = createClient();
          const ext = cvFile.name.split(".").pop() ?? "pdf";
          const path = `${funnel.id}/${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("cvs")
            .upload(path, cvFile, { contentType: cvFile.type, upsert: false });
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(path);
            cv_url = urlData.publicUrl;
          }
        } catch { /* best-effort */ }
      }

      fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnel_id: funnel.id,
          job_id: funnel.job_id,
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          city: form.city || null,
          cv_url,
          answers,
        }),
      }).catch(() => {/* best-effort */});
    })();
  }

  if (!currentPage) {
    return (
      <Screen color={color} textColor={textColor} branding={branding}>
        <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: color }}>
            <span className="text-2xl font-bold" style={{ color: textColor }}>✓</span>
          </div>
          <h2 className="text-lg font-black text-gray-900 mb-2">Vielen Dank!</h2>
          <p className="text-sm text-gray-500">Deine Bewerbung wurde erfolgreich übermittelt.</p>
        </div>
      </Screen>
    );
  }

  return (
    <Screen color={color} textColor={textColor} branding={branding}>
      {/* Progress bar */}
      {pages.length > 1 && (
        <div className="w-full h-1 bg-gray-100 flex-shrink-0">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${((pageIdx + 1) / pages.length) * 100}%`, background: color }}
          />
        </div>
      )}

      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {currentPage.blocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            color={color}
            textColor={textColor}
            branding={branding}
            answers={answers[block.id] ?? []}
            onToggleChoice={(value, selection) => toggleChoice(block.id, value, selection)}
            onAdvance={advance}
            form={form}
            onFormChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
            consent={consent}
            onConsentChange={setConsent}
            consentText={funnel.consent_text}
            cvFile={cvFile}
            onCvChange={setCvFile}
            submitting={submitting}
            onSubmit={handleSubmit}
            submitted={submitted}
          />
        ))}
      </div>
    </Screen>
  );
}

// ─── Screen wrapper ───────────────────────────────────────────────────────────

function Screen({ children, color, textColor, branding }: {
  children: React.ReactNode; color: string; textColor: string; branding: FunnelBranding;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-0 sm:py-8 px-0 sm:px-4">
      <div className="w-full sm:max-w-sm bg-white sm:rounded-3xl sm:shadow-xl overflow-hidden flex flex-col min-h-screen sm:min-h-0">
        {branding.logo_url && (
          <div className="px-5 pt-4 pb-2 flex justify-center flex-shrink-0">
            <img src={branding.logo_url} alt="Logo" className="h-8 object-contain" />
          </div>
        )}
        {children}
        <div className="flex-shrink-0 py-3 text-center">
          <span className="text-[9px] text-gray-300">Powered by KI Recruiting</span>
        </div>
      </div>
    </div>
  );
}

// ─── Block Renderer ───────────────────────────────────────────────────────────

function BlockRenderer({
  block, color, textColor, branding, answers, onToggleChoice, onAdvance,
  form, onFormChange, consent, onConsentChange, consentText,
  cvFile, onCvChange, submitting, onSubmit, submitted,
}: {
  block: Block; color: string; textColor: string; branding: FunnelBranding;
  answers: string[]; onToggleChoice: (value: string, sel: "single" | "multiple") => void;
  onAdvance: () => void;
  form: { name: string; email: string; phone: string; city: string };
  onFormChange: (patch: Partial<typeof form>) => void;
  consent: boolean; onConsentChange: (v: boolean) => void;
  consentText: string | null;
  cvFile: File | null; onCvChange: (f: File | null) => void;
  submitting: boolean; onSubmit: () => Promise<void>; submitted: boolean;
}) {
  const c = block.content;

  // ── PROFILE HEADER ──
  if (block.type === "profile_header") {
    return (
      <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
        {c.image_url ? (
          <img src={c.image_url} className="w-16 h-16 rounded-full object-cover mb-3 border-4 border-white shadow-md" alt="" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-100 mb-3 flex items-center justify-center border-4 border-white shadow-md">
            <span className="text-2xl text-gray-300">👤</span>
          </div>
        )}
        {(c.name || c.title_text) && (
          <div className="mb-3">
            {c.name && <div className="font-bold text-sm text-gray-900">{c.name}</div>}
            {c.title_text && <div className="text-xs" style={{ color }}>{c.title_text}</div>}
          </div>
        )}
        <h1 className="font-black text-xl text-gray-900 leading-tight mb-2">{c.headline}</h1>
        {c.subtext && <p className="text-sm text-gray-500 mb-5 leading-relaxed">{c.subtext}</p>}
        <button onClick={onAdvance} className="w-full py-4 rounded-2xl font-black text-sm shadow-sm active:scale-95 transition-transform" style={{ background: color, color: textColor }}>
          {c.cta_text || "Jetzt bewerben →"}
        </button>
      </div>
    );
  }

  // ── WELCOME ──
  if (block.type === "welcome") {
    return (
      <div className="flex flex-col items-center text-center px-6 py-10">
        <div className="text-5xl mb-4">{c.emoji || "👋"}</div>
        <h2 className="font-black text-xl text-gray-900 mb-3">{c.headline}</h2>
        {c.subtext && <p className="text-sm text-gray-500 leading-relaxed mb-6">{c.subtext}</p>}
        <button onClick={onAdvance} className="w-full py-4 rounded-2xl font-black text-sm" style={{ background: color, color: textColor }}>
          Weiter →
        </button>
      </div>
    );
  }

  // ── MULTIPLE CHOICE ──
  if (block.type === "multiple_choice") {
    const sel = c.selection ?? "single";
    const hasSelection = answers.length > 0;
    return (
      <div className="px-5 py-6">
        <h2 className="font-black text-lg text-gray-900 mb-1 leading-tight">{c.question || "Frage"}</h2>
        {sel === "multiple" && <p className="text-xs text-gray-400 mb-3">Mehrere Antworten möglich</p>}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(c.items ?? []).map((item) => {
            const selected = answers.includes(item.value);
            return (
              <button
                key={item.id}
                onClick={() => onToggleChoice(item.value, sel)}
                className="flex items-center gap-2.5 rounded-2xl px-3 py-3.5 border-2 text-left transition-all active:scale-95"
                style={{ borderColor: selected ? color : "#E5E7EB", background: selected ? color + "15" : "white" }}
              >
                <span className="material-symbols-outlined text-base" style={{ color: selected ? color : "#9CA3AF" }}>{item.icon || "check"}</span>
                <span className="text-xs font-semibold text-gray-900 leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
        {(sel === "single" ? hasSelection : true) && (
          <button
            onClick={onAdvance}
            className="w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95"
            style={{ background: hasSelection ? color : "#F3F4F6", color: hasSelection ? textColor : "#9CA3AF" }}
          >
            {c.cta || "Weiter →"}
          </button>
        )}
      </div>
    );
  }

  // ── IMAGE CHOICE ──
  if (block.type === "image_choice") {
    return (
      <div className="px-5 py-6">
        <h2 className="font-black text-lg text-gray-900 mb-3 leading-tight">{c.question || "Frage"}</h2>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(c.items ?? []).map((item) => {
            const selected = answers.includes(item.value);
            return (
              <button
                key={item.id}
                onClick={() => { onToggleChoice(item.value, "single"); setTimeout(onAdvance, 300); }}
                className="relative rounded-2xl overflow-hidden border-3 transition-all active:scale-95"
                style={{ aspectRatio: "1", border: `3px solid ${selected ? color : "transparent"}` }}
              >
                {item.image_url ? (
                  <img src={item.image_url} className="w-full h-full object-cover" alt={item.label} />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-3xl text-gray-300">🖼</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 py-1.5 text-center" style={{ background: color }}>
                  <span className="font-bold text-xs" style={{ color: textColor }}>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── LIST CHOICE ──
  if (block.type === "list_choice") {
    return (
      <div className="px-5 py-6">
        <h2 className="font-black text-lg text-gray-900 mb-3 leading-tight">{c.question || "Frage"}</h2>
        <div className="space-y-2">
          {(c.items ?? []).map((item) => {
            const selected = answers.includes(item.value);
            return (
              <button
                key={item.id}
                onClick={() => { onToggleChoice(item.value, "single"); setTimeout(onAdvance, 300); }}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all active:scale-95 text-left"
                style={{ background: selected ? color : "#F3F4F6", color: selected ? textColor : "#111827" }}
              >
                <span className="material-symbols-outlined text-base" style={{ color: selected ? textColor : "#9CA3AF" }}>{item.icon || "arrow_right"}</span>
                <span className="text-sm font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── CONTACT FORM ──
  if (block.type === "contact_form") {
    const isValid = form.name && form.email && form.phone && consent;
    return (
      <div className="px-5 py-6">
        <h2 className="font-black text-lg text-gray-900 mb-4">{c.headline || "Deine Kontaktdaten"}</h2>
        <div className="space-y-3 mb-4">
          {[
            { key: "name" as const, emoji: "👋", ph: "Vollständiger Name", type: "text" },
            { key: "email" as const, emoji: "📧", ph: "E-Mail Adresse", type: "email" },
            { key: "phone" as const, emoji: "📱", ph: "Telefonnummer", type: "tel" },
          ].map((f) => (
            <div key={f.key} className="flex items-center gap-3 border-2 border-gray-200 rounded-2xl px-4 py-3 focus-within:border-current transition-colors" style={{ "--tw-border-opacity": 1 } as React.CSSProperties}>
              <span className="text-lg flex-shrink-0">{f.emoji}</span>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={(e) => onFormChange({ [f.key]: e.target.value })}
                placeholder={f.ph}
                className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
              />
            </div>
          ))}
          {c.show_city && (
            <div className="flex items-center gap-3 border-2 border-gray-200 rounded-2xl px-4 py-3">
              <span className="text-lg">📍</span>
              <input
                type="text"
                value={form.city}
                onChange={(e) => onFormChange({ city: e.target.value })}
                placeholder="Deine Stadt"
                className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
              />
            </div>
          )}
          {c.show_cv_upload && (
            <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl px-4 py-3 cursor-pointer hover:border-gray-300 transition-colors">
              <span className="text-lg">📎</span>
              <div className="flex-1">
                {cvFile ? (
                  <span className="text-sm text-gray-900 font-medium">{cvFile.name}</span>
                ) : (
                  <>
                    <div className="text-sm text-gray-500 font-medium">Lebenslauf hochladen (optional)</div>
                    <div className="text-xs text-gray-400">max. 5MB · PDF, JPG, PNG</div>
                  </>
                )}
              </div>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => onCvChange(e.target.files?.[0] ?? null)} />
            </label>
          )}
        </div>
        {/* Consent */}
        <button
          onClick={() => onConsentChange(!consent)}
          className="flex items-start gap-3 text-left w-full mb-5"
        >
          <div
            className="w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
            style={{ borderColor: consent ? color : "#D1D5DB", background: consent ? color : "white" }}
          >
            {consent && <span className="text-white text-xs font-black">✓</span>}
          </div>
          <span className="text-xs text-gray-500 leading-relaxed">
            {consentText || "Ich stimme der Datenschutzerklärung zu und erkläre mich einverstanden, dass meine Daten zur Bearbeitung meiner Bewerbung verwendet werden."}
          </span>
        </button>
        {!isValid && (form.name || form.email || form.phone) && (
          <p className="text-xs text-red-500 mb-3 text-center">
            {!form.name ? "Bitte Namen eingeben." : !form.email ? "Bitte E-Mail eingeben." : !form.phone ? "Bitte Telefonnummer eingeben — wird für dein Bewerbungsgespräch benötigt." : "Bitte Datenschutz zustimmen."}
          </p>
        )}
        <button
          onClick={onSubmit}
          disabled={!isValid || submitting}
          className="w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
          style={{ background: color, color: textColor }}
        >
          {submitting ? "Wird gesendet…" : c.cta_text || "Bewerbung absenden →"}
        </button>
      </div>
    );
  }

  // ── TEXT ──
  if (block.type === "text") {
    return (
      <div className={`px-5 py-3 ${c.align === "center" ? "text-center" : "text-left"}`}>
        <p className={`leading-relaxed text-gray-700 ${c.bold ? "font-bold" : ""} ${
          c.size === "xl" ? "text-xl" : c.size === "lg" ? "text-base" : c.size === "sm" ? "text-xs" : "text-sm"
        }`}>
          {c.content}
        </p>
      </div>
    );
  }

  // ── BUTTON ──
  if (block.type === "button") {
    return (
      <div className="px-5 py-3">
        <button
          onClick={onAdvance}
          className="w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95"
          style={c.style === "outline"
            ? { border: `2px solid ${color}`, color, background: "transparent" }
            : { background: color, color: textColor }}
        >
          {c.label || "Weiter →"}
        </button>
      </div>
    );
  }

  // ── IMAGE ──
  if (block.type === "image" && c.url) {
    return (
      <div className="px-5 py-3">
        <img src={c.url} alt={c.alt ?? ""} className={`w-full object-cover ${c.rounded ? "rounded-2xl" : ""}`} />
      </div>
    );
  }

  // ── DIVIDER ──
  if (block.type === "divider") {
    return (
      <div className={`px-5 ${c.spacing === "lg" ? "py-6" : c.spacing === "sm" ? "py-2" : "py-4"}`}>
        <div className="w-full h-px bg-gray-100" />
      </div>
    );
  }

  // ── RATING ──
  if (block.type === "rating") {
    return (
      <div className="px-5 py-3 text-center">
        <div className="flex justify-center gap-1 mb-1">
          {Array.from({ length: c.stars ?? 5 }).map((_, i) => (
            <span key={i} className="text-lg" style={{ color }}>★</span>
          ))}
        </div>
        <div className="text-xs text-gray-500">
          {c.count && <span className="font-bold text-gray-900">{c.count} von </span>}
          {c.source_text}
        </div>
      </div>
    );
  }

  // ── LOADING SCREEN ──
  if (block.type === "loading_screen") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: color + "20" }}>
          <span className="material-symbols-outlined text-2xl animate-spin" style={{ color }}>progress_activity</span>
        </div>
        <h2 className="font-black text-lg text-gray-900 mb-2">{c.headline || "Einen Moment…"}</h2>
        {c.subtext && <p className="text-sm text-gray-500">{c.subtext}</p>}
      </div>
    );
  }

  // ── THANK YOU ──
  if (block.type === "thank_you") {
    return (
      <div className="flex flex-col items-center text-center py-16 px-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: color }}>
          <span className="font-black text-2xl" style={{ color: textColor }}>✓</span>
        </div>
        <p className="text-xs font-bold mb-2" style={{ color }}>Großartige Neuigkeiten!</p>
        <h2 className="font-black text-xl text-gray-900 leading-tight mb-3">{c.headline || "Vielen Dank!"}</h2>
        {c.subtext && <p className="text-sm text-gray-500 leading-relaxed">{c.subtext}</p>}
      </div>
    );
  }

  return null;
}
