import { prisma } from "@/lib/prisma";
import {
  renderCampaignHtml,
  parseCampaignCards,
} from "@/lib/campaign-content";
import { parseCampaignDocuments } from "@/lib/campaign-documents";

const BREVO_URL = "https://api.brevo.com/v3";
const CONCURRENCY = 5;
const BATCH_SIZE = 100;
const BREVO_TIMEOUT_MS = 20_000;

/** Zostaví prisma filter pre cieľových ACTIVE odberateľov (všetci alebo podľa skupín). */
export function targetWhere(allActive: boolean, groupNames: string[]): object {
  if (allActive) return { status: "ACTIVE" };
  if (groupNames.length) {
    return {
      status: "ACTIVE",
      groups: {
        some: {
          group: {
            name: { in: groupNames },
          },
        },
      },
    };
  }
  return { status: "ACTIVE", id: "-" };
}

async function getSender(): Promise<{ name: string; email: string }> {
  const [senderName, senderEmail] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "senderName" } }),
    prisma.setting.findUnique({ where: { key: "senderEmail" } }),
  ]);
  return {
    name: senderName?.value || "OZ BOVAP",
    email: senderEmail?.value || "noreply@bovap.sk",
  };
}

async function fetchBrevo(
  key: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; status: number; messageId?: string; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BREVO_TIMEOUT_MS);
  try {
    const res = await fetch(`${BREVO_URL}/smtp/email`, {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, status: res.status };
    let messageId: string | undefined;
    try {
      const data: unknown = await res.json();
      if (data && typeof data === "object") {
        const id = (data as Record<string, unknown>).messageId;
        if (typeof id === "string") messageId = id;
      }
    } catch {
      // Brevo nevrátilo JSON – odoslanie prebehlo, len nemáme messageId
    }
    return { ok: true, status: res.status, messageId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "network-error";
    return {
      ok: false,
      status: 0,
      error: /abort/i.test(msg) ? "timeout" : msg.slice(0, 180),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Spracuje dávku PENDING príjemcov kampane (perzistentná fronta v DB).
 *
 * Idempotentné + obnoviteľné: po reštarte/deployi stačí zavolať znova
 * (tlačidlo „Spracovať frontu", cron endpoint alebo retry akcia).
 * Timeout/chyba siete necháva príjemcu v PENDING na ďalší pokus;
 * FAILED je len zamietnutie zo strany Brevo API (HTTP 4xx/5xx).
 */
export async function processSendQueue(opts: {
  campaignId?: string;
  batchSize?: number;
}): Promise<{ processed: number; sent: number; failed: number; pendingLeft: number }> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return { processed: 0, sent: 0, failed: 0, pendingLeft: 0 };
  const batchSize = Math.min(Math.max(opts.batchSize ?? BATCH_SIZE, 1), 500);
  const appUrl = process.env.APP_URL ?? "https://mail.bovap.sk";
  const sender = await getSender();

  const scope = opts.campaignId
    ? { campaignId: opts.campaignId }
    : { campaign: { status: "SENDING" } };

  const batch = await prisma.campaignRecipient.findMany({
    where: { ...scope, status: "PENDING" },
    orderBy: { id: "asc" },
    take: batchSize,
    include: { subscriber: true, campaign: true },
  });
  if (!batch.length) {
    if (opts.campaignId) await finalizeIfDone(opts.campaignId);
    else {
      const sending = await prisma.campaign.findMany({
        where: { status: "SENDING" },
        select: { id: true },
      });
      for (const c of sending) await finalizeIfDone(c.id);
    }
    return { processed: 0, sent: 0, failed: 0, pendingLeft: 0 };
  }

  let sent = 0;
  let failed = 0;
  let i = 0;
  const run = async () => {
    while (true) {
      const idx = i++;
      if (idx >= batch.length) break;
      const r = batch[idx];
      if (!r.subscriber || !r.subscriber.email) {
        failed++;
        await prisma.campaignRecipient.update({
          where: { id: r.id },
          data: { status: "FAILED", error: "missing-email" },
        });
        continue;
      }
      const unsubscribeUrl = `${appUrl}/odhlasenie/${r.subscriber.unsubscribeToken}`;
      const result = await fetchBrevo(key, {
        sender,
        to: [{ email: r.subscriber.email }],
        subject: r.campaign.subject,
        htmlContent: renderCampaignHtml({
          title: r.campaign.title || r.campaign.subject,
          bodyText: r.campaign.bodyText,
          cards: parseCampaignCards(r.campaign.cards),
          documents: parseCampaignDocuments(r.campaign.documents),
          unsubscribeUrl,
        }),
        tags: ["bovap-newsletter"],
        headers: {
          "X-Mailin-custom": JSON.stringify({
            campaignId: r.campaignId,
            recipientId: r.id,
          }),
        },
      });
      if (result.ok) {
        sent++;
        await prisma.campaignRecipient.update({
          where: { id: r.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            error: null,
            messageId: result.messageId ?? undefined,
          },
        });
      } else if (result.status === 0) {
        // Timeout / sieť – ponechať PENDING na retry, len zaznamenať pokus.
        await prisma.campaignRecipient.update({
          where: { id: r.id },
          data: { error: result.error ?? "timeout" },
        });
      } else {
        failed++;
        await prisma.campaignRecipient.update({
          where: { id: r.id },
          data: { status: "FAILED", error: `HTTP ${result.status}` },
        });
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, run));

  const touchedIds: string[] = Array.from(
    new Set(batch.map((r) => r.campaignId)),
  );
  for (const campaignId of touchedIds) await finalizeIfDone(campaignId);

  const pendingLeft = await prisma.campaignRecipient.count({
    where: { ...scope, status: "PENDING" },
  });
  return { processed: batch.length, sent, failed, pendingLeft };
}

/** Prepočíta počty z DB a uzavrie kampaň, ak už nezostáva PENDING. */
async function finalizeIfDone(campaignId: string) {
  const [pending, sent, failed, campaign] = await Promise.all([
    prisma.campaignRecipient.count({
      where: { campaignId, status: "PENDING" },
    }),
    prisma.campaignRecipient.count({
      where: {
        campaignId,
        status: { in: ["SENT", "DELIVERED", "OPENED", "CLICKED"] },
      },
    }),
    prisma.campaignRecipient.count({ where: { campaignId, status: "FAILED" } }),
    prisma.campaign.findUnique({ where: { id: campaignId } }),
  ]);
  if (!campaign || campaign.status !== "SENDING") return;
  if (pending > 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { recipientsSent: sent, recipientsFailed: failed },
    });
    return;
  }
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: sent === 0 && failed > 0 ? "FAILED" : "SENT",
      sentAt: new Date(),
      recipientsSent: sent,
      recipientsFailed: failed,
    },
  });
}

/**
 * Kompatibilná obálka: odošle celú frontu kampane po dávkach.
 * Ponechaná pre existujúce volania; nové cesty používajú processSendQueue.
 */
export async function deliverCampaign(campaignId: string): Promise<void> {
  for (let guard = 0; guard < 100; guard++) {
    const { pendingLeft } = await processSendQueue({ campaignId });
    if (pendingLeft === 0) break;
  }
}
