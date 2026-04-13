"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type AdImage = {
  id: string;
  url: string;
  image_hash: string | null;
  label: string | null;
  ai_generated: boolean;
  created_at: string;
};

const STYLE_OPTIONS = ["Auto", "Büro", "Produktion", "Außendienst", "Team"];

type Props = {
  jobId: string;
  jobTitle: string;
  jobLocation?: string | null;
  selectedUrl?: string | null;
  onSelect?: (url: string) => void;
  onSelectForAds?: (url: string | null) => void;
};

export function JobAdImages({ jobId, jobTitle, jobLocation, selectedUrl, onSelect, onSelectForAds }: Props) {
  const [images, setImages] = useState<AdImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("Auto");
  const [error, setError] = useState<string | null>(null);
  const [savingSelect, setSavingSelect] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/jobs/${jobId}/images`);
    const json = await res.json();
    setImages(json.images ?? []);
    setLoading(false);
  }, [jobId]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style: selectedStyle === "Auto" ? undefined : selectedStyle }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fehler");
      setImages((prev) => [json.image, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Nur Bilder erlaubt"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Max. 5 MB"); return; }
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `job-images/${jobId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("funnel-media").upload(path, file, { upsert: false });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from("funnel-media").getPublicUrl(path);
      const { data: inserted } = await supabase
        .from("job_ad_images")
        .insert({ job_id: jobId, url: data.publicUrl, ai_generated: false })
        .select("id, url, image_hash, label, ai_generated, created_at")
        .single();
      if (inserted) setImages((prev) => [inserted as AdImage, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (e: React.MouseEvent, imageId: string, imageUrl: string) => {
    e.stopPropagation();
    const res = await fetch(`/api/jobs/${jobId}/images?image_id=${imageId}`, { method: "DELETE" });
    if (res.ok) {
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      // If deleted image was the selected one, clear selection
      if (imageUrl === selectedUrl) {
        await selectForAds(new MouseEvent("click") as unknown as React.MouseEvent, null);
      }
    }
  };

  const selectForAds = async (e: React.MouseEvent, url: string | null) => {
    e.stopPropagation();
    setSavingSelect(url ?? "__clear__");
    try {
      await fetch(`/api/jobs/${jobId}/images`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_ad_image_url: url }),
      });
      onSelectForAds?.(url);
    } finally {
      setSavingSelect(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Szene</span>
          <div className="flex gap-1">
            {STYLE_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStyle(s)}
                className={`px-3 py-1 rounded-full font-label text-xs font-bold transition-colors ${
                  selectedStyle === s
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 bg-surface-container-highest text-on-surface px-4 py-2 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">{uploading ? "hourglass_empty" : "upload"}</span>
            {uploading ? "Lädt…" : "Hochladen"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }}
          />

          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-xl font-label text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-sm ${generating ? "animate-spin" : ""}`}>
              {generating ? "progress_activity" : "auto_awesome"}
            </span>
            {generating ? "Generiert…" : "KI generieren"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-error-container/30 rounded-xl text-error font-label text-xs">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      {/* Image grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-surface-container-high animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-3">image</span>
          <p className="font-body text-sm text-on-surface-variant">Noch keine Ad-Bilder vorhanden.</p>
          <p className="font-body text-xs text-outline mt-1">Bild hochladen oder per KI generieren.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => {
            const isSelected = img.url === selectedUrl;
            return (
              <div key={img.id} className="flex flex-col gap-1.5">
                {/* Image */}
                <div
                  className={`relative aspect-square rounded-xl overflow-hidden bg-surface-container-high cursor-pointer ring-2 transition-all ${
                    isSelected ? "ring-primary shadow-lg" : "ring-transparent"
                  }`}
                  onClick={() => onSelect?.(img.url)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`Ad Bild – ${jobTitle}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Selected badge */}
                  {isSelected && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary rounded-full px-2 py-0.5">
                      <span className="material-symbols-outlined text-on-primary text-xs">check_circle</span>
                      <span className="font-label text-[9px] font-bold text-on-primary uppercase tracking-widest">Aktiv</span>
                    </div>
                  )}
                  {/* AI badge */}
                  {img.ai_generated && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-inverse-surface/70 rounded-full px-2 py-0.5">
                      <span className="material-symbols-outlined text-inverse-on-surface text-xs">auto_awesome</span>
                    </div>
                  )}
                </div>

                {/* Action bar — always visible */}
                <div className="flex gap-1.5">
                  <button
                    onClick={(e) => selectForAds(e, isSelected ? null : img.url)}
                    disabled={savingSelect === img.url}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg font-label text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 ${
                      isSelected
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-on-surface-variant hover:bg-primary hover:text-on-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {savingSelect === img.url ? "hourglass_empty" : isSelected ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    {isSelected ? "Aktiv" : "Wählen"}
                  </button>
                  <button
                    onClick={(e) => deleteImage(e, img.id, img.url)}
                    className="w-8 flex items-center justify-center rounded-lg bg-surface-container-high text-error hover:bg-error hover:text-on-error transition-colors"
                    title="Löschen"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {images.length > 0 && (
        <p className="font-label text-[10px] text-outline text-center">
          {images.length} {images.length === 1 ? "Bild" : "Bilder"} · Hover: auswählen oder löschen
        </p>
      )}
    </div>
  );
}
