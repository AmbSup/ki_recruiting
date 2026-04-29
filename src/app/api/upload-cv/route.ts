import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Defense-in-depth gegen Mime-Mismatch + freundliche 415-Antwort. Browser-File-Type
// kommt als file.type — kein Server-side-Sniffing, daher reicht das für UX-Block.
// Legacy .doc (binär, application/msword) ist BEWUSST NICHT in der Liste —
// mammoth-DOCX-Extraction funktioniert nur mit .docx.
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
]);
const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "jpg", "jpeg", "png"]);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const funnelId = formData.get("funnel_id") as string | null;

  if (!file || !funnelId) {
    return NextResponse.json({ error: "file und funnel_id erforderlich" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const mimeOk = ALLOWED_MIME_TYPES.has(file.type);
  const extOk = ALLOWED_EXTENSIONS.has(ext);
  if (!mimeOk && !extOk) {
    return NextResponse.json(
      {
        error: "Format nicht unterstützt — bitte als PDF, DOCX, JPG oder PNG hochladen.",
        supported: ["PDF", "DOCX", "JPG", "PNG"],
        received: { mime: file.type, ext },
      },
      { status: 415 },
    );
  }
  const path = `${funnelId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from("cvs")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("cvs").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
