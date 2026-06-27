import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

// Audio-Feedback-Upload für die Public Showcase-Page. Multipart-POST mit
//   audio:           Blob (audio/webm|ogg|mp4|mpeg)
//   bundle_slug:     string (existierender funnels.slug)
//   duration_seconds: number-string (Client-Schätzung, nicht autoritativ)
//
// Rate-Limit: 3 Submissions / Stunde pro IP-Hash. Keine IP wird gespeichert,
// nur SHA-256(ip + SALT). SALT = N8N_WEBHOOK_SECRET als convenience-secret
// damit kein neues Secret benötigt wird; falls das später getrennt soll →
// eigene Env-Var SHOWCASE_HASH_SALT.

const BUCKET = "showcase-feedback";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DURATION = 60; // Sekunden
const RATE_LIMIT_PER_HOUR = 3;

const ALLOWED_MIME = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
]);

function extOf(mime: string): string {
  if (mime.startsWith("audio/webm")) return "webm";
  if (mime.startsWith("audio/ogg")) return "ogg";
  if (mime.startsWith("audio/mp4")) return "mp4";
  if (mime.startsWith("audio/mpeg")) return "mp3";
  if (mime.startsWith("audio/wav")) return "wav";
  return "webm";
}

function hashIp(ip: string): string {
  const salt = process.env.N8N_WEBHOOK_SECRET ?? "showcase-default-salt";
  return crypto.createHash("sha256").update(`${ip}::${salt}`).digest("hex").slice(0, 32);
}

function clientIp(req: NextRequest): string {
  // Vercel/Edge: x-forwarded-for, getrennt durch Komma. Erstes Element = client.
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const first = xff.split(",")[0]?.trim();
  if (first) return first;
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Multipart-Body erwartet" }, { status: 400 });
  }

  const file = form.get("audio");
  const bundleSlug = (form.get("bundle_slug") ?? "").toString().trim();
  const durationRaw = (form.get("duration_seconds") ?? "").toString();
  const durationSec = Number.isFinite(Number(durationRaw)) ? Number(durationRaw) : null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Feld 'audio' fehlt" }, { status: 400 });
  }
  if (!bundleSlug) {
    return NextResponse.json({ error: "Feld 'bundle_slug' fehlt" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: `Audio-Format nicht erlaubt: ${file.type}` }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `Audio zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB) — max 5 MB.` },
      { status: 413 },
    );
  }
  if (durationSec != null && durationSec > MAX_DURATION + 5) {
    return NextResponse.json(
      { error: `Audio zu lang (${durationSec}s) — max ${MAX_DURATION}s.` },
      { status: 413 },
    );
  }

  const supabase = createAdminClient();

  // Bundle existiert?
  const { data: funnel } = await supabase
    .from("funnels")
    .select("slug")
    .eq("slug", bundleSlug)
    .maybeSingle();
  if (!funnel) {
    return NextResponse.json({ error: "Bundle nicht gefunden" }, { status: 404 });
  }

  // Rate-Limit
  const ipHash = hashIp(clientIp(req));
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("showcase_feedback")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneHourAgo);
  if ((recentCount ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return NextResponse.json(
      { error: "Zu viele Feedbacks in der letzten Stunde. Bitte später nochmal." },
      { status: 429 },
    );
  }

  // Upload
  const id = crypto.randomUUID();
  const path = `${id}.${extOf(file.type)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (uploadErr) {
    return NextResponse.json({ error: `Upload fehlgeschlagen: ${uploadErr.message}` }, { status: 500 });
  }

  const { error: insertErr } = await supabase.from("showcase_feedback").insert({
    id,
    bundle_slug: bundleSlug,
    audio_storage_path: path,
    duration_seconds: durationSec,
    content_type: file.type,
    size_bytes: file.size,
    user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    ip_hash: ipHash,
  });
  if (insertErr) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    return NextResponse.json({ error: `DB-Insert fehlgeschlagen: ${insertErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, id });
}
