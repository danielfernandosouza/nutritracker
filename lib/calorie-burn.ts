/**
 * Estimativa de calorias já queimadas hoje pelo metabolismo basal + atividade diária (TDEE),
 * prorateada pela fração do dia já passada — não é medição real, é a mesma lógica usada por
 * apps de fitness pra estimar "gasto até agora" quando não há um treino específico registrado.
 */
export function estimateBaselineBurnKcal(tdee: number, now: Date = new Date()): number {
  const fractionOfDay = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
  return Math.round(tdee * fractionOfDay);
}
