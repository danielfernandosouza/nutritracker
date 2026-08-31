export type CardioActivity = "RUN" | "WALK" | "HIKE";
export type CardioIntensity = "leve" | "moderada" | "intensa";

/**
 * MET aproximados do Compendium of Physical Activities, por faixa de ritmo — a mesma faixa
 * também classifica a intensidade, então as duas coisas ficam sempre consistentes entre si.
 */
function paceTier(activity: CardioActivity, paceMinPerKm: number): { met: number; intensity: CardioIntensity } {
  if (activity === "HIKE") return { met: 6.0, intensity: "moderada" };

  if (activity === "WALK") {
    if (paceMinPerKm <= 10) return { met: 5.0, intensity: "moderada" };
    if (paceMinPerKm <= 13) return { met: 3.5, intensity: "leve" };
    return { met: 2.8, intensity: "leve" };
  }

  // RUN
  if (paceMinPerKm <= 4.5) return { met: 12.8, intensity: "intensa" };
  if (paceMinPerKm <= 5.5) return { met: 11.0, intensity: "intensa" };
  if (paceMinPerKm <= 6.5) return { met: 9.8, intensity: "moderada" };
  if (paceMinPerKm <= 8) return { met: 8.3, intensity: "moderada" };
  return { met: 6.0, intensity: "leve" };
}

export function estimateCardioBurnKcal(
  activity: CardioActivity,
  distanceKm: number,
  durationMinutes: number,
  weightKg: number,
): number {
  const paceMinPerKm = distanceKm > 0 ? durationMinutes / distanceKm : 0;
  const { met } = paceTier(activity, paceMinPerKm);
  return met * weightKg * (durationMinutes / 60);
}

export function classifyCardioIntensity(activity: CardioActivity, paceMinPerKm: number): CardioIntensity {
  return paceTier(activity, paceMinPerKm).intensity;
}
