"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parseTestRecipients, validGroupName } from "@/lib/settings-input";
import { parseCampaignCards, renderCampaignHtml } from "@/lib/campaign-content";
import { campaignDraftInput } from "@/lib/campaign-edit";
import { attachCampaignDocuments, attachPdfLinks } from "@/lib/r2-pdf";
import { parseCampaignDocuments } from "@/lib/campaign-documents";
import { subscriberGroupInput } from "@/lib/subscriber-query";
import { deliverCampaign, targetWhere } from "@/lib/campaign-send";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session-token";

export type ActionState = { error?: string } | undefined;

// ---- Auth ----

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Vyplňte email aj heslo." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Nesprávny email alebo heslo." };
  }

  const store = await cookies();
  // Preview beží cez HTTP; produkčné mail.bovap.sk cez HTTPS.
  // Secure cookie sa cez HTTP neposiela, takže by proxy vrátila login.
  const requestHeaders = await headers();
  const isHttps = requestHeaders.get("x-forwarded-proto") === "https";
  store.set(SESSION_COOKIE_NAME, await createSessionToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  redirect("/");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

// ---- Kampane ----

export async function createCampaignAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const bodyText = String(formData.get("bodyText") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;
  const cards = parseCampaignCards(String(formData.get("cards") ?? "[]"));

  if (!name || !subject) return { error: "Vyplňte názov a nadpis kampane." };

  const campaign = await prisma.campaign.create({
    data: { name, subject, title, bodyText, cards: JSON.stringify(cards), imageUrl, status: "DRAFT" },
  });
  try {
    const cardsWithPdfs = await attachPdfLinks(cards, formData, campaign.id);
    const documents = await attachCampaignDocuments([], formData, campaign.id);
    if (cardsWithPdfs.some((card, index) => card.url !== cards[index]?.url) || documents.length) await prisma.campaign.update({ where: { id: campaign.id }, data: { cards: JSON.stringify(cardsWithPdfs), documents: JSON.stringify(documents) } });
  } catch {
    redirect(`/kampane/${campaign.id}?uploadError=1`);
  }
  redirect(`/kampane/${campaign.id}`);
}

export async function updateCampaignAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const input = campaignDraftInput(formData);
  if (!id || !input) redirect(`/kampane/${id}/upravit?error=1`);
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign || campaign.status !== "DRAFT") redirect(`/kampane/${id}`);
  try {
    const cards = await attachPdfLinks(parseCampaignCards(input.cards), formData, id);
    const documents = await attachCampaignDocuments(parseCampaignDocuments(String(formData.get("documents") ?? "[]")), formData, id);
    await prisma.campaign.update({ where: { id }, data: { ...input, cards: JSON.stringify(cards), documents: JSON.stringify(documents) } });
  } catch {
    redirect(`/kampane/${id}/upravit?uploadError=1`);
  }
  redirect(`/kampane/${id}?saved=1`);
}

export async function sendCampaignTestAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  const setting = await prisma.setting.findUnique({ where: { key: "testRecipients" } });
  const recipients = parseTestRecipients(setting?.value ?? "");
  const apiKey = process.env.BREVO_API_KEY;
  if (!campaign || !recipients.length || !apiKey) redirect(`/kampane/${id}?testError=1`);

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const [senderName, senderEmail] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "senderName" } }),
    prisma.setting.findUnique({ where: { key: "senderEmail" } }),
  ]);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      sender: { name: senderName?.value || "OZ BOVAP", email: senderEmail?.value || "noreply@bovap.sk" },
      to: recipients.map((email) => ({ email })),
      subject: `[TEST] ${campaign.subject}`,
      htmlContent: renderCampaignHtml({ title: campaign.title || campaign.subject, bodyText: campaign.bodyText, cards: parseCampaignCards(campaign.cards), documents: parseCampaignDocuments(campaign.documents), unsubscribeUrl: `${appUrl}/odhlasenie/ukazka` }),
    }),
  });
  if (!response.ok) redirect(`/kampane/${id}?testError=1`);
  redirect(`/kampane/${id}?testSent=${recipients.length}`);
}

// ---- Ostré odoslanie (newsletter) ----

export async function sendCampaignAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign || campaign.status !== "DRAFT") redirect(`/kampane/${id}`);
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) redirect(`/kampane/${id}?sendError=1`);

    const allActive = formData.get("allActive") === "1";
    const groupNames = subscriberGroupInput(String(formData.get("groups") ?? ""));
    const subscribers = await prisma.subscriber.findMany({
      where: targetWhere(allActive, groupNames),
      select: { id: true, email: true },
    });
   if (!subscribers.length) redirect(`/kampane/${id}?sendError=2`);

  // Zablokovať opätovné odoslanie a vytvoriť príjemcov atomicky
  await prisma.$transaction([
    prisma.campaign.update({
      where: { id },
      data: { status: "SENDING", recipientsTarget: subscribers.length },
    }),
    ...subscribers.map((s) =>
      prisma.campaignRecipient.create({
        data: { campaignId: id, subscriberId: s.id, status: "PENDING" },
      }),
    ),
  ]);

  // Odošleme na pozadí — vrátime odpoveď hneď, aby request nespadil na timeout
  void deliverCampaign(id);

  redirect(`/kampane/${id}?sending=1`);
}

export async function addSubscriberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const groupNames = subscriberGroupInput(String(formData.get("groups") ?? ""));
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Zadajte platnú emailovú adresu." };
  }

  const subscriber = await prisma.subscriber.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      source: "MANUAL",
      status: "ACTIVE",
      unsubscribeToken: crypto.randomUUID(),
    },
  });
  if (groupNames.length) {
    await prisma.$transaction(async (tx) => {
      for (const groupName of groupNames) {
        const group = await tx.group.upsert({ where: { name: groupName }, update: {}, create: { name: groupName } });
        await tx.subscriberGroup.upsert({
          where: { subscriberId_groupId: { subscriberId: subscriber.id, groupId: group.id } },
          update: {},
          create: { subscriberId: subscriber.id, groupId: group.id },
        });
      }
    });
  }
  redirect("/odberatelia");
}

export async function updateSubscriberAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "ACTIVE");
  const groupNames = Array.from(new Set(
    String(formData.get("groups") ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  ));
  const validStatuses = ["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "COMPLAINED"];

  if (!id || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/odberatelia");
  }
  if (!validStatuses.includes(status)) redirect(`/odberatelia/${id}`);

  await prisma.$transaction(async (tx) => {
    const groups = await Promise.all(
      groupNames.map((name) => tx.group.upsert({ where: { name }, update: {}, create: { name } })),
    );
    await tx.subscriber.update({
      where: { id },
      data: {
        email,
        name,
        status,
        unsubscribedAt: status === "UNSUBSCRIBED" ? new Date() : null,
        groups: {
          deleteMany: {},
          create: groups.map((group) => ({ groupId: group.id })),
        },
      },
    });
  });
  redirect(`/odberatelia/${id}?saved=1`);
}

export async function deleteSubscriberAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/odberatelia");
  await prisma.subscriber.delete({ where: { id } });
  redirect("/odberatelia?deleted=1");
}

// ---- Nastavenia ----

export async function saveTestRecipientsAction(formData: FormData) {
  const recipients = parseTestRecipients(String(formData.get("testRecipients") ?? ""));
  await prisma.setting.upsert({
    where: { key: "testRecipients" },
    update: { value: recipients.join(", ") },
    create: { key: "testRecipients", value: recipients.join(", ") },
  });
  redirect("/nastavenia?testSaved=1");
}

export async function createGroupAction(formData: FormData) {
  const name = validGroupName(String(formData.get("name") ?? ""));
  if (name) await prisma.group.upsert({ where: { name }, update: {}, create: { name } });
  redirect("/nastavenia?groupSaved=1");
}

export async function deleteGroupAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/nastavenia");
  const count = await prisma.subscriberGroup.count({ where: { groupId: id } });
  if (count) redirect("/nastavenia?groupError=occupied");
  await prisma.group.delete({ where: { id } });
  redirect("/nastavenia?groupDeleted=1");
}

export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const values = {
    senderName: String(formData.get("senderName") ?? "").trim(),
    senderEmail: String(formData.get("senderEmail") ?? "").trim(),
    footerText: String(formData.get("footerText") ?? "").trim(),
  };

  for (const [key, value] of Object.entries(values)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  redirect("/nastavenia");
}

// ---- Odhlásenie (verejné) ----

export async function unsubscribeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Chýba token odhlásenia." };

  const result = await prisma.subscriber.updateMany({
    where: { unsubscribeToken: token, status: "ACTIVE" },
    data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
  });
  if (result.count === 0) return { error: "Táto adresa už nie je aktívnym odberateľom." };
  redirect(`/odhlasenie/${token}?done=1`);
}
