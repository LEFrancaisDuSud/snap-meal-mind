-- Public bucket for meal photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-images', 'meal-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Meal images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'meal-images');

-- Users upload to their own folder
CREATE POLICY "Users can upload their own meal images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meal-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own meal images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'meal-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own meal images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'meal-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);