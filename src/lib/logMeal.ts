import { supabase } from "@/integrations/supabase/client";
import type { NutritionData, Profile } from "@/types/nutrition";
import { todayISO } from "./dates";
import { xpProgress } from "./tdee";

export interface LogMealInput {
  userId: string;
  data: NutritionData;
  imageUrl?: string | null;
  portionMultiplier?: number;
  profile?: Profile | null;
}

/**
 * Insert a meal in DB + bump XP/streak. Throws on error so caller can toast.
 * Sanitizes & rounds all numeric fields to match schema (integer calories, numeric macros).
 */
export async function logMeal({
  userId,
  data,
  imageUrl = null,
  portionMultiplier = 1,
  profile,
}: LogMealInput) {
  const m = portionMultiplier;

  const components = (data.components || []).map((c) => ({
    name: String(c.name || ""),
    emoji: String(c.emoji || "🍽️"),
    quantity_estimate: String(c.quantity_estimate || ""),
    calories: Number(c.calories) || 0,
    protein_g: Number(c.protein_g) || 0,
    carbs_g: Number(c.carbs_g) || 0,
    fat_g: Number(c.fat_g) || 0,
  }));

  const insertPayload = {
    user_id: userId,
    dish_name: String(data.dish_name || "Repas"),
    meal_type: data.meal_type,
    image_url: imageUrl,
    total_calories: Math.max(0, Math.round(Number(data.total_calories) * m)),
    total_protein_g: round1(Number(data.total_protein_g) * m),
    total_carbs_g: round1(Number(data.total_carbs_g) * m),
    total_fat_g: round1(Number(data.total_fat_g) * m),
    health_score:
      data.health_score == null
        ? null
        : Math.max(0, Math.min(10, Math.round(Number(data.health_score)))),
    health_tip: data.health_tip || null,
    components: components as any,
    portion_multiplier: m,
    log_date: todayISO(),
  };

  const { error } = await supabase.from("meals").insert(insertPayload);
  if (error) throw error;

  // XP + streak
  const today = todayISO();
  const last = profile?.last_log_date;
  let newStreak = profile?.current_streak || 0;
  if (last !== today) {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const yISO = isoOf(yest);
    newStreak = last === yISO ? newStreak + 1 : 1;
  }
  const newXP = (profile?.xp || 0) + 25;
  const newLevel = xpProgress(newXP).level;
  const bestStreak = Math.max(profile?.best_streak || 0, newStreak);

  await supabase
    .from("profiles")
    .update({
      xp: newXP,
      level: newLevel,
      current_streak: newStreak,
      best_streak: bestStreak,
      last_log_date: today,
    })
    .eq("user_id", userId);
}

function round1(n: number) {
  return Math.round((Number(n) || 0) * 10) / 10;
}
function isoOf(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
