-- CreateTable
CREATE TABLE "WaterEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "amountMl" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaterEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SleepEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "bedTime" TEXT NOT NULL,
    "wakeTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SleepEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaterEntry_userId_date_idx" ON "WaterEntry"("userId", "date");

-- CreateIndex
CREATE INDEX "SleepEntry_userId_date_idx" ON "SleepEntry"("userId", "date");

-- AddForeignKey
ALTER TABLE "WaterEntry" ADD CONSTRAINT "WaterEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SleepEntry" ADD CONSTRAINT "SleepEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
