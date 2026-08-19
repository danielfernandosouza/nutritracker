export type MealTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  sugar: number;
};

export const EMPTY_TOTALS: MealTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  sodium: 0,
  sugar: 0,
};
