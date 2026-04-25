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
  | "thank_you"
  | "icon_cards"
  | "vertical_tiles"
  | "free_text";

type ChoiceItem = {
  id: string;
  label: string;
  icon: string;
  value: string;
  image_url?: string;
  sublabel?: string;
  // Per-item Bar-Overrides (image_choice). Fallback: item → block → default.
  tile_bar_padding_x?: number;
  tile_bar_padding_y?: number;
  tile_bar_height?: number;
  tile_bar_width?: number;
  tile_bar_radius?: number;
  tile_bar_bg_color?: string;
  tile_bar_bg_opacity?: number;
};

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
  font_pair?: string;
  bg_color?: string;
  bg_gradient?: string;
  content_width?: string;
  [key: string]: unknown;
};

const fontPairs: { key: string; label: string; headline: string; body: string; headlineVar: string; bodyVar: string }[] = [
  { key: "default", label: "Newsreader + Manrope", headline: "Newsreader", body: "Manrope", headlineVar: "var(--font-newsreader)", bodyVar: "var(--font-manrope)" },
  { key: "syne-inter", label: "Syne + Inter", headline: "Syne", body: "Inter", headlineVar: "var(--font-syne)", bodyVar: "var(--font-inter)" },
  { key: "playfair-montserrat", label: "Playfair + Montserrat", headline: "Playfair Display", body: "Montserrat", headlineVar: "var(--font-playfair)", bodyVar: "var(--font-montserrat)" },
  { key: "bebas-inter", label: "Bebas Neue + Inter", headline: "Bebas Neue", body: "Inter", headlineVar: "var(--font-bebas)", bodyVar: "var(--font-inter)" },
];

const gradientPresets = [
  { label: "Rosa → Gelb", value: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  { label: "Rosa → Rot", value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { label: "Blau → Lila", value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { label: "Grün → Cyan", value: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)" },
  { label: "Orange → Gelb", value: "linear-gradient(135deg, #f5a623 0%, #f7dc6f 100%)" },
  { label: "Blau → Cyan", value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
];

const popularIcons = [
  "check", "star", "favorite", "rocket_launch", "work", "school", "trending_up", "bolt",
  "diamond", "groups", "payments", "schedule", "verified", "thumb_up", "emoji_events",
  "psychology", "local_fire_department", "auto_awesome", "celebration", "lightbulb",
  "workspace_premium", "eco", "spa", "fitness_center", "restaurant", "flight",
  "code", "brush", "music_note", "camera_alt",
];

type Funnel = {
  id: string;
  name: string;
  slug: string;
  funnel_type: string;
  external_url: string | null;
  // Polymorph: genau eines von beiden ist gesetzt (DB-seitig via XOR-Check)
  job_id: string | null;
  sales_program_id: string | null;
  status: string;
  branding: FunnelBranding | null;
  views: number;
  submissions: number;
  consent_text: string | null;
  job: { title: string; company: { name: string } } | null;
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

// Render {{icon_name}} as Material Symbol inline icons
function renderTextWithIcons(text: string) {
  const parts = text.split(/(\{\{[a-z_]+\}\})/g);
  return parts.map((part, i) => {
    const match = part.match(/^\{\{([a-z_]+)\}\}$/);
    if (match) return <span key={i} className="material-symbols-outlined align-middle" style={{ fontSize: "1.2em" }}>{match[1]}</span>;
    return part;
  });
}

// Auto-append px if value is a bare number (e.g. "120" → "120px", "80%" stays "80%")
function cssVal(val: string | undefined, fallback: string | undefined): string | undefined {
  if (!val) return fallback;
  if (/^\d+$/.test(val)) return `${val}px`;
  return val;
}

const sizeMap: Record<string, string> = { sm: "12px", md: "14px", lg: "18px", xl: "24px" };
const headlineSizeMap: Record<string, string> = { sm: "14px", md: "18px", lg: "24px", xl: "32px" };

// ─── Floating Text Toolbar ──────────────────────────────────────────────────

type ActiveTextField = { blockId: string; fieldKey: string; rect: DOMRect } | null;
type ActiveImageItem = { blockId: string; itemId: string } | null;

// ─── Element Properties Panel (shown in right sidebar when sub-element is selected) ──

const availableFonts = [
  { key: "", label: "Standard (Funnel-Font)", var: "inherit" },
  { key: "newsreader", label: "Newsreader", var: "var(--font-newsreader)" },
  { key: "manrope", label: "Manrope", var: "var(--font-manrope)" },
  { key: "syne", label: "Syne", var: "var(--font-syne)" },
  { key: "inter", label: "Inter", var: "var(--font-inter)" },
  { key: "playfair", label: "Playfair Display", var: "var(--font-playfair)" },
  { key: "montserrat", label: "Montserrat", var: "var(--font-montserrat)" },
  { key: "bebas", label: "Bebas Neue", var: "var(--font-bebas)" },
];

const fieldLabels: Record<string, string> = {
  name: "Name", title: "Titel", headline: "Headline", subtext: "Beschreibung",
  cta: "CTA Button", question: "Frage", text: "Text", size: "Text", content: "Text",
  btn: "Button", textarea_field: "Textfeld", card_item: "Kachel",
  vtile_label: "Titel", vtile_sublabel: "Untertitel",
  consent: "Einverständnis",
  kicker: "Kicker",
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
  const fKey = `${fieldKey}_font`;
  const curSize = (content[sKey] as string) ?? "md";
  const curColor = (content[cKey] as string) ?? "";
  const curAlign = (content[aKey] as string) ?? "center";
  const curFont = (content[fKey] as string) ?? "";

  // Map fieldKey to the actual content field for text editing
  const textFieldMap: Record<string, string> = {
    name: "name", title: "title_text", headline: "headline", subtext: "subtext",
    cta: "cta_text", question: "question", text: "content", size: "content", content: "content",
    btn: "label", textarea_field: "placeholder", card_item: "question",
    consent: "consent_text",
    kicker: "kicker_text",
  };
  const textKey = textFieldMap[fieldKey] ?? fieldKey;
  const textValue = (content[textKey] as string) ?? "";
  const isContainer = ["btn", "textarea_field", "card_item"].includes(fieldKey);
  // Style-only fields: text content lives per-item (e.g. vtile_label/vtile_sublabel
  // are styling prefixes for item.label/item.sublabel) — hide the textarea + icon-picker.
  const styleOnly = fieldKey === "vtile_label" || fieldKey === "vtile_sublabel";

  const [showIcons, setShowIcons] = useState(false);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm">text_fields</span>
          <span className="font-label text-xs font-bold uppercase tracking-widest text-on-surface">
            {fieldLabels[fieldKey] ?? fieldKey}
          </span>
        </div>
        <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface text-sm">close</button>
      </div>

      {/* Text Content — larger textarea (skipped for style-only fields like vtile_label) */}
      {!styleOnly && (
        <div>
          <textarea
            value={textValue}
            onChange={(e) => onUpdate({ [textKey]: e.target.value })}
            rows={4}
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-y min-h-[80px]"
            placeholder="Text eingeben…"
          />
        </div>
      )}

      {/* Compact toolbar row: Size presets + px + alignment */}
      <div className="bg-surface-container-low rounded-xl p-3 space-y-2.5">
        {/* Size row */}
        <div className="flex items-center gap-1.5">
          {(["sm", "md", "lg", "xl"] as const).map((s) => (
            <button key={s} onClick={() => { onUpdate({ [sKey]: s, [`${fieldKey}_font_size`]: undefined }); }}
              className={`px-2 py-1.5 rounded-lg font-label text-[10px] font-bold uppercase transition-all ${curSize === s && !content[`${fieldKey}_font_size`] ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"}`}>
              {s.toUpperCase()}
            </button>
          ))}
          <input type="number" min={8} max={120}
            value={(content[`${fieldKey}_font_size`] as number) ?? ""}
            onChange={(e) => onUpdate({ [`${fieldKey}_font_size`]: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="px"
            className="w-14 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-[10px] font-mono text-center focus:outline-none focus:border-primary" />
        </div>

        {/* Alignment + Bold row */}
        <div className="flex items-center gap-1.5">
          {(["left", "center", "right"] as const).map((a) => (
            <button key={a} onClick={() => onUpdate({ [aKey]: a })}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center justify-center ${curAlign === a ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"}`}>
              <span className="material-symbols-outlined text-sm">{a === "left" ? "format_align_left" : a === "center" ? "format_align_center" : "format_align_right"}</span>
            </button>
          ))}
          <div className="flex-1" />
          {/* Color inline */}
          <input type="color" value={curColor || "#111827"} onChange={(e) => onUpdate({ [cKey]: e.target.value })}
            className="w-7 h-7 rounded-lg border border-outline-variant/20 cursor-pointer p-0" />
          <input type="text" value={curColor} onChange={(e) => onUpdate({ [cKey]: e.target.value })} placeholder="#111827"
            className="w-[72px] bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-primary" />
          {curColor && <button onClick={() => onUpdate({ [cKey]: "" })} className="material-symbols-outlined text-outline text-xs hover:text-error">close</button>}
        </div>
      </div>

      {/* Font — dropdown selector */}
      <div>
        <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5">Schriftart</label>
        <select
          value={curFont}
          onChange={(e) => onUpdate({ [fKey]: e.target.value || undefined })}
          className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-3 py-2.5 font-body text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
          style={{ fontFamily: availableFonts.find(f => f.key === curFont)?.var ?? "inherit" }}
        >
          {availableFonts.map((f) => (
            <option key={f.key} value={f.key} style={{ fontFamily: f.var }}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Container sizing — for buttons, fields, cards */}
      {isContainer && (
        <div className="bg-surface-container-low rounded-xl p-3 space-y-2">
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Abmessungen</span>
          <p className="font-label text-[8px] text-outline -mt-1">Werte: px (z.B. 120px), % (z.B. 80%), oder auto</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-label text-[9px] text-outline">Höhe (px / %)</span>
              <input type="text" value={(content[`${fieldKey}_height`] as string) ?? ""} onChange={(e) => onUpdate({ [`${fieldKey}_height`]: e.target.value || undefined })} placeholder="auto"
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-primary" />
            </div>
            <div>
              <span className="font-label text-[9px] text-outline">Breite (px / %)</span>
              <input type="text" value={(content[`${fieldKey}_width`] as string) ?? ""} onChange={(e) => onUpdate({ [`${fieldKey}_width`]: e.target.value || undefined })} placeholder="100%"
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-primary" />
            </div>
            <div>
              <span className="font-label text-[9px] text-outline">Padding (px)</span>
              <input type="number" min={0} value={(content[`${fieldKey}_padding`] as number) ?? ""} onChange={(e) => onUpdate({ [`${fieldKey}_padding`]: e.target.value ? Number(e.target.value) : undefined })} placeholder="—"
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-primary" />
            </div>
            <div>
              <span className="font-label text-[9px] text-outline">Rundung (px)</span>
              <input type="number" min={0} value={(content[`${fieldKey}_radius`] as number) ?? ""} onChange={(e) => onUpdate({ [`${fieldKey}_radius`]: e.target.value ? Number(e.target.value) : undefined })} placeholder="16"
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-primary" />
            </div>
          </div>
          {/* Background color for this element */}
          <div className="flex items-center gap-2">
            <span className="font-label text-[9px] text-outline">Hintergrund</span>
            <input type="color" value={(content[`${fieldKey}_bg`] as string) || "#000000"} onChange={(e) => onUpdate({ [`${fieldKey}_bg`]: e.target.value })}
              className="w-6 h-6 rounded border border-outline-variant/20 cursor-pointer p-0" />
            <input type="text" value={(content[`${fieldKey}_bg`] as string) ?? ""} onChange={(e) => onUpdate({ [`${fieldKey}_bg`]: e.target.value || undefined })} placeholder="Standard"
              className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-primary" />
          </div>
        </div>
      )}

      {/* Icon Picker — collapsible (skipped for style-only fields where text is per-item) */}
      {!styleOnly && (
        <div>
          <button onClick={() => setShowIcons(!showIcons)}
            className="w-full flex items-center justify-between py-2 font-label text-xs font-bold uppercase tracking-widest text-outline hover:text-on-surface transition-colors">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">add_reaction</span>
              Icon einfügen
            </span>
            <span className={`material-symbols-outlined text-sm transition-transform ${showIcons ? "rotate-180" : ""}`}>expand_more</span>
          </button>
          {showIcons && (
            <div className="grid grid-cols-6 gap-1 mt-1">
              {popularIcons.map((icon) => (
                <button key={icon} onClick={() => onUpdate({ [textKey]: textValue + ` {{${icon}}}` })}
                  className="p-1.5 rounded-lg border border-outline-variant/10 hover:bg-primary-container/20 hover:border-primary/30 transition-colors flex items-center justify-center"
                  title={icon}>
                  <span className="material-symbols-outlined text-base text-on-surface-variant">{icon}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Back to block */}
      <button onClick={onClose}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-outline-variant/20 text-on-surface-variant font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Zurück zum Block
      </button>
    </div>
  );
}

function ImageItemPanel({ item, blockContent, onUpdate, onClose }: {
  item: ChoiceItem;
  blockContent: BlockContent;
  onUpdate: (patch: Partial<ChoiceItem>) => void;
  onClose: () => void;
}) {
  const blockPadX = (blockContent.tile_bar_padding_x as number | undefined) ?? 6;
  const blockPadY = (blockContent.tile_bar_padding_y as number | undefined) ?? 4;
  const blockHeight = blockContent.tile_bar_height as number | undefined;
  const blockWidth = (blockContent.tile_bar_width as number | undefined) ?? 100;
  const blockRadius = (blockContent.tile_bar_radius as number | undefined) ?? 0;
  const blockOpacity = (blockContent.tile_bar_bg_opacity as number | undefined) ?? 100;
  const blockBg = (blockContent.tile_bar_bg_color as string | undefined) ?? "";

  const padX = item.tile_bar_padding_x ?? blockPadX;
  const padY = item.tile_bar_padding_y ?? blockPadY;
  const height = item.tile_bar_height ?? blockHeight ?? 0;
  const width = item.tile_bar_width ?? blockWidth;
  const radius = item.tile_bar_radius ?? blockRadius;
  const opacity = item.tile_bar_bg_opacity ?? blockOpacity;
  const bgColor = item.tile_bar_bg_color ?? blockBg;

  const hasOverrides = (
    item.tile_bar_padding_x !== undefined ||
    item.tile_bar_padding_y !== undefined ||
    item.tile_bar_height !== undefined ||
    item.tile_bar_width !== undefined ||
    item.tile_bar_radius !== undefined ||
    item.tile_bar_bg_color !== undefined ||
    item.tile_bar_bg_opacity !== undefined
  );

  const resetAll = () => onUpdate({
    tile_bar_padding_x: undefined,
    tile_bar_padding_y: undefined,
    tile_bar_height: undefined,
    tile_bar_width: undefined,
    tile_bar_radius: undefined,
    tile_bar_bg_color: undefined,
    tile_bar_bg_opacity: undefined,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary text-sm flex-shrink-0">image</span>
          <span className="font-label text-xs font-bold uppercase tracking-widest text-on-surface truncate">
            Kachel: {item.label || "(unbenannt)"}
          </span>
        </div>
        <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface text-sm flex-shrink-0">close</button>
      </div>

      <div>
        <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-1.5">Label</label>
        <input
          value={item.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-3 py-2 font-body text-sm text-on-surface focus:outline-none focus:border-primary"
        />
      </div>

      <div className="bg-surface-container-low rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Label-Bar (nur diese Kachel)</span>
          {hasOverrides && (
            <button onClick={resetAll} className="font-label text-[9px] font-bold text-primary hover:underline">Auf Standard</button>
          )}
        </div>
        <NumberSlider
          label="Padding oben/unten"
          min={0} max={40} step={1}
          value={padY}
          onChange={(v) => onUpdate({ tile_bar_padding_y: v })}
          suffix="px"
        />
        <NumberSlider
          label="Padding seitlich"
          min={0} max={40} step={1}
          value={padX}
          onChange={(v) => onUpdate({ tile_bar_padding_x: v })}
          suffix="px"
        />
        <NumberSlider
          label="Höhe (0 = auto)"
          min={0} max={120} step={1}
          value={height}
          onChange={(v) => onUpdate({ tile_bar_height: v === 0 ? undefined : v })}
          suffix="px"
        />
        <NumberSlider
          label="Breite"
          min={20} max={100} step={1}
          value={width}
          onChange={(v) => onUpdate({ tile_bar_width: v })}
          suffix="%"
        />
        <NumberSlider
          label="Eckenradius"
          min={0} max={30} step={1}
          value={radius}
          onChange={(v) => onUpdate({ tile_bar_radius: v })}
          suffix="px"
        />
        <NumberSlider
          label="Deckkraft"
          min={0} max={100} step={5}
          value={opacity}
          onChange={(v) => onUpdate({ tile_bar_bg_opacity: v })}
          suffix="%"
        />
        <div className="flex items-center gap-2">
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline w-14">Farbe</span>
          <input
            type="color"
            value={bgColor || "#FFC107"}
            onChange={(e) => onUpdate({ tile_bar_bg_color: e.target.value })}
            className="w-8 h-8 rounded-lg border border-outline-variant/20 cursor-pointer p-0.5"
          />
          <input
            type="text"
            value={bgColor}
            onChange={(e) => onUpdate({ tile_bar_bg_color: e.target.value || undefined })}
            placeholder="Standard (Block)"
            className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary"
          />
          {item.tile_bar_bg_color !== undefined && (
            <button onClick={() => onUpdate({ tile_bar_bg_color: undefined })} className="material-symbols-outlined text-outline text-sm hover:text-error">close</button>
          )}
        </div>
      </div>

      <button onClick={onClose}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-outline-variant/20 text-on-surface-variant font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-colors">
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
    free_text: { question: "Warum bist du der/die Richtige für diesen Job?", placeholder: "Deine Antwort hier…", cta: "Weiter →", is_required: true },
    icon_cards: { items: [
      { id: uid(), label: "Weiter bewerben!", icon: "check", value: "yes", image_url: "" },
      { id: uid(), label: "Bewerbung abbrechen!", icon: "close", value: "no", image_url: "" },
    ], question: "Was ist Dein nächster Schritt?", card_bg: "#22d3ee", card_icon_color: "#ffffff", card_columns: "2" },
    vertical_tiles: {
      question: "Welchen Bildungshintergrund hast du?",
      show_vtile_image: true,
      vtile_height: 88,
      vtile_width: "100%",
      vtile_padding: 16,
      vtile_radius: 16,
      vtile_bg: "#ffffff",
      vtile_border: "#E5E7EB",
      vtile_label_color: "#111827",
      vtile_sublabel_color: "#6B7280",
      items: [
        { id: uid(), label: "Ja, abgeschlossenes Studium", sublabel: "Bachelor, Master oder höher", icon: "school", value: "studium", image_url: "" },
        { id: uid(), label: "Berufsausbildung", sublabel: "Lehre oder Fachausbildung", icon: "engineering", value: "berufsausbildung", image_url: "" },
        { id: uid(), label: "Noch in Ausbildung", sublabel: "Aktuell Schule oder Studium", icon: "menu_book", value: "in_ausbildung", image_url: "" },
        { id: uid(), label: "Autodidakt", sublabel: "Selbst gelernt, ohne Abschluss", icon: "self_improvement", value: "autodidakt", image_url: "" },
      ],
    },
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
  free_text:       { label: "Freitext-Antwort",   icon: "edit_note",      category: "interactive" },
  icon_cards:      { label: "Icon-Kacheln",      icon: "dashboard",      category: "interactive" },
  vertical_tiles:  { label: "Vertikale Kacheln",  icon: "view_agenda",    category: "interactive" },
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
  activeItemId,
  onItemClick,
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
  activeItemId: string | null;
  onItemClick: (itemId: string, e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const c = block.content;
  const color = branding.primary_color;
  const textColor = branding.button_text_color;

  // Helper: get style for a text field (supports px override + per-element font + line-height)
  const ts = (fieldKey: string, defaults: { size?: string; color?: string; align?: string; lineHeight?: number | string }) => {
    const pxSize = c[`${fieldKey}_font_size`] as number | undefined;
    const fontKey = c[`${fieldKey}_font`] as string | undefined;
    const fontVar = fontKey ? availableFonts.find(f => f.key === fontKey)?.var : undefined;
    const lh = c[`${fieldKey}_line_height`] as number | undefined;
    return {
      fontSize: pxSize ? `${pxSize}px` : (fieldKey === "headline" ? headlineSizeMap : sizeMap)[(c[`${fieldKey}_size`] as string) ?? defaults.size ?? "md"],
      color: (c[`${fieldKey}_color`] as string) || defaults.color || "#111827",
      textAlign: ((c[`${fieldKey}_align`] as string) || defaults.align || "center") as "left" | "center" | "right",
      ...(fontVar ? { fontFamily: fontVar } : {}),
      ...(lh != null ? { lineHeight: lh } : (defaults.lineHeight != null ? { lineHeight: defaults.lineHeight } : {})),
    };
  };
  // Helper: inner block container style with gap
  const innerStyle = (c.block_gap as number) != null ? { display: "flex" as const, flexDirection: "column" as const, gap: `${c.block_gap}px` } : {};

  // Helper: click handler + active ring for text
  const tp = (fieldKey: string) => ({
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); onTextClick(fieldKey, e); },
    className: `cursor-pointer transition-all rounded-sm ${activeFieldKey === fieldKey ? "ring-2 ring-blue-400 ring-offset-1" : "hover:ring-1 hover:ring-blue-200 hover:ring-offset-1"}`,
  });

  const wrapperClass = `relative cursor-pointer transition-all ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 rounded-lg" : hovered ? "ring-1 ring-blue-300 ring-offset-1 rounded-lg" : ""}`;

  return (
    <div
      className={wrapperClass}
      style={{
        background: (c.bg_gradient as string) ?? (c.bg_color as string) ?? undefined,
        paddingTop: (c.block_padding_t as number) != null ? `${c.block_padding_t}px` : undefined,
        paddingRight: (c.block_padding_r as number) != null ? `${c.block_padding_r}px` : undefined,
        paddingBottom: (c.block_padding_b as number) != null ? `${c.block_padding_b}px` : undefined,
        paddingLeft: (c.block_padding_l as number) != null ? `${c.block_padding_l}px` : undefined,
      }}
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
        <div className="flex flex-col items-center text-center px-4 pt-3 pb-2" style={innerStyle}>
          {c.image_url ? (
            <img src={c.image_url} className="w-12 h-12 rounded-full object-cover mb-1.5 border-2 border-white shadow" alt="" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 mb-1.5 flex items-center justify-center border-2 border-white shadow">
              <span className="material-symbols-outlined text-xl text-gray-400">person</span>
            </div>
          )}
          {(c.name || c.title_text) && (
            <div className="mb-2">
              {c.name && <div {...tp("name")} style={ts("name", { size: "sm", color: "#111827" })}><span className="font-bold">{renderTextWithIcons((c.name as string) ?? "")}</span></div>}
              {c.title_text && <div {...tp("title")} style={ts("title", { size: "sm", color })}>{c.title_text}</div>}
            </div>
          )}
          <h2
            {...tp("headline")}
            style={{ ...ts("headline", { size: "lg", color: "#111827" }), fontWeight: 900, lineHeight: 1.1 }}
          >
            {renderTextWithIcons((c.headline as string) ?? "")}
          </h2>
          {c.subtext && (
            <p
              {...tp("subtext")}
              style={{ ...ts("subtext", { size: "sm", color: "#6B7280" }), lineHeight: 1.6, marginBottom: 12 }}
            >
              {renderTextWithIcons((c.subtext as string) ?? "")}
            </p>
          )}
          <button {...tp("btn")} className={`w-full py-3 rounded-2xl font-black text-xs cursor-pointer transition-all ${activeFieldKey === "btn" ? "ring-2 ring-blue-400 ring-offset-1" : "hover:ring-1 hover:ring-blue-200 hover:ring-offset-1"}`}
            style={{
              background: (c.btn_bg as string) || color, color: (c.btn_color as string) || textColor,
              ...((c.btn_height as string) ? { height: cssVal(c.btn_height as string, undefined) } : {}),
              ...((c.btn_radius as number) != null ? { borderRadius: `${c.btn_radius}px` } : {}),
              ...((c.btn_padding as number) != null ? { padding: `${c.btn_padding}px` } : {}),
              fontSize: ts("btn", { size: "sm" }).fontSize,
            }}>
            {renderTextWithIcons((c.cta_text as string) || "Jetzt bewerben →")}
          </button>
        </div>
      )}

      {/* ── WELCOME ── */}
      {block.type === "welcome" && (
        <div className="flex flex-col items-center text-center px-4 py-5" style={innerStyle}>
          <div className="text-3xl mb-3">{c.emoji || "👋"}</div>
          <h3
            {...tp("headline")}
            style={{ ...ts("headline", { size: "md", color: "#111827" }), fontWeight: 900 }}
          >
            {renderTextWithIcons((c.headline as string) ?? "")}
          </h3>
          <p
            {...tp("subtext")}
            style={{ ...ts("subtext", { size: "sm", color: "#6B7280" }), lineHeight: 1.6 }}
          >
            {renderTextWithIcons((c.subtext as string) ?? "")}
          </p>
        </div>
      )}

      {/* ── MULTIPLE CHOICE ── */}
      {block.type === "multiple_choice" && (
        <div className="px-4 py-3" style={innerStyle}>
          <h3 {...tp("question")} style={{ ...ts("question", { size: "md", color: "#111827" }), fontWeight: 900, lineHeight: 1.2 }}>{renderTextWithIcons((c.question as string) || "Frage")}</h3>
          {c.selection === "multiple" && <p className="text-[9px] text-gray-400 mb-2">(Wähle so viele Antworten, wie du möchtest)</p>}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {(c.items ?? []).slice(0, 6).map((item, i) => (
              <div key={item.id} className="flex items-center gap-2 rounded-xl px-3 py-2.5 border-2 cursor-pointer"
                style={{ borderColor: i === 0 ? color : "#E5E7EB", background: i === 0 ? color + "15" : "white" }}>
                <span className="material-symbols-outlined text-sm text-gray-700">{item.icon || "check"}</span>
                <span style={{ ...ts("tile_label", { size: "sm", color: "#111827", align: "left", lineHeight: 1.2 }), fontWeight: 600 }}>{item.label}</span>
              </div>
            ))}
          </div>
          <button {...tp("btn")} className={`w-full py-2.5 rounded-2xl font-black text-xs cursor-pointer transition-all ${activeFieldKey === "btn" ? "ring-2 ring-blue-400 ring-offset-1" : "hover:ring-1 hover:ring-blue-200 hover:ring-offset-1"}`}
            style={{ background: (c.btn_bg as string) || color, color: (c.btn_color as string) || textColor, ...((c.btn_radius as number) != null ? { borderRadius: `${c.btn_radius}px` } : {}) }}>
            {renderTextWithIcons((c.cta as string) || "Absenden und weiter")}
          </button>
        </div>
      )}

      {/* ── IMAGE CHOICE ── */}
      {block.type === "image_choice" && (
        <div className="px-4 py-3">
          <h3 {...tp("question")} style={{ ...ts("question", { size: "md", color: "#111827" }), fontWeight: 900, lineHeight: 1.2 }}>{renderTextWithIcons((c.question as string) || "Frage")}</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {(c.items ?? []).slice(0, 4).map((item, i) => {
              const bar = resolveBar(item, c);
              const widthInset = (100 - bar.width) / 2;
              const isItemActive = activeItemId === item.id;
              return (
                <div
                  key={item.id}
                  className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${isItemActive ? "ring-2 ring-blue-400 ring-offset-1" : "hover:ring-1 hover:ring-blue-200 hover:ring-offset-1"}`}
                  style={{ aspectRatio: "1", borderColor: i === 0 ? color : "transparent" }}
                  onClick={(e) => { e.stopPropagation(); onItemClick(item.id, e); }}
                >
                  {item.image_url ? (
                    <img src={item.image_url} className="w-full h-full object-cover" alt={item.label} />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl text-gray-300">image</span>
                    </div>
                  )}
                  <div
                    className="absolute bottom-0 flex items-center justify-center"
                    style={{
                      left: `${widthInset}%`,
                      right: `${widthInset}%`,
                      background: hexToRgba(bar.bgColor ?? color, bar.opacity),
                      paddingTop: `${bar.padY}px`,
                      paddingBottom: `${bar.padY}px`,
                      paddingLeft: `${bar.padX}px`,
                      paddingRight: `${bar.padX}px`,
                      borderRadius: `${bar.radius}px`,
                      ...(bar.height != null ? { height: `${bar.height}px` } : {}),
                    }}
                  >
                    <span style={{ ...ts("tile_label", { size: "sm", color: textColor, align: "center", lineHeight: 1.15 }), fontWeight: "bold", display: "block", width: "100%" }}>{item.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LIST CHOICE ── */}
      {block.type === "list_choice" && (
        <div className="px-4 py-3">
          <h3 {...tp("question")} style={{ ...ts("question", { size: "md", color: "#111827" }), fontWeight: 900, lineHeight: 1.2 }}>{renderTextWithIcons((c.question as string) || "Frage")}</h3>
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
        <div className="px-4 py-3" style={innerStyle}>
          <h3 {...tp("headline")} style={{ ...ts("headline", { size: "md", color: "#111827" }), fontWeight: 900, marginBottom: 12 }}>{renderTextWithIcons((c.headline as string) || "Deine Kontaktdaten")}</h3>
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
            {(() => {
              const cp = tp("consent");
              return (
                <span onClick={cp.onClick} className={cp.className} style={ts("consent", { size: "sm", color: "#9CA3AF", align: "left", lineHeight: 1.4 })}>
                  {(c.consent_text as string) || "Datenschutzerklärung gelesen und akzeptiert"}
                </span>
              );
            })()}
          </div>
          <button {...tp("btn")} className={`w-full mt-3 py-2.5 rounded-2xl font-black text-xs cursor-pointer transition-all ${activeFieldKey === "btn" ? "ring-2 ring-blue-400 ring-offset-1" : "hover:ring-1 hover:ring-blue-200 hover:ring-offset-1"}`}
            style={{ background: (c.btn_bg as string) || color, color: (c.btn_color as string) || textColor, ...((c.btn_radius as number) != null ? { borderRadius: `${c.btn_radius}px` } : {}) }}>
            {renderTextWithIcons((c.cta_text as string) || "Bewerbung absenden →")}
          </button>
        </div>
      )}

      {/* ── TEXT ── */}
      {block.type === "text" && (
        <div className="px-4 py-2">
          <p
            {...tp("text")}
            className={`leading-relaxed ${c.bold ? "font-bold" : ""} cursor-pointer transition-all rounded-sm ${activeFieldKey === "text" ? "ring-2 ring-blue-400 ring-offset-1" : "hover:ring-1 hover:ring-blue-200 hover:ring-offset-1"}`}
            style={ts("text", { size: "md", color: "#374151", align: "left" })}
          >
            {renderTextWithIcons((c.content as string) ?? "")}
          </p>
        </div>
      )}

      {/* ── BUTTON ── */}
      {block.type === "button" && (
        <div className="px-4 py-2">
          <button {...tp("btn")}
            className={`w-full py-3 rounded-2xl font-black text-xs cursor-pointer transition-all ${activeFieldKey === "btn" ? "ring-2 ring-blue-400 ring-offset-1" : "hover:ring-1 hover:ring-blue-200 hover:ring-offset-1"}`}
            style={{
              ...(c.style === "outline" ? { border: `2px solid ${color}`, color: (c.btn_color as string) || color, background: (c.btn_bg as string) || "transparent" } : { background: (c.btn_bg as string) || color, color: (c.btn_color as string) || textColor }),
              ...((c.btn_radius as number) != null ? { borderRadius: `${c.btn_radius}px` } : {}),
              ...((c.btn_height as string) ? { height: cssVal(c.btn_height as string, undefined) } : {}),
              fontSize: ts("btn", { size: "sm" }).fontSize,
            }}
          >
            {renderTextWithIcons((c.label as string) || "Weiter →")}
          </button>
        </div>
      )}

      {/* ── IMAGE ── */}
      {block.type === "image" && (
        <div className="px-4 py-2">
          {c.url ? (
            <img src={c.url as string} alt={(c.alt as string) ?? ""} className={`${c.rounded ? "rounded-xl" : ""}`}
              style={{
                width: (c.img_width as string) || "100%",
                height: (c.img_height as string) || "auto",
                maxWidth: (c.img_max_width as string) || "100%",
                objectFit: ((c.img_fit as string) || "cover") as "cover" | "contain" | "fill" | "none",
                margin: "0 auto", display: "block",
              }} />
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
        <div className="flex flex-col items-center justify-center py-8 text-center px-4" style={innerStyle}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: (branding.primary_color) + "20" }}>
            <span className="material-symbols-outlined text-xl animate-spin" style={{ color: branding.primary_color }}>progress_activity</span>
          </div>
          <h3 {...tp("headline")} style={{ ...ts("headline", { size: "md", color: "#111827" }), fontWeight: 900 }}>{renderTextWithIcons((c.headline as string) ?? "")}</h3>
          {c.subtext && <p {...tp("subtext")} style={{ ...ts("subtext", { size: "sm", color: "#6B7280" }), marginTop: 4 }}>{renderTextWithIcons((c.subtext as string) ?? "")}</p>}
        </div>
      )}

      {/* ── THANK YOU ── */}
      {block.type === "thank_you" && (
        <div className="flex flex-col items-center text-center py-8 px-4" style={innerStyle}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: branding.primary_color }}>
            <span className="material-symbols-outlined text-xl font-bold" style={{ color: branding.button_text_color, fontVariationSettings: "'FILL' 1" }}>check</span>
          </div>
          {(() => {
            const kp = tp("kicker");
            return (
              <p onClick={kp.onClick} className={`mb-1 ${kp.className}`} style={{ ...ts("kicker", { size: "sm", color: branding.primary_color, lineHeight: 1.2 }), fontWeight: 700 }}>
                {(c.kicker_text as string) || "Großartige Neuigkeiten!"}
              </p>
            );
          })()}
          <h3 {...tp("headline")} style={{ ...ts("headline", { size: "md", color: "#111827" }), fontWeight: 900, lineHeight: 1.1, marginBottom: 8 }}>{renderTextWithIcons((c.headline as string) ?? "")}</h3>
          {c.subtext && <p {...tp("subtext")} style={{ ...ts("subtext", { size: "sm", color: "#6B7280" }), lineHeight: 1.6 }}>{renderTextWithIcons((c.subtext as string) ?? "")}</p>}
        </div>
      )}

      {/* ── FREE TEXT ── */}
      {block.type === "free_text" && (
        <div className="px-4 py-3" style={innerStyle}>
          <h3 {...tp("question")} style={{ ...ts("question", { size: "md", color: "#111827" }), fontWeight: 900, lineHeight: 1.2, marginBottom: 8 }}>{renderTextWithIcons((c.question as string) || "Frage")}</h3>
          <div {...tp("textarea_field")} className={`border border-gray-200 rounded-xl px-3 py-2.5 cursor-pointer transition-all ${activeFieldKey === "textarea_field" ? "ring-2 ring-blue-400 ring-offset-1" : "hover:ring-1 hover:ring-blue-200 hover:ring-offset-1"}`}
            style={{
              minHeight: cssVal((c.textarea_field_height as string), "60px"),
              width: cssVal((c.textarea_field_width as string), undefined),
              ...((c.textarea_field_padding as number) != null ? { padding: `${c.textarea_field_padding}px` } : {}),
              ...((c.textarea_field_radius as number) != null ? { borderRadius: `${c.textarea_field_radius}px` } : {}),
              ...((c.textarea_field_bg as string) ? { background: c.textarea_field_bg as string, borderColor: "transparent" } : {}),
            }}>
            <span className="text-xs text-gray-400">{(c.placeholder as string) || "Deine Antwort hier…"}</span>
          </div>
          <button {...tp("btn")} className={`w-full py-2.5 rounded-2xl font-black text-xs cursor-pointer transition-all ${activeFieldKey === "btn" ? "ring-2 ring-blue-400 ring-offset-1" : "hover:ring-1 hover:ring-blue-200 hover:ring-offset-1"}`}
            style={{ background: (c.btn_bg as string) || color, color: (c.btn_color as string) || textColor, ...((c.btn_radius as number) != null ? { borderRadius: `${c.btn_radius}px` } : {}) }}>
            {renderTextWithIcons((c.cta as string) || "Weiter →")}
          </button>
        </div>
      )}

      {/* ── ICON CARDS ── */}
      {block.type === "icon_cards" && (
        <div className="px-4 py-3">
          <h3 {...tp("question")} style={{ ...ts("question", { size: "md", color: "#111827" }), fontWeight: 900, lineHeight: 1.2, marginBottom: 8 }}>{renderTextWithIcons((c.question as string) || "Frage")}</h3>
          <div {...tp("card_item")} className={`grid gap-2 cursor-pointer transition-all rounded-lg ${activeFieldKey === "card_item" ? "ring-2 ring-blue-400 ring-offset-1" : "hover:ring-1 hover:ring-blue-200 hover:ring-offset-1"} ${(c.card_columns as string) === "1" ? "grid-cols-1" : "grid-cols-2"}`}>
            {(c.items ?? []).map((item) => (
              <div key={item.id} className="flex flex-col items-center justify-center rounded-xl py-4 px-3 text-center"
                style={{
                  background: (c.card_bg as string) || color,
                  minHeight: cssVal((c.card_item_height as string), "80px"),
                  ...((c.card_item_radius as number) != null ? { borderRadius: `${c.card_item_radius}px` } : {}),
                  ...((c.card_item_padding as number) != null ? { padding: `${c.card_item_padding}px` } : {}),
                }}>
                <span className="material-symbols-outlined text-2xl mb-1" style={{ color: (c.card_icon_color as string) || "#ffffff", fontVariationSettings: "'FILL' 1" }}>{item.icon || "check"}</span>
                <span className="font-black" style={{ color: (c.card_icon_color as string) || "#ffffff", fontSize: ts("card_item", { size: "sm" }).fontSize }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VERTICAL TILES ── */}
      {block.type === "vertical_tiles" && (
        <div className="px-4 py-3">
          <h3 {...tp("question")} style={{ ...ts("question", { size: "md", color: "#111827" }), fontWeight: 900, lineHeight: 1.2, marginBottom: 8 }}>{renderTextWithIcons((c.question as string) || "Frage")}</h3>
          <div {...tp("vtile_item")} className={`flex flex-col gap-1.5 cursor-pointer transition-all rounded-lg ${activeFieldKey === "vtile_item" ? "ring-2 ring-blue-400 ring-offset-1" : "hover:ring-1 hover:ring-blue-200 hover:ring-offset-1"}`}>
            {(c.items ?? []).slice(0, 4).map((item, i) => {
              const showImg = (c.show_vtile_image as boolean) ?? true;
              const isSelected = i === 1;
              const padding = (c.vtile_padding as number | undefined) ?? 12;
              const radius = (c.vtile_radius as number | undefined) ?? 12;
              const minH = (c.vtile_height as number | undefined) ?? 64;
              const widthVal = (c.vtile_width as string) || "100%";
              const bg = (c.vtile_bg as string) || "#ffffff";
              const borderColor = (c.vtile_border as string) || "#E5E7EB";
              const imgSize = (c.vtile_image_size as number | undefined) ?? 48;
              const previewImgSize = Math.max(20, Math.round(imgSize * 0.66));
              return (
                <div key={item.id} className="flex items-center gap-2 mx-auto"
                  style={{
                    background: bg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: `${radius}px`,
                    padding: `${Math.max(6, Math.round(padding * 0.6))}px`,
                    minHeight: `${Math.max(44, Math.round(minH * 0.7))}px`,
                    width: widthVal,
                    maxWidth: "100%",
                  }}>
                  {showImg && (
                    <div className="flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden" style={{ width: `${previewImgSize}px`, height: `${previewImgSize}px` }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-base text-gray-400">{item.icon || "image"}</span>
                      )}
                    </div>
                  )}
                  {!showImg && item.icon && (
                    <span className="material-symbols-outlined flex-shrink-0 text-base" style={{ color: (c.vtile_label_color as string) || "#111827" }}>{item.icon}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    {(() => {
                      const lp = tp("vtile_label");
                      return <div onClick={lp.onClick} className={`truncate ${lp.className}`} style={{ ...ts("vtile_label", { size: "sm", color: "#111827", align: "left", lineHeight: 1.2 }), fontWeight: 700 }}>{item.label}</div>;
                    })()}
                    {item.sublabel && (() => {
                      const sp = tp("vtile_sublabel");
                      return <div onClick={sp.onClick} className={`truncate ${sp.className}`} style={ts("vtile_sublabel", { size: "sm", color: "#6B7280", align: "left", lineHeight: 1.2 })}>{item.sublabel}</div>;
                    })()}
                  </div>
                  <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: isSelected ? color : "#9CA3AF" }}>
                    {isSelected ? "radio_button_checked" : "radio_button_unchecked"}
                  </span>
                </div>
              );
            })}
          </div>
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

function TextStyleControls({ label, sizeKey, colorKey, alignKey, fontKey, lineHeightKey, fontSizeKey, content, onUpdate, sizes = ["sm", "md", "lg", "xl"] as const, showFont = false, showLineHeight = false, showFontSize = false }: {
  label: string;
  sizeKey: string; colorKey: string; alignKey: string;
  fontKey?: string; lineHeightKey?: string; fontSizeKey?: string;
  content: BlockContent;
  onUpdate: (c: Partial<BlockContent>) => void;
  sizes?: readonly string[];
  showFont?: boolean;
  showLineHeight?: boolean;
  showFontSize?: boolean;
}) {
  const currentSize = (content as Record<string, unknown>)[sizeKey] as string ?? "md";
  const currentColor = (content as Record<string, unknown>)[colorKey] as string ?? "";
  const currentAlign = (content as Record<string, unknown>)[alignKey] as string ?? "center";
  const currentFont = fontKey ? (content as Record<string, unknown>)[fontKey] as string ?? "" : "";
  const currentLh = lineHeightKey ? (content as Record<string, unknown>)[lineHeightKey] as number | undefined : undefined;
  const currentFontSize = fontSizeKey ? (content as Record<string, unknown>)[fontSizeKey] as number | undefined : undefined;
  return (
    <div className="bg-surface-container-low rounded-xl p-3 space-y-2.5">
      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">{label}</span>
      {/* Font Family (optional) */}
      {showFont && fontKey && (
        <select value={currentFont} onChange={(e) => onUpdate({ [fontKey]: e.target.value })}
          className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary">
          {availableFonts.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
      )}
      {/* Size */}
      <div className="flex gap-1">
        {sizes.map((s) => (
          <button key={s} onClick={() => onUpdate({ [sizeKey]: s })}
            className={`flex-1 py-1 rounded-lg border font-label text-[10px] font-bold uppercase transition-all ${currentSize === s ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
            {s.toUpperCase()}
          </button>
        ))}
      </div>
      {/* Custom px font-size (optional) */}
      {showFontSize && fontSizeKey && (
        <div className="flex items-center gap-2">
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline w-14">px</span>
          <input type="number" min={6} max={120} value={currentFontSize ?? ""} onChange={(e) => onUpdate({ [fontSizeKey]: e.target.value === "" ? undefined : Number(e.target.value) })}
            placeholder="auto"
            className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-primary" />
          {currentFontSize != null && (
            <button onClick={() => onUpdate({ [fontSizeKey]: undefined })} className="material-symbols-outlined text-outline text-sm hover:text-error">close</button>
          )}
        </div>
      )}
      {/* Line-Height (optional) */}
      {showLineHeight && lineHeightKey && (
        <div className="flex items-center gap-2">
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline w-14">Zeilen</span>
          <input type="range" min={0.8} max={2.0} step={0.05} value={currentLh ?? 1.2} onChange={(e) => onUpdate({ [lineHeightKey]: Number(e.target.value) })}
            className="flex-1" />
          <span className="font-label text-[10px] font-mono w-10 text-right">{(currentLh ?? 1.2).toFixed(2)}</span>
        </div>
      )}
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

// ─── Number-Slider Helper (für padding-y, line-height, opacity etc.) ────────
function NumberSlider({ label, min, max, step = 1, value, onChange, suffix }: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline flex-shrink-0 min-w-0">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1" />
      <span className="font-label text-[10px] font-mono w-12 text-right text-on-surface-variant">{value}{suffix ?? ""}</span>
    </div>
  );
}

// ─── Hex → rgba (für Bar-Hintergrund mit Opacity) ───────────────────────────
function hexToRgba(hex: string, opacityPercent: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.length === 3 ? clean[0] + clean[0] : clean.slice(0, 2), 16);
  const g = parseInt(clean.length === 3 ? clean[1] + clean[1] : clean.slice(2, 4), 16);
  const b = parseInt(clean.length === 3 ? clean[2] + clean[2] : clean.slice(4, 6), 16);
  const a = Math.max(0, Math.min(100, opacityPercent)) / 100;
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return hex;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Resolves bar values for image_choice tiles. Fallback chain: item → block → default.
function resolveBar(item: ChoiceItem, c: BlockContent) {
  return {
    padX: item.tile_bar_padding_x ?? (c.tile_bar_padding_x as number | undefined) ?? 6,
    padY: item.tile_bar_padding_y ?? (c.tile_bar_padding_y as number | undefined) ?? 4,
    height: item.tile_bar_height ?? (c.tile_bar_height as number | undefined),
    width: item.tile_bar_width ?? (c.tile_bar_width as number | undefined) ?? 100,
    radius: item.tile_bar_radius ?? (c.tile_bar_radius as number | undefined) ?? 0,
    bgColor: item.tile_bar_bg_color ?? (c.tile_bar_bg_color as string | undefined),
    opacity: item.tile_bar_bg_opacity ?? (c.tile_bar_bg_opacity as number | undefined) ?? 100,
  };
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

      {/* Background — available for all blocks */}
      <div>
        <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Hintergrund</label>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          <button onClick={() => onUpdate({ bg_color: undefined, bg_gradient: undefined })}
            className={`py-1.5 rounded-lg border font-label text-[10px] font-bold transition-all ${!(c.bg_color as string) && !(c.bg_gradient as string) ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
            Ohne
          </button>
          <button onClick={() => onUpdate({ bg_gradient: undefined, bg_color: (c.bg_color as string) || "#f3f4f6" })}
            className={`py-1.5 rounded-lg border font-label text-[10px] font-bold transition-all ${(c.bg_color as string) && !(c.bg_gradient as string) ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
            Farbe
          </button>
          <button onClick={() => onUpdate({ bg_color: undefined, bg_gradient: (c.bg_gradient as string) || gradientPresets[0].value })}
            className={`py-1.5 rounded-lg border font-label text-[10px] font-bold transition-all ${(c.bg_gradient as string) ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
            Verlauf
          </button>
        </div>
        {(c.bg_color as string) && !(c.bg_gradient as string) && (
          <div className="flex items-center gap-2">
            <input type="color" value={c.bg_color as string} onChange={(e) => onUpdate({ bg_color: e.target.value })}
              className="w-8 h-8 rounded-lg border border-outline-variant/20 cursor-pointer p-0.5" />
            <input type="text" value={c.bg_color as string} onChange={(e) => onUpdate({ bg_color: e.target.value })} placeholder="#f3f4f6"
              className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary" />
          </div>
        )}
        {(c.bg_gradient as string) && (
          <div className="grid grid-cols-3 gap-1.5">
            {gradientPresets.map((g) => (
              <button key={g.label} onClick={() => onUpdate({ bg_gradient: g.value })}
                className={`h-8 rounded-lg border-2 transition-all ${c.bg_gradient === g.value ? "border-primary scale-105" : "border-transparent"}`}
                style={{ background: g.value }} title={g.label} />
            ))}
          </div>
        )}
      </div>

      {/* Layout — Padding (4 values) & Gap */}
      <div>
        <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Layout</label>
        {/* Padding T/R/B/L */}
        <div className="bg-surface-container-low rounded-xl p-3 mb-2">
          <span className="font-label text-[10px] font-bold text-outline block mb-2">Padding (px)</span>
          <div className="grid grid-cols-4 gap-1.5">
            {(["t", "r", "b", "l"] as const).map((side) => {
              const key = `block_padding_${side}`;
              const labels = { t: "T", r: "R", b: "B", l: "L" };
              return (
                <div key={side} className="text-center">
                  <input type="number" min={0} max={80}
                    value={(c[key] as number) ?? ""}
                    onChange={(e) => onUpdate({ [key]: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-1.5 py-1.5 text-xs text-center focus:outline-none focus:border-primary" />
                  <span className="font-label text-[9px] text-outline mt-0.5 block">{labels[side]}</span>
                </div>
              );
            })}
          </div>
        </div>
        {/* Gap */}
        <div className="bg-surface-container-low rounded-xl p-3">
          <div className="flex items-center gap-2">
            <span className="font-label text-[10px] font-bold text-outline">Gap (px)</span>
            <input type="number" min={0} max={60} value={(c.block_gap as number) ?? ""} onChange={(e) => onUpdate({ block_gap: e.target.value ? Number(e.target.value) : undefined })} placeholder="0"
              className="w-16 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-primary" />
            <span className="font-label text-[9px] text-outline">Vertikaler Abstand</span>
          </div>
        </div>
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
          <TextStyleControls
            label="Kachel-Beschriftung"
            sizeKey="tile_label_size"
            colorKey="tile_label_color"
            alignKey="tile_label_align"
            fontKey="tile_label_font"
            lineHeightKey="tile_label_line_height"
            fontSizeKey="tile_label_font_size"
            content={c}
            onUpdate={onUpdate}
            showFont
            showLineHeight
            showFontSize
          />
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
          <TextStyleControls
            label="Kachel-Beschriftung"
            sizeKey="tile_label_size"
            colorKey="tile_label_color"
            alignKey="tile_label_align"
            fontKey="tile_label_font"
            lineHeightKey="tile_label_line_height"
            fontSizeKey="tile_label_font_size"
            content={c}
            onUpdate={onUpdate}
            showFont
            showLineHeight
            showFontSize
          />
          <div className="bg-surface-container-low rounded-xl p-3 space-y-2.5">
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Label-Bar (Standard für alle Kacheln)</span>
            <p className="font-label text-[9px] text-outline -mt-1">Klick auf eine Kachel im Preview, um nur diese eine zu ändern.</p>
            <NumberSlider
              label="Padding oben/unten"
              min={0}
              max={40}
              step={1}
              value={(c.tile_bar_padding_y as number | undefined) ?? 4}
              onChange={(v) => onUpdate({ tile_bar_padding_y: v })}
              suffix="px"
            />
            <NumberSlider
              label="Padding seitlich"
              min={0}
              max={40}
              step={1}
              value={(c.tile_bar_padding_x as number | undefined) ?? 6}
              onChange={(v) => onUpdate({ tile_bar_padding_x: v })}
              suffix="px"
            />
            <NumberSlider
              label="Höhe (px, leer = auto)"
              min={0}
              max={120}
              step={1}
              value={(c.tile_bar_height as number | undefined) ?? 0}
              onChange={(v) => onUpdate({ tile_bar_height: v === 0 ? undefined : v })}
              suffix="px"
            />
            <NumberSlider
              label="Breite"
              min={20}
              max={100}
              step={1}
              value={(c.tile_bar_width as number | undefined) ?? 100}
              onChange={(v) => onUpdate({ tile_bar_width: v })}
              suffix="%"
            />
            <NumberSlider
              label="Eckenradius"
              min={0}
              max={30}
              step={1}
              value={(c.tile_bar_radius as number | undefined) ?? 0}
              onChange={(v) => onUpdate({ tile_bar_radius: v })}
              suffix="px"
            />
            <NumberSlider
              label="Deckkraft"
              min={0}
              max={100}
              step={5}
              value={(c.tile_bar_bg_opacity as number | undefined) ?? 100}
              onChange={(v) => onUpdate({ tile_bar_bg_opacity: v })}
              suffix="%"
            />
            {/* Custom Bar-Farbe (Override für Branding-Farbe) */}
            <div className="flex items-center gap-2">
              <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline w-14">Farbe</span>
              <input
                type="color"
                value={(c.tile_bar_bg_color as string) || "#FFC107"}
                onChange={(e) => onUpdate({ tile_bar_bg_color: e.target.value })}
                className="w-8 h-8 rounded-lg border border-outline-variant/20 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={(c.tile_bar_bg_color as string) ?? ""}
                onChange={(e) => onUpdate({ tile_bar_bg_color: e.target.value })}
                placeholder="Branding (leer)"
                className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary"
              />
              {(c.tile_bar_bg_color as string) && (
                <button onClick={() => onUpdate({ tile_bar_bg_color: "" })} className="material-symbols-outlined text-outline text-sm hover:text-error">close</button>
              )}
            </div>
          </div>
        </>
      )}

      {/* CONTACT FORM */}
      {block.type === "contact_form" && (
        <>
          {field("Überschrift", c.headline ?? "", (v) => onUpdate({ headline: v }))}
          {field("CTA Button", c.cta_text ?? "", (v) => onUpdate({ cta_text: v }), "Bewerbung absenden →")}

          <div className="bg-surface-container-low rounded-xl p-3 space-y-2">
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Basis</span>
            {toggle("Name getrennt", "Vorname + Nachname statt Vollname", (c.show_name_split as boolean) ?? false, (v) => onUpdate({ show_name_split: v }))}
            {toggle("Stadt", "Feld 'Deine Stadt'", (c.show_city as boolean) ?? false, (v) => onUpdate({ show_city: v }))}
            {toggle("LinkedIn", "LinkedIn Profil-URL", (c.show_linkedin as boolean) ?? false, (v) => onUpdate({ show_linkedin: v }))}
            {toggle("Lebenslauf", "CV-Upload", (c.show_cv_upload as boolean) ?? true, (v) => onUpdate({ show_cv_upload: v }))}
          </div>

          <div className="bg-surface-container-low rounded-xl p-3 space-y-2">
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Bewerbungsrelevant</span>
            {toggle("Aktueller Jobtitel", "", (c.show_current_job as boolean) ?? false, (v) => onUpdate({ show_current_job: v }))}
            {toggle("Aktueller Arbeitgeber", "", (c.show_current_employer as boolean) ?? false, (v) => onUpdate({ show_current_employer: v }))}
            {toggle("Starttermin", "Frühester Starttermin", (c.show_start_date as boolean) ?? false, (v) => onUpdate({ show_start_date: v }))}
            {toggle("Gehaltsvorstellung", "", (c.show_salary as boolean) ?? false, (v) => onUpdate({ show_salary: v }))}
            {toggle("Berufserfahrung", "Jahre", (c.show_experience_years as boolean) ?? false, (v) => onUpdate({ show_experience_years: v }))}
            {toggle("Ausbildung", "Abschluss", (c.show_education as boolean) ?? false, (v) => onUpdate({ show_education: v }))}
            {toggle("Führerschein", "Ja/Nein", (c.show_drivers_license as boolean) ?? false, (v) => onUpdate({ show_drivers_license: v }))}
            {toggle("Reisebereitschaft", "", (c.show_travel as boolean) ?? false, (v) => onUpdate({ show_travel: v }))}
            {toggle("Umzugsbereitschaft", "", (c.show_relocate as boolean) ?? false, (v) => onUpdate({ show_relocate: v }))}
          </div>

          <div className="bg-surface-container-low rounded-xl p-3 space-y-2">
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Qualifikation</span>
            {toggle("Skills", "Hauptkompetenzen", (c.show_skills as boolean) ?? false, (v) => onUpdate({ show_skills: v }))}
            {toggle("Sprachen", "", (c.show_languages as boolean) ?? false, (v) => onUpdate({ show_languages: v }))}
            {toggle("Portfolio", "Website / GitHub", (c.show_portfolio as boolean) ?? false, (v) => onUpdate({ show_portfolio: v }))}
          </div>

          <div className="bg-surface-container-low rounded-xl p-3 space-y-2">
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Recruiting</span>
            {toggle("Wie gefunden", "Quelle", (c.show_source as boolean) ?? false, (v) => onUpdate({ show_source: v }))}
            {toggle("Positionsinteresse", "Dropdown", (c.show_position_interest as boolean) ?? false, (v) => onUpdate({ show_position_interest: v }))}
          </div>
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
          <div>
            <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Größe</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-label text-[10px] text-outline">Breite</span>
                <div className="flex items-center gap-1">
                  <input type="text" value={(c.img_width as string) ?? "100%"} onChange={(e) => onUpdate({ img_width: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <span className="font-label text-[10px] text-outline">Höhe</span>
                <div className="flex items-center gap-1">
                  <input type="text" value={(c.img_height as string) ?? "auto"} onChange={(e) => onUpdate({ img_height: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <span className="font-label text-[10px] text-outline">Max-Breite</span>
                <input type="text" value={(c.img_max_width as string) ?? "100%"} onChange={(e) => onUpdate({ img_max_width: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary" />
              </div>
              <div>
                <span className="font-label text-[10px] text-outline">Objekt-Anpassung</span>
                <select value={(c.img_fit as string) ?? "cover"} onChange={(e) => onUpdate({ img_fit: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary">
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </div>
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

      {/* FREE TEXT */}
      {block.type === "free_text" && (
        <>
          {field("Fragetext", (c.question as string) ?? "", (v) => onUpdate({ question: v }))}
          {field("Platzhalter", (c.placeholder as string) ?? "", (v) => onUpdate({ placeholder: v }), "Deine Antwort hier…")}
          {field("CTA Button", (c.cta as string) ?? "", (v) => onUpdate({ cta: v }), "Weiter →")}
          {toggle("Pflichtfeld", "Antwort ist erforderlich", (c.is_required as boolean) ?? true, (v) => onUpdate({ is_required: v }))}
        </>
      )}

      {/* ICON CARDS */}
      {block.type === "icon_cards" && (
        <>
          {field("Fragetext", c.question ?? "", (v) => onUpdate({ question: v }))}
          <div>
            <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Spalten</label>
            <div className="flex gap-2">
              {(["1", "2"] as const).map((n) => (
                <button key={n} onClick={() => onUpdate({ card_columns: n })}
                  className={`flex-1 py-2 rounded-xl border font-label text-xs font-bold transition-all ${(c.card_columns as string) === n ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
                  {n === "1" ? "1 Spalte" : "2 Spalten"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-label text-[10px] text-outline block mb-1">Kachel-Farbe</label>
              <div className="flex items-center gap-1">
                <input type="color" value={(c.card_bg as string) || "#22d3ee"} onChange={(e) => onUpdate({ card_bg: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-outline-variant/20 cursor-pointer p-0.5" />
                <input type="text" value={(c.card_bg as string) || ""} onChange={(e) => onUpdate({ card_bg: e.target.value })} placeholder="#22d3ee"
                  className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="font-label text-[10px] text-outline block mb-1">Icon/Text-Farbe</label>
              <div className="flex items-center gap-1">
                <input type="color" value={(c.card_icon_color as string) || "#ffffff"} onChange={(e) => onUpdate({ card_icon_color: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-outline-variant/20 cursor-pointer p-0.5" />
                <input type="text" value={(c.card_icon_color as string) || ""} onChange={(e) => onUpdate({ card_icon_color: e.target.value })} placeholder="#ffffff"
                  className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-label text-xs font-bold uppercase tracking-widest text-outline">Kacheln ({(c.items ?? []).length})</label>
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
        </>
      )}

      {/* VERTICAL TILES */}
      {block.type === "vertical_tiles" && (
        <>
          {field("Fragetext", c.question ?? "", (v) => onUpdate({ question: v }))}
          {toggle("Bild in Kachel", "Bild statt/zusätzlich zu Icon anzeigen", (c.show_vtile_image as boolean) ?? true, (v) => onUpdate({ show_vtile_image: v }))}

          <div className="bg-surface-container-low rounded-xl p-3 space-y-2.5">
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Kachel-Größe</span>
            <NumberSlider label="Höhe" min={48} max={160} step={1} value={(c.vtile_height as number | undefined) ?? 88} onChange={(v) => onUpdate({ vtile_height: v })} suffix="px" />
            <div className="flex items-center gap-2">
              <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline flex-shrink-0">Breite</span>
              <input type="text" value={(c.vtile_width as string) ?? "100%"} onChange={(e) => onUpdate({ vtile_width: e.target.value || undefined })} placeholder="100%"
                className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary" />
            </div>
            <NumberSlider label="Padding" min={4} max={32} step={1} value={(c.vtile_padding as number | undefined) ?? 16} onChange={(v) => onUpdate({ vtile_padding: v })} suffix="px" />
            <NumberSlider label="Eckenradius" min={0} max={32} step={1} value={(c.vtile_radius as number | undefined) ?? 16} onChange={(v) => onUpdate({ vtile_radius: v })} suffix="px" />
            <NumberSlider label="Bildgröße" min={16} max={80} step={1} value={(c.vtile_image_size as number | undefined) ?? 48} onChange={(v) => onUpdate({ vtile_image_size: v })} suffix="px" />
          </div>

          <TextStyleControls
            label="Titel-Typografie"
            sizeKey="vtile_label_size"
            colorKey="vtile_label_color"
            alignKey="vtile_label_align"
            fontKey="vtile_label_font"
            lineHeightKey="vtile_label_line_height"
            fontSizeKey="vtile_label_font_size"
            content={c}
            onUpdate={onUpdate}
            showFont
            showLineHeight
            showFontSize
          />

          <TextStyleControls
            label="Untertitel-Typografie"
            sizeKey="vtile_sublabel_size"
            colorKey="vtile_sublabel_color"
            alignKey="vtile_sublabel_align"
            fontKey="vtile_sublabel_font"
            lineHeightKey="vtile_sublabel_line_height"
            fontSizeKey="vtile_sublabel_font_size"
            content={c}
            onUpdate={onUpdate}
            showFont
            showLineHeight
            showFontSize
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-label text-[10px] text-outline block mb-1">Hintergrund</label>
              <div className="flex items-center gap-1">
                <input type="color" value={(c.vtile_bg as string) || "#ffffff"} onChange={(e) => onUpdate({ vtile_bg: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-outline-variant/20 cursor-pointer p-0.5" />
                <input type="text" value={(c.vtile_bg as string) || ""} onChange={(e) => onUpdate({ vtile_bg: e.target.value })} placeholder="#ffffff"
                  className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="font-label text-[10px] text-outline block mb-1">Rahmen</label>
              <div className="flex items-center gap-1">
                <input type="color" value={(c.vtile_border as string) || "#E5E7EB"} onChange={(e) => onUpdate({ vtile_border: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-outline-variant/20 cursor-pointer p-0.5" />
                <input type="text" value={(c.vtile_border as string) || ""} onChange={(e) => onUpdate({ vtile_border: e.target.value })} placeholder="#E5E7EB"
                  className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-label text-xs font-bold uppercase tracking-widest text-outline">Kacheln ({(c.items ?? []).length})</label>
              <button onClick={addItem} className="flex items-center gap-1 font-label text-xs font-bold text-primary hover:underline">
                <span className="material-symbols-outlined text-xs">add</span> Hinzufügen
              </button>
            </div>
            <div className="space-y-2">
              {(c.items ?? []).map((item, i) => (
                <div key={item.id} className="bg-surface-container-low rounded-xl p-2.5 border border-outline-variant/10 space-y-1.5">
                  <div className="flex gap-1.5 items-center">
                    <input value={item.label} onChange={(e) => updateItem(i, { label: e.target.value })} placeholder="Titel"
                      className="flex-1 bg-surface-container border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary" />
                    <button onClick={() => removeItem(i)} className="material-symbols-outlined text-outline hover:text-error text-sm">close</button>
                  </div>
                  <input value={item.sublabel ?? ""} onChange={(e) => updateItem(i, { sublabel: e.target.value })} placeholder="Untertitel (optional)"
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary" />
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-outline text-sm w-5 text-center">{item.icon || "circle"}</span>
                    <input value={item.icon} onChange={(e) => updateItem(i, { icon: e.target.value })} placeholder="Icon (z.B. school)"
                      className="flex-1 bg-surface-container border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary" />
                  </div>
                  {(c.show_vtile_image as boolean) && (
                    <ImageUpload value={item.image_url ?? ""} onChange={(v) => updateItem(i, { image_url: v })} aspect="square" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
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
      {/* Page Background */}
      <div>
        <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Hintergrund</label>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          <button onClick={() => onChange({ bg_color: undefined, bg_gradient: undefined })}
            className={`py-1.5 rounded-lg border font-label text-[10px] font-bold transition-all ${!branding.bg_color && !branding.bg_gradient ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
            Weiß
          </button>
          <button onClick={() => onChange({ bg_gradient: undefined, bg_color: branding.bg_color || "#f3f4f6" })}
            className={`py-1.5 rounded-lg border font-label text-[10px] font-bold transition-all ${branding.bg_color && !branding.bg_gradient ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
            Farbe
          </button>
          <button onClick={() => onChange({ bg_color: undefined, bg_gradient: branding.bg_gradient || gradientPresets[0].value })}
            className={`py-1.5 rounded-lg border font-label text-[10px] font-bold transition-all ${branding.bg_gradient ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
            Verlauf
          </button>
        </div>
        {branding.bg_color && !branding.bg_gradient && (
          <div className="flex items-center gap-2">
            <input type="color" value={branding.bg_color} onChange={(e) => onChange({ bg_color: e.target.value })}
              className="w-8 h-8 rounded-lg border border-outline-variant/20 cursor-pointer p-0.5" />
            <input type="text" value={branding.bg_color} onChange={(e) => onChange({ bg_color: e.target.value })} placeholder="#f3f4f6"
              className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary" />
          </div>
        )}
        {branding.bg_gradient && (
          <div className="grid grid-cols-3 gap-1.5">
            {gradientPresets.map((g) => (
              <button key={g.label} onClick={() => onChange({ bg_gradient: g.value })}
                className={`h-8 rounded-lg border-2 transition-all ${branding.bg_gradient === g.value ? "border-primary scale-105" : "border-transparent"}`}
                style={{ background: g.value }} title={g.label} />
            ))}
          </div>
        )}
      </div>

      {/* Content Width */}
      <div>
        <label className="font-label text-xs font-bold uppercase tracking-widest text-outline block mb-2">Inhaltsbreite (Desktop)</label>
        <div className="flex gap-1.5 mb-2">
          {[
            { label: "Schmal", value: "400px" },
            { label: "Normal", value: "520px" },
            { label: "Breit", value: "680px" },
            { label: "Voll", value: "100%" },
          ].map((w) => (
            <button key={w.value} onClick={() => onChange({ content_width: w.value })}
              className={`flex-1 py-1.5 rounded-lg border font-label text-[10px] font-bold transition-all ${(branding.content_width ?? "520px") === w.value ? "border-primary bg-primary-container/30 text-primary" : "border-outline-variant/20 text-on-surface-variant"}`}>
              {w.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="text" value={branding.content_width ?? "520px"} onChange={(e) => onChange({ content_width: e.target.value })} placeholder="520px"
            className="w-24 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-primary" />
          <span className="font-label text-[9px] text-outline">Mobil: automatisch 100%</span>
        </div>
      </div>
      {/* Preview */}
      <div className="border border-outline-variant/10 rounded-xl p-4 bg-surface-container-low">
        <p className="font-label text-xs text-outline uppercase tracking-widest mb-3">Button-Vorschau</p>
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
  const [activeImageItem, setActiveImageItem] = useState<ActiveImageItem>(null);
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

    // Sales-Consent-Validator: Sales-Funnels dürfen ohne dokumentiertes Opt-In
    // nicht gespeichert werden. Recruiting unverändert.
    if (funnel?.sales_program_id) {
      const consent = (funnel.consent_text ?? "").trim();
      if (consent.length < 30) {
        setSaveError(
          "Sales-Funnel: Consent-Text fehlt oder ist zu kurz (mind. 30 Zeichen). "
          + "Ohne dokumentiertes Opt-In darf kein Sales-Call getriggert werden."
        );
        setSaving(false);
        return;
      }
      const hasContactForm = pages.some((p) => p.blocks.some((b) => b.type === "contact_form"));
      if (!hasContactForm) {
        setSaveError("Sales-Funnel: Mindestens eine Seite mit 'contact_form'-Block erforderlich.");
        setSaving(false);
        return;
      }
    }

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

  async function unpublish() {
    await supabase.from("funnels").update({ status: "draft" }).eq("id", funnelId);
    setFunnel((f) => f ? { ...f, status: "draft" } : f);
  }

  function updateBlock(blockId: string, content: Partial<BlockContent>) {
    setPages((prev) => prev.map((p, i) => i !== selectedPageIdx ? p : {
      ...p, blocks: p.blocks.map((b) => b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b)
    }));
  }

  function updateImageItem(blockId: string, itemId: string, patch: Partial<ChoiceItem>) {
    setPages((prev) => prev.map((p, i) => i !== selectedPageIdx ? p : {
      ...p,
      blocks: p.blocks.map((b) => {
        if (b.id !== blockId) return b;
        const items = (b.content.items ?? []).map((it) => it.id === itemId ? { ...it, ...patch } : it);
        return { ...b, content: { ...b.content, items } };
      }),
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
                    <span className="font-label text-xs text-outline">{funnel.job_id ? "Job-ID" : "Sales-Program-ID"}</span>
                    <span className="font-label text-xs text-outline font-mono text-right break-all">{funnel.job_id ?? funnel.sales_program_id ?? "–"}</span>
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
            {funnel?.status === "active" ? (
              <button onClick={unpublish}
                className="flex items-center gap-1.5 bg-error-container text-error px-4 py-2 rounded-lg font-label text-xs font-bold uppercase tracking-widest hover:bg-error-container/80 transition-colors">
                <span className="material-symbols-outlined text-sm">wifi_tethering_off</span>
                Deaktivieren
              </button>
            ) : (
              <button onClick={publish}
                className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-lg font-label text-xs font-bold uppercase tracking-widest hover:bg-primary-dim transition-colors">
                <span className="material-symbols-outlined text-sm">wifi_tethering</span>
                Publizieren
              </button>
            )}
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
        <div className="flex-1 overflow-y-auto flex items-start justify-center py-8 px-6 bg-surface-container/50" onClick={() => { setSelectedBlockId(null); setShowBlockPicker(false); setActiveTextField(null); setActiveImageItem(null); }}>
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
              <div className={`overflow-y-auto ${previewMode === "desktop" ? "flex justify-center bg-gray-50" : ""}`}
                style={{ maxHeight: previewMode === "desktop" ? 640 : 580, background: branding.bg_gradient ?? branding.bg_color ?? "white" }}>
              <div className={previewMode === "desktop" ? `w-full min-h-full shadow-sm ${!branding.bg_gradient && !branding.bg_color ? "bg-white" : ""}` : ""}
                style={previewMode === "desktop" ? { maxWidth: (branding.content_width as string) || "400px" } : undefined}>

              {/* Logo */}
              {branding.logo_url && (
                <div className="flex items-center justify-center px-5 pt-3 pb-1">
                  <img src={branding.logo_url} alt="Logo" className="h-5 object-contain" />
                </div>
              )}

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
                      setActiveImageItem(null);
                    }}
                    activeItemId={activeImageItem?.blockId === block.id ? activeImageItem.itemId : null}
                    onItemClick={(itemId) => {
                      setActiveImageItem({ blockId: block.id, itemId });
                      setSelectedBlockId(block.id);
                      setActiveTextField(null);
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
              {activeImageItem && selectedBlock && selectedBlock.id === activeImageItem.blockId && (() => {
                const item = (selectedBlock.content.items ?? []).find((it) => it.id === activeImageItem.itemId);
                if (!item) return null;
                return (
                  <ImageItemPanel
                    item={item}
                    blockContent={selectedBlock.content}
                    onUpdate={(patch) => updateImageItem(selectedBlock.id, item.id, patch)}
                    onClose={() => setActiveImageItem(null)}
                  />
                );
              })()}
              {!activeImageItem && activeTextField && selectedBlock ? (
                <ElementPropertiesPanel
                  fieldKey={activeTextField.fieldKey}
                  content={selectedBlock.content}
                  onUpdate={(c) => updateBlock(selectedBlock.id, c)}
                  onClose={() => setActiveTextField(null)}
                />
              ) : !activeImageItem && selectedBlock ? (
                <PropertiesPanel block={selectedBlock} onUpdate={(c) => updateBlock(selectedBlock.id, c)} />
              ) : !activeImageItem && (
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
