import type { Goal } from "@/lib/calculations";

/**
 * Estimativa de calorias já queimadas hoje pelo metabolismo basal + atividade diária (TDEE),
 * prorateada pela fração do dia já passada — não é medição real, é a mesma lógica usada por
 * apps de fitness pra estimar "gasto até agora" quando não há um treino específico registrado.
 */
export function estimateBaselineBurnKcal(tdee: number, now: Date = new Date()): number {
  const fractionOfDay = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
  return Math.round(tdee * fractionOfDay);
}

export type EnergyBalance = "good" | "watch" | "neutral";

/**
 * Classifica consumido-menos-queimado (negativo = déficit, positivo = superávit) conforme o
 * objetivo do usuário — mesmo espírito do veredito de peso em lib/weekly-summary.ts.
 */
export function classifyEnergyBalance(netKcal: number, goal: Goal): EnergyBalance {
  const wantsDeficit = goal === "lose_fat" || goal === "recomposition";
  const wantsSurplus = goal === "gain_muscle";

  if (wantsDeficit) {
    if (netKcal <= -100) return "good";
    return netKcal > 200 ? "watch" : "neutral";
  }
  if (wantsSurplus) {
    if (netKcal >= 100) return "good";
    return netKcal < -200 ? "watch" : "neutral";
  }
  return Math.abs(netKcal) <= 250 ? "good" : "watch";
}
