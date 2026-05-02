export interface IngredientItem {
  name: string;
  emoji: string;
  quantity_estimate: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export type MealType = 'Petit-déjeuner' | 'Déjeuner' | 'Dîner' | 'Collation';

export interface NutritionData {
  dish_name: string;
  meal_type: MealType;
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

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  age: number | null;
  sex: 'male' | 'female' | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  goal: 'lose' | 'maintain' | 'gain' | null;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
  xp: number;
  level: number;
  current_streak: number;
  best_streak: number;
  last_log_date: string | null;
  onboarding_completed: boolean;
}

export interface MealRow {
  id: string;
  user_id: string;
  dish_name: string;
  meal_type: MealType;
  image_url: string | null;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  health_score: number | null;
  health_tip: string | null;
  components: IngredientItem[];
  portion_multiplier: number;
  logged_at: string;
  log_date: string;
}
