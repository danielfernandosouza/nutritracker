import { Dumbbell, Anchor, TrendingUp, BicepsFlexed, Footprints, PersonStanding, Zap, type LucideIcon } from "lucide-react";
import type { MuscleGroup } from "@/lib/exercises";

export const MUSCLE_GROUP_ICONS: Record<MuscleGroup, LucideIcon> = {
  chest: Dumbbell,
  back: Anchor,
  shoulders: TrendingUp,
  biceps: BicepsFlexed,
  triceps: BicepsFlexed,
  quads: Footprints,
  hamstrings: Footprints,
  glutes: PersonStanding,
  calves: Footprints,
  abs: Zap,
};

export function dominantMuscleGroup(groups: (MuscleGroup | undefined)[]): MuscleGroup | undefined {
  const counts = new Map<MuscleGroup, number>();
  for (const g of groups) {
    if (!g) continue;
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}
