export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          badge_type: string
          id: string
          shared: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_type: string
          id?: string
          shared?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_type?: string
          id?: string
          shared?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      body_measurements: {
        Row: {
          body_fat_pct: number | null
          hips_cm: number | null
          id: string
          logged_at: string
          neck_cm: number | null
          user_id: string
          waist_cm: number | null
        }
        Insert: {
          body_fat_pct?: number | null
          hips_cm?: number | null
          id?: string
          logged_at?: string
          neck_cm?: number | null
          user_id: string
          waist_cm?: number | null
        }
        Update: {
          body_fat_pct?: number | null
          hips_cm?: number | null
          id?: string
          logged_at?: string
          neck_cm?: number | null
          user_id?: string
          waist_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_foods: {
        Row: {
          food_data: Json
          food_name: string
          id: string
          last_used_at: string
          use_count: number
          user_id: string
        }
        Insert: {
          food_data: Json
          food_name: string
          id?: string
          last_used_at?: string
          use_count?: number
          user_id: string
        }
        Update: {
          food_data?: Json
          food_name?: string
          id?: string
          last_used_at?: string
          use_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_foods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      food_logs: {
        Row: {
          calories: number
          carbs_g: number
          confidence_score: string | null
          fat_g: number
          fiber_g: number
          food_name: string
          id: string
          input_method: string
          log_date: string
          logged_at: string
          meal_type: string
          micronutrients_json: Json | null
          photo_url: string | null
          portion_multiplier: number
          protein_g: number
          sugar_g: number
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          confidence_score?: string | null
          fat_g?: number
          fiber_g?: number
          food_name: string
          id?: string
          input_method?: string
          log_date?: string
          logged_at?: string
          meal_type: string
          micronutrients_json?: Json | null
          photo_url?: string | null
          portion_multiplier?: number
          protein_g?: number
          sugar_g?: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          confidence_score?: string | null
          fat_g?: number
          fiber_g?: number
          food_name?: string
          id?: string
          input_method?: string
          log_date?: string
          logged_at?: string
          meal_type?: string
          micronutrients_json?: Json | null
          photo_url?: string | null
          portion_multiplier?: number
          protein_g?: number
          sugar_g?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          generated_at: string
          generation_count: number
          id: string
          plan_json: Json
          user_id: string
        }
        Insert: {
          generated_at?: string
          generation_count?: number
          id?: string
          plan_json: Json
          user_id: string
        }
        Update: {
          generated_at?: string
          generation_count?: number
          id?: string
          plan_json?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          dismissed: boolean
          dismissed_count: number
          id: string
          message: string
          sent_at: string
          type: string
          user_id: string
        }
        Insert: {
          dismissed?: boolean
          dismissed_count?: number
          id?: string
          message: string
          sent_at?: string
          type: string
          user_id: string
        }
        Update: {
          dismissed?: boolean
          dismissed_count?: number
          id?: string
          message?: string
          sent_at?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_queue: {
        Row: {
          action_type: string
          created_at: string
          id: string
          payload: Json
          synced: boolean
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          payload: Json
          synced?: boolean
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          payload?: Json
          synced?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offline_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_granted: boolean
          created_at: string
          id: string
          joined_at: string | null
          referred_email: string
          referred_user_id: string | null
          referrer_user_id: string
        }
        Insert: {
          bonus_granted?: boolean
          created_at?: string
          id?: string
          joined_at?: string | null
          referred_email: string
          referred_user_id?: string | null
          referrer_user_id: string
        }
        Update: {
          bonus_granted?: boolean
          created_at?: string
          id?: string
          joined_at?: string | null
          referred_email?: string
          referred_user_id?: string | null
          referrer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          activity_level: string | null
          age: number | null
          avatar_url: string | null
          best_streak: number
          carbs_g_goal: number | null
          created_at: string
          daily_kcal_goal: number | null
          dietary_prefs: string[] | null
          email: string
          fat_g_goal: number | null
          gender: string | null
          goal: string | null
          height_cm: number | null
          id: string
          language: string
          last_active_at: string
          last_logged_date: string | null
          last_reset_date: string
          logs_today: number
          name: string | null
          notification_settings: Json
          onboarding_complete: boolean
          premium_expires_at: string | null
          protein_g_goal: number | null
          scans_today: number
          searches_today: number
          streak_days: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          target_weight_kg: number | null
          units: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          avatar_url?: string | null
          best_streak?: number
          carbs_g_goal?: number | null
          created_at?: string
          daily_kcal_goal?: number | null
          dietary_prefs?: string[] | null
          email: string
          fat_g_goal?: number | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          id: string
          language?: string
          last_active_at?: string
          last_logged_date?: string | null
          last_reset_date?: string
          logs_today?: number
          name?: string | null
          notification_settings?: Json
          onboarding_complete?: boolean
          premium_expires_at?: string | null
          protein_g_goal?: number | null
          scans_today?: number
          searches_today?: number
          streak_days?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          target_weight_kg?: number | null
          units?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          avatar_url?: string | null
          best_streak?: number
          carbs_g_goal?: number | null
          created_at?: string
          daily_kcal_goal?: number | null
          dietary_prefs?: string[] | null
          email?: string
          fat_g_goal?: number | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          language?: string
          last_active_at?: string
          last_logged_date?: string | null
          last_reset_date?: string
          logs_today?: number
          name?: string | null
          notification_settings?: Json
          onboarding_complete?: boolean
          premium_expires_at?: string | null
          protein_g_goal?: number | null
          scans_today?: number
          searches_today?: number
          streak_days?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          target_weight_kg?: number | null
          units?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      water_logs: {
        Row: {
          glasses_count: number
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          glasses_count?: number
          id?: string
          log_date?: string
          user_id: string
        }
        Update: {
          glasses_count?: number
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          delivered_at: string
          id: string
          read_at: string | null
          report_text: string
          user_id: string
          week_start: string
        }
        Insert: {
          delivered_at?: string
          id?: string
          read_at?: string | null
          report_text: string
          user_id: string
          week_start: string
        }
        Update: {
          delivered_at?: string
          id?: string
          read_at?: string | null
          report_text?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_logs: {
        Row: {
          id: string
          logged_at: string
          note: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          id?: string
          logged_at?: string
          note?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          id?: string
          logged_at?: string
          note?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
