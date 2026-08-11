-- Add structured email content cards.
ALTER TABLE "Campaign" ADD COLUMN "cards" TEXT NOT NULL DEFAULT '[]';
