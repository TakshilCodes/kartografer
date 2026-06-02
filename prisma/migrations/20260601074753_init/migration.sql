-- CreateEnum
CREATE TYPE "PlaceProvider" AS ENUM ('GEOAPIFY', 'MAPBOX', 'GOOGLE', 'NOMINATIM', 'MANUAL');

-- CreateEnum
CREATE TYPE "TripVisibility" AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('DRAFT', 'GENERATED', 'EDITING', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('FAMILY', 'SOLO', 'COUPLE', 'FRIENDS', 'BUSINESS', 'ADVENTURE', 'RELIGIOUS', 'LUXURY', 'BUDGET', 'OTHER');

-- CreateEnum
CREATE TYPE "TravelPace" AS ENUM ('RELAXED', 'BALANCED', 'FAST');

-- CreateEnum
CREATE TYPE "FoodPreference" AS ENUM ('VEGETARIAN', 'VEGAN', 'NON_VEGETARIAN', 'JAIN', 'NO_PREFERENCE');

-- CreateEnum
CREATE TYPE "TransportPreference" AS ENUM ('FLIGHT', 'TRAIN', 'BUS', 'CAB', 'SELF_DRIVE', 'MIXED', 'NO_PREFERENCE');

-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('SIGHTSEEING', 'ADVENTURE', 'FOOD', 'SHOPPING', 'RELAXATION', 'CULTURE', 'RELIGIOUS', 'NATURE', 'TRANSPORT_BREAK', 'HIDDEN_SPOT', 'OTHER');

-- CreateEnum
CREATE TYPE "ItemSource" AS ENUM ('AI_GENERATED', 'USER_ADDED', 'AI_EDITED', 'CLONED');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('FLIGHT', 'TRAIN', 'BUS', 'CAB', 'SELF_DRIVE', 'WALK', 'BIKE', 'FERRY', 'METRO', 'MIXED', 'OTHER');

-- CreateEnum
CREATE TYPE "CostType" AS ENUM ('PER_PERSON', 'TOTAL');

-- CreateEnum
CREATE TYPE "StayType" AS ENUM ('HOTEL', 'RESORT', 'HOMESTAY', 'HOUSEBOAT', 'HOSTEL', 'VILLA', 'CAMP', 'GUEST_HOUSE', 'OTHER');

-- CreateEnum
CREATE TYPE "BudgetLevel" AS ENUM ('BUDGET', 'MID_RANGE', 'PREMIUM', 'LUXURY');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('UNDER_BUDGET', 'SLIGHTLY_OVER', 'OVER_BUDGET', 'BUDGET_FRIENDLY', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ChatRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AiProposalStatus" AS ENUM ('NONE', 'PENDING', 'APPLIED', 'DISCARDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "hashedPassword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "provider" "PlaceProvider" NOT NULL,
    "providerPlaceId" TEXT,
    "name" TEXT NOT NULL,
    "formattedName" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "countryCode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromPlaceId" TEXT,
    "toPlaceId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "slug" TEXT,
    "publicSlug" TEXT,
    "daysCount" INTEGER NOT NULL,
    "peopleCount" INTEGER NOT NULL,
    "budgetAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "tripType" "TripType" NOT NULL DEFAULT 'OTHER',
    "travelPace" "TravelPace" NOT NULL DEFAULT 'BALANCED',
    "foodPreference" "FoodPreference" NOT NULL DEFAULT 'NO_PREFERENCE',
    "transportPreference" "TransportPreference" NOT NULL DEFAULT 'MIXED',
    "specialNotes" TEXT,
    "visibility" "TripVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "TripStatus" NOT NULL DEFAULT 'DRAFT',
    "isAiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "originalTripId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripDay" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3),
    "estimatedCost" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripActivity" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "tripDayId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "locationName" TEXT,
    "address" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "durationMinutes" INTEGER,
    "category" "ActivityCategory" NOT NULL DEFAULT 'OTHER',
    "estimatedCost" DECIMAL(12,2),
    "source" "ItemSource" NOT NULL DEFAULT 'USER_ADDED',
    "notes" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportOption" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "tripDayId" TEXT,
    "title" TEXT NOT NULL,
    "mode" "TransportMode" NOT NULL DEFAULT 'OTHER',
    "fromText" TEXT,
    "toText" TEXT,
    "description" TEXT,
    "costType" "CostType" NOT NULL DEFAULT 'TOTAL',
    "pricePerPerson" DECIMAL(12,2),
    "totalCost" DECIMAL(12,2),
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "source" "ItemSource" NOT NULL DEFAULT 'USER_ADDED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StayOption" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "tripDayId" TEXT,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "area" TEXT,
    "stayType" "StayType" NOT NULL DEFAULT 'OTHER',
    "budgetLevel" "BudgetLevel" NOT NULL DEFAULT 'MID_RANGE',
    "pricePerNight" DECIMAL(12,2),
    "nights" INTEGER,
    "totalCost" DECIMAL(12,2),
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "bestFor" TEXT,
    "source" "ItemSource" NOT NULL DEFAULT 'USER_ADDED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StayOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealSuggestion" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "tripDayId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "title" TEXT NOT NULL,
    "locationName" TEXT,
    "estimatedCost" DECIMAL(12,2),
    "source" "ItemSource" NOT NULL DEFAULT 'USER_ADDED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MealSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripCostBreakdown" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "transportCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "stayCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "foodCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "activityCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "miscCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalEstimatedCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "userBudget" DECIMAL(12,2),
    "budgetStatus" "BudgetStatus" NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripCostBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripChatMessage" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "proposedChangesJson" JSONB,
    "changeSummary" TEXT,
    "costImpact" DECIMAL(12,2),
    "status" "AiProposalStatus" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Place_name_idx" ON "Place"("name");

-- CreateIndex
CREATE INDEX "Place_city_idx" ON "Place"("city");

-- CreateIndex
CREATE INDEX "Place_state_idx" ON "Place"("state");

-- CreateIndex
CREATE INDEX "Place_country_idx" ON "Place"("country");

-- CreateIndex
CREATE INDEX "Place_countryCode_idx" ON "Place"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "Place_provider_providerPlaceId_key" ON "Place"("provider", "providerPlaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_publicSlug_key" ON "Trip"("publicSlug");

-- CreateIndex
CREATE INDEX "Trip_userId_idx" ON "Trip"("userId");

-- CreateIndex
CREATE INDEX "Trip_fromPlaceId_idx" ON "Trip"("fromPlaceId");

-- CreateIndex
CREATE INDEX "Trip_toPlaceId_idx" ON "Trip"("toPlaceId");

-- CreateIndex
CREATE INDEX "Trip_visibility_idx" ON "Trip"("visibility");

-- CreateIndex
CREATE INDEX "Trip_status_idx" ON "Trip"("status");

-- CreateIndex
CREATE INDEX "Trip_createdAt_idx" ON "Trip"("createdAt");

-- CreateIndex
CREATE INDEX "TripDay_tripId_idx" ON "TripDay"("tripId");

-- CreateIndex
CREATE INDEX "TripDay_dayNumber_idx" ON "TripDay"("dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TripDay_tripId_dayNumber_key" ON "TripDay"("tripId", "dayNumber");

-- CreateIndex
CREATE INDEX "TripActivity_tripId_idx" ON "TripActivity"("tripId");

-- CreateIndex
CREATE INDEX "TripActivity_tripDayId_idx" ON "TripActivity"("tripDayId");

-- CreateIndex
CREATE INDEX "TripActivity_category_idx" ON "TripActivity"("category");

-- CreateIndex
CREATE INDEX "TripActivity_source_idx" ON "TripActivity"("source");

-- CreateIndex
CREATE INDEX "TripActivity_position_idx" ON "TripActivity"("position");

-- CreateIndex
CREATE INDEX "TransportOption_tripId_idx" ON "TransportOption"("tripId");

-- CreateIndex
CREATE INDEX "TransportOption_tripDayId_idx" ON "TransportOption"("tripDayId");

-- CreateIndex
CREATE INDEX "TransportOption_mode_idx" ON "TransportOption"("mode");

-- CreateIndex
CREATE INDEX "TransportOption_isSelected_idx" ON "TransportOption"("isSelected");

-- CreateIndex
CREATE INDEX "StayOption_tripId_idx" ON "StayOption"("tripId");

-- CreateIndex
CREATE INDEX "StayOption_tripDayId_idx" ON "StayOption"("tripDayId");

-- CreateIndex
CREATE INDEX "StayOption_city_idx" ON "StayOption"("city");

-- CreateIndex
CREATE INDEX "StayOption_stayType_idx" ON "StayOption"("stayType");

-- CreateIndex
CREATE INDEX "StayOption_budgetLevel_idx" ON "StayOption"("budgetLevel");

-- CreateIndex
CREATE INDEX "StayOption_isSelected_idx" ON "StayOption"("isSelected");

-- CreateIndex
CREATE INDEX "MealSuggestion_tripId_idx" ON "MealSuggestion"("tripId");

-- CreateIndex
CREATE INDEX "MealSuggestion_tripDayId_idx" ON "MealSuggestion"("tripDayId");

-- CreateIndex
CREATE INDEX "MealSuggestion_mealType_idx" ON "MealSuggestion"("mealType");

-- CreateIndex
CREATE UNIQUE INDEX "TripCostBreakdown_tripId_key" ON "TripCostBreakdown"("tripId");

-- CreateIndex
CREATE INDEX "TripCostBreakdown_budgetStatus_idx" ON "TripCostBreakdown"("budgetStatus");

-- CreateIndex
CREATE INDEX "TripChatMessage_tripId_idx" ON "TripChatMessage"("tripId");

-- CreateIndex
CREATE INDEX "TripChatMessage_userId_idx" ON "TripChatMessage"("userId");

-- CreateIndex
CREATE INDEX "TripChatMessage_role_idx" ON "TripChatMessage"("role");

-- CreateIndex
CREATE INDEX "TripChatMessage_status_idx" ON "TripChatMessage"("status");

-- CreateIndex
CREATE INDEX "TripChatMessage_createdAt_idx" ON "TripChatMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_fromPlaceId_fkey" FOREIGN KEY ("fromPlaceId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_toPlaceId_fkey" FOREIGN KEY ("toPlaceId") REFERENCES "Place"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripDay" ADD CONSTRAINT "TripDay_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripActivity" ADD CONSTRAINT "TripActivity_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripActivity" ADD CONSTRAINT "TripActivity_tripDayId_fkey" FOREIGN KEY ("tripDayId") REFERENCES "TripDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportOption" ADD CONSTRAINT "TransportOption_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportOption" ADD CONSTRAINT "TransportOption_tripDayId_fkey" FOREIGN KEY ("tripDayId") REFERENCES "TripDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StayOption" ADD CONSTRAINT "StayOption_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StayOption" ADD CONSTRAINT "StayOption_tripDayId_fkey" FOREIGN KEY ("tripDayId") REFERENCES "TripDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealSuggestion" ADD CONSTRAINT "MealSuggestion_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealSuggestion" ADD CONSTRAINT "MealSuggestion_tripDayId_fkey" FOREIGN KEY ("tripDayId") REFERENCES "TripDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripCostBreakdown" ADD CONSTRAINT "TripCostBreakdown_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripChatMessage" ADD CONSTRAINT "TripChatMessage_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripChatMessage" ADD CONSTRAINT "TripChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
