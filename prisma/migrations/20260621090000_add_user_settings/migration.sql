-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'INR',
    "themePreference" "ThemePreference" NOT NULL DEFAULT 'SYSTEM',
    "defaultTripVisibility" "TripVisibility" NOT NULL DEFAULT 'PRIVATE',
    "enablePublicSharingByDefault" BOOLEAN NOT NULL DEFAULT false,
    "exportIncludeEstimatedBudget" BOOLEAN NOT NULL DEFAULT true,
    "exportIncludePlannedBudget" BOOLEAN NOT NULL DEFAULT true,
    "exportIncludeTravelerNotes" BOOLEAN NOT NULL DEFAULT true,
    "exportIncludeKartograferBranding" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "UserSettings_userId_idx" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;