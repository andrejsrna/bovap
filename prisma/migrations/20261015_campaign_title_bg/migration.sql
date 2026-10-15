-- Farba pozadia hlavného titulku kampane (prázdne = bez pozadia).
ALTER TABLE "Campaign" ADD COLUMN "titleBg" TEXT NOT NULL DEFAULT '';
