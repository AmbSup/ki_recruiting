"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getFunnelPublicUrl } from "@/lib/funnel-url";
import { ImageUpload } from "@/components/ui/image-upload";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockType =
  | "profile_header"
  | "multiple_choice"
  | "image_choice"
  | "list_choice"
  | "contact_form"
  | "text"
  | "button"
  | "image"
  | "divider"
  | "rating"
  | "welcome"
  | "loading_screen"
  | "thank_you";

type ChoiceItem = { id: string; label: string; icon: string; value: string; image_url?: string };

type BlockContent = {
  // profile_header
  image_url?: string;
  name?: string;
  title_text?: string;
  headline?: string;
  subtext?: string;
  cta_text?: string;
  // multiple_choice / image_choice / list_choice
  question?: string;
  selection?: "single" | "multiple";
  items?: ChoiceItem[];
  cta?: string;
  // contact_form
  show_cv_upload?: boolean;
  show_city?: boolean;
  // text
  content?: string;
  size?: "sm" | "md" | "lg" | "xl";
  align?: "left" | "center" | "right";
  bold?: boolean;
  color?: string;
  // text styling — dynamic per-field: {fieldKey}_size, {fieldKey}_color, {fieldKey}_align
  headline_size?: string; headline_color?: string; headline_align?: string;
  subtext_size?: string; subtext_color?: string; subtext_align?: string;
  name_size?: string; name_color?: string; name_align?: string;
  title_size?: string; title_color?: string; title_align?: string;
  cta_size?: string; cta_color?: string;
  question_size?: string; question_color?: string; question_align?: string;
  // generic dynamic style access
  [key: string]: unknown;
  // button
  label?: string;
  style?: "primary" | "outline";
  // image
  url?: string;
  alt?: string;
  rounded?: boolean;
  // rating
  stars?: number;
  count?: string;
  source_text?: string;
  // welcome
  emoji?: string;
  // divider
  spacing?: "sm" | "md" | "lg";
};

type Block = {
  id: string;
  type: BlockType;
  content: BlockContent;
};

type FunnelPage = {
  id?: string;
  page_order: number;
  is_required: boolean;
  blocks: Block[];
  // legacy fields (kept for migration)
  page_type?: string;
  question_text?: string;
  selection_type?: string;
  options?: { label: string; icon: string; value: string }[];
  settings?: Record<string, unknown>;
};

type FunnelBranding = {
  primary_color: string;
  button_text_color: string;
  logo_url?: string;
};

type Funnel = {
  id: string;
  name: string;
  slug: string;
  funnel_type: string;
  external_url: string | null;
  job_id: string;
  status: string;
  branding: FunnelBranding | null;
  views: number;
  submissions: number;
  job: { title: string; company: { name: string } };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const defaultBranding: FunnelBranding = {
  primary_color: "#F9BE2A",
  button_text_color: "#1A1A1A",
  logo_url: "",
};

const sizeMap: Record<string, string> = { sm: "12px", md: "14px", lg: "18px", xl: "24px" };
const headlineSizeMap: Record<string, string> = { sm: "14px", md: "18px", lg: "24px", xl: "32px" };

// ─── Floating Text Toolbar ──────────────────────────────────────────────────

type ActiveTextField = { blockId: string; fieldKey: string; rect: DOMRect } | null;

// ─── Element Properties Panel (shown in right sidebar when sub-element is selected) ──

const fieldLabels: Record<string, string> = {
  name: "Name", title: "Titel", headline: "Headline", subtext: "Beschreibung",
  cta: "CTA Button", question: "Frage", size: "Text", content: "Text",
};

function ElementPropertiesPanel({ fieldKey, content, onUpdate, onClose }: {
  fieldKey: string;
  content: BlockContent;
  onUpdate: (c: Partial<BlockContent>) => void;
  onClose: () => void;
}) {
  const sKey = `${fieldKey}_size`;
  const cKey = `${fieldKey}_color`;
  const aKey = `${fieldKey}_align`;
  const curSize = (content[sKey] as string) ?? "md";
  const curColor = (content[cKey] as string) ?? "";
  const curAlign = (content[aKey] as string) ?? "center";

  // Map fieldKey to the actual content field for text editing
  const textFieldMap: Record<string, string> = {
    name: "name", title: "title_text", headline: "headline", subtext: "subtext",
    cta: "cta_text", question: "question", size: "content", content: "content",
  };
  const textKey = textFieldMap[fieldKey] ?? fieldKey;
  const textValue = (content[textKey] as string) ?? "";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base">text_fields</span>
          <span className="font-label text-xs font-bold uppercase tracking-widest text-on-surface">
            {fieldLabels[fieldKey] ?? fieldKey}
          </span>
        </div>
        <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface text-sm">close</button>
      </div>

      {/* Text Content */}
      <div>
        <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5">Text</label>
        <textarea
          value={textValue}
          onChange={(e) => onUpdate({ [textKey]: e.target.value })}
          rows={2}
          className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-3 py-2 font-body text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
        />
      </div>

      {/* Size */}
      <div>
        <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Schriftgröße</label>
        <div className="flex gap-1.5">
          {(["sm", "md", "lg", "xl"] as const).map((s) => (
            <button key={s} onClick={() => onUpdate({ [sKey]: s })}
              className={`flex-1 py-2 rounded-xl border font-label text-xs font-bold uppercase transition-all ${curSize === s ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant hover:border-outline"}`}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Alignment */}
      <div>
        <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Ausrichtung</label>
        <div className="flex gap-1.5">
          {(["left", "center", "right"] as const).map((a) => (
            <button key={a} onClick={() => onUpdate({ [aKey]: a })}
              className={`flex-1 py-2 rounded-xl border transition-all flex items-center justify-center ${curAlign === a ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant hover:border-outline"}`}>
              <span className="material-symbols-outlined text-sm">{a === "left" ? "format_align_left" : a === "center" ? "format_align_center" : "format_align_right"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Farbe</label>
        <div className="flex items-center gap-2">
          <input type="color" value={curColor || "#111827"} onChange={(e) => onUpdate({ [cKey]: e.target.value })}
            className="w-10 h-10 rounded-xl border border-outline-variant/20 cursor-pointer p-0.5" />
          <input type="text" value={curColor} onChange={(e) => onUpdate({ [cKey]: e.target.value })} placeholder="#111827"
            className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary" />
          {curColor && <button onClick={() => onUpdate({ [cKey]: "" })} className="material-symbols-outlined text-outline text-sm hover:text-error p-1">close</button>}
        </div>
      </div>

      {/* Back to block */}
      <button onClick={onClose}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-outline-variant/20 text-on-surface-variant font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Zurück zum Block
      </button>
    </div>
  );
}

function blockDefaults(type: BlockType): Block {
  const id = uid();
  const defaults: Record<BlockType, BlockContent> = {
    profile_header: { image_url: "", name: "Max Mustermann", title_text: "Recruiting Manager", headline: "Werde Teil unseres Teams!", subtext: "Bewirb dich in wenigen Minuten.", cta_text: "Jetzt bewerben →" },
    multiple_choice: { question: "Neue Frage", selection: "single", items: [{ id: uid(), label: "Option A", icon: "check", value: "a" }, { id: uid(), label: "Option B", icon: "close", value: "b" }], cta: "Weiter →" },
    image_choice: { question: "Neue Frage", selection: "single", items: [{ id: uid(), label: "Option A", icon: "", value: "a", image_url: "" }, { id: uid(), label: "Option B", icon: "", value: "b", image_url: "" }], cta: "Weiter →" },
    list_choice: { question: "Neue Frage", selection: "single", items: [{ id: uid(), label: "Option A", icon: "arrow_right", value: "a" }, { id: uid(), label: "Option B", icon: "arrow_right", value: "b" }] },
    contact_form: { headline: "Wie können wir dich erreichen?", cta_text: "Bewerbung absenden →", show_cv_upload: true, show_city: false },
    text: { content: "Text hier eingeben…", size: "md", align: "left", bold: false },
    button: { label: "Weiter →", style: "primary" },
    image: { url: "", alt: "", rounded: true },
    divider: { spacing: "md" },
    rating: { stars: 5, count: "18+", source_text: "Kununu Bewertungen" },
    welcome: { emoji: "👋", headline: "Hey, lass' uns loslegen!", subtext: "Diese kurze Umfrage hilft uns zu verstehen, ob diese Rolle gut zu dir passt. Es dauert nur eine Minute." },
    loading_screen: { headline: "Wir überprüfen deine Antworten…", subtext: "Bitte noch einen Moment Geduld!" },
    thank_you: { headline: "Wir passen zueinander!", subtext: "Wir melden uns in Kürze bei dir." },
  };
  return { id, type, content: defaults[type] };
}

function migratePageToBlocks(page: FunnelPage): Block[] {
  if (page.blocks && page.blocks.length > 0) return page.blocks;
  const pt = page.page_type;
  const qt = page.question_text ?? "";
  const s = (page.settings ?? {}) as Record<string, unknown>;
  if (pt === "intro") {
    return [{ id: uid(), type: "profile_header" as BlockType, content: { headline: qt, subtext: (s.subtext as string) ?? "", cta_text: (s.cta_text as string) ?? "Jetzt bewerben →", name: (s.profile_name as string) ?? "", title_text: (s.profile_title as string) ?? "", image_url: (s.profile_image_url as string) ?? "" } }];
  }
  if (pt === "question_tiles") {
    return [{ id: uid(), type: "multiple_choice", content: { question: qt, selection: (page.selection_type ?? "single") as "single" | "multiple", items: (page.options ?? []).map((o) => ({ id: uid(), label: o.label, icon: o.icon, value: o.value })), cta: "Weiter →" } }];
  }
  if (pt === "question_images") {
    return [{ id: uid(), type: "image_choice", content: { question: qt, selection: "single", items: (page.options ?? []).map((o) => ({ id: uid(), label: o.label, icon: "", value: o.value, image_url: "" })), cta: "Weiter →" } }];
  }
  if (pt === "contact_form") {
    return [{ id: uid(), type: "contact_form", content: { headline: qt || "Wie können wir dich erreichen?", cta_text: s.cta_text as string ?? "Bewerbung absenden →", show_cv_upload: s.show_cv_upload as boolean ?? true, show_city: false } }];
  }
  if (pt === "loading") {
    return [{ id: uid(), type: "loading_screen", content: { headline: qt, subtext: s.subtext as string ?? "" } }];
  }
  if (pt === "thank_you") {
    return [{ id: uid(), type: "thank_you", content: { headline: qt, subtext: s.subtext as string ?? "" } }];
  }
  return [blockDefaults("text")];
}

const defaultPages: FunnelPage[] = [
  { page_order: 1, is_required: true, blocks: [blockDefaults("profile_header")] },
  { page_order: 2, is_required: true, blocks: [{ ...blockDefaults("multiple_choice"), content: { question: "Was motiviert dich bei diesem Job?", selection: "multiple", items: [{ id: uid(), label: "Gutes Gehalt", icon: "payments", value: "salary" }, { id: uid(), label: "Team & Kultur", icon: "groups", value: "team" }, { id: uid(), label: "Entwicklung", icon: "trending_up", value: "growth" }, { id: uid(), label: "Flexibilität", icon: "schedule", value: "flex" }], cta: "Absenden und weiter" } }] },
  { page_order: 3, is_required: true, blocks: [blockDefaults("contact_form")] },
  { page_order: 4, is_required: false, blocks: [blockDefaults("loading_screen")] },
  { page_order: 5, is_required: false, blocks: [blockDefaults("thank_you")] },
];

// ─── Block Config ─────────────────────────────────────────────────────────────

const blockConfig: Record<BlockType, { label: string; icon: string; category: "interactive" | "simple" }> = {
  profile_header:  { label: "Profil-Header",    icon: "person",         category: "simple" },
  multiple_choice: { label: "Kacheln",           icon: "grid_view",      category: "interactive" },
  image_choice:    { label: "Bild-Kacheln",      icon: "image",          category: "interactive" },
  list_choice:     { label: "Liste",             icon: "format_list_bulleted", category: "interactive" },
  contact_form:    { label: "Kontaktformular",   icon: "contact_page",   category: "interactive" },
  welcome:         { label: "Willkommen",        icon: "waving_hand",    category: "simple" },
  text:            { label: "Text",              icon: "text_fields",    category: "simple" },
  button:          { label: "Button",            icon: "smart_button",   category: "simple" },
  image:           { label: "Bild",              icon: "image",          category: "simple" },
  divider:         { label: "Trenner",           icon: "horizontal_rule", category: "simple" },
  rating:          { label: "Bewertungen",       icon: "star",           category: "simple" },
  loading_screen:  { label: "Ladescreen",        icon: "hourglass_top",  category: "simple" },
  thank_you:       { label: "Danke-Seite",       icon: "celebration",    category: "simple" },
};

// ─── Block Preview Renderer ───────────────────────────────────────────────────

function BlockPreview({
  block,
  branding,
  isSelected,
  onSelect,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
  isFirst,
  isLast,
  activeFieldKey,
  onTextClick,
}: {
  block: Block;
  branding: FunnelBranding;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (content: Partial<BlockContent>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  isFirst: boolean;
  isLast: boolean;
  activeFieldKey: string | null;
  onTextClick: (fieldKey: string, e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const c = block.content;
  const color = branding.primary_color;
  const textColor = branding.button_text_color;

  // Helper: get style for a text field
  const ts = (fieldKey: string, defaults: { size?: string; color?: string; align?: string }) => ({
    fontSize: (fieldKey === "headline" ? headlineSizeMap : sizeMap)[(c[`${fieldKey}_size`] as string) ?? defaults.size ?? "md"],
    color: (c[`${fieldKey}_color`] as string) || defaults.color || "#111827",
    textAlign: ((c[`${fieldKey}_align`] as string) || defaults.align || "center") as "left" | "center" | "right",
  });
  // Helper: click handler + active ring for text
  const tp = (fieldKey: string) => ({
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); onTextClick(fieldKey, e); },
    className: `cursor-pointer transition-all rounded-sm ${activeFieldKey === fieldKey ? "ring-2 ring-blue-400 ring-offset-1" : "hover:ring-1 hover:ring-blue-200 hover:ring-offset-1"}`,
  });

  const wrapperClass = `relative cursor-pointer transition-all ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 rounded-lg" : hovered ? "ring-1 ring-blue-300 ring-offset-1 rounded-lg" : ""}`;

  return (
    <div
      className={wrapperClass}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover toolbar */}
      {(hovered || isSelected) && (
        <div className="absolute -top-7 right-0 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-md px-1 py-0.5 z-20" onClick={(e) => e.stopPropagation()}>
          {!isFirst && <button onClick={onMoveUp} className="p-1 hover:bg-gray-100 rounded text-gray-500"><span className="material-symbols-outlined text-xs">arrow_upward</span></button>}
          {!isLast && <button onClick={onMoveDown} className="p-1 hover:bg-gray-100 rounded text-gray-500"><span className="material-symbols-outlined text-xs">arrow_downward</span></button>}
          <button onClick={onDelete} className="p-1 hover:bg-red-50 rounded text-red-400"><span className="material-symbols-outlined text-xs">delete</span></button>
        </div>
      )}

      {/* ── PROFILE HEADER ── */}
      {block.type === "profile_header" && (
        <div className="flex flex-col items-center text-center px-4 pt-3 pb-2">
          {c.image_url ? (
            <img src={c.image_url} className="w-12 h-12 rounded-full object-cover mb-1.5 border-2 border-white shadow" alt="" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 mb-1.5 flex items-center justify-center border-2 border-white shadow">
              <span className="material-symbols-outlined text-xl text-gray-400">person</span>
            </div>
          )}
          {(c.name || c.title_text) && (
            <div className="mb-2">
              {c.name && <div {...tp("name")} style={ts("name", { size: "sm", color: "#111827" })}><span className="font-bold">{c.name}</span></div>}
              {c.title_text && <div {...tp("title")} style={ts("title", { size: "sm", color })}>{c.title_text}</div>}
            </div>
          )}
          <h2
            {...tp("headline")}
            style={{ ...ts("headline", { size: "lg", color: "#111827" }), fontWeight: 900, lineHeight: 1.1 }}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onUpdate({ headline: e.currentTarget.innerText })}
          >
            {c.headline}
          </h2>
          {c.subtext && (
            <p
              {...tp("subtext")}
              style={{ ...ts("subtext", { size: "sm", color: "#6B7280" }), lineHeight: 1.6, marginBottom: 12 }}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onUpdate({ subtext: e.currentTarget.innerText })}
            >
              {c.subtext}
            </p>
          )}
          <button className="w-full py-3 rounded-2xl font-black text-xs" style={{ background: color, color: textColor }}>
            {c.cta_text || "Jetzt bewerben →"}
          </button>
        </div>
      )}

      {/* ── WELCOME ── */}
      {block.type === "welcome" && (
        <div className="flex flex-col items-center text-center px-4 py-5">
          <div className="text-3xl mb-3">{c.emoji || "👋"}</div>
          <h3
            {...tp("headline")}
            style={{ ...ts("headline", { size: "md", color: "#111827" }), fontWeight: 900 }}
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate({ headline: e.currentTarget.innerText })}
          >
            {c.headline}
          </h3>
          <p
            {...tp("subtext")}
            style={{ ...ts("subtext", { size: "sm", color: "#6B7280" }), lineHeight: 1.6 }}
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate({ subtext: e.currentTarget.innerText })}
          >
            {c.subtext}
          </p>
        </div>
      )}

      {/* ── MULTIPLE CHOICE ── */}
      {block.type === "multiple_choice" && (
        <div className="px-4 py-3">
          <h3 {...tp("question")} style={{ ...ts("question", { size: "md", color: "#111827" }), fontWeight: 900, lineHeight: 1.2 }}>{c.question || "Frage"}</h3>
          {c.selection === "multiple" && <p className="text-[9px] text-gray-400 mb-2">(Wähle so viele Antworten, wie du möchtest)</p>}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {(c.items ?? []).slice(0, 6).map((item, i) => (
              <div key={item.id} className="flex items-center gap-2 rounded-xl px-3 py-2.5 border-2 cursor-pointer"
                style={{ borderColor: i === 0 ? color : "#E5E7EB", background: i === 0 ? color + "15" : "white" }}>
                <span className="material-symbols-outlined text-sm text-gray-700">{item.icon || "check"}</span>
                <span className="text-xs font-semibold text-gray-900 leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
          <button className="w-full py-2.5 rounded-2xl font-black text-xs" style={{ background: color, color: textColor }}>
            {c.cta || "Absenden und weiter"}
          </button>
        </div>
      )}

      {/* ── IMAGE CHOICE ── */}
      {block.type === "image_choice" && (
        <div className="px-4 py-3">
          <h3 {...tp("question")} style={{ ...ts("question", { size: "md", color: "#111827" }), fontWeight: 900, lineHeight: 1.2 }}>{c.question || "Frage"}</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {(c.items ?? []).slice(0, 4).map((item, i) => (
              <div key={item.id} className="relative rounded-xl overflow-hidden border-2 cursor-pointer" style={{ aspectRatio: "1", borderColor: i === 0 ? color : "transparent" }}>
                {item.image_url ? (
                  <img src={item.image_url} className="w-full h-full object-cover" alt={item.label} />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-gray-300">image</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 py-1 text-center" style={{ background: color }}>
                  <span className="font-bold text-[9px]" style={{ color: textColor }}>{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LIST CHOICE ── */}
      {block.type === "list_choice" && (
        <div className="px-4 py-3">
          <h3 {...tp("question")} style={{ ...ts("question", { size: "md", color: "#111827" }), fontWeight: 900, lineHeight: 1.2 }}>{c.question || "Frage"}</h3>
          <div className="space-y-1.5">
            {(c.items ?? []).slice(0, 5).map((item, i) => (
              <div key={item.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer"
                style={{ background: i === 0 ? "#1A1A1A" : "#F3F4F6" }}>
                <span className="material-symbols-outlined text-sm" style={{ color: i === 0 ? color : "#6B7280" }}>{item.icon || "arrow_right"}</span>
                <span className="text-xs font-semibold" style={{ color: i === 0 ? "white" : "#111827" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONTACT FORM ── */}
      {block.type === "contact_form" && (
        <div className="px-4 py-3">
          <h3 className="font-black text-sm text-gray-900 mb-3">{c.headline || "Deine Kontaktdaten"}</h3>
          <div className="space-y-2">
            {[{ emoji: "👋", ph: "Dein vollständiger Name" }, { emoji: "📧", ph: "Deine E-Mailadresse" }, { emoji: "📱", ph: "Deine Telefonnummer" }].map((f) => (
              <div key={f.ph} className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                <span className="text-sm">{f.emoji}</span>
                <span className="text-xs text-gray-400">{f.ph}</span>
              </div>
            ))}
            {c.show_city && (
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                <span className="text-sm">📍</span>
                <span className="text-xs text-gray-400">Deine Stadt</span>
              </div>
            )}
            {c.show_cv_upload && (
              <div className="flex items-center gap-2 border border-dashed border-gray-200 rounded-xl px-3 py-2.5">
                <span className="material-symbols-outlined text-gray-300 text-base">upload_file</span>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Lebenslauf hochladen (optional)</div>
                  <div className="text-[9px] text-gray-400">max. 5MB, .pdf, .jpg, .png</div>
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 flex items-start gap-1.5">
            <div className="w-3 h-3 border border-gray-300 rounded mt-0.5 flex-shrink-0" />
            <span className="text-[9px] text-gray-400">Datenschutzerklärung gelesen und akzeptiert</span>
          </div>
          <button className="w-full mt-3 py-2.5 rounded-2xl font-black text-xs" style={{ background: color, color: textColor }}>
            {c.cta_text || "Bewerbung absenden →"}
          </button>
        </div>
      )}

      {/* ── TEXT ── */}
      {block.type === "text" && (
        <div className="px-4 py-2">
          <p
            {...tp("size")}
            className={`outline-none leading-relaxed ${c.bold ? "font-bold" : ""} cursor-pointer transition-all rounded-sm ${activeFieldKey === "size" ? "ring-2 ring-blue-400 ring-offset-1" : "hover:ring-1 hover:ring-blue-200 hover:ring-offset-1"}`}
            style={{ fontSize: sizeMap[(c.size as string) ?? "md"], color: (c.color as string) || "#374151", textAlign: ((c.align as string) || "left") as "left" | "center" | "right" }}
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate({ content: e.currentTarget.innerText })}
          >
            {c.content}
          </p>
        </div>
      )}

      {/* ── BUTTON ── */}
      {block.type === "button" && (
        <div className="px-4 py-2">
          <button
            className="w-full py-3 rounded-2xl font-black text-xs"
            style={c.style === "outline" ? { border: `2px solid ${color}`, color, background: "transparent" } : { background: color, color: textColor }}
          >
            {c.label || "Weiter →"}
          </button>
        </div>
      )}

      {/* ── IMAGE ── */}
      {block.type === "image" && (
        <div className="px-4 py-2">
          {c.url ? (
            <img src={c.url} alt={c.alt ?? ""} className={`w-full object-cover ${c.rounded ? "rounded-xl" : ""}`} style={{ maxHeight: 160 }} />
          ) : (
            <div className={`w-full h-24 bg-gray-100 flex items-center justify-center ${c.rounded ? "rounded-xl" : ""}`}>
              <span className="material-symbols-outlined text-3xl text-gray-300">image</span>
            </div>
          )}
        </div>
      )}

      {/* ── DIVIDER ── */}
      {block.type === "divider" && (
        <div className={`px-4 ${c.spacing === "lg" ? "py-5" : c.spacing === "sm" ? "py-1.5" : "py-3"}`}>
          <div className="w-full h-px bg-gray-100" />
        </div>
      )}

      {/* ── RATING ── */}
      {block.type === "rating" && (
        <div className="px-4 py-3 text-center">
          <div className="flex justify-center gap-0.5 mb-1">
            {Array.from({ length: c.stars ?? 5 }).map((_, i) => (
              <span key={i} className="text-sm" style={{ color }}>★</span>
            ))}
          </div>
          <div className="text-xs text-gray-500">
            {c.count && <span className="font-bold text-gray-900">{c.count} von </span>}
            {c.source_text}
          </div>
        </div>
      )}

      {/* ── LOADING SCREEN ── */}
      {block.type === "loading_screen" && (
        <div className="flex flex-col items-center justify-center py-8 text-center px-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: (branding.primary_color) + "20" }}>
            <span className="material-symbols-outlined text-xl animate-spin" style={{ color: branding.primary_color }}>progress_activity</span>
          </div>
          <h3 className="font-black text-sm" style={{ color: c.headline_color ?? "#111827" }}>{c.headline}</h3>
          {c.subtext && <p className="text-xs mt-1" style={{ color: c.subtext_color ?? "#6B7280" }}>{c.subtext}</p>}
        </div>
      )}

      {/* ── THANK YOU ── */}
      {block.type === "thank_you" && (
        <div className="flex flex-col items-center text-center py-8 px-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: branding.primary_color }}>
            <span className="material-symbols-outlined text-xl font-bold" style={{ color: branding.button_text_color, fontVariationSettings: "'FILL' 1" }}>check</span>
          </div>
          <p className="text-xs font-bold mb-1" style={{ color: branding.primary_color }}>Großartige Neuigkeiten!</p>
          <h3 className="font-black text-sm leading-tight mb-2" style={{ color: c.headline_color ?? "#111827" }}>{c.headline}</h3>
          {c.subtext && <p className="text-xs leading-relaxed" style={{ color: c.subtext_color ?? "#6B7280" }}>{c.subtext}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Block Picker ─────────────────────────────────────────────────────────────

function BlockPicker({ onAdd, onClose }: { onAdd: (type: BlockType) => void; onClose: () => void }) {
  const interactiveTypes = (Object.entries(blockConfig) as [BlockType, typeof blockConfig[BlockType]][])
    .filter(([, c]) => c.category === "interactive");
  const simpleTypes = (Object.entries(blockConfig) as [BlockType, typeof blockConfig[BlockType]][])
    .filter(([, c]) => c.category === "simple");

  return (
    <div className="absolute bottom-14 left-0 right-0 z-30 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden mx-2">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="font-bold text-xs text-gray-900">Block hinzufügen</span>
        <button onClick={onClose} className="material-symbols-outlined text-gray-400 text-base">close</button>
      </div>
      <div className="overflow-y-auto max-h-64 p-3">
        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Interaktive Blöcke</div>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {interactiveTypes.map(([type, cfg]) => (
            <button key={type} onClick={() => { onAdd(type); onClose(); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-100 transition-colors text-left">
              <span className="material-symbols-outlined text-sm text-gray-500">{cfg.icon}</span>
              <span className="text-xs font-semibold text-gray-700">{cfg.label}</span>
            </button>
          ))}
        </div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Einfache Blöcke</div>
        <div className="grid grid-cols-2 gap-1.5">
          {simpleTypes.map(([type, cfg]) => (
            <button key={type} onClick={() => { onAdd(type); onClose(); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-blue-50 hover:border-blue-200 border border-gray-100 transition-colors text-left">
              <span className="material-symbols-outlined text-sm text-gray-500">{cfg.icon}</span>
              <span className="text-xs font-semibold text-gray-700">{cfg.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Block Picker Inline (Right Panel) ────────────────────────────────────────

function BlockPickerInline({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const interactiveTypes = (Object.entries(blockConfig) as [BlockType, typeof blockConfig[BlockType]][])
    .filter(([, c]) => c.category === "interactive");
  const simpleTypes = (Object.entries(blockConfig) as [BlockType, typeof blockConfig[BlockType]][])
    .filter(([, c]) => c.category === "simple");

  return (
    <div className="space-y-4">
      <div>
        <div className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2 px-1">Interaktive Blöcke</div>
        <div className="grid grid-cols-2 gap-1.5">
          {interactiveTypes.map(([type, cfg]) => (
            <button key={type} onClick={() => onAdd(type)}
              className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-surface-container-low hover:bg-primary-container/20 hover:border-primary border border-outline-variant/20 transition-colors text-center">
              <span className="material-symbols-outlined text-xl text-outline">{cfg.icon}</span>
              <span className="font-label text-xs font-bold text-on-surface-variant leading-tight">{cfg.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2 px-1">Einfache Blöcke</div>
        <div className="grid grid-cols-2 gap-1.5">
          {simpleTypes.map(([type, cfg]) => (
            <button key={type} onClick={() => onAdd(type)}
              className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-surface-container-low hover:bg-primary-container/20 hover:border-primary border border-outline-variant/20 transition-colors text-center">
              <span className="material-symbols-outlined text-xl text-outline">{cfg.icon}</span>
              <span className="font-label text-xs font-bold text-on-surface-variant leading-tight">{cfg.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Text Style Controls ────────────────────────────────────────────────────────

function TextStyleControls({ label, sizeKey, colorKey, alignKey, content, onUpdate, sizes = ["sm", "md", "lg", "xl"] as const }: {
  label: string;
  sizeKey: string; colorKey: string; alignKey: string;
  content: BlockContent;
  onUpdate: (c: Partial<BlockContent>) => void;
  sizes?: readonly string[];
}) {
  const currentSize = (content as Record<string, unknown>)[sizeKey] as string ?? "md";
  const currentColor = (content as Record<string, unknown>)[colorKey] as string ?? "";
  const currentAlign = (content as Record<string, unknown>)[alignKey] as string ?? "center";
  return (
    <div className="bg-surface-container-low rounded-xl p-3 space-y-2.5">
      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">{label}</span>
      {/* Size */}
      <div className="flex gap-1">
        {sizes.map((s) => (
          <button key={s} onClick={() => onUpdate({ [sizeKey]: s })}
            className={`flex-1 py-1 rounded-lg border font-label text-[10px] font-bold uppercase transition-all ${currentSize === s ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
            {s.toUpperCase()}
          </button>
        ))}
      </div>
      {/* Align */}
      <div className="flex gap-1">
        {(["left", "center", "right"] as const).map((a) => (
          <button key={a} onClick={() => onUpdate({ [alignKey]: a })}
            className={`flex-1 py-1.5 rounded-lg border transition-all flex items-center justify-center ${currentAlign === a ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
            <span className="material-symbols-outlined text-sm">{a === "left" ? "format_align_left" : a === "center" ? "format_align_center" : "format_align_right"}</span>
          </button>
        ))}
      </div>
      {/* Color */}
      <div className="flex items-center gap-2">
        <input type="color" value={currentColor || "#111827"} onChange={(e) => onUpdate({ [colorKey]: e.target.value })}
          className="w-8 h-8 rounded-lg border border-outline-variant/20 cursor-pointer p-0.5" />
        <input type="text" value={currentColor} onChange={(e) => onUpdate({ [colorKey]: e.target.value })} placeholder="#111827"
          className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary" />
        {currentColor && <button onClick={() => onUpdate({ [colorKey]: "" })} className="material-symbols-outlined text-outline text-sm hover:text-error">close</button>}
      </div>
    </div>
  );
}

// ─── Properties Panel ──────────────────────────────────────────────────────────

function PropertiesPanel({ block, onUpdate }: { block: Block; onUpdate: (c: Partial<BlockContent>) => void }) {
  const c = block.content;

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder = "") => (
    <div key={label}>
      <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-3 py-2 font-body text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
    </div>
  );

  const textarea = (label: string, value: string, onChange: (v: string) => void, rows = 2) => (
    <div key={label}>
      <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
        className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-3 py-2 font-body text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none" />
    </div>
  );

  const toggle = (label: string, desc: string, value: boolean, onChange: (v: boolean) => void) => (
    <div key={label} className="flex items-center justify-between py-2.5 px-3 border border-outline-variant/10 rounded-xl">
      <div>
        <div className="font-label text-xs font-bold text-on-surface">{label}</div>
        <div className="font-label text-xs text-outline">{desc}</div>
      </div>
      <button onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${value ? "bg-primary" : "bg-outline-variant/40"}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );

  const addItem = () => {
    onUpdate({ items: [...(c.items ?? []), { id: uid(), label: "Neue Option", icon: "check", value: uid(), image_url: "" }] });
  };
  const updateItem = (i: number, update: Partial<ChoiceItem>) => {
    onUpdate({ items: (c.items ?? []).map((item, idx) => idx === i ? { ...item, ...update } : item) });
  };
  const removeItem = (i: number) => {
    onUpdate({ items: (c.items ?? []).filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-4">
      {/* Block type label */}
      <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/10">
        <span className="material-symbols-outlined text-outline text-base">{blockConfig[block.type]?.icon}</span>
        <span className="font-label text-xs font-bold uppercase tracking-widest text-on-surface">{blockConfig[block.type]?.label}</span>
      </div>

      {/* PROFILE HEADER */}
      {block.type === "profile_header" && (
        <>
          <ImageUpload value={c.image_url ?? ""} onChange={(v) => onUpdate({ image_url: v })} label="Foto" aspect="circle" />
          {field("Name", c.name ?? "", (v) => onUpdate({ name: v }), "Max Mustermann")}
          {field("Titel", c.title_text ?? "", (v) => onUpdate({ title_text: v }), "Recruiting Manager")}
          {field("Headline", c.headline ?? "", (v) => onUpdate({ headline: v }), "Werde Teil unseres Teams!")}
          {textarea("Beschreibung", c.subtext ?? "", (v) => onUpdate({ subtext: v }))}
          {field("CTA Button", c.cta_text ?? "", (v) => onUpdate({ cta_text: v }), "Jetzt bewerben →")}
          <TextStyleControls label="Headline-Stil" sizeKey="headline_size" colorKey="headline_color" alignKey="headline_align" content={c} onUpdate={onUpdate} />
          <TextStyleControls label="Beschreibung-Stil" sizeKey="subtext_size" colorKey="subtext_color" alignKey="subtext_align" content={c} onUpdate={onUpdate} sizes={["sm", "md", "lg"]} />
        </>
      )}

      {/* MULTIPLE CHOICE */}
      {(block.type === "multiple_choice" || block.type === "list_choice") && (
        <>
          {field("Fragetext", c.question ?? "", (v) => onUpdate({ question: v }))}
          {block.type === "multiple_choice" && (
            <div>
              <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Auswahl</label>
              <div className="flex gap-2">
                {(["single", "multiple"] as const).map((t) => (
                  <button key={t} onClick={() => onUpdate({ selection: t })}
                    className={`flex-1 py-2 rounded-xl border font-label text-xs font-bold uppercase tracking-widest transition-all ${c.selection === t ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant hover:border-outline"}`}>
                    {t === "single" ? "Einfach" : "Mehrfach"}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-label text-xs font-bold uppercase tracking-widest text-outline">Antworten ({(c.items ?? []).length})</label>
              <button onClick={addItem} className="flex items-center gap-1 font-label text-xs font-bold text-primary hover:underline">
                <span className="material-symbols-outlined text-xs">add</span> Hinzufügen
              </button>
            </div>
            <div className="space-y-2">
              {(c.items ?? []).map((item, i) => (
                <div key={item.id} className="bg-surface-container-low rounded-xl p-2.5 border border-outline-variant/10 space-y-1.5">
                  <div className="flex gap-1.5 items-center">
                    <input value={item.label} onChange={(e) => updateItem(i, { label: e.target.value })} placeholder="Label"
                      className="flex-1 bg-surface-container border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary" />
                    <button onClick={() => removeItem(i)} className="material-symbols-outlined text-outline hover:text-error text-sm">close</button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-outline text-sm w-5 text-center">{item.icon || "check"}</span>
                    <input value={item.icon} onChange={(e) => updateItem(i, { icon: e.target.value })} placeholder="Icon (z.B. check)"
                      className="flex-1 bg-surface-container border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {block.type === "multiple_choice" && field("CTA Button", c.cta ?? "", (v) => onUpdate({ cta: v }), "Absenden und weiter")}
        </>
      )}

      {/* IMAGE CHOICE */}
      {block.type === "image_choice" && (
        <>
          {field("Fragetext", c.question ?? "", (v) => onUpdate({ question: v }))}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-label text-xs font-bold uppercase tracking-widest text-outline">Bilder ({(c.items ?? []).length})</label>
              <button onClick={addItem} className="flex items-center gap-1 font-label text-xs font-bold text-primary hover:underline">
                <span className="material-symbols-outlined text-xs">add</span> Hinzufügen
              </button>
            </div>
            <div className="space-y-2">
              {(c.items ?? []).map((item, i) => (
                <div key={item.id} className="bg-surface-container-low rounded-xl p-2.5 border border-outline-variant/10 space-y-1.5">
                  <div className="flex gap-1.5 items-center">
                    <input value={item.label} onChange={(e) => updateItem(i, { label: e.target.value })} placeholder="Label"
                      className="flex-1 bg-surface-container border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary" />
                    <button onClick={() => removeItem(i)} className="material-symbols-outlined text-outline hover:text-error text-sm">close</button>
                  </div>
                  <ImageUpload value={item.image_url ?? ""} onChange={(v) => updateItem(i, { image_url: v })} aspect="square" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* CONTACT FORM */}
      {block.type === "contact_form" && (
        <>
          {field("Überschrift", c.headline ?? "", (v) => onUpdate({ headline: v }))}
          {field("CTA Button", c.cta_text ?? "", (v) => onUpdate({ cta_text: v }), "Bewerbung absenden →")}
          {toggle("Lebenslauf Upload", "CV-Upload im Formular zeigen", c.show_cv_upload ?? true, (v) => onUpdate({ show_cv_upload: v }))}
          {toggle("Stadt-Feld", "Feld 'Deine Stadt' anzeigen", c.show_city ?? false, (v) => onUpdate({ show_city: v }))}
        </>
      )}

      {/* TEXT */}
      {block.type === "text" && (
        <>
          {textarea("Text", c.content ?? "", (v) => onUpdate({ content: v }), 3)}
          <TextStyleControls label="Text-Stil" sizeKey="size" colorKey="color" alignKey="align" content={c} onUpdate={onUpdate} />
          {toggle("Fett", "", c.bold ?? false, (v) => onUpdate({ bold: v }))}
        </>
      )}

      {/* BUTTON */}
      {block.type === "button" && (
        <>
          {field("Button Text", c.label ?? "", (v) => onUpdate({ label: v }))}
          <div>
            <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Stil</label>
            <div className="flex gap-2">
              {(["primary", "outline"] as const).map((s) => (
                <button key={s} onClick={() => onUpdate({ style: s })}
                  className={`flex-1 py-2 rounded-xl border font-label text-xs font-bold uppercase transition-all ${c.style === s ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
                  {s === "primary" ? "Gefüllt" : "Umriss"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* IMAGE */}
      {block.type === "image" && (
        <>
          <ImageUpload value={c.url ?? ""} onChange={(v) => onUpdate({ url: v })} label="Bild" aspect="wide" />
          {field("Alt-Text", c.alt ?? "", (v) => onUpdate({ alt: v }))}
          {toggle("Abgerundet", "Bild mit gerundeten Ecken", c.rounded ?? true, (v) => onUpdate({ rounded: v }))}
        </>
      )}

      {/* RATING */}
      {block.type === "rating" && (
        <>
          <div>
            <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Sterne (1–5)</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => onUpdate({ stars: n })}
                  className={`flex-1 py-1.5 rounded-lg border font-label text-xs font-bold transition-all ${c.stars === n ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          {field("Anzahl", c.count ?? "", (v) => onUpdate({ count: v }), "18+")}
          {field("Quelle", c.source_text ?? "", (v) => onUpdate({ source_text: v }), "Kununu Bewertungen")}
        </>
      )}

      {/* WELCOME */}
      {block.type === "welcome" && (
        <>
          {field("Emoji", c.emoji ?? "", (v) => onUpdate({ emoji: v }), "👋")}
          {field("Headline", c.headline ?? "", (v) => onUpdate({ headline: v }))}
          {textarea("Beschreibung", c.subtext ?? "", (v) => onUpdate({ subtext: v }))}
          <TextStyleControls label="Headline-Stil" sizeKey="headline_size" colorKey="headline_color" alignKey="headline_align" content={c} onUpdate={onUpdate} />
          <TextStyleControls label="Beschreibung-Stil" sizeKey="subtext_size" colorKey="subtext_color" alignKey="subtext_align" content={c} onUpdate={onUpdate} sizes={["sm", "md", "lg"]} />
        </>
      )}

      {/* LOADING / THANK YOU */}
      {(block.type === "loading_screen" || block.type === "thank_you") && (
        <>
          {field("Überschrift", c.headline ?? "", (v) => onUpdate({ headline: v }))}
          {textarea("Beschreibung", c.subtext ?? "", (v) => onUpdate({ subtext: v }))}
          <TextStyleControls label="Headline-Stil" sizeKey="headline_size" colorKey="headline_color" alignKey="headline_align" content={c} onUpdate={onUpdate} />
          <TextStyleControls label="Beschreibung-Stil" sizeKey="subtext_size" colorKey="subtext_color" alignKey="subtext_align" content={c} onUpdate={onUpdate} sizes={["sm", "md", "lg"]} />
        </>
      )}

      {/* DIVIDER */}
      {block.type === "divider" && (
        <div>
          <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Abstand</label>
          <div className="flex gap-2">
            {(["sm", "md", "lg"] as const).map((s) => (
              <button key={s} onClick={() => onUpdate({ spacing: s })}
                className={`flex-1 py-2 rounded-xl border font-label text-xs font-bold uppercase transition-all ${c.spacing === s ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
                {s === "sm" ? "Klein" : s === "md" ? "Mittel" : "Groß"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Design Panel ──────────────────────────────────────────────────────────────

function DesignPanel({ branding, onChange }: { branding: FunnelBranding; onChange: (b: Partial<FunnelBranding>) => void }) {
  const presets = ["#F9BE2A", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#F97316", "#06B6D4", "#1A1A1A"];
  return (
    <div className="space-y-5">
      <div>
        <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-3">Hauptfarbe</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {presets.map((c) => (
            <button key={c} onClick={() => onChange({ primary_color: c })}
              className={`w-7 h-7 rounded-lg transition-all ${branding.primary_color === c ? "ring-2 ring-offset-1 ring-primary scale-110" : "hover:scale-110"}`}
              style={{ background: c }} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="color" value={branding.primary_color} onChange={(e) => onChange({ primary_color: e.target.value })}
            className="w-10 h-10 rounded-xl cursor-pointer border border-outline-variant/20 p-0.5" />
          <input value={branding.primary_color} onChange={(e) => onChange({ primary_color: e.target.value })}
            className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-3 py-2 font-body text-sm text-on-surface focus:outline-none focus:border-primary" />
        </div>
      </div>
      <div>
        <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Button-Textfarbe</label>
        <div className="flex gap-2">
          {["#1A1A1A", "#FFFFFF"].map((c) => (
            <button key={c} onClick={() => onChange({ button_text_color: c })}
              className={`flex-1 py-2.5 rounded-xl border font-label text-xs font-bold transition-all ${branding.button_text_color === c ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
              {c === "#1A1A1A" ? "Dunkel" : "Hell"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Logo URL</label>
        <input value={branding.logo_url ?? ""} onChange={(e) => onChange({ logo_url: e.target.value })} placeholder="https://…"
          className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-3 py-2 font-body text-sm text-on-surface focus:outline-none focus:border-primary" />
      </div>
      <div className="border border-outline-variant/10 rounded-xl p-4 bg-surface-container-low">
        <p className="font-label text-xs text-outline uppercase tracking-widest mb-3">Vorschau</p>
        <button className="w-full py-3 rounded-2xl font-black text-sm" style={{ background: branding.primary_color, color: branding.button_text_color }}>
          Jetzt bewerben →
        </button>
      </div>
    </div>
  );
}

// ─── Main Editor ───────────────────────────────────────────────────────────────

export function FunnelEditor({ funnelId }: { funnelId: string }) {
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [pages, setPages] = useState<FunnelPage[]>(defaultPages);
  const [selectedPageIdx, setSelectedPageIdx] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"seiten" | "design">("seiten");
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [activeTextField, setActiveTextField] = useState<ActiveTextField>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [branding, setBranding] = useState<FunnelBranding>(defaultBranding);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data: fd } = await supabase.from("funnels").select("*, job:jobs(id, title, company:companies(name))").eq("id", funnelId).single();
    if (fd) {
      const f = fd as unknown as Funnel;
      setFunnel(f);
      if (f.branding) setBranding({ ...defaultBranding, ...f.branding });
    }
    const { data: pd } = await supabase.from("funnel_pages").select("*").eq("funnel_id", funnelId).order("page_order");
    if (pd && pd.length > 0) {
      setPages((pd as unknown as FunnelPage[]).map((p) => ({ ...p, blocks: migratePageToBlocks(p) })));
    }
  }, [funnelId]);

  useEffect(() => { load(); }, [load]);

  const currentPage = pages[selectedPageIdx];
  const selectedBlock = currentPage?.blocks.find((b) => b.id === selectedBlockId) ?? null;

  // Deselect block when page changes
  useEffect(() => { setSelectedBlockId(null); }, [selectedPageIdx]);

  async function save() {
    setSaving(true);
    setSaveError(null);
    await supabase.from("funnels").update({ branding }).eq("id", funnelId);
    for (const page of pages) {
      const payload = { blocks: page.blocks, is_required: page.is_required, page_order: page.page_order, funnel_id: funnelId, page_type: "intro" };
      if (page.id) {
        const { error } = await supabase.from("funnel_pages").update(payload).eq("id", page.id);
        if (error) { setSaveError(error.message); setSaving(false); return; }
      } else {
        const { data, error } = await supabase.from("funnel_pages").insert([payload]).select().single();
        if (error) { setSaveError(error.message); setSaving(false); return; }
        if (data) setPages((prev) => prev.map((p) => p.page_order === page.page_order && !p.id ? { ...p, id: (data as FunnelPage).id } : p));
      }
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function publish() {
    await save();
    await supabase.from("funnels").update({ status: "active", published_at: new Date().toISOString() }).eq("id", funnelId);
    setFunnel((f) => f ? { ...f, status: "active" } : f);
  }

  function updateBlock(blockId: string, content: Partial<BlockContent>) {
    setPages((prev) => prev.map((p, i) => i !== selectedPageIdx ? p : {
      ...p, blocks: p.blocks.map((b) => b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b)
    }));
  }

  function addBlock(type: BlockType) {
    const newBlock = blockDefaults(type);
    setPages((prev) => prev.map((p, i) => i !== selectedPageIdx ? p : { ...p, blocks: [...p.blocks, newBlock] }));
    setSelectedBlockId(newBlock.id);
  }

  function moveBlock(blockId: string, dir: -1 | 1) {
    setPages((prev) => prev.map((p, i) => {
      if (i !== selectedPageIdx) return p;
      const idx = p.blocks.findIndex((b) => b.id === blockId);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= p.blocks.length) return p;
      const blocks = [...p.blocks];
      [blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]];
      return { ...p, blocks };
    }));
  }

  function deleteBlock(blockId: string) {
    setPages((prev) => prev.map((p, i) => i !== selectedPageIdx ? p : { ...p, blocks: p.blocks.filter((b) => b.id !== blockId) }));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  }

  function addPage() {
    const page: FunnelPage = { page_order: pages.length + 1, is_required: true, blocks: [blockDefaults("text")] };
    setPages((prev) => [...prev, page]);
    setSelectedPageIdx(pages.length);
  }

  function deletePage(idx: number) {
    if (pages.length <= 1) return;
    const removed = pages[idx];
    if (removed.id) supabase.from("funnel_pages").delete().eq("id", removed.id);
    setPages((prev) => prev.filter((_, i) => i !== idx).map((p, i) => ({ ...p, page_order: i + 1 })));
    setSelectedPageIdx(Math.max(0, idx - 1));
  }

  function movePage(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= pages.length) return;
    setPages((prev) => {
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next.map((p, i) => ({ ...p, page_order: i + 1 }));
    });
    setSelectedPageIdx(newIdx);
  }

  // Page type label for sidebar
  function pageLabel(page: FunnelPage) {
    const types = page.blocks.map((b) => blockConfig[b.type]?.label);
    if (types.length === 0) return "Leer";
    if (types.length === 1) return types[0];
    return `${types[0]} +${types.length - 1}`;
  }

  function pageIcon(page: FunnelPage) {
    if (page.blocks.length === 0) return "draft";
    return blockConfig[page.blocks[0].type]?.icon ?? "draft";
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-72 flex-shrink-0 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col z-10">
        <div className="px-4 py-4 border-b border-outline-variant/20">
          <a href="/funnels" className="inline-flex items-center gap-1 text-outline hover:text-on-surface transition-colors mb-3 font-label text-xs font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-sm">arrow_back</span> Zurück
          </a>
          <h2 className="font-headline text-base italic text-on-surface leading-tight truncate">{funnel?.name ?? "Funnel"}</h2>
          {funnel?.job && <p className="font-label text-xs text-outline mt-0.5 truncate">{funnel.job.title} · {funnel.job.company.name}</p>}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/20">
          {(["seiten", "design"] as const).map((tab) => (
            <button key={tab} onClick={() => setSidebarTab(tab)}
              className={`flex-1 py-2.5 font-label text-xs font-bold uppercase tracking-widest transition-colors ${sidebarTab === tab ? "text-primary border-b-2 border-primary" : "text-outline hover:text-on-surface"}`}>
              {tab === "seiten" ? "Übersicht" : "Design"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {sidebarTab === "seiten" ? (
            <div className="py-2 px-2">
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="font-label text-xs font-bold uppercase tracking-widest text-outline">Seiten</span>
              </div>
              {pages.map((page, i) => (
                <div key={i}
                  className={`group flex items-center gap-2 px-2 py-2 rounded-lg mb-0.5 cursor-pointer transition-all ${selectedPageIdx === i ? "bg-primary-container text-on-primary-container" : "hover:bg-surface-container text-on-surface-variant hover:text-on-surface"}`}
                  onClick={() => setSelectedPageIdx(i)}>
                  <span className="font-label text-xs font-bold text-outline w-4 flex-shrink-0">{i + 1}</span>
                  <span className={`material-symbols-outlined text-base flex-shrink-0 ${selectedPageIdx === i ? "" : "text-outline"}`}>{pageIcon(page)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-label text-xs font-bold truncate">{pageLabel(page)}</p>
                    <p className="font-label text-[9px] opacity-50 truncate">{page.blocks.length} Block{page.blocks.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {i > 0 && <button onClick={(e) => { e.stopPropagation(); movePage(i, -1); }} className="p-1 rounded hover:bg-surface-container-high text-on-surface transition-colors" title="Nach oben"><span className="material-symbols-outlined text-sm">arrow_upward</span></button>}
                    {i < pages.length - 1 && <button onClick={(e) => { e.stopPropagation(); movePage(i, 1); }} className="p-1 rounded hover:bg-surface-container-high text-on-surface transition-colors" title="Nach unten"><span className="material-symbols-outlined text-sm">arrow_downward</span></button>}
                    {pages.length > 1 && <button onClick={(e) => { e.stopPropagation(); deletePage(i); }} className="p-1 rounded hover:bg-error-container/30 text-on-surface hover:text-error transition-colors" title="Löschen"><span className="material-symbols-outlined text-sm">delete</span></button>}
                  </div>
                </div>
              ))}

              {/* Ergebnisse */}
              <div className="px-2 mt-4 mb-1.5"><span className="font-label text-xs font-bold uppercase tracking-widest text-outline">Ergebnisse</span></div>
              <div className="flex items-center gap-2 px-2 py-2 rounded-lg text-on-surface-variant opacity-50 cursor-default">
                <span className="font-label text-xs font-bold text-outline w-4">A</span>
                <span className="material-symbols-outlined text-base text-outline">celebration</span>
                <span className="font-label text-xs font-bold">Bestätigung</span>
              </div>

              {/* Nachrichten */}
              <div className="px-2 mt-4 mb-1.5"><span className="font-label text-xs font-bold uppercase tracking-widest text-outline">Nachrichten</span></div>
              <div className="flex items-center gap-2 px-2 py-2 rounded-lg text-on-surface-variant opacity-50 cursor-default">
                <span className="material-symbols-outlined text-base text-outline">mail</span>
                <span className="font-label text-xs font-bold">Bewerbungsbestätigung</span>
              </div>

              <button onClick={addPage} className="w-full flex items-center gap-2 px-2 py-2 mt-3 rounded-lg text-outline hover:bg-surface-container hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-sm">add</span>
                <span className="font-label text-xs font-semibold">Seite hinzufügen</span>
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {funnel && (
                <div className="bg-surface-container rounded-xl p-3 space-y-1.5">
                  <p className="font-label text-xs font-bold uppercase tracking-widest text-outline mb-2">Job-Info</p>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-label text-xs text-outline">Job</span>
                    <span className="font-label text-xs text-on-surface text-right">{funnel.job?.title ?? "–"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-label text-xs text-outline">Firma</span>
                    <span className="font-label text-xs text-on-surface text-right">{funnel.job?.company.name ?? "–"}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-label text-xs text-outline">Job-ID</span>
                    <span className="font-label text-xs text-outline font-mono text-right break-all">{funnel.job_id}</span>
                  </div>
                </div>
              )}
              <DesignPanel branding={branding} onChange={(b) => setBranding((prev) => ({ ...prev, ...b }))} />
            </div>
          )}
        </div>

        {/* Stats */}
        {funnel && (
          <div className="px-4 py-3 border-t border-outline-variant/20 grid grid-cols-2 gap-2">
            <div className="text-center"><div className="font-headline text-xl text-on-surface">{funnel.views}</div><div className="font-label text-xs text-outline uppercase tracking-widest">Views</div></div>
            <div className="text-center"><div className="font-headline text-xl text-on-surface">{funnel.submissions}</div><div className="font-label text-xs text-outline uppercase tracking-widest">Leads</div></div>
          </div>
        )}
      </aside>

      {/* ── CENTER: PREVIEW ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-outline-variant/20 bg-surface-container-lowest flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`text-xs font-label font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1 ${funnel?.status === "active" ? "bg-primary-container/30 text-primary" : "bg-surface-container text-outline"}`}>
              <span className="material-symbols-outlined text-xs">{funnel?.status === "active" ? "wifi_tethering" : "edit"}</span>
              {funnel?.status === "active" ? "Live" : "Entwurf"}
            </div>
            {funnel?.status === "active" && (
              <a
                href={getFunnelPublicUrl(funnel)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-label text-xs text-primary hover:underline truncate max-w-[260px]"
                title={getFunnelPublicUrl(funnel)}
              >
                <span className="material-symbols-outlined text-xs">open_in_new</span>
                {getFunnelPublicUrl(funnel)}
              </a>
            )}
            <span className="font-label text-xs text-outline">Seite {selectedPageIdx + 1} / {pages.length} · {currentPage?.blocks.length ?? 0} Blöcke</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Device toggle */}
            <div className="flex items-center bg-surface-container rounded-lg border border-outline-variant/20 overflow-hidden">
              <button onClick={() => setPreviewMode("mobile")}
                className={`p-1.5 transition-colors ${previewMode === "mobile" ? "bg-primary-container text-primary" : "text-outline hover:text-on-surface"}`} title="Mobile">
                <span className="material-symbols-outlined text-sm">smartphone</span>
              </button>
              <button onClick={() => setPreviewMode("desktop")}
                className={`p-1.5 transition-colors ${previewMode === "desktop" ? "bg-primary-container text-primary" : "text-outline hover:text-on-surface"}`} title="Desktop">
                <span className="material-symbols-outlined text-sm">monitor</span>
              </button>
            </div>
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-surface-container rounded-lg border border-outline-variant/20 px-1">
              <button onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))}
                className="p-1.5 text-outline hover:text-on-surface transition-colors" title="Verkleinern">
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
              <span className="font-label text-xs font-bold text-on-surface-variant w-8 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(1)))}
                className="p-1.5 text-outline hover:text-on-surface transition-colors" title="Vergrößern">
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
              <button onClick={() => setZoom(1)}
                className="p-1.5 text-outline hover:text-on-surface transition-colors border-l border-outline-variant/20 ml-0.5" title="Zurücksetzen">
                <span className="material-symbols-outlined text-sm">fit_screen</span>
              </button>
            </div>

            {saveError && (
              <span className="font-label text-xs text-error max-w-[200px] truncate" title={saveError}>
                <span className="material-symbols-outlined text-xs align-middle">error</span> {saveError}
              </span>
            )}
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 bg-surface-container px-4 py-2 rounded-lg font-label text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-surface-container-high transition-colors">
              {saving ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
               : saved ? <span className="material-symbols-outlined text-sm text-primary">check</span>
               : <span className="material-symbols-outlined text-sm">save</span>}
              {saved ? "Gespeichert" : "Speichern"}
            </button>
            <button onClick={publish} disabled={funnel?.status === "active"}
              className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-lg font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">wifi_tethering</span>
              {funnel?.status === "active" ? "Live" : "Publizieren"}
            </button>
          </div>
        </div>

        {/* Page strip */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-surface-container border-b border-outline-variant/10 overflow-x-auto flex-shrink-0">
          {pages.map((page, i) => (
            <button key={i} onClick={() => setSelectedPageIdx(i)}
              className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${selectedPageIdx === i ? "bg-primary-container text-on-primary-container" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"}`}>
              <span className="material-symbols-outlined text-sm">{pageIcon(page)}</span>
              <span className="font-label text-[9px] font-bold uppercase tracking-widest">{i + 1}</span>
            </button>
          ))}
          <button onClick={addPage} className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-outline hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="font-label text-[9px] font-bold uppercase tracking-widest">Neu</span>
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto flex items-start justify-center py-8 px-6 bg-surface-container/50" onClick={() => { setSelectedBlockId(null); setShowBlockPicker(false); setActiveTextField(null); }}>
          {/* Device frame */}
          <div className="relative origin-top" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }} onClick={(e) => e.stopPropagation()}>
            <div className={`bg-white shadow-2xl overflow-hidden border border-gray-200 ${previewMode === "mobile" ? "w-[320px] rounded-[2.5rem]" : "w-[768px] rounded-xl"}`}>
              {/* Status bar / Browser chrome */}
              {previewMode === "mobile" ? (
                <div className="h-7 bg-gray-900 flex items-center justify-between px-6 rounded-t-[2.5rem] flex-shrink-0">
                  <span className="text-white text-[9px] font-bold">9:41</span>
                  <div className="w-14 h-2.5 bg-gray-700 rounded-full" />
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-2 bg-white/60 rounded-sm" /><div className="w-2 h-2 bg-white/60 rounded-full" />
                  </div>
                </div>
              ) : (
                <div className="h-9 bg-gray-100 border-b border-gray-200 flex items-center px-3 gap-2 rounded-t-xl flex-shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white border border-gray-200 rounded-md px-3 py-1 mx-8">
                    <span className="text-[10px] text-gray-400 font-mono">{funnel ? getFunnelPublicUrl(funnel) : "funnel.example.com"}</span>
                  </div>
                </div>
              )}

              {/* Content wrapper — centered card on desktop, full-width on mobile */}
              <div className={`overflow-y-auto bg-white ${previewMode === "desktop" ? "flex justify-center bg-gray-50" : ""}`} style={{ maxHeight: previewMode === "desktop" ? 640 : 580 }}>
              <div className={previewMode === "desktop" ? "w-full max-w-[400px] bg-white min-h-full shadow-sm" : ""}>

              {/* Logo */}
              <div className="flex items-center justify-center px-5 pt-3 pb-1 bg-white">
                {branding.logo_url ? (
                  <img src={branding.logo_url} alt="Logo" className="h-5 object-contain" />
                ) : (
                  <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: branding.primary_color }}>
                    <span className="text-[8px] font-black" style={{ color: branding.button_text_color }}>P</span>
                  </div>
                )}
              </div>

              {/* Blocks */}
              <div className="relative">
                {currentPage?.blocks.map((block, i) => (
                  <BlockPreview
                    key={block.id}
                    block={block}
                    branding={branding}
                    isSelected={selectedBlockId === block.id}
                    onSelect={() => setSelectedBlockId(block.id)}
                    onUpdate={(c) => updateBlock(block.id, c)}
                    onMoveUp={() => moveBlock(block.id, -1)}
                    onMoveDown={() => moveBlock(block.id, 1)}
                    onDelete={() => deleteBlock(block.id)}
                    isFirst={i === 0}
                    isLast={i === currentPage.blocks.length - 1}
                    activeFieldKey={activeTextField?.blockId === block.id ? activeTextField.fieldKey : null}
                    onTextClick={(fieldKey, e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      const container = (e.target as HTMLElement).closest(".relative");
                      const containerRect = container?.getBoundingClientRect() ?? rect;
                      setActiveTextField({ blockId: block.id, fieldKey, rect: new DOMRect(rect.left - containerRect.left, rect.top - containerRect.top, rect.width, rect.height) });
                      setSelectedBlockId(block.id);
                    }}
                  />
                ))}

                {/* Add block button */}
                <div className="px-4 py-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowBlockPicker((v) => !v); setSelectedBlockId(null); }}
                    className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border-2 border-dashed transition-colors ${showBlockPicker ? "border-blue-400 bg-blue-50 text-blue-500" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-400 hover:text-blue-500"}`}
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    <span className="text-xs font-bold uppercase tracking-widest">Block hinzufügen</span>
                  </button>
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-center">
                  <span className="text-[9px] text-gray-300">Impressum · Datenschutz · Cookies</span>
                </div>
              </div>
              </div>{/* /desktop inner card */}
              </div>{/* /content wrapper */}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: PROPERTIES / BLOCK PICKER ── */}
      <aside className="w-72 flex-shrink-0 bg-surface-container-lowest border-l border-outline-variant/20 flex flex-col">
        {/* Header tabs */}
        <div className="flex border-b border-outline-variant/20 flex-shrink-0">
          <button
            onClick={() => { setShowBlockPicker(false); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 font-label text-xs font-bold uppercase tracking-widest transition-colors ${!showBlockPicker ? "text-primary border-b-2 border-primary" : "text-outline hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            Eigenschaften
          </button>
          <button
            onClick={() => { setShowBlockPicker(true); setSelectedBlockId(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 font-label text-xs font-bold uppercase tracking-widest transition-colors ${showBlockPicker ? "text-primary border-b-2 border-primary" : "text-outline hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-sm">add_box</span>
            Blöcke
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showBlockPicker ? (
            /* ── BLOCK PICKER ── */
            <div className="p-4">
              <BlockPickerInline onAdd={(type) => { addBlock(type); setShowBlockPicker(false); }} />
            </div>
          ) : (
            /* ── PROPERTIES ── */
            <div className="p-5">
              {activeTextField && selectedBlock ? (
                <ElementPropertiesPanel
                  fieldKey={activeTextField.fieldKey}
                  content={selectedBlock.content}
                  onUpdate={(c) => updateBlock(selectedBlock.id, c)}
                  onClose={() => setActiveTextField(null)}
                />
              ) : selectedBlock ? (
                <PropertiesPanel block={selectedBlock} onUpdate={(c) => updateBlock(selectedBlock.id, c)} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-3xl text-outline-variant mb-3">touch_app</span>
                  <p className="font-label text-xs text-outline">Klicke auf einen Block im Preview um ihn zu bearbeiten</p>
                  <button onClick={() => setShowBlockPicker(true)} className="mt-4 flex items-center gap-1.5 text-primary font-label text-xs font-bold hover:underline">
                    <span className="material-symbols-outlined text-sm">add_box</span>
                    Block hinzufügen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
