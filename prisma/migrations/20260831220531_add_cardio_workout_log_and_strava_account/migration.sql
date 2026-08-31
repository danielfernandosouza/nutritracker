-- AlterTable
ALTER TABLE "WorkoutLog" ADD COLUMN     "cardioActivity" TEXT,
ADD COLUMN     "distanceKm" DOUBLE PRECISION,
ADD COLUMN     "paceMinPerKm" DOUBLE PRECISION,
ADD COLUMN     "routePolyline" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "stravaActivityId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'STRENGTH';

-- CreateTable
CREATE TABLE "StravaAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StravaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StravaAccount_userId_key" ON "StravaAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutLog_stravaActivityId_key" ON "WorkoutLog"("stravaActivityId");

-- CreateIndex
CREATE INDEX "WorkoutLog_userId_type_date_idx" ON "WorkoutLog"("userId", "type", "date");

-- AddForeignKey
ALTER TABLE "StravaAccount" ADD CONSTRAINT "StravaAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

