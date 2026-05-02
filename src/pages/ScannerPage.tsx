import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CameraScreen from "@/components/CameraScreen";
import AnalyzingScreen from "@/components/AnalyzingScreen";
import ResultsScreen from "@/components/ResultsScreen";
import ErrorScreen from "@/components/ErrorScreen";
import type { NutritionData, PortionMultiplier, Screen } from "@/types/nutrition";
import { analyzeFood } from "@/lib/analyze";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { todayISO } from "@/lib/dates";
import { xpProgress } from "@/lib/tdee";

const screenVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function ScannerPage() {
  const { user } = useAuth();
  const { profile, refresh: refreshProfile } = useProfile();
  const nav = useNavigate();

  const [currentScreen, setCurrentScreen] = useState<Screen>("camera");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<NutritionData | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState<PortionMultiplier>(1);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

  const handleCapture = (dataUrl: string) => {
    setSelectedImage(dataUrl);
    setCurrentScreen("analyzing");
  };

  const reset = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setError(null);
    setPortionMultiplier(1);
    setCurrentScreen("camera");
  };

  useEffect(() => {
    if (currentScreen !== "analyzing" || !selectedImage) return;
    let cancelled = false;
    const minDelay = new Promise((r) => setTimeout(r, 2500));
    Promise.all([analyzeFood(selectedImage), minDelay])
      .then(([data]) => {
        if (cancelled) return;
        setAnalysisResult(data);
        setCurrentScreen("results");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Une erreur s'est produite");
        setCurrentScreen("error");
      });
    return () => { cancelled = true; };
  }, [currentScreen, selectedImage]);

  const handleLogMeal = async () => {
    if (!user || !analysisResult || !selectedImage) return;
    setSaving(true);
    try {
      const m = portionMultiplier;
      const { error: insertErr } = await supabase.from("meals").insert({
        user_id: user.id,
        dish_name: analysisResult.dish_name,
        meal_type: analysisResult.meal_type,
        image_url: selectedImage,
        total_calories: Math.round(analysisResult.total_calories * m),
        total_protein_g: round1(analysisResult.total_protein_g * m),
        total_carbs_g: round1(analysisResult.total_carbs_g * m),
        total_fat_g: round1(analysisResult.total_fat_g * m),
        health_score: analysisResult.health_score,
        health_tip: analysisResult.health_tip,
        components: analysisResult.components as any,
        portion_multiplier: m,
        log_date: todayISO(),
      });
      if (insertErr) throw insertErr;

      // XP + streak
      const today = todayISO();
      const last = profile?.last_log_date;
      let newStreak = profile?.current_streak || 0;
      if (last !== today) {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const yISO = yest.toISOString().slice(0, 10);
        newStreak = last === yISO ? newStreak + 1 : 1;
      }
      const newXP = (profile?.xp || 0) + 25;
      const newLevel = xpProgress(newXP).level;
      const bestStreak = Math.max(profile?.best_streak || 0, newStreak);

      await supabase
        .from("profiles")
        .update({
          xp: newXP,
          level: newLevel,
          current_streak: newStreak,
          best_streak: bestStreak,
          last_log_date: today,
        })
        .eq("user_id", user.id);

      await refreshProfile();
      toast.success("Repas enregistré ! +25 XP 🎉");
      setTimeout(() => nav("/"), 500);
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = () => {
    reset();
    setTimeout(() => fallbackInputRef.current?.click(), 100);
  };

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setCurrentScreen("analyzing");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        {currentScreen === "camera" && (
          <motion.div key="camera" variants={screenVariants} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.25 }} className="absolute inset-0">
            <CameraScreen facingMode={facingMode} setFacingMode={setFacingMode} onCapture={handleCapture} onClose={() => nav("/")} />
          </motion.div>
        )}
        {currentScreen === "analyzing" && selectedImage && (
          <motion.div key="analyzing" variants={screenVariants} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.25 }} className="absolute inset-0">
            <AnalyzingScreen imageBase64={selectedImage} />
          </motion.div>
        )}
        {currentScreen === "results" && selectedImage && analysisResult && (
          <motion.div key="results" variants={screenVariants} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.25 }} className="absolute inset-0">
            <ResultsScreen
              imageBase64={selectedImage}
              data={analysisResult}
              setData={setAnalysisResult}
              portionMultiplier={portionMultiplier}
              setPortionMultiplier={setPortionMultiplier}
              onLogged={handleLogMeal}
              onRetake={reset}
              saving={saving}
            />
          </motion.div>
        )}
        {currentScreen === "error" && (
          <motion.div key="error" variants={screenVariants} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.25 }} className="absolute inset-0">
            <ErrorScreen message={error || "Erreur inconnue"} onRetry={reset} onChangePhoto={handleChangePhoto} />
          </motion.div>
        )}
      </AnimatePresence>
      <input ref={fallbackInputRef} type="file" accept="image/*" onChange={handleFallbackFile} className="hidden" />
    </div>
  );
}

function round1(n: number) { return Math.round(n * 10) / 10; }
