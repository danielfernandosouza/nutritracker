-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "daysPerWeek" INTEGER,
ADD COLUMN     "equipmentPreference" TEXT,
ADD COLUMN     "favoriteMuscleGroups" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "splitStyle" TEXT;
