import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

// Import odoberateľov regiónu "Západ" z data/zapad.csv
// Spustenie: DATABASE_URL=... npx tsx prisma/scripts/import-zapad.ts

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const lines = readFileSync("data/zapad.csv", "utf8")
    .split("\n")
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l && l !== "email");

  const emails = new Set(lines);
  console.log(`Vstup: ${emails.size} unikátnych adries`);

  // Skupina Západ
  const group = await prisma.group.upsert({
    where: { name: "Západ" },
    update: {},
    create: { name: "Západ" },
  });

  let created = 0;
  let existing = 0;
  for (const email of emails) {
    const sub = await prisma.subscriber.upsert({
      where: { email },
      update: {},
      create: {
        email,
        source: "IMPORT",
        status: "ACTIVE",
        unsubscribeToken: randomUUID(),
      },
    });
    if (sub.source === "IMPORT") created++;
    else existing++;

    await prisma.subscriberGroup.upsert({
      where: {
        subscriberId_groupId: { subscriberId: sub.id, groupId: group.id },
      },
      update: {},
      create: { subscriberId: sub.id, groupId: group.id },
    });
  }

  const totalSubs = await prisma.subscriber.count();
  const inGroup = await prisma.subscriberGroup.count({
    where: { groupId: group.id },
  });

  console.log(JSON.stringify(
    {
      novoVytvoreni: created,
      uzExistovali: existing,
      celkomOdoberatelia: totalSubs,
      skupina: { id: group.id, nazov: group.name, clenov: inGroup },
    },
    null,
    2,
  ));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
