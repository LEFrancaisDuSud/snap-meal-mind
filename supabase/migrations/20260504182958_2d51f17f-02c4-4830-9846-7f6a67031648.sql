
-- Drop old tables and storage
DROP TABLE IF EXISTS public.meals CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;

-- Recreate updated_at helper (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ USERS ============
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  avatar_url text,
  age int,
  gender text,
  height_cm numeric,
  weight_kg numeric,
  target_weight_kg numeric,
  activity_level text,
  goal text,
  dietary_prefs text[] DEFAULT '{}',
  daily_kcal_goal int DEFAULT 2000,
  protein_g_goal int DEFAULT 150,
  carbs_g_goal int DEFAULT 200,
  fat_g_goal int DEFAULT 70,
  subscription_status text NOT NULL DEFAULT 'free',
  premium_expires_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  streak_days int NOT NULL DEFAULT 0,
  best_streak int NOT NULL DEFAULT 0,
  last_logged_date date,
  scans_today int NOT NULL DEFAULT 0,
  logs_today int NOT NULL DEFAULT 0,
  searches_today int NOT NULL DEFAULT 0,
  last_reset_date date NOT NULL DEFAULT (now() at time zone 'utc')::date,
  onboarding_complete boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'en',
  units text NOT NULL DEFAULT 'metric',
  notification_settings jsonb NOT NULL DEFAULT '{"quiet_start":"22:00","quiet_end":"07:00","types":{"breakfast":true,"lunch":true,"protein":true,"streak":true,"milestone":true,"weekly":true}}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE TRIGGER users_updated BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create user row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, name, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.email LIKE '%@nutriscan.app' THEN 'premium_annual' ELSE 'free' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ FOOD LOGS ============
CREATE TABLE public.food_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  food_name text NOT NULL,
  meal_type text NOT NULL,
  calories int NOT NULL DEFAULT 0,
  protein_g numeric NOT NULL DEFAULT 0,
  carbs_g numeric NOT NULL DEFAULT 0,
  fat_g numeric NOT NULL DEFAULT 0,
  fiber_g numeric NOT NULL DEFAULT 0,
  sugar_g numeric NOT NULL DEFAULT 0,
  micronutrients_json jsonb DEFAULT '{}',
  photo_url text,
  input_method text NOT NULL DEFAULT 'manual',
  confidence_score text,
  portion_multiplier numeric NOT NULL DEFAULT 1,
  logged_at timestamptz NOT NULL DEFAULT now(),
  log_date date NOT NULL DEFAULT (now() at time zone 'utc')::date
);
CREATE INDEX food_logs_user_date_idx ON public.food_logs(user_id, logged_at DESC);
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fl_select" ON public.food_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fl_insert" ON public.food_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fl_update" ON public.food_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "fl_delete" ON public.food_logs FOR DELETE USING (auth.uid() = user_id);

-- Streak trigger
CREATE OR REPLACE FUNCTION public.update_streak_on_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE today date := (now() at time zone 'utc')::date; last date;
BEGIN
  SELECT last_logged_date INTO last FROM public.users WHERE id = NEW.user_id;
  IF last IS NULL OR last < today - interval '1 day' THEN
    UPDATE public.users SET streak_days = 1, last_logged_date = today, logs_today = logs_today + 1 WHERE id = NEW.user_id;
  ELSIF last = today - interval '1 day' THEN
    UPDATE public.users SET streak_days = streak_days + 1, best_streak = GREATEST(best_streak, streak_days + 1), last_logged_date = today, logs_today = logs_today + 1 WHERE id = NEW.user_id;
  ELSE
    UPDATE public.users SET logs_today = logs_today + 1 WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER food_logs_streak AFTER INSERT ON public.food_logs FOR EACH ROW EXECUTE FUNCTION public.update_streak_on_log();

-- ============ WEIGHT LOGS ============
CREATE TABLE public.weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  weight_kg numeric NOT NULL,
  note text,
  logged_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wl_all" ON public.weight_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ WATER LOGS ============
CREATE TABLE public.water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  glasses_count int NOT NULL DEFAULT 0,
  log_date date NOT NULL DEFAULT (now() at time zone 'utc')::date,
  UNIQUE(user_id, log_date)
);
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "water_all" ON public.water_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ BODY MEASUREMENTS ============
CREATE TABLE public.body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  neck_cm numeric, waist_cm numeric, hips_cm numeric, body_fat_pct numeric,
  logged_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bm_all" ON public.body_measurements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ MEAL PLANS ============
CREATE TABLE public.meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  plan_json jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generation_count int NOT NULL DEFAULT 1
);
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_all" ON public.meal_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ ACHIEVEMENTS ============
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  shared boolean NOT NULL DEFAULT false,
  UNIQUE(user_id, badge_type)
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ach_all" ON public.achievements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ FAVORITE FOODS ============
CREATE TABLE public.favorite_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  food_name text NOT NULL,
  food_data jsonb NOT NULL,
  use_count int NOT NULL DEFAULT 1,
  last_used_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.favorite_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ff_all" ON public.favorite_foods FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ WEEKLY REPORTS ============
CREATE TABLE public.weekly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_text text NOT NULL,
  week_start date NOT NULL,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wr_all" ON public.weekly_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ REFERRALS ============
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_email text NOT NULL,
  referred_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  joined_at timestamptz,
  bonus_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ref_select" ON public.referrals FOR SELECT USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);
CREATE POLICY "ref_insert" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_user_id);

-- ============ NOTIFICATION LOG ============
CREATE TABLE public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  dismissed boolean NOT NULL DEFAULT false,
  dismissed_count int NOT NULL DEFAULT 0
);
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nl_all" ON public.notification_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ OFFLINE QUEUE ============
CREATE TABLE public.offline_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  synced boolean NOT NULL DEFAULT false
);
ALTER TABLE public.offline_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oq_all" ON public.offline_queue FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ STORAGE ============
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-images', 'meal-images', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_write" ON storage.objects;
DROP POLICY IF EXISTS "meal_images_read" ON storage.objects;
DROP POLICY IF EXISTS "meal_images_write" ON storage.objects;
DROP POLICY IF EXISTS "meal_images_delete" ON storage.objects;

CREATE POLICY "avatars_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "meal_images_read" ON storage.objects FOR SELECT USING (bucket_id = 'meal-images');
CREATE POLICY "meal_images_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'meal-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "meal_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'meal-images' AND auth.uid()::text = (storage.foldername(name))[1]);
