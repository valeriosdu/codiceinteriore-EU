// Calcolo eta + fascia + gap per modulare il tono del system prompt Gemini.

export type FasciaEta = "20-30" | "30-45" | "45-60" | "60+";

export interface BirthDateInput {
  day: number;
  month: number; // 1-12
  year: number;
}

export function calcolaEta(birth: BirthDateInput, today: Date = new Date()): number {
  const todayY = today.getUTCFullYear();
  const todayM = today.getUTCMonth() + 1;
  const todayD = today.getUTCDate();
  let age = todayY - birth.year;
  if (todayM < birth.month || (todayM === birth.month && todayD < birth.day)) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function fasciaEtaCoppia(etaA: number, etaB: number): FasciaEta {
  const media = (etaA + etaB) / 2;
  if (media < 30) return "20-30";
  if (media < 45) return "30-45";
  if (media < 60) return "45-60";
  return "60+";
}

export function gapSignificativo(etaA: number, etaB: number): boolean {
  return Math.abs(etaA - etaB) > 10;
}
