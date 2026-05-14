import twilio from "twilio";

// Generischer Twilio-Wrapper für SMS + WhatsApp.
// Env vars:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_PHONE_NUMBER_SMS    (oder Fallback TWILIO_PHONE_NUMBER für Sender)
//   TWILIO_WHATSAPP_NUMBER     (optional; wenn unset → WhatsApp-Channel skipped)
//
// Wenn TWILIO_WHATSAPP_NUMBER fehlt UND der Aufrufer WhatsApp in den channels
// hat, loggen wir WARN und überspringen still — SMS läuft trotzdem. Macht die
// Funktion sicher zum graceful-degraden während WhatsApp-Setup noch nicht steht.

export type Channel = "sms" | "whatsapp";

export type SendOfferLinkResult = {
  smsSid?: string;
  whatsappSid?: string;
  errors: { channel: Channel; message: string }[];
};

export async function sendOfferLink(opts: {
  toPhone: string; // E.164
  channels: Channel[];
  leadFirstName?: string;
  offerName: string;
  detailUrl: string;
  imageUrl?: string;
}): Promise<SendOfferLinkResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error(
      "Twilio-Env fehlt — TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN setzen",
    );
  }
  const client = twilio(sid, token);

  const result: SendOfferLinkResult = { errors: [] };
  const tasks: Promise<unknown>[] = [];

  if (opts.channels.includes("sms")) {
    tasks.push(
      sendSms(client, opts)
        .then((sid) => {
          result.smsSid = sid;
        })
        .catch((e: unknown) => {
          result.errors.push({ channel: "sms", message: extractErrorMessage(e) });
        }),
    );
  }

  if (opts.channels.includes("whatsapp")) {
    tasks.push(
      sendWhatsApp(client, opts)
        .then((sid) => {
          if (sid) result.whatsappSid = sid;
        })
        .catch((e: unknown) => {
          result.errors.push({ channel: "whatsapp", message: extractErrorMessage(e) });
        }),
    );
  }

  await Promise.allSettled(tasks);
  return result;
}

async function sendSms(
  client: ReturnType<typeof twilio>,
  opts: { toPhone: string; leadFirstName?: string; offerName: string; detailUrl: string },
): Promise<string> {
  const from = process.env.TWILIO_PHONE_NUMBER_SMS || process.env.TWILIO_PHONE_NUMBER;
  if (!from) {
    throw new Error(
      "TWILIO_PHONE_NUMBER_SMS (oder TWILIO_PHONE_NUMBER) fehlt",
    );
  }
  const body = composeBody(opts);
  const msg = await client.messages.create({ to: opts.toPhone, from, body });
  return msg.sid;
}

async function sendWhatsApp(
  client: ReturnType<typeof twilio>,
  opts: {
    toPhone: string;
    leadFirstName?: string;
    offerName: string;
    detailUrl: string;
    imageUrl?: string;
  },
): Promise<string | null> {
  const waSender = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!waSender) {
    console.warn(
      "[notifications/twilio] TWILIO_WHATSAPP_NUMBER nicht gesetzt — WhatsApp-Channel skipped",
    );
    return null;
  }

  // Twilio WhatsApp Production verlangt einen pre-approved Content-Template
  // OUTSIDE des 24h-Service-Windows. Free-Form-Messages funktionieren nur in
  // Sandbox-Mode (Lead muss vorher Join-Code an Sandbox-Nummer schicken).
  //
  // Wenn TWILIO_WHATSAPP_CONTENT_SID gesetzt ist → Template-Send mit Variablen.
  // Wenn nicht → Free-Form (klappt in Sandbox, scheitert in Production).
  const contentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID;
  const fromAddr = `whatsapp:${waSender}`;
  const toAddr = `whatsapp:${opts.toPhone}`;

  if (contentSid) {
    // Template-Variables-Reihenfolge muss mit dem im Twilio-Content-Builder
    // angelegten Template übereinstimmen. Default-Schema (1=name, 2=offerName,
    // 3=summary, 4=detailUrl) lässt sich anpassen indem TWILIO_WHATSAPP_CONTENT_SID
    // auf ein anderes Template zeigt.
    const contentVariables = JSON.stringify({
      "1": opts.leadFirstName?.trim() || "",
      "2": opts.offerName,
      "3": opts.detailUrl,
    });
    const msg = await client.messages.create({
      to: toAddr,
      from: fromAddr,
      contentSid,
      contentVariables,
    });
    return msg.sid;
  }

  // Fallback: Free-Form (Sandbox / 24h-Service-Window)
  const body = composeBody(opts);
  const msg = await client.messages.create({
    to: toAddr,
    from: fromAddr,
    body,
    ...(opts.imageUrl ? { mediaUrl: [opts.imageUrl] } : {}),
  });
  return msg.sid;
}

function composeBody(opts: {
  leadFirstName?: string;
  offerName: string;
  detailUrl: string;
}): string {
  const greet = opts.leadFirstName?.trim();
  const intro = greet
    ? `Hallo ${greet}, hier ist dein Top-Angebot:`
    : `Hier ist dein Top-Angebot:`;
  return `${intro}\n\n${opts.offerName}\n\n${opts.detailUrl}`;
}

function extractErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return JSON.stringify(e);
}
