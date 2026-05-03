import { supabase } from "@/integrations/supabase/client";

/** Upload a base64 / data URL image to the meal-images bucket. Returns public URL. */
export async function uploadMealImage(
  userId: string,
  base64OrDataUrl: string,
): Promise<string | null> {
  try {
    const clean = base64OrDataUrl.includes(",")
      ? base64OrDataUrl.split(",")[1]
      : base64OrDataUrl;
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: "image/jpeg" });

    const path = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.jpg`;

    const { error } = await supabase.storage
      .from("meal-images")
      .upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (error) {
      console.error("upload error", error);
      return null;
    }
    const { data } = supabase.storage.from("meal-images").getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error("uploadMealImage failed", e);
    return null;
  }
}
