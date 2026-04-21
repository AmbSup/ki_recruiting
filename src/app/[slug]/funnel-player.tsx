"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockType =
  | "profile_header" | "multiple_choice" | "image_choice" | "list_choice"
  | "contact_form" | "text" | "button" | "image" | "divider" | "rating"
  | "welcome" | "loading_screen" | "thank_you" | "icon_cards" | "free_text";

type ChoiceItem = { id: string; label: string; icon: string; value: string; image_url?: string };

type BlockContent = {
  image_url?: string; name?: string; title_text?: string;
  headline?: string; subtext?: string; cta_text?: string;
  question?: string; selection?: "single" | "multiple";
  items?: ChoiceItem[]; cta?: string;
  show_cv_upload?: boolean; show_city?: boolean;
  content?: string; size?: "sm" | "md" | "lg" | "xl";
  align?: "left" | "center" | "right"; bold?: boolean;
  color?: string;
  headline_size?: string; headline_color?: string; headline_align?: string;
  subtext_size?: string; subtext_color?: string; subtext_align?: string;
  name_size?: string; name_color?: string; name_align?: string;
  title_size?: string; title_color?: string; title_align?: string;
  cta_size?: string; cta_color?: string;
  question_size?: string; question_color?: string; question_align?: string;
  [key: string]: unknown;
  label?: string; style?: "primary" | "outline";
  url?: string; alt?: string; rounded?: boolean;
  stars?: number; count?: string; source_text?: string;
  emoji?: string; spacing?: "sm" | "md" | "lg";
};

function renderTextWithIcons(text: string) {
  const parts = text.split(/(\{\{[a-z_]+\}\})/g);
  return parts.map((part, i) => {
    const match = part.match(/^\{\{([a-z_]+)\}\}$/);
    if (match) return <span key={i} className="material-symbols-outlined align-middle" style={{ fontSize: "1.2em" }}>{match[1]}</span>;
    return part;
  });
}

function cssVal(val: string | undefined, fallback: string | undefined): string | undefined {
  if (!val) return fallback;
  if (/^\d+$/.test(val)) return `${val}px`;
  return val;
}

const sizeMap: Record<string, string> = { sm: "0.75rem", md: "0.875rem", lg: "1.125rem", xl: "1.5rem" };
const headlineSizeMap: Record<string, string> = { sm: "0.875rem", md: "1.125rem", lg: "1.5rem", xl: "2rem" };
const fontVarMap: Record<string, string> = {
  newsreader: "var(--font-newsreader)", manrope: "var(--font-manrope)",
  syne: "var(--font-syne)", inter: "var(--font-inter)",
  playfair: "var(--font-playfair)", montserrat: "var(--font-montserrat)",
  bebas: "var(--font-bebas)",
};

type Block = { id: string; type: BlockType; content: BlockContent };

type FunnelPage = {
  id?: string; page_order: number; is_required: boolean; blocks: Block[];
  page_type?: string; question_text?: string; selection_type?: string;
  options?: { label: string; icon: string; value: string }[];
  settings?: Record<string, unknown>;
};

type FunnelBranding = { primary_color: string; button_text_color: string; logo_url?: string; font_pair?: string; bg_color?: string; bg_gradient?: string; content_width?: string; [key: string]: unknown };

const fontFamilyMap: Record<string, { headline: string; body: string }> = {
  default: { headline: "var(--font-newsreader), serif", body: "var(--font-manrope), sans-serif" },
  "syne-inter": { headline: "var(--font-syne), sans-serif", body: "var(--font-inter), sans-serif" },
  "playfair-montserrat": { headline: "var(--font-playfair), serif", body: "var(--font-montserrat), sans-serif" },
  "bebas-inter": { headline: "var(--font-bebas), sans-serif", body: "var(--font-inter), sans-serif" },
};

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

// ─── Facebook App Events helper ───────────────────────────────────────────────

type FbWindow = Window & { FB?: { init: (opts: Record<string, unknown>) => void; AppEvents?: { logEvent: (name: string, value?: number | null, params?: Record<string, string | number>) => void } } };

function fbAppEvent(name: string, value?: number | null, params?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  (window as FbWindow).FB?.AppEvents?.logEvent(name, value ?? null, params ?? {});
}

function loadFbSdk(appId: string) {
  if (typeof window === "undefined") return;
  if (document.getElementById("facebook-jssdk")) return;
  const js = document.createElement("script");
  js.id = "facebook-jssdk";
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  js.onload = () => {
    (window as FbWindow).FB?.init({
      appId,
      autoLogAppEvents: true,
      xfbml: false,
      version: "v21.0",
    });
  };
  document.body.appendChild(js);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FunnelPlayer({ funnel, pages: rawPages }: { funnel: Funnel; pages: FunnelPage[] }) {
  const branding: FunnelBranding = { ...defaultBranding, ...(funnel.branding ?? {}) };
  const color = branding.primary_color;
  const textColor = branding.button_text_color;

  const pages = rawPages.map((p) => ({ ...p, blocks: migratePageToBlocks(p) }));

  const [pageIdx, setPageIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState<Record<string, string>>({ name: "", email: "", phone: "", city: "" });
  const [consent, setConsent] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPage = pages[pageIdx];

  // Load FB SDK and fire ViewContent App Event once on mount
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    if (appId) {
      loadFbSdk(appId);
      // Wait briefly for SDK to initialize before firing first event
      setTimeout(() => {
        fbAppEvent('fb_mobile_content_view', null, {
          fb_content_id: funnel.id,
          fb_content_type: 'job',
        });
      }, 2000);
    }
  }, []);

  // Auto-advance loading screen + fire Contact event when contact form is shown
  useEffect(() => {
    if (!currentPage) return;
    const hasLoading = currentPage.blocks.some((b) => b.type === "loading_screen");
    if (hasLoading) {
      const t = setTimeout(() => advance(), 2500);
      setAutoAdvance(t);
      return () => clearTimeout(t);
    }
    const hasContactForm = currentPage.blocks.some((b) => b.type === "contact_form");
    if (hasContactForm) fbAppEvent('Contact');
  }, [pageIdx]);

  function advance() {
    if (autoAdvance) clearTimeout(autoAdvance);
    if (pageIdx < pages.length - 1) {
      setPageIdx((i) => i + 1);
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Use question text as key (readable in applicant detail), fall back to block ID
  function answerKey(block: Block) {
    return (block.content.question as string) || block.id;
  }

  function toggleChoice(blockId: string, value: string, selection: "single" | "multiple", questionKey?: string) {
    const key = questionKey ?? blockId;
    setAnswers((prev) => {
      const current = prev[key] ?? [];
      if (selection === "single") {
        return { ...prev, [key]: [value] };
      }
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  async function handleSubmit() {
    const hasName = form.name || (form.first_name && form.last_name);
    console.log("[funnel] handleSubmit called", { hasName, email: form.email, consent, submitted });
    if (!hasName || !form.email) { console.log("[funnel] missing name or email"); return; }
    if (!consent) { console.log("[funnel] consent not given"); return; }
    if (submitted) { console.log("[funnel] already submitted"); return; }
    setSubmitting(true);

    // Advance immediately for good UX
    setSubmitted(true);
    advance();
    setSubmitting(false);

    // Upload CV via server route (admin key), then call /api/apply
    (async () => {
      let cv_url: string | null = null;
      if (cvFile) {
        try {
          const fd = new FormData();
          fd.append("file", cvFile);
          fd.append("funnel_id", funnel.id);
          const res = await fetch("/api/upload-cv", { method: "POST", body: fd });
          if (res.ok) {
            const json = await res.json();
            cv_url = json.url ?? null;
          }
        } catch { /* best-effort */ }
      }

      // Map extra form fields to German labels for funnel_responses
      const extraFieldLabels: Record<string, string> = {
        linkedin: "LinkedIn", current_job: "Aktueller Jobtitel", current_employer: "Aktueller Arbeitgeber",
        start_date: "Starttermin", salary: "Gehaltsvorstellung", experience_years: "Berufserfahrung (Jahre)",
        education: "Ausbildung", drivers_license: "Führerschein", travel: "Reisebereitschaft",
        relocate: "Umzugsbereitschaft", skills: "Skills", languages: "Sprachen",
        portfolio: "Portfolio", source: "Gefunden über", position_interest: "Positionsinteresse",
      };
      const extraAnswers: Record<string, string[]> = {};
      for (const [k, label] of Object.entries(extraFieldLabels)) {
        if (form[k]) extraAnswers[label] = [form[k]];
      }
      const fullName = form.name || [form.first_name, form.last_name].filter(Boolean).join(" ");

      // Save application, then trigger CV analysis in its own request
      fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnel_id: funnel.id,
          job_id: funnel.job_id,
          name: fullName,
          email: form.email,
          phone: form.phone || null,
          city: form.city || null,
          cv_url,
          cv_file_name: cvFile?.name ?? null,
          answers: { ...answers, ...extraAnswers },
        }),
      }).then(async (r) => {
        console.log("[funnel] apply response:", r.status);
        if (!r.ok) { console.error("[funnel] apply failed:", await r.text().catch(() => "")); return; }
        const { application_id } = await r.json();
        console.log("[funnel] application_id:", application_id);
        if (!application_id) return;
        // Fire Meta Pixel standard events
        if (typeof window !== "undefined" && (window as Window & { fbq?: (...args: unknown[]) => void }).fbq) {
          const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq!;
          fbq("track", "Lead");
          fbq("track", "CompleteRegistration");
        }
        // Fire Facebook App Event
        fbAppEvent('fb_mobile_complete_registration', null, { fb_registration_method: 'funnel' });
        // Trigger CV analysis as its own long-running request (maxDuration = 60s)
        fetch("/api/cv-analyse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ application_id }),
        }).catch(() => {/* best-effort */});
      }).catch((err) => console.error("[funnel] apply error:", err));
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
          <div key={block.id} style={{
            background: (block.content.bg_gradient as string) ?? (block.content.bg_color as string) ?? undefined,
            paddingTop: (block.content.block_padding_t as number) != null ? `${block.content.block_padding_t}px` : undefined,
            paddingRight: (block.content.block_padding_r as number) != null ? `${block.content.block_padding_r}px` : undefined,
            paddingBottom: (block.content.block_padding_b as number) != null ? `${block.content.block_padding_b}px` : undefined,
            paddingLeft: (block.content.block_padding_l as number) != null ? `${block.content.block_padding_l}px` : undefined,
            ...((block.content.block_gap as number) != null ? { display: "flex", flexDirection: "column" as const, gap: `${block.content.block_gap}px` } : {}),
          }}>
          <BlockRenderer
            block={block}
            color={color}
            textColor={textColor}
            branding={branding}
            answers={answers[answerKey(block)] ?? []}
            onToggleChoice={(value, selection) => toggleChoice(block.id, value, selection, answerKey(block))}
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
          </div>
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
    <div className="min-h-screen flex items-start justify-center py-0 sm:py-8 px-0 sm:px-4"
      style={{ background: branding.bg_gradient ?? branding.bg_color ?? "#f9fafb" }}>
      <div className="w-full sm:rounded-3xl sm:shadow-xl overflow-hidden flex flex-col min-h-screen sm:min-h-0"
        style={{ fontFamily: (fontFamilyMap[branding.font_pair ?? "default"] ?? fontFamilyMap.default).body, maxWidth: branding.content_width ?? "520px", background: branding.bg_gradient || branding.bg_color ? "transparent" : "white" }}>
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
  form: Record<string, string>;
  onFormChange: (patch: Record<string, string>) => void;
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
            {c.name && <div className="font-bold" style={{ fontSize: sizeMap[(c.name_size as string) ?? "md"], color: (c.name_color as string) || "#111827" }}>{c.name}</div>}
            {c.title_text && <div style={{ fontSize: sizeMap[(c.title_size as string) ?? "sm"], color: (c.title_color as string) || color }}>{c.title_text}</div>}
          </div>
        )}
        <h1 className="font-black leading-tight mb-2" style={{ fontSize: (c.headline_font_size as number) ? `${c.headline_font_size}px` : headlineSizeMap[(c.headline_size as string) ?? "lg"], color: (c.headline_color as string) || "#111827", textAlign: ((c.headline_align as string) ?? "center") as "left" | "center" | "right", ...((c.headline_font as string) ? { fontFamily: fontVarMap[c.headline_font as string] } : {}) }}>{renderTextWithIcons((c.headline as string) ?? "")}</h1>
        {c.subtext && <p className="mb-5 leading-relaxed" style={{ fontSize: (c.subtext_font_size as number) ? `${c.subtext_font_size}px` : sizeMap[(c.subtext_size as string) ?? "md"], color: (c.subtext_color as string) || "#6B7280", textAlign: ((c.subtext_align as string) ?? "center") as "left" | "center" | "right", ...((c.subtext_font as string) ? { fontFamily: fontVarMap[c.subtext_font as string] } : {}) }}>{renderTextWithIcons((c.subtext as string) ?? "")}</p>}
        <button onClick={onAdvance} className="w-full py-4 font-black text-sm shadow-sm active:scale-95 transition-transform"
          style={{ background: (c.btn_bg as string) || color, color: (c.btn_color as string) || textColor, borderRadius: (c.btn_radius as number) != null ? `${c.btn_radius}px` : "16px" }}>
          {renderTextWithIcons((c.cta_text as string) || "Jetzt bewerben →")}
        </button>
      </div>
    );
  }

  // ── WELCOME ──
  if (block.type === "welcome") {
    return (
      <div className="flex flex-col items-center text-center px-6 py-10">
        <div className="text-5xl mb-4">{c.emoji || "👋"}</div>
        <h2 className="font-black mb-3" style={{ fontSize: headlineSizeMap[c.headline_size ?? "lg"], color: c.headline_color || "#111827", textAlign: (c.headline_align ?? "center") as "left" | "center" | "right" }}>{renderTextWithIcons((c.headline as string) ?? "")}</h2>
        {c.subtext && <p className="leading-relaxed mb-6" style={{ fontSize: sizeMap[c.subtext_size ?? "md"], color: c.subtext_color || "#6B7280", textAlign: (c.subtext_align ?? "center") as "left" | "center" | "right" }}>{renderTextWithIcons((c.subtext as string) ?? "")}</p>}
        <button onClick={onAdvance} className="w-full py-4 font-black text-sm"
          style={{ background: (c.btn_bg as string) || color, color: (c.btn_color as string) || textColor, borderRadius: (c.btn_radius as number) != null ? `${c.btn_radius}px` : "16px" }}>
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
        <h2 className="font-black mb-1 leading-tight" style={{ fontSize: headlineSizeMap[(c.question_size as string) ?? "md"], color: (c.question_color as string) || "#111827" }}>{renderTextWithIcons((c.question as string) || "Frage")}</h2>
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
            className="w-full py-4 font-black text-sm transition-all active:scale-95"
            style={{ background: hasSelection ? ((c.btn_bg as string) || color) : "#F3F4F6", color: hasSelection ? ((c.btn_color as string) || textColor) : "#9CA3AF", borderRadius: (c.btn_radius as number) != null ? `${c.btn_radius}px` : "16px" }}
          >
            {renderTextWithIcons((c.cta as string) || "Weiter →")}
          </button>
        )}
      </div>
    );
  }

  // ── IMAGE CHOICE ──
  if (block.type === "image_choice") {
    return (
      <div className="px-5 py-6">
        <h2 className="font-black mb-3 leading-tight" style={{ fontSize: headlineSizeMap[(c.question_size as string) ?? "md"], color: (c.question_color as string) || "#111827" }}>{renderTextWithIcons((c.question as string) || "Frage")}</h2>
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
        <h2 className="font-black mb-3 leading-tight" style={{ fontSize: headlineSizeMap[(c.question_size as string) ?? "md"], color: (c.question_color as string) || "#111827" }}>{renderTextWithIcons((c.question as string) || "Frage")}</h2>
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
    const nameValid = c.show_name_split ? (form.first_name && form.last_name) : form.name;
    const isValid = nameValid && form.email && consent;
    const FieldRow = ({ emoji, placeholder, fieldKey, type = "text" }: { emoji: string; placeholder: string; fieldKey: string; type?: string }) => (
      <div className="flex items-center gap-3 border-2 border-gray-200 rounded-2xl px-4 py-3">
        <span className="text-lg flex-shrink-0">{emoji}</span>
        <input type={type} value={form[fieldKey] ?? ""} onChange={(e) => onFormChange({ [fieldKey]: e.target.value })} placeholder={placeholder}
          className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent" />
      </div>
    );
    return (
      <div className="px-5 py-6">
        <h2 className="font-black text-lg text-gray-900 mb-4">{renderTextWithIcons((c.headline as string) || "Deine Kontaktdaten")}</h2>
        <div className="space-y-3 mb-4">
          {c.show_name_split ? (
            <>
              <FieldRow emoji="👤" placeholder="Vorname" fieldKey="first_name" />
              <FieldRow emoji="👤" placeholder="Nachname" fieldKey="last_name" />
            </>
          ) : (
            <FieldRow emoji="👋" placeholder="Vollständiger Name" fieldKey="name" />
          )}
          <FieldRow emoji="📧" placeholder="E-Mail Adresse" fieldKey="email" type="email" />
          <FieldRow emoji="📱" placeholder="Telefonnummer" fieldKey="phone" type="tel" />
          {(c.show_city as boolean) && <FieldRow emoji="📍" placeholder="Deine Stadt" fieldKey="city" />}
          {(c.show_linkedin as boolean) && <FieldRow emoji="🔗" placeholder="LinkedIn Profil-URL" fieldKey="linkedin" type="url" />}
          {(c.show_current_job as boolean) && <FieldRow emoji="💼" placeholder="Aktueller Jobtitel" fieldKey="current_job" />}
          {(c.show_current_employer as boolean) && <FieldRow emoji="🏢" placeholder="Aktueller Arbeitgeber" fieldKey="current_employer" />}
          {(c.show_start_date as boolean) && <FieldRow emoji="📅" placeholder="Frühester Starttermin" fieldKey="start_date" type="date" />}
          {(c.show_salary as boolean) && <FieldRow emoji="💰" placeholder="Gehaltsvorstellung (z.B. 50.000 €)" fieldKey="salary" />}
          {(c.show_experience_years as boolean) && <FieldRow emoji="⏱️" placeholder="Berufserfahrung (Jahre)" fieldKey="experience_years" type="number" />}
          {(c.show_education as boolean) && <FieldRow emoji="🎓" placeholder="Ausbildung / Abschluss" fieldKey="education" />}
          {(c.show_drivers_license as boolean) && (
            <div className="flex items-center gap-3 border-2 border-gray-200 rounded-2xl px-4 py-3">
              <span className="text-lg">🚗</span>
              <select value={form.drivers_license ?? ""} onChange={(e) => onFormChange({ drivers_license: e.target.value })}
                className="flex-1 text-sm text-gray-900 outline-none bg-transparent">
                <option value="">Führerschein vorhanden?</option>
                <option value="yes">Ja</option>
                <option value="no">Nein</option>
              </select>
            </div>
          )}
          {(c.show_travel as boolean) && <FieldRow emoji="✈️" placeholder="Reisebereitschaft (z.B. 30%)" fieldKey="travel" />}
          {(c.show_relocate as boolean) && (
            <div className="flex items-center gap-3 border-2 border-gray-200 rounded-2xl px-4 py-3">
              <span className="text-lg">🏠</span>
              <select value={form.relocate ?? ""} onChange={(e) => onFormChange({ relocate: e.target.value })}
                className="flex-1 text-sm text-gray-900 outline-none bg-transparent">
                <option value="">Umzugsbereitschaft?</option>
                <option value="yes">Ja</option>
                <option value="no">Nein</option>
                <option value="maybe">Vielleicht</option>
              </select>
            </div>
          )}
          {(c.show_skills as boolean) && <FieldRow emoji="⚡" placeholder="Hauptkompetenzen / Skills" fieldKey="skills" />}
          {(c.show_languages as boolean) && <FieldRow emoji="🌍" placeholder="Sprachen (z.B. DE C2, EN B2)" fieldKey="languages" />}
          {(c.show_portfolio as boolean) && <FieldRow emoji="🔗" placeholder="Portfolio / Website / GitHub" fieldKey="portfolio" type="url" />}
          {(c.show_source as boolean) && <FieldRow emoji="👀" placeholder="Wie hast du uns gefunden?" fieldKey="source" />}
          {(c.show_position_interest as boolean) && <FieldRow emoji="🎯" placeholder="Interesse an Position" fieldKey="position_interest" />}
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
        {!isValid && (form.name || form.email) && (
          <p className="text-xs text-red-500 mb-3 text-center">
            {!form.name ? "Bitte Namen eingeben." : !form.email ? "Bitte E-Mail eingeben." : "Bitte Datenschutz zustimmen."}
          </p>
        )}
        <button
          onClick={onSubmit}
          disabled={!isValid || submitting}
          className="w-full py-4 font-black text-sm transition-all active:scale-95 disabled:opacity-50"
          style={{ background: (c.btn_bg as string) || color, color: (c.btn_color as string) || textColor, borderRadius: (c.btn_radius as number) != null ? `${c.btn_radius}px` : "16px" }}
        >
          {submitting ? "Wird gesendet…" : c.cta_text || "Bewerbung absenden →"}
        </button>
      </div>
    );
  }

  // ── TEXT ──
  if (block.type === "text") {
    return (
      <div className="px-5 py-3">
        <p className={`leading-relaxed ${c.bold ? "font-bold" : ""}`}
          style={{
            fontSize: (c.text_font_size as number) ? `${c.text_font_size}px` : sizeMap[(c.text_size as string) ?? (c.size as string) ?? "md"],
            color: (c.text_color as string) || (c.color as string) || "#374151",
            textAlign: ((c.text_align as string) || (c.align as string) || "left") as "left" | "center" | "right",
            ...((c.text_font as string) ? { fontFamily: fontVarMap[c.text_font as string] } : {}),
          }}>
          {renderTextWithIcons((c.content as string) ?? "")}
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
          className="w-full py-4 font-black text-sm transition-all active:scale-95"
          style={{
            ...(c.style === "outline"
              ? { border: `2px solid ${color}`, color: (c.btn_color as string) || color, background: (c.btn_bg as string) || "transparent" }
              : { background: (c.btn_bg as string) || color, color: (c.btn_color as string) || textColor }),
            borderRadius: (c.btn_radius as number) != null ? `${c.btn_radius}px` : "16px",
          }}
        >
          {renderTextWithIcons((c.label as string) || "Weiter →")}
        </button>
      </div>
    );
  }

  // ── IMAGE ──
  if (block.type === "image" && c.url) {
    return (
      <div className="px-5 py-3">
        <img src={c.url as string} alt={(c.alt as string) ?? ""} className={`${c.rounded ? "rounded-2xl" : ""}`}
          style={{
            width: (c.img_width as string) || "100%",
            height: (c.img_height as string) || "auto",
            maxWidth: (c.img_max_width as string) || "100%",
            objectFit: ((c.img_fit as string) || "cover") as "cover" | "contain" | "fill" | "none",
            margin: "0 auto", display: "block",
          }} />
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
        <h2 className="font-black text-lg mb-2" style={{ color: c.headline_color || "#111827" }}>{c.headline || "Einen Moment…"}</h2>
        {c.subtext && <p className="text-sm" style={{ color: c.subtext_color || "#6B7280" }}>{renderTextWithIcons((c.subtext as string) ?? "")}</p>}
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
        <h2 className="font-black text-xl leading-tight mb-3" style={{ color: c.headline_color || "#111827" }}>{c.headline || "Vielen Dank!"}</h2>
        {c.subtext && <p className="text-sm leading-relaxed" style={{ color: c.subtext_color || "#6B7280" }}>{renderTextWithIcons((c.subtext as string) ?? "")}</p>}
      </div>
    );
  }

  // ── FREE TEXT ──
  if (block.type === "free_text") {
    const curAnswer = answers[0] ?? "";
    const isRequired = (c.is_required as boolean) ?? true;
    return (
      <div className="px-5 py-6" style={(c.block_gap as number) != null ? { display: "flex", flexDirection: "column", gap: `${c.block_gap}px` } : undefined}>
        <h2 className="font-black leading-tight" style={{
          fontSize: (c.question_font_size as number) ? `${c.question_font_size}px` : headlineSizeMap[(c.question_size as string) ?? "md"],
          color: (c.question_color as string) || "#111827",
          textAlign: ((c.question_align as string) || "left") as "left" | "center" | "right",
          ...((c.question_font as string) ? { fontFamily: fontVarMap[c.question_font as string] } : {}),
        }}>{renderTextWithIcons((c.question as string) || "Frage")}</h2>
        <textarea
          value={curAnswer}
          onChange={(e) => onToggleChoice(e.target.value, "single")}
          rows={4}
          placeholder={(c.placeholder as string) || "Deine Antwort hier…"}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-colors resize-none"
          style={{
            minHeight: cssVal((c.textarea_field_height as string), undefined),
            width: cssVal((c.textarea_field_width as string), undefined),
            ...((c.textarea_field_padding as number) != null ? { padding: `${c.textarea_field_padding}px` } : {}),
            ...((c.textarea_field_radius as number) != null ? { borderRadius: `${c.textarea_field_radius}px` } : {}),
            ...((c.textarea_field_bg as string) ? { background: c.textarea_field_bg as string, borderColor: "transparent" } : {}),
          }}
        />
        <button
          onClick={onAdvance}
          disabled={isRequired && !curAnswer.trim()}
          className="w-full py-4 font-black text-sm transition-all active:scale-95 disabled:opacity-40"
          style={{
            background: (c.btn_bg as string) || color,
            color: (c.btn_color as string) || textColor,
            borderRadius: (c.btn_radius as number) != null ? `${c.btn_radius}px` : "16px",
            fontSize: (c.btn_font_size as number) ? `${c.btn_font_size}px` : undefined,
          }}
        >
          {renderTextWithIcons((c.cta as string) || "Weiter →")}
        </button>
      </div>
    );
  }

  // ── ICON CARDS ──
  if (block.type === "icon_cards") {
    const cols = (c.card_columns as string) === "1" ? "grid-cols-1" : "grid-cols-2";
    return (
      <div className="px-5 py-6">
        <h2 className="font-black text-lg text-gray-900 mb-4 text-center">{renderTextWithIcons((c.question as string) || "Frage")}</h2>
        <div className={`grid gap-3 ${cols}`}>
          {(c.items ?? []).map((item) => {
            const selected = answers.includes(item.value);
            return (
              <button key={item.id}
                onClick={() => { onToggleChoice(item.value, "single"); setTimeout(onAdvance, 300); }}
                className={`flex flex-col items-center justify-center rounded-2xl py-6 px-4 text-center transition-all active:scale-95 ${selected ? "ring-2 ring-offset-2 ring-gray-900" : ""}`}
                style={{ background: (c.card_bg as string) || color, minHeight: 100 }}>
                <span className="material-symbols-outlined text-4xl mb-2" style={{ color: (c.card_icon_color as string) || "#ffffff", fontVariationSettings: "'FILL' 1" }}>{item.icon || "check"}</span>
                <span className="text-sm font-black" style={{ color: (c.card_icon_color as string) || "#ffffff" }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
