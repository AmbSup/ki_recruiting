import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export const maxDuration = 60;

// GET: Meta-Webhook-Subscription-Handshake.
// Meta ruft mit ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=... auf.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200, headers: { "content-type": "text/plain" } });
  }
  return new Response("Forbidden", { status: 403 });
}

// POST: Meta Leadgen Event. Body-Signatur via x-hub-signature-256 verifizieren,
// dann raw nach ad_leads persistieren und an n8n-Matcher weiterreichen.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Signature-Verify (HMAC-SHA256 des raw Body mit App-Secret)
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    console.error("[meta-leadgen] META_APP_SECRET nicht konfiguriert");
    return NextResponse.json({ error: "Server misconfig" }, { status: 500 });
  }
  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  if (!safeEqual(signature, expected)) {
    console.warn("[meta-leadgen] Signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: MetaLeadgenPayload;
  try {
    payload = JSON.parse(rawBody) as MetaLeadgenPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const inserted: string[] = [];

  // Meta sendet ein Array von `entry`-Objekten, jedes mit `changes[]`
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "leadgen") continue;
      const v = change.value;
      if (!v?.leadgen_id) continue;

      // Meta gibt uns im Webhook nur IDs — die echten Feld-Werte müssen via
      // Graph API gezogen werden. Das macht n8n (kennt das User-Access-Token
      // und verwaltet Rate-Limits). Hier nur raw persistieren.
      const { data, error } = await supabase
        .from("ad_leads")
        .insert({
          meta_lead_id: v.leadgen_id,
          meta_form_id: v.form_id ?? null,
          raw_field_data: v,
          // ad_campaign_id kann hier noch null sein — Matcher setzt ihn nach
          // Graph-API-Lookup anhand form_id → sales_programs.meta_form_ids.
        })
        .select("id")
        .single();

      if (error) {
        // Duplicate leadgen_id ignorieren (Meta kann retryen)
        if ((error as { code?: string }).code !== "23505") {
          console.error("[meta-leadgen] ad_leads insert error:", error);
        }
        continue;
      }
      if (data) inserted.push(data.id);
    }
  }

  // Hand-Off an n8n-Matcher (fire-and-forget — Meta erwartet schnelle Antwort)
  const n8nBase = process.env.N8N_BASE_URL;
  if (n8nBase && inserted.length > 0) {
    void fetch(`${n8nBase}/webhook/meta-leadgen-matcher`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ad_lead_ids: inserted }),
    }).catch((err) => console.error("[meta-leadgen] n8n matcher trigger failed:", err));
  }

  return NextResponse.json({ received: inserted.length });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

// Meta-Webhook-Payload (vereinfacht — nur die Felder, die wir brauchen)
type MetaLeadgenPayload = {
  object?: string;
  entry?: {
    id?: string;
    time?: number;
    changes?: {
      field?: string;
      value?: {
        leadgen_id?: string;
        form_id?: string;
        page_id?: string;
        ad_id?: string;
        adgroup_id?: string;
        created_time?: number;
      };
    }[];
  }[];
};
