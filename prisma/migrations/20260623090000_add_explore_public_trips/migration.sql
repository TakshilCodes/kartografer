ALTER TABLE "Trip"
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publicTitle" TEXT,
ADD COLUMN "publicDescription" TEXT,
ADD COLUMN "coverImageUrl" TEXT,
ADD COLUMN "destination" TEXT,
ADD COLUMN "durationDays" INTEGER,
ADD COLUMN "budgetStyle" TEXT,
ADD COLUMN "travelStyle" TEXT,
ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "copiedCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Trip_isPublic_idx" ON "Trip"("isPublic");
CREATE INDEX "Trip_destination_idx" ON "Trip"("destination");
CREATE INDEX "Trip_durationDays_idx" ON "Trip"("durationDays");
CREATE INDEX "Trip_budgetStyle_idx" ON "Trip"("budgetStyle");
CREATE INDEX "Trip_travelStyle_idx" ON "Trip"("travelStyle");
CREATE INDEX "Trip_publishedAt_idx" ON "Trip"("publishedAt");
CREATE INDEX "Trip_copiedCount_idx" ON "Trip"("copiedCount");