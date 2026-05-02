// Pure-Function-Helper: parsed eine vom Operator eingegebene Video-URL und
// gibt provider + embed_url + id zurück. Wird im Funnel-Editor (Properties-
// Panel) für Live-Provider-Erkennung genutzt UND im Funnel-Player für das
// Rendering.

export type VideoProvider = "youtube" | "vimeo" | "direct";

export type ParsedVideo = {
  provider: VideoProvider;
  embed_url: string;        // ist iframe-src für YouTube/Vimeo, video-src für direct
  video_id: string | null;  // null für direct
};

// YouTube: watch?v=, youtu.be/, embed/, shorts/
// 11-char Video-ID-Format ist YouTubes Standard.
const YT_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

// Vimeo: vimeo.com/{id} oder vimeo.com/video/{id} oder player.vimeo.com/video/{id}
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/;

export function parseVideoUrl(url: string | null | undefined): ParsedVideo {
  const u = (url ?? "").trim();
  if (!u) return { provider: "direct", embed_url: "", video_id: null };
  const yt = u.match(YT_RE);
  if (yt) {
    return {
      provider: "youtube",
      embed_url: `https://www.youtube.com/embed/${yt[1]}`,
      video_id: yt[1],
    };
  }
  const vi = u.match(VIMEO_RE);
  if (vi) {
    return {
      provider: "vimeo",
      embed_url: `https://player.vimeo.com/video/${vi[1]}`,
      video_id: vi[1],
    };
  }
  // Fallback: jede andere URL wird als direkte Video-Datei behandelt (MP4/WebM/HLS).
  return { provider: "direct", embed_url: u, video_id: null };
}

// Hübsches Provider-Label für UI-Anzeige.
export function providerLabel(p: VideoProvider): string {
  if (p === "youtube") return "YouTube";
  if (p === "vimeo") return "Vimeo";
  return "Direkt-Video";
}
