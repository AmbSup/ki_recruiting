"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  /** aspect ratio hint for preview: "square" | "wide" | "circle" */
  aspect?: "square" | "wide" | "circle";
};

export function ImageUpload({ value, onChange, label, placeholder = "https://…", aspect = "wide" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Nur Bilder erlaubt (JPG, PNG, WebP, GIF)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Datei zu groß (max. 5 MB)");
      return;
    }
    setError(null);
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("funnel-media")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("funnel-media").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  const previewClass = aspect === "circle"
    ? "w-16 h-16 rounded-full"
    : aspect === "square"
    ? "w-full rounded-xl aspect-square"
    : "w-full rounded-xl h-28";

  return (
    <div>
      {label && (
        <label className="font-label text-[10px] font-bold uppercase tracking-widest text-outline block mb-1.5">
          {label}
        </label>
      )}

      {/* Preview + Upload area */}
      <div
        className="relative group"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        {value ? (
          /* Image preview */
          <div className="relative">
            <img
              src={value}
              alt="Preview"
              className={`${previewClass} object-cover border border-outline-variant/20`}
            />
            {/* Overlay on hover */}
            <div className={`absolute inset-0 ${previewClass} bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2`}>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1 bg-white text-gray-900 rounded-lg px-2 py-1 text-[10px] font-bold hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-xs">upload</span>
                Ändern
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="flex items-center gap-1 bg-white text-red-500 rounded-lg px-2 py-1 text-[10px] font-bold hover:bg-red-50 transition-colors"
              >
                <span className="material-symbols-outlined text-xs">delete</span>
                Löschen
              </button>
            </div>
          </div>
        ) : (
          /* Upload dropzone */
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-outline-variant/30 rounded-xl py-5 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary-container/10 transition-colors disabled:opacity-60"
          >
            {uploading ? (
              <>
                <span className="material-symbols-outlined text-2xl text-outline animate-spin">progress_activity</span>
                <span className="font-label text-[10px] text-outline uppercase tracking-widest">Wird hochgeladen…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-2xl text-outline-variant">cloud_upload</span>
                <span className="font-label text-[10px] text-outline uppercase tracking-widest">Klicken oder ziehen</span>
                <span className="font-label text-[9px] text-outline-variant">JPG, PNG, WebP · max. 5 MB</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* URL input fallback */}
      <div className="mt-2 flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-3 py-1.5 font-body text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          title="Bild hochladen"
          className="flex-shrink-0 p-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <span className="material-symbols-outlined text-base text-outline animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-base text-outline">upload</span>
          )}
        </button>
      </div>

      {error && (
        <p className="font-label text-[10px] text-error mt-1">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
