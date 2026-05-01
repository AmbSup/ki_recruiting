import twilio from "twilio";

// Twilio-SMS-Helper. Reuses Twilio account creds from existing env vars.
// Required envs:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_PHONE_NUMBER_SMS  (Sender, E.164; kann gleich sein wie Voice-Number falls SMS-fähig)
//
// Wenn TWILIO_PHONE_NUMBER_SMS fehlt, fällt der Sender auf TWILIO_PHONE_NUMBER (Voice-Default)
// zurück — funktioniert nur, wenn die Voice-Nummer auch SMS unterstützt.

export async function sendBookingLinkSms(opts: {
  to: string; // E.164
  bookingLink: string;
  greeting?: string; // optional Vorname etc.
}): Promise<{ sid: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER_SMS || process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) {
    throw new Error(
      "Twilio-Env fehlt — TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER_SMS prüfen",
    );
  }
  const client = twilio(sid, token);
  const greet = opts.greeting?.trim();
  const body = greet
    ? `Hallo ${greet}, hier ist Ihr Buchungslink für unseren Termin: ${opts.bookingLink}`
    : `Hier ist Ihr Buchungslink für unseren Termin: ${opts.bookingLink}`;
  const msg = await client.messages.create({ to: opts.to, from, body });
  return { sid: msg.sid };
}
