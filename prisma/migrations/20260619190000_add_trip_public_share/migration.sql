-- AlterTable
ALTER TABLE "Trip"
ADD COLUMN "isPublicShareEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publicShareSlug" TEXT,
ADD COLUMN "publicSharedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Trip_publicShareSlug_key" ON "Trip"("publicShareSlug");
