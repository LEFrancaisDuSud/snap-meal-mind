import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { MealRow, MealType } from "@/types/nutrition";

export const MEAL_TYPES: MealType[] = ["Petit-déjeuner", "Déjeuner", "Dîner", "Collation"];

export function useMeals(date: string) {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setMeals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", date)
      .order("logged_at", { ascending: true });
    setMeals((data as any[] as MealRow[]) || []);
    setLoading(false);
  }, [user, date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { meals, loading, refresh };
}

export function totalsFromMeals(meals: MealRow[]) {
  return meals.reduce(
    (acc, m) => ({
      cal: acc.cal + Number(m.total_calories),
      p: acc.p + Number(m.total_protein_g),
      c: acc.c + Number(m.total_carbs_g),
      f: acc.f + Number(m.total_fat_g),
    }),
    { cal: 0, p: 0, c: 0, f: 0 },
  );
}

export function groupMealsByType(meals: MealRow[]) {
  const map = new Map<MealType, MealRow[]>();
  MEAL_TYPES.forEach((t) => map.set(t, []));
  meals.forEach((m) => {
    const arr = map.get(m.meal_type) || [];
    arr.push(m);
    map.set(m.meal_type, arr);
  });
  return map;
}
