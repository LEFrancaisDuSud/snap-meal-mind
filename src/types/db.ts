// Domain types for NutriScan
export type SubscriptionStatus = "free" | "premium_monthly" | "premium_annual";
export type Gender = "male" | "female" | "other";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type Goal = "lose" | "maintain" | "gain" | "health";
export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";
export type InputMethod = "photo" | "barcode" | "search" | "voice" | "manual";
export type Confidence = "high" | "medium" | "low";

export interface NSUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  age: number | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  target_weight_kg: number | null;
  activity_level: ActivityLevel | null;
  goal: Goal | null;
  dietary_prefs: string[];
  daily_kcal_goal: number;
  protein_g_goal: number;
  carbs_g_goal: number;
  fat_g_goal: number;
  subscription_status: SubscriptionStatus;
  premium_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  streak_days: number;
  best_streak: number;
  last_logged_date: string | null;
  scans_today: number;
  logs_today: number;
  searches_today: number;
  last_reset_date: string;
  onboarding_complete: boolean;
  language: string;
  units: "metric" | "imperial";
  notification_settings: any;
}

export interface FoodLog {
  id: string;
  user_id: string;
  food_name: string;
  meal_type: MealType;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  micronutrients_json: any;
  photo_url: string | null;
  input_method: InputMethod;
  confidence_score: Confidence | null;
  portion_multiplier: number;
  logged_at: string;
  log_date: string;
}

export const FREE_LIMITS = {
  food_logs: 2,
  photo_scans: 1,
  searches: 1,
} as const;

export function isPremium(u: Pick<NSUser, "subscription_status"> | null | undefined): boolean {
  return !!u && (u.subscription_status === "premium_monthly" || u.subscription_status === "premium_annual");
}
