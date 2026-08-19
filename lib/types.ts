export type Meal = {
  id: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  sugar: number;
  emoji: string;
  photo: string | null;
  createdAt: string;
};

export type MealItem = {
  name: string;
  portion: string;
  calories: number;
};

export type MealInput = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  sugar: number;
  emoji: string;
  photo?: string | null;
  /** Transient — not persisted, only used to explain the estimate on the scan-result screen. */
  items?: MealItem[];
  explanation?: string;
};

export const EMPTY_MEAL_INPUT: MealInput = {
  name: "",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  sodium: 0,
  sugar: 0,
  emoji: "🍽️",
  photo: null,
  items: [],
  explanation: "",
};
