import { prisma } from "@/lib/prisma";

// Mapovanie Brevo transakčných eventov na lokálne stavy príjemcu.
// Zdroj: https://developers.brevo.com/docs/transactional-webhooks

export type NormalizedEvent =
  | "DELIVERED"
  | "OPENED"
  | "CLICKED"
  | "SOFT_BOUNCE"
  | "HARD_BOUNCE"
  | "COMPLAINT"
  | "UNSUBSCRIBED"
  | "BLOCKED"
  | "ERROR"
  | "IGNORED";

const MAP: Record<string, NormalizedEvent> = {
  delivered: "DELIVERED",
  opened: "OPENED",
  unique_opened: "OPENED",
  proxy_open: "OPENED",
  unique_proxy_open: "OPENED",
  click: "CLICKED",
  clicked: "CLICKED",
  soft_bounce: "SOFT_BOUNCE",
  hard_bounce: "HARD_BOUNCE",
  complaint: "COMPLAINT",
  spam: "COMPLAINT",
  unsubscribed: "UNSUBSCRIBED",
  unsubscribe: "UNSUBSCRIBED",
  blocked: "BLOCKED",
  invalid_email: "BLOCKED",
  deferred: "IGNORED",
  request: "IGNORED",
  sent: "IGNORED",
  error: "ERROR",
};

export function normalizeBrevoEvent(raw: unknown): NormalizedEvent {
  const name = String((raw as Record<string, unknown> | null)?.event ?? "")
    .trim()
    .toLowerCase();
  return MAP[name] ?? "IGNORED";
}

/** Skúsi vytiahnuť {campaignId, recipientId} z X-Mailin-custom hlavičky eventu. */
export function parseCustomRef(payload: Record<string, unknown>): {
  campaignId?: string;
  recipientId?: string;
} {
  const raw =
    payload["X-Mailin-custom"] ??
    payload["X-Mailin-Custom"] ??
    payload["x-mailin-custom"];
  if (typeof raw !== "string" || !raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const o = parsed as Record<string, unknown>;
      return {
        campaignId:
          typeof o.campaignId === "string" ? o.campaignId : undefined,
        recipientId:
          typeof o.recipientId === "string" ? o.recipientId : undefined,
      };
    }
  } catch {
    // nie JSON – ignorujeme, použije sa fallback párovanie
  }
  return {};
}

const RANK: Record<string, number> = {
  PENDING: 0,
  FAILED: 1,
  SENT: 2,
  DELIVERED: 3,
  OPENED: 4,
  CLICKED: 5,
  BOUNCED: 6,
};

function forwardOnly(current: string, next: string): boolean {
  return (RANK[next] ?? 0) > (RANK[current] ?? 0);
}

/**
 * Idempotentne zapíše Brevo event na príjemcu + agregáty kampane + status odberateľa.
 * Vracia "applied" | "duplicate" | "unmatched".
 */
export async function applyBrevoEvent(payload: {
  event: NormalizedEvent;
  email?: string;
  messageId?: string;
  campaignId?: string;
  recipientId?: string;
  at?: Date;
}): Promise<"applied" | "duplicate" | "unmatched"> {
  const at = payload.at ?? new Date();

  // 1) Najpresnejšie: priamy recipientId z X-Mailin-custom.
  let recipient = payload.recipientId
    ? await prisma.campaignRecipient.findUnique({
        where: { id: payload.recipientId },
        include: { subscriber: true },
      })
    : null;

  // 2) Fallback: message-id uložené pri odoslaní.
  if (!recipient && payload.messageId) {
    recipient = await prisma.campaignRecipient.findFirst({
      where: { messageId: payload.messageId },
      include: { subscriber: true },
    });
  }

  // 3) Fallback: email + najnovšia odosielaná/odoslaná kampaň.
  if (!recipient && payload.email) {
    const email = payload.email.toLowerCase();
    recipient = await prisma.campaignRecipient.findFirst({
      where: {
        subscriber: { email },
        status: { in: ["PENDING", "SENT", "DELIVERED", "OPENED", "CLICKED"] },
      },
      orderBy: { campaign: { createdAt: "desc" } },
      include: { subscriber: true },
    });
  }

  if (!recipient) return "unmatched";

  const campaign = await prisma.campaign.findUnique({
    where: { id: recipient.campaignId },
  });
  if (!campaign) return "unmatched";

  switch (payload.event) {
    case "DELIVERED": {
      if (recipient.status === "DELIVERED") return "duplicate";
      if (!forwardOnly(recipient.status, "DELIVERED")) return "duplicate";
      await prisma.$transaction([
        prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "DELIVERED", deliveredAt: at, error: null },
        }),
        prisma.campaign.update({
          where: { id: campaign.id },
          data: { statsDelivered: { increment: 1 } },
        }),
      ]);
      return "applied";
    }
    case "OPENED": {
      if (recipient.openedAt) return "duplicate";
      const data: Record<string, unknown> = { openedAt: at };
      if (forwardOnly(recipient.status, "OPENED")) {
        data.status = "OPENED";
        if (!recipient.deliveredAt) data.deliveredAt = at;
      }
      await prisma.$transaction([
        prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data,
        }),
        prisma.campaign.update({
          where: { id: campaign.id },
          data: { statsOpened: { increment: 1 } },
        }),
      ]);
      return "applied";
    }
    case "CLICKED": {
      if (recipient.clickedAt) return "duplicate";
      const data: Record<string, unknown> = { clickedAt: at };
      if (forwardOnly(recipient.status, "CLICKED")) {
        data.status = "CLICKED";
        if (!recipient.deliveredAt) data.deliveredAt = at;
        if (!recipient.openedAt) data.openedAt = at;
      }
      await prisma.$transaction([
        prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data,
        }),
        prisma.campaign.update({
          where: { id: campaign.id },
          data: { statsClicked: { increment: 1 } },
        }),
      ]);
      return "applied";
    }
    case "SOFT_BOUNCE": {
      if (recipient.status === "BOUNCED") return "duplicate";
      await prisma.$transaction([
        prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "BOUNCED", bouncedAt: at, error: "soft_bounce" },
        }),
        prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            statsBounced: { increment: 1 },
            statsSoftBounced: { increment: 1 },
          },
        }),
      ]);
      return "applied";
    }
    case "HARD_BOUNCE":
    case "BLOCKED":
    case "ERROR": {
      if (recipient.status === "BOUNCED") return "duplicate";
      const reason =
        payload.event === "HARD_BOUNCE"
          ? "hard_bounce"
          : payload.event === "BLOCKED"
            ? "blocked"
            : "error";
      await prisma.$transaction([
        prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "BOUNCED", bouncedAt: at, error: reason },
        }),
        prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            statsBounced: { increment: 1 },
            statsHardBounced: { increment: 1 },
          },
        }),
        prisma.subscriber.updateMany({
          where: { id: recipient.subscriberId, status: "ACTIVE" },
          data: { status: "BOUNCED" },
        }),
      ]);
      return "applied";
    }
    case "COMPLAINT": {
      await prisma.$transaction([
        prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { error: "complaint" },
        }),
        prisma.subscriber.updateMany({
          where: { id: recipient.subscriberId, status: "ACTIVE" },
          data: { status: "COMPLAINED" },
        }),
      ]);
      return "applied";
    }
    case "UNSUBSCRIBED": {
      const sub = await prisma.subscriber.findUnique({
        where: { id: recipient.subscriberId },
      });
      if (sub?.status !== "UNSUBSCRIBED") {
        await prisma.$transaction([
          prisma.subscriber.update({
            where: { id: recipient.subscriberId },
            data: { status: "UNSUBSCRIBED", unsubscribedAt: at },
          }),
          prisma.campaign.update({
            where: { id: campaign.id },
            data: { statsUnsub: { increment: 1 } },
          }),
        ]);
        return "applied";
      }
      return "duplicate";
    }
    default:
      return "duplicate";
  }
}
