import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getVideoR2Bucket, getVideoR2Client } from "@/lib/video-intake/r2";
import { getVideoToolSession, videoToolRequest } from "@/lib/video-intake/supabase";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 500 * 1024 * 1024;
const MAX_FILES = 8;

const fileSchema = z.object({
  name: z.string().min(1).max(180),
  size: z.number().int().positive().max(MAX_FILE_SIZE),
  type: z.string().max(100),
});

const startSchema = z.object({
  action: z.literal("start"),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(40),
  consent: z.literal(true),
  website: z.string().max(0).optional(),
  files: z.array(fileSchema).min(1).max(MAX_FILES),
});

const completeSchema = z.object({
  action: z.literal("complete"),
  projectId: z.string().uuid(),
  completionToken: z.string().min(20).max(5000),
  uploads: z.array(z.object({ key: z.string().min(1).max(500), label: z.string().min(1).max(180) })).min(1).max(MAX_FILES),
});

type CompletionPayload = { projectId: string; keys: string[]; expiresAt: number };

function signingSecret() {
  const secret = process.env.VIDEO_INTAKE_SIGNING_SECRET;
  if (!secret) throw new Error("Fehlende Server-Konfiguration: VIDEO_INTAKE_SIGNING_SECRET");
  return secret;
}

function signCompletion(payload: CompletionPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", signingSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyCompletion(token: string): CompletionPayload {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) throw new Error("Ungültiges Upload-Ticket.");
  const expected = createHmac("sha256", signingSecret()).update(encoded).digest();
  const supplied = Buffer.from(signature, "base64url");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) throw new Error("Ungültiges Upload-Ticket.");
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as CompletionPayload;
  if (payload.expiresAt < Date.now()) throw new Error("Das Upload-Ticket ist abgelaufen. Bitte starte den Upload erneut.");
  return payload;
}

function safeFileName(fileName: string) {
  const lower = fileName.toLowerCase();
  if (!lower.endsWith(".mp4")) throw new Error("Nur MP4-Videos werden unterstützt.");
  const stem = fileName
    .slice(0, -4)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "video";
  return `${stem}.mp4`;
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    if (raw?.action === "complete") return completeUpload(raw);

    const body = startSchema.parse(raw);
    const session = await getVideoToolSession();
    const projectName = `${body.name} – Video ${new Date().toLocaleDateString("de-AT")}`;

    const projects = await videoToolRequest<Array<{ id: string }>>(session, "projects?select=id", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ name: projectName, brand: "default", owner_id: session.userId, status: "new" }),
    });
    const projectId = projects[0]?.id;
    if (!projectId) throw new Error("Das Video-Projekt konnte nicht angelegt werden.");

    await videoToolRequest(session, "project_notes", {
      method: "POST",
      body: JSON.stringify({
        project_id: projectId,
        kind: "prompt",
        title: "Kundenkontakt",
        content: `Name: ${body.name}\nE-Mail: ${body.email}\nTelefon: ${body.phone}\nQuelle: app.neuronic-automation.ai/video`,
        sort_order: 0,
      }),
    });

    const r2 = getVideoR2Client();
    const bucket = getVideoR2Bucket();
    const uploads = await Promise.all(body.files.map(async (file) => {
      const label = safeFileName(file.name);
      const key = `${session.userId}/${projectId}/raw/${Date.now()}-${crypto.randomUUID()}-${label}`;
      const url = await getSignedUrl(r2, new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: "video/mp4",
        ContentLength: file.size,
      }), { expiresIn: 900 });
      return { url, key, label };
    }));

    const completionToken = signCompletion({ projectId, keys: uploads.map((upload) => upload.key), expiresAt: Date.now() + 60 * 60 * 1000 });
    return NextResponse.json({ projectId, uploads, completionToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Bitte prüfe deine Angaben und die ausgewählten Videos." }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload konnte nicht vorbereitet werden." }, { status: 500 });
  }
}

async function completeUpload(raw: unknown) {
  const body = completeSchema.parse(raw);
  const ticket = verifyCompletion(body.completionToken);
  const requestedKeys = body.uploads.map((upload) => upload.key);
  if (ticket.projectId !== body.projectId || requestedKeys.length !== ticket.keys.length || requestedKeys.some((key, index) => key !== ticket.keys[index])) {
    return NextResponse.json({ error: "Upload-Ticket und Dateien stimmen nicht überein." }, { status: 403 });
  }
  const session = await getVideoToolSession();
  const project = await videoToolRequest<Array<{ id: string; owner_id: string }>>(
    session,
    `projects?id=eq.${encodeURIComponent(body.projectId)}&select=id,owner_id&limit=1`,
    { method: "GET" },
  );
  if (!project[0] || project[0].owner_id !== session.userId) {
    return NextResponse.json({ error: "Projekt nicht gefunden." }, { status: 404 });
  }

  await videoToolRequest(session, "raw_media", {
    method: "POST",
    body: JSON.stringify(body.uploads.map((upload) => ({
      project_id: body.projectId,
      storage_key: upload.key,
      label: upload.label,
      kind: "video",
    }))),
  });
  return NextResponse.json({ ok: true, projectId: body.projectId });
}
