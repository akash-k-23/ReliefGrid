import { createHmac, timingSafeEqual } from "node:crypto";

export const getSmsProviderName = () => ["twilio", "gateway"].includes(process.env.SMS_PROVIDER) ? process.env.SMS_PROVIDER : "mock";

export async function sendSms({ to, body, callbackUrl, idempotencyKey }) {
  const provider = getSmsProviderName();
  if (provider === "mock") return { provider, accepted: false, status: "MOCKED", providerMessageId: null };

  if (provider === "gateway") {
    const { SMS_GATEWAY_URL, SMS_GATEWAY_TOKEN, SMS_SENDER_ID, SMS_DLT_TEMPLATE_ID, SMS_DLT_ENTITY_ID } = process.env;
    if (!SMS_GATEWAY_URL || !SMS_GATEWAY_TOKEN || !SMS_SENDER_ID) throw new Error("SMS gateway URL, token, and registered sender ID are required");
    if (process.env.SMS_COUNTRY_CODE === "IN" && process.env.NODE_ENV === "production" && (!SMS_DLT_TEMPLATE_ID || !SMS_DLT_ENTITY_ID)) {
      throw new Error("SMS_DLT_TEMPLATE_ID and SMS_DLT_ENTITY_ID are required for production India SMS delivery");
    }
    const response = await fetch(SMS_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${SMS_GATEWAY_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        senderId: SMS_SENDER_ID,
        body,
        templateId: SMS_DLT_TEMPLATE_ID || null,
        entityId: SMS_DLT_ENTITY_ID || null,
        callbackUrl: callbackUrl || null,
        idempotencyKey: idempotencyKey || null,
      }),
    });
    if (!response.ok) throw new Error(`SMS gateway request failed with status ${response.status}`);
    const result = await response.json().catch(() => ({}));
    return { provider, accepted: true, status: "SENT", providerMessageId: result.messageId || result.id || null };
  }

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, SMS_SENDER_ID, SMS_DLT_TEMPLATE_ID, SMS_DLT_ENTITY_ID } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !SMS_SENDER_ID) throw new Error("Twilio credentials and a registered sender ID are required");
  if (process.env.SMS_COUNTRY_CODE === "IN" && process.env.NODE_ENV === "production" && (!SMS_DLT_TEMPLATE_ID || !SMS_DLT_ENTITY_ID)) {
    throw new Error("SMS_DLT_TEMPLATE_ID and SMS_DLT_ENTITY_ID are required for production India SMS delivery");
  }

  const payload = new URLSearchParams({ To: to, From: SMS_SENDER_ID, Body: body });
  if (callbackUrl) payload.set("StatusCallback", callbackUrl);
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload,
  });
  if (!response.ok) throw new Error(`Twilio request failed with status ${response.status}`);
  const result = await response.json();
  return { provider, accepted: true, status: "SENT", providerMessageId: result.sid || null };
}

export function verifyTwilioSignature(url, params, signature) {
  if (!process.env.TWILIO_AUTH_TOKEN || !signature) return false;
  const signedPayload = Object.keys(params).sort().reduce((value, key) => `${value}${key}${params[key]}`, url);
  const expected = createHmac("sha1", process.env.TWILIO_AUTH_TOKEN).update(signedPayload).digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(signature);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export function verifyGatewayWebhookToken(token) {
  const expected = process.env.SMS_GATEWAY_WEBHOOK_TOKEN || "";
  if (!expected || !token) return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(token);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}
