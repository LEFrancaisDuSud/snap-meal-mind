import type { ActivityLevel, Gender, Goal } from "@/types/db";

export const ACTIVITY_MULT: Record<ActivityLevel, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, athlete: 1.9,
};

export interface PlanInput {
  age: number;
  gender: Gender;
  weight_kg: number;
  height_cm: number;
  target_weight_kg: number;
  activity: ActivityLevel;
  goal: Goal;
}

export interface NutritionPlan {
  daily_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  weeks_to_goal: number;
  tdee: number;
}

export function computePlan(i: PlanInput): NutritionPlan {
  const offset = i.gender === "male" ? 5 : i.gender === "female" ? -161 : -78;
  const bmr = 10 * i.weight_kg + 6.25 * i.height_cm - 5 * i.age + offset;
  const tdee = bmr * ACTIVITY_MULT[i.activity];

  let kcal = tdee;
  if (i.goal === "lose") kcal = tdee - 400;
  else if (i.goal === "gain") kcal = tdee + 300;

  const protein_g = Math.round(i.weight_kg * 2.0);
  const protein_kcal = protein_g * 4;
  const remaining = Math.max(0, kcal - protein_kcal);
  const carbs_g = Math.round((remaining * 0.45) / 4);
  const fat_g = Math.round((remaining * 0.30) / 9);
  const weeks = Math.max(1, Math.ceil(Math.abs(i.weight_kg - i.target_weight_kg) / 0.5));

  return {
    daily_kcal: Math.round(kcal),
    protein_g, carbs_g, fat_g,
    weeks_to_goal: weeks,
    tdee: Math.round(tdee),
  };
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Good night";
}
