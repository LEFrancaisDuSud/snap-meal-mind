import { supabase } from "@/integrations/supabase/client";
import type { NutritionData, MealType } from "@/types/nutrition";

const MEAL_MAP: Record<string, MealType> = {
  Breakfast: "Petit-déjeuner",
  Lunch: "Déjeuner",
  Dinner: "Dîner",
  Snack: "Collation",
  "Petit-déjeuner": "Petit-déjeuner",
  "Déjeuner": "Déjeuner",
  "Dîner": "Dîner",
  "Collation": "Collation",
};

export async function analyzeFood(base64Image: string): Promise<NutritionData> {
  const clean = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

  const { data, error } = await supabase.functions.invoke("analyze-food", {
    body: { imageBase64: clean },
  });

  if (error) {
    const ctx: any = (error as any).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const body = await ctx.json();
        if (body?.error) throw new Error(body.error);
      } catch (_) {}
    }
    throw new Error(error.message || "Échec de l'analyse de l'image");
  }

  if (!data || (data as any).error) {
    throw new Error((data as any)?.error || "Aucune donnée renvoyée");
  }

  const raw = data as any;
  const result: NutritionData = {
    ...raw,
    meal_type: MEAL_MAP[raw.meal_type] || "Déjeuner",
  };
  return result;
}
