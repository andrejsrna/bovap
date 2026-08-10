import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Admin účet
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@bovap.sk";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "bovap-admin-2026";
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hash,
      name: "BOVAP Admin",
      role: "admin",
    },
  });
  console.log(`✓ Admin: ${email}`);

  // Základné nastavenia
  const settings: Record<string, string> = {
    senderName: "Občianske združenie BOVAP",
    senderEmail: "info@bovap.sk",
    footerText:
      "Túto správu dostávate, pretože ste odoberateľom správ OZ BOVAP. Odhlásiť sa môžete kliknutím na odkaz nižšie.",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log("✓ Nastavenia");

  // Vzorkoví odoberatelia (dev náhľad; produkčný zoznam príde z migrácie centrum.sk)
  const samples = [
    { email: "priklad1@example.sk", name: "Vzorový Odoberateľ" },
    { email: "priklad2@example.sk", name: null },
    { email: "odhlaseny@example.sk", name: "Odhlásený Vzor" },
  ];
  for (const s of samples) {
    await prisma.subscriber.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        name: s.name,
        status: s.email === "odhlaseny@example.sk" ? "UNSUBSCRIBED" : "ACTIVE",
        source: "IMPORT",
        unsubscribeToken: crypto.randomUUID(),
      },
    });
  }
  console.log("✓ Vzorkoví odoberatelia (3)");

  // Vzorová kampaň (koncept)
  const campaignCount = await prisma.campaign.count();
  if (campaignCount === 0) {
    await prisma.campaign.create({
      data: {
        name: "Vitajte v BOVAP emailoch",
        subject: "Testovacia správa z nového rozhrania",
        title: "Vitajte!",
        bodyText:
          "Toto je vzorová kampaň. V editore prepíšete nadpis, text a pridáte fotku.",
        imageUrl: null,
        status: "DRAFT",
      },
    });
    console.log("✓ Vzorová kampaň");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
