import { prisma } from "@/lib/prisma";
import {
  renderCampaignHtml,
  parseCampaignCards,
} from "@/lib/campaign-content";
import { parseCampaignDocuments } from "@/lib/campaign-documents";

const BREVO_URL = "https://api.brevo.com/v3";
const CONCURRENCY = 5;

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

/**
 * Odošle kampaň cez Brevo transakčný SMTP všetkým PENDING príjemcom.

 * Beží na pozadí (fire-and-forget po redirect-e) — takže veľké zoznamy
 * nespadil na timeout server actionu. Kampaň musí byť už SENDING s riadkami
 * CampaignRecipient vytvorenými. Na konci sa kampaň označí SENT (alebo FAILED,
 */
export async function deliverCampaign(campaignId: string): Promise<void> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return;
  const appUrl = process.env.APP_URL ?? "https://mail.bovap.sk";
  const sender = await getSender();;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      recipients: {
        where: { status: "PENDING" },
        include: { subscriber: true },
      },
    },
  });
  if (!campaign) return;
  const list = campaign.recipients.filter((r) => Boolean(r.subscriber.email));;
  const total = list.length;
  if (!total) { await markFinished(campaignId, 0, 0, true); return; }
  let sent =0, failed =0;
  let i =0;
  const run = async () => {
    while (true) {
      const idx = i++;
      if (idx >= total) break;
      const r = list[idx];;
      const unsubscribeUrl = `${appUrl}/odhlasenie/${r.subscriber.unsubscribeToken}`;
      try {
        const res = await fetch(`${BREVO_URL}/smtp/email`, {
          method: "POST",
          headers: { "api-key": key, "content-type": "application/json" },
          body: JSON.stringify({
            sender,
            to: [{ email: r.subscriber.email }],
            subject: campaign.subject,
            htmlContent: renderCampaignHtml({
              title: campaign.title || campaign.subject,
              bodyText: campaign.bodyText,
              cards: parseCampaignCards(campaign.cards),
              documents: parseCampaignDocuments(campaign.documents),
              unsubscribeUrl,
            }),
            tags: ["bovap-newsletter"],
          }),
        });
        if (res.ok) {
          sent++;
          await prisma.campaignRecipient.update({
            where: { id: r.id },
            data: { status: "SENT", sentAt: new Date(), error: null },
          });
        } else {
          failed++;
          await prisma.campaignRecipient.update({
            where: { id: r.id },
            data: { status: "FAILED", error: `HTTP ${res.status}` },
          });
        }
      } catch {
        failed++;
        await prisma.campaignRecipient.update({
          where: { id: r.id },
          data: { status: "FAILED", error: "timeout" },
        });
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, run));
  await markFinished(campaignId, sent, failed, false);
}

async function markFinished(
  campaignId: string,
  sent: number,
  failed: number,
  noneQueued: boolean,
): Promise<void> {
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: noneQueued || (sent === 0 && failed > 0) ? "FAILED" : "SENT",
      sentAt: new Date(),
      recipientsSent: sent,
      statsBounced: failed,
    },
  });
}