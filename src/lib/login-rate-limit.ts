import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minút
const LOCK_MS = 15 * 60 * 1000; // lockout 15 minút

const keyOf = (ip: string, email: string) =>
  `${ip.slice(0, 64)}|${email.slice(0, 128)}`;

/** Vráti čas odomknutia, ak je kombinácia IP+email práve zablokovaná. */
export async function loginLockedUntil(
  ip: string,
  email: string,
): Promise<Date | null> {
  const row = await prisma.loginAttempt.findUnique({
    where: { key: keyOf(ip, email) },
  });
  if (!row?.lockedUntil) return null;
  if (row.lockedUntil.getTime() <= Date.now()) return null;
  return row.lockedUntil;
}

/** Zaznamená neúspešný pokus; po prekročení limitu zamkne. */
export async function recordFailedLogin(ip: string, email: string) {
  const key = keyOf(ip, email);
  const now = Date.now();
  const row = await prisma.loginAttempt.findUnique({ where: { key } });
  const windowOpen =
    row && now - row.updatedAt.getTime() < WINDOW_MS ? row.attempts : 0;
  const attempts = windowOpen + 1;
  await prisma.loginAttempt.upsert({
    where: { key },
    update: {
      attempts,
      lockedUntil:
        attempts >= MAX_ATTEMPTS ? new Date(now + LOCK_MS) : undefined,
    },
    create: {
      key,
      attempts,
      lockedUntil:
        attempts >= MAX_ATTEMPTS ? new Date(now + LOCK_MS) : null,
    },
  });
}

/** Vymaže záznam po úspešnom prihlásení. */
export async function clearLoginAttempts(ip: string, email: string) {
  await prisma.loginAttempt.deleteMany({ where: { key: keyOf(ip, email) } });
}
