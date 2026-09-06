import { NextResponse } from "next/server";
import {
  applyBrevoEvent,
  normalizeBrevoEvent,
  parseCustomRef,
} from "@/lib/brevo-webhook";

/**
 * Brevo transakčný webhook: POST /api/webhooks/brevo?token=BREVO_WEBHOOK_SECRET
 * Eventy: delivered, opened, click, soft_bounce, hard_bounce, complaint,
 * unsubscribed, blocked, error. Párovanie cez X-Mailin-custom
 * ({campaignId, recipientId}), fallback message-id / email.
 */
export async function POST(req: Request) {
  const secret = process.env.BREVO_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook-off" }, { status: 503 });
  const url = new URL(req.url);
  if (url.searchParams.get("token") !== secret)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }
  const events = Array.isArray(body) ? body : [body];
  let applied = 0;
  let duplicate = 0;
  let unmatched = 0;
  for (const raw of events) {
    if (!raw || typeof raw !== "object") {
      unmatched++;
      continue;
    }
    const payload = raw as Record<string, unknown>;
    const event = normalizeBrevoEvent(payload);
    if (event === "IGNORED") {
      duplicate++;
      continue;
    }
    const ref = parseCustomRef(payload);
    const email =
      typeof payload.email === "string" ? payload.email : undefined;
    const messageId =
      typeof payload["message-id"] === "string"
        ? (payload["message-id"] as string)
        : undefined;
    const ts =
      typeof payload.ts_event === "number"
        ? new Date(payload.ts_event * 1000)
        : undefined;
    const result = await applyBrevoEvent({
      event,
      email,
      messageId,
      campaignId: ref.campaignId,
      recipientId: ref.recipientId,
      at: ts,
    });
    if (result === "applied") applied++;
    else if (result === "duplicate") duplicate++;
    else unmatched++;
  }
  return NextResponse.json({ applied, duplicate, unmatched });
}
