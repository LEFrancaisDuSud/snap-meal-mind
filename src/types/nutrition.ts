export interface IngredientItem {
  name: string;
  emoji: string;
  quantity_estimate: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface NutritionData {
  dish_name: string;
  meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  components: IngredientItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  health_score: number;
  health_tip: string;
}

export type Screen = 'camera' | 'analyzing' | 'results' | 'error';
export type PortionMultiplier = 0.5 | 1 | 1.5 | 2;
