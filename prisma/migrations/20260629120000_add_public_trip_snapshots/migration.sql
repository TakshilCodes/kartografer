ALTER TABLE "Trip"
ADD COLUMN "publicSnapshotJson" JSONB,
ADD COLUMN "publicSnapshotUpdatedAt" TIMESTAMP(3),
ADD COLUMN "publicSnapshotContentUpdatedAt" TIMESTAMP(3);

CREATE INDEX "Trip_publicSnapshotUpdatedAt_idx" ON "Trip"("publicSnapshotUpdatedAt");
