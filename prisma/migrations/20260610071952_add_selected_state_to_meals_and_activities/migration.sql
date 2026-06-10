-- AlterTable
ALTER TABLE "MealSuggestion" ADD COLUMN     "isSelected" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "TripActivity" ADD COLUMN     "isSelected" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "MealSuggestion_isSelected_idx" ON "MealSuggestion"("isSelected");

-- CreateIndex
CREATE INDEX "TripActivity_isSelected_idx" ON "TripActivity"("isSelected");
