"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
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

  if (!name || !subject) return { error: "Vyplňte názov a nadpis kampane." };

  const campaign = await prisma.campaign.create({
    data: { name, subject, title, bodyText, imageUrl, status: "DRAFT" },
  });
  redirect(`/kampane/${campaign.id}`);
}

// ---- Odoberatelia ----

export async function addSubscriberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Zadajte platnú emailovú adresu." };
  }

  await prisma.subscriber.upsert({
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
  redirect("/odberatelia");
}

// ---- Nastavenia ----

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
