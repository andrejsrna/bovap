-- Produkčný balík: metriky doručenia, idempotentné odoslanie, login rate limit.

-- Nové počítadlá kampane (FAILED oddelene od bounce; delivered + soft/hard bounce).
ALTER TABLE "Campaign" ADD COLUMN "recipientsFailed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Campaign" ADD COLUMN "statsDelivered" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Campaign" ADD COLUMN "statsSoftBounced" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Campaign" ADD COLUMN "statsHardBounced" INTEGER NOT NULL DEFAULT 0;

-- Párovanie Brevo eventov na príjemcu + časy doručenia/bounce.
ALTER TABLE "CampaignRecipient" ADD COLUMN "messageId" TEXT;
ALTER TABLE "CampaignRecipient" ADD COLUMN "deliveredAt" TIMESTAMP(3);
ALTER TABLE "CampaignRecipient" ADD COLUMN "bouncedAt" TIMESTAMP(3);

-- Idempotencia odoslania: jeden riadok na (kampaň, odberateľ).
-- Odstráni prípadné historické duplicity pred vytvorením unikátu.
DELETE FROM "CampaignRecipient" a USING "CampaignRecipient" b
WHERE a."campaignId" = b."campaignId"
  AND a."subscriberId" = b."subscriberId"
  AND a.id > b.id;
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_campaignId_subscriberId_key" UNIQUE ("campaignId", "subscriberId");
CREATE INDEX IF NOT EXISTS "CampaignRecipient_messageId_idx" ON "CampaignRecipient"("messageId");

-- Rate limit prihlásenia.
CREATE TABLE "LoginAttempt" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("key")
);
