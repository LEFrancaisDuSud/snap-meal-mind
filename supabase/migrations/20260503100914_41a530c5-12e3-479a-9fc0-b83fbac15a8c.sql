DROP POLICY IF EXISTS "Meal images are publicly readable" ON storage.objects;

CREATE POLICY "Users can view their own meal images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'meal-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);