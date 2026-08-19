import type { ActivityLevel } from "@/lib/calculations";

export type WaterInput = { weightKg: number; activityLevel: ActivityLevel };

/** ~35ml/kg de peso corporal, com um acréscimo pra quem treina mais — referência geral, não prescrição médica. */
export function computeWaterTargetMl({ weightKg, activityLevel }: WaterInput): number {
  const base = 35 * weightKg;
  const activityBonus: Record<ActivityLevel, number> = {
    sedentary: 0,
    light: 150,
    moderate: 350,
    active: 500,
    very_active: 700,
  };
  return Math.round(base + activityBonus[activityLevel]);
}

export type SleepTargetRange = { minHours: number; maxHours: number };

/** Faixa geral por idade (18-64: 7-9h, 65+: 7-8h), com +30min no mínimo se treinou no dia anterior (recuperação). */
export function computeSleepTargetHours(age: number, workedOutYesterday: boolean): SleepTargetRange {
  const base: SleepTargetRange = age >= 65 ? { minHours: 7, maxHours: 8 } : { minHours: 7, maxHours: 9 };
  return workedOutYesterday ? { ...base, minHours: base.minHours + 0.5 } : base;
}

export type SleepQuality = "good" | "short" | "late_bedtime";

export type SleepFeedback = {
  durationHours: number;
  quality: SleepQuality;
  message: string;
};

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Duração dormida a partir de "HH:MM"/"HH:MM", tratando a virada de meia-noite (dormiu antes, acordou depois). */
export function computeSleepDurationHours(bedTime: string, wakeTime: string): number {
  const bed = parseTimeToMinutes(bedTime);
  const wake = parseTimeToMinutes(wakeTime);
  const minutes = wake > bed ? wake - bed : 24 * 60 - bed + wake;
  return Math.round((minutes / 60) * 10) / 10;
}

/** Dormir entre meia-noite e 5h tende a prejudicar a qualidade do sono mesmo quando a duração bate a meta. */
const LATE_BEDTIME_END_MINUTES = 5 * 60;

export function computeSleepFeedback(bedTime: string, wakeTime: string, target: SleepTargetRange): SleepFeedback {
  const durationHours = computeSleepDurationHours(bedTime, wakeTime);
  const bedMinutes = parseTimeToMinutes(bedTime);
  const isLateBedtime = bedMinutes < LATE_BEDTIME_END_MINUTES;

  if (durationHours < target.minHours) {
    return {
      durationHours,
      quality: "short",
      message: `Você dormiu ${durationHours.toFixed(1).replace(".0", "")}h — abaixo das ${target.minHours}h recomendadas pra você.`,
    };
  }

  if (isLateBedtime) {
    return {
      durationHours,
      quality: "late_bedtime",
      message: `A duração ficou boa (${durationHours.toFixed(1).replace(".0", "")}h), mas dormir tão tarde pode afetar a qualidade do sono.`,
    };
  }

  return {
    durationHours,
    quality: "good",
    message: `Boa noite de sono — ${durationHours.toFixed(1).replace(".0", "")}h, dentro da meta.`,
  };
}
