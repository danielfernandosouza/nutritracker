-- AlterTable
ALTER TABLE "Meal" ADD COLUMN     "photo" TEXT;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "WeightEntry" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeightEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeightEntry_date_idx" ON "WeightEntry"("date");
