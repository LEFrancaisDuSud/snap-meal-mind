// TDEE / macro / gamification helpers
import type { Profile } from "@/types/nutrition";

const ACTIVITY_FACTOR: Record<NonNullable<Profile["activity_level"]>, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function computeTDEE(input: {
  age: number;
  sex: "male" | "female";
  height_cm: number;
  weight_kg: number;
  activity_level: NonNullable<Profile["activity_level"]>;
  goal: "lose" | "maintain" | "gain";
}) {
  // Mifflin-St Jeor
  const bmr =
    input.sex === "male"
      ? 10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age + 5
      : 10 * input.weight_kg + 6.25 * input.height_cm - 5 * input.age - 161;

  let calories = Math.round(bmr * ACTIVITY_FACTOR[input.activity_level]);
  if (input.goal === "lose") calories -= 400;
  if (input.goal === "gain") calories += 300;
  calories = Math.max(1200, Math.round(calories / 10) * 10);

  // Macro split: 30% protein, 40% carbs, 30% fat (lose) ; 25/50/25 maintain ; 30/45/25 gain
  const split =
    input.goal === "lose"
      ? { p: 0.3, c: 0.4, f: 0.3 }
      : input.goal === "gain"
      ? { p: 0.3, c: 0.45, f: 0.25 }
      : { p: 0.25, c: 0.5, f: 0.25 };

  const protein = Math.round((calories * split.p) / 4);
  const carbs = Math.round((calories * split.c) / 4);
  const fat = Math.round((calories * split.f) / 9);

  return { calories, protein, carbs, fat };
}

export function xpForLevel(level: number) {
  // Level n requires n * 300 cumulative XP
  return level * 300;
}
export function levelFromXP(xp: number) {
  let lvl = 1;
  while (xpForLevel(lvl) <= xp) lvl++;
  return lvl;
}
export function xpProgress(xp: number) {
  const lvl = levelFromXP(xp);
  const prev = lvl > 1 ? xpForLevel(lvl - 1) : 0;
  const next = xpForLevel(lvl);
  return {
    level: lvl,
    nextLevelAt: next,
    inLevel: xp - prev,
    levelSpan: next - prev,
    pct: Math.min(100, Math.round(((xp - prev) / (next - prev)) * 100)),
  };
}

export const ACTIVITY_LABELS: Record<NonNullable<Profile["activity_level"]>, string> = {
  sedentary: "Sédentaire",
  light: "Légère",
  moderate: "Modérée",
  active: "Active",
  very_active: "Très active",
};

export const GOAL_LABELS: Record<NonNullable<Profile["goal"]>, string> = {
  lose: "Perdre du poids",
  maintain: "Maintenir",
  gain: "Prendre de la masse",
};
