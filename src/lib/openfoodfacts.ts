import type { IngredientItem, MealType, NutritionData } from "@/types/nutrition";

export interface OFFProduct {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  nutriScore?: "a" | "b" | "c" | "d" | "e" | null;
  novaGroup?: number | null;
  per100g: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sugars_g?: number;
    salt_g?: number;
  };
  servingSizeG?: number | null;
}

export async function fetchProduct(barcode: string): Promise<OFFProduct | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode,
  )}.json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  if (json?.status !== 1 || !json.product) return null;
  const p = json.product;
  const n = p.nutriments || {};
  const cal =
    n["energy-kcal_100g"] ??
    (n["energy-kj_100g"] ? Math.round(n["energy-kj_100g"] / 4.184) : 0);
  const servingMatch = (p.serving_size || "").match(/(\d+(?:[.,]\d+)?)\s*g/i);
  const servingSizeG = servingMatch
    ? parseFloat(servingMatch[1].replace(",", "."))
    : null;
  return {
    barcode,
    name: p.product_name || p.generic_name || "Produit inconnu",
    brand: p.brands || undefined,
    imageUrl: p.image_front_url || p.image_url || undefined,
    nutriScore: p.nutriscore_grade || null,
    novaGroup: p.nova_group || null,
    per100g: {
      calories: Math.round(cal || 0),
      protein_g: Number(n.proteins_100g || 0),
      carbs_g: Number(n.carbohydrates_100g || 0),
      fat_g: Number(n.fat_100g || 0),
      sugars_g: Number(n.sugars_100g || 0),
      salt_g: Number(n.salt_100g || 0),
    },
    servingSizeG,
  };
}

/** Best meal type guess based on time of day. */
export function guessMealType(date = new Date()): MealType {
  const h = date.getHours();
  if (h < 11) return "Petit-déjeuner";
  if (h < 15) return "Déjeuner";
  if (h < 18) return "Collation";
  return "Dîner";
}

/** Convert a product + grams to a NutritionData payload (single-component). */
export function productToNutrition(
  product: OFFProduct,
  grams: number,
): NutritionData {
  const ratio = grams / 100;
  const calories = Math.round(product.per100g.calories * ratio);
  const protein_g = round1(product.per100g.protein_g * ratio);
  const carbs_g = round1(product.per100g.carbs_g * ratio);
  const fat_g = round1(product.per100g.fat_g * ratio);
  const score = nutriScoreToHealth(product.nutriScore);
  const ing: IngredientItem = {
    name: product.name,
    emoji: "🛒",
    quantity_estimate: `${Math.round(grams)} g`,
    calories,
    protein_g,
    carbs_g,
    fat_g,
  };
  return {
    dish_name: product.name,
    meal_type: guessMealType(),
    components: [ing],
    total_calories: calories,
    total_protein_g: protein_g,
    total_carbs_g: carbs_g,
    total_fat_g: fat_g,
    health_score: score.score,
    health_tip: score.tip,
  };
}

export function nutriScoreToHealth(grade?: string | null): {
  score: number;
  tip: string;
  color: "green" | "orange" | "red";
} {
  switch ((grade || "").toLowerCase()) {
    case "a":
      return {
        score: 9,
        tip: "Excellent choix nutritionnel — Nutri-Score A.",
        color: "green",
      };
    case "b":
      return {
        score: 7,
        tip: "Bon choix nutritionnel — Nutri-Score B.",
        color: "green",
      };
    case "c":
      return {
        score: 5,
        tip: "À consommer avec modération — Nutri-Score C.",
        color: "orange",
      };
    case "d":
      return {
        score: 3,
        tip: "Qualité nutritionnelle limitée — Nutri-Score D.",
        color: "red",
      };
    case "e":
      return {
        score: 1,
        tip: "À limiter fortement — Nutri-Score E.",
        color: "red",
      };
    default:
      return {
        score: 5,
        tip: "Nutri-Score indisponible pour ce produit.",
        color: "orange",
      };
  }
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
