import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const emails = [...new Set(
    readFileSync("data/vychod.csv", "utf8")
      .split("\n")
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line && line !== "email"),
  )];
  const group = await prisma.group.upsert({
    where: { name: "Východ" },
    update: {},
    create: { name: "Východ" },
  });
  let created = 0;
  let existing = 0;
  let linked = 0;

  for (const email of emails) {
    const before = await prisma.subscriber.findUnique({ where: { email } });
    const subscriber = before ?? await prisma.subscriber.create({
      data: { email, source: "IMPORT", status: "ACTIVE", unsubscribeToken: randomUUID() },
    });
    if (before) existing++; else created++;

    const membership = await prisma.subscriberGroup.findUnique({
      where: { subscriberId_groupId: { subscriberId: subscriber.id, groupId: group.id } },
    });
    if (!membership) {
      await prisma.subscriberGroup.create({
        data: { subscriberId: subscriber.id, groupId: group.id },
      });
      linked++;
    }
  }

  console.log(JSON.stringify({
    vstup: emails.length,
    noví: created,
    užExistovali: existing,
    novoPriradeníDoVychod: linked,
    členovVychod: await prisma.subscriberGroup.count({ where: { groupId: group.id } }),
    celkomOdoberatelia: await prisma.subscriber.count(),
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
