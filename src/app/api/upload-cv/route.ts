import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriter } from "@/lib/auth/guards";

const MAX_SIZE = 10 * 1024 * 1024;
const UPLOADS_PER_HOUR = 10;
const MIME_BY_EXTENSION: Record<string, string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  jpg: ["image/jpeg"], jpeg: ["image/jpeg"], png: ["image/png"],
};

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")?.trim() || "unknown";
}

function hashIp(ip: string): string {
  const salt = process.env.UPLOAD_RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHash("sha256").update(`${ip}::${salt}`).digest("hex").slice(0, 32);
}

function hasExpectedMagic(buffer: Buffer, ext: string): boolean {
  if (ext === "pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (ext === "jpg" || ext === "jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (ext === "png") return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (ext === "docx") return buffer[0] === 0x50 && buffer[1] === 0x4b; // ZIP container; document parser validates structure later.
  return false;
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ error: "Multipart-Body erwartet" }, { status: 400 }); }

  const file = formData.get("file");
  const funnelId = formData.get("funnel_id")?.toString().trim();
  if (!(file instanceof File) || !funnelId) {
    return NextResponse.json({ error: "file und funnel_id erforderlich" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Datei muss zwischen 1 Byte und 10 MB gross sein" }, { status: 413 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedMime = MIME_BY_EXTENSION[ext];
  if (!allowedMime?.includes(file.type)) {
    return NextResponse.json({ error: "Dateiendung und MIME-Typ stimmen nicht ueberein" }, { status: 415 });
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasExpectedMagic(buffer, ext)) {
    return NextResponse.json({ error: "Dateiinhalt entspricht nicht dem angegebenen Format" }, { status: 415 });
  }

  const supabase = createAdminClient();
  const uploadId = crypto.randomUUID();
  const auth = await requireWriter();
  const isWriter = auth.ok;
  const path = `${isWriter ? "manual" : funnelId}/${uploadId}.${ext}`;
  const ipHash = hashIp(clientIp(req));
  if (!isWriter) {
    const { data: reserved, error: reserveError } = await supabase.rpc("reserve_cv_upload", {
      p_id: uploadId, p_funnel_id: funnelId, p_storage_path: path,
      p_ip_hash: ipHash, p_limit: UPLOADS_PER_HOUR,
    });
    if (reserveError) return NextResponse.json({ error: "Upload-Reservierung fehlgeschlagen" }, { status: 500 });
    if (!reserved) return NextResponse.json({ error: "Ungueltiger Funnel oder Upload-Limit erreicht" }, { status: 429 });
  }

  const { error: uploadError } = await supabase.storage.from("cvs").upload(path, buffer, {
    contentType: file.type, upsert: false,
  });
  if (uploadError) {
    if (!isWriter) await supabase.from("pending_cv_uploads").delete().eq("id", uploadId);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }
  return NextResponse.json({ url: `/api/cvs/${path}`, path, upload_id: uploadId });
}
