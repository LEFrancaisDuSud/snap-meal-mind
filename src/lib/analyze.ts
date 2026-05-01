import { supabase } from "@/integrations/supabase/client";
import type { NutritionData } from "@/types/nutrition";

export async function analyzeFood(base64Image: string): Promise<NutritionData> {
  // Strip data URL prefix if present
  const clean = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

  const { data, error } = await supabase.functions.invoke("analyze-food", {
    body: { imageBase64: clean },
  });

  if (error) {
    // supabase.functions.invoke surfaces non-2xx as error
    const ctx: any = (error as any).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const body = await ctx.json();
        if (body?.error) throw new Error(body.error);
      } catch (_) { /* fall through */ }
    }
    throw new Error(error.message || "Failed to analyze image");
  }

  if (!data || (data as any).error) {
    throw new Error((data as any)?.error || "No data returned");
  }
  return data as NutritionData;
}
