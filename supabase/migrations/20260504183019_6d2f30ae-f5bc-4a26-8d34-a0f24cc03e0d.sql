
-- Restrict bucket listing to owner folder
DROP POLICY IF EXISTS "avatars_read" ON storage.objects;
DROP POLICY IF EXISTS "meal_images_read" ON storage.objects;

CREATE POLICY "avatars_read_own" ON storage.objects FOR SELECT USING (
  bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1])
);
CREATE POLICY "meal_images_read_own" ON storage.objects FOR SELECT USING (
  bucket_id = 'meal-images' AND (auth.uid()::text = (storage.foldername(name))[1])
);

-- Revoke API execute on definer functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_streak_on_log() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
