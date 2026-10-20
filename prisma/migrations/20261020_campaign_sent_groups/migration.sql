-- Skupiny, ktorým už kampaň odišla (postupné odosielanie po regiónoch).
ALTER TABLE "Campaign" ADD COLUMN "sentGroups" TEXT NOT NULL DEFAULT '[]';
