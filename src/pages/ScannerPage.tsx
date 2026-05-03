import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Camera, Barcode, Mic } from "lucide-react";
import CameraScreen from "@/components/CameraScreen";
import AnalyzingScreen from "@/components/AnalyzingScreen";
import ResultsScreen from "@/components/ResultsScreen";
import ErrorScreen from "@/components/ErrorScreen";
import BarcodeScanner from "@/components/BarcodeScanner";
import BarcodeProductCard from "@/components/BarcodeProductCard";
import VoiceCapture from "@/components/VoiceCapture";
import type { NutritionData, PortionMultiplier } from "@/types/nutrition";
import { analyzeFood } from "@/lib/analyze";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { uploadMealImage } from "@/lib/storage";
import { logMeal } from "@/lib/logMeal";
import { fetchProduct, productToNutrition, guessMealType, type OFFProduct } from "@/lib/openfoodfacts";

type Mode = "photo" | "barcode" | "voice";
type Phase = "capture" | "analyzing" | "results" | "error" | "barcode-result";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function ScannerPage() {
  const { user } = useAuth();
  const { profile, refresh: refreshProfile } = useProfile();
  const nav = useNavigate();

  const [mode, setMode] = useState<Mode>("photo");
  const [phase, setPhase] = useState<Phase>("capture");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<NutritionData | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState<PortionMultiplier>(1);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<OFFProduct | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setError(null);
    setPortionMultiplier(1);
    setScannedProduct(null);
    setPhase("capture");
  };

  // PHOTO flow
  const handleCapture = (dataUrl: string) => {
    setSelectedImage(dataUrl);
    setPhase("analyzing");
  };

  useEffect(() => {
    if (phase !== "analyzing" || !selectedImage) return;
    let cancelled = false;
    const minDelay = new Promise((r) => setTimeout(r, 1800));
    Promise.all([analyzeFood(selectedImage), minDelay])
      .then(([data]) => {
        if (cancelled) return;
        setAnalysisResult(data);
        setPhase("results");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Une erreur s'est produite");
        setPhase("error");
      });
    return () => { cancelled = true; };
  }, [phase, selectedImage]);

  const handleLogMealPhoto = async () => {
    if (!user || !analysisResult || !selectedImage) return;
    setSaving(true);
    try {
      const imageUrl = await uploadMealImage(user.id, selectedImage);
      await logMeal({
        userId: user.id,
        data: analysisResult,
        imageUrl,
        portionMultiplier,
        profile,
      });
      await refreshProfile();
      toast.success("Repas enregistré ! +25 XP 🎉");
      setTimeout(() => nav("/"), 400);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  // BARCODE flow
  const handleBarcodeDetected = async (code: string) => {
    if (productLoading || scannedProduct) return;
    setProductLoading(true);
    try {
      const p = await fetchProduct(code);
      if (!p) {
        toast.error(`Produit introuvable (code ${code})`);
        return;
      }
      setScannedProduct(p);
      setPhase("barcode-result");
    } catch (e: any) {
      toast.error("Erreur réseau OpenFoodFacts");
    } finally {
      setProductLoading(false);
    }
  };

  const handleAddBarcodeMeal = async (grams: number, mealType: any) => {
    if (!user || !scannedProduct) return;
    setSaving(true);
    try {
      const data = productToNutrition(scannedProduct, grams);
      data.meal_type = mealType;
      await logMeal({
        userId: user.id,
        data,
        imageUrl: scannedProduct.imageUrl || null,
        portionMultiplier: 1,
        profile,
      });
      await refreshProfile();
      toast.success("Produit ajouté ! +25 XP 🎉");
      setTimeout(() => nav("/"), 400);
    } catch (e: any) {
      toast.error(e?.message || "Erreur enregistrement");
    } finally {
      setSaving(false);
    }
  };

  // VOICE flow
  const handleVoiceTranscript = async (text: string) => {
    setPhase("analyzing");
    try {
      const { data, error } = await supabase.functions.invoke("parse-voice-meal", {
        body: { transcript: text },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setSelectedImage(null);
      setAnalysisResult(data as NutritionData);
      setPhase("results");
    } catch (e: any) {
      setError(e?.message || "Erreur");
      setPhase("error");
    }
  };

  const handleChangePhoto = () => {
    reset();
    setMode("photo");
    setTimeout(() => fallbackInputRef.current?.click(), 100);
  };

  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setPhase("analyzing");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const showModeSwitcher = phase === "capture";

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === "capture" && mode === "photo" && (
          <motion.div key="photo" {...fadeUp} transition={{ duration: 0.2 }} className="absolute inset-0">
            <CameraScreen
              facingMode={facingMode}
              setFacingMode={setFacingMode}
              onCapture={handleCapture}
              onClose={() => nav("/")}
            />
          </motion.div>
        )}

        {phase === "capture" && mode === "barcode" && (
          <motion.div key="barcode" {...fadeUp} transition={{ duration: 0.2 }} className="absolute inset-0">
            <BarcodeScanner
              onDetected={handleBarcodeDetected}
              onClose={() => nav("/")}
              paused={productLoading}
            />
            {productLoading && (
              <div className="absolute inset-x-0 bottom-24 flex justify-center z-30">
                <div className="bg-card/90 backdrop-blur-md text-foreground text-sm px-4 py-2 rounded-full">
                  Recherche du produit…
                </div>
              </div>
            )}
          </motion.div>
        )}

        {phase === "capture" && mode === "voice" && (
          <motion.div key="voice" {...fadeUp} transition={{ duration: 0.2 }} className="absolute inset-0">
            <VoiceCapture onTranscript={handleVoiceTranscript} onClose={() => nav("/")} />
          </motion.div>
        )}

        {phase === "analyzing" && (
          <motion.div key="analyzing" {...fadeUp} transition={{ duration: 0.2 }} className="absolute inset-0">
            <AnalyzingScreen imageBase64={selectedImage || ""} />
          </motion.div>
        )}

        {phase === "results" && analysisResult && (
          <motion.div key="results" {...fadeUp} transition={{ duration: 0.2 }} className="absolute inset-0">
            <ResultsScreen
              imageBase64={selectedImage || ""}
              data={analysisResult}
              setData={setAnalysisResult}
              portionMultiplier={portionMultiplier}
              setPortionMultiplier={setPortionMultiplier}
              onLogged={handleLogMealPhoto}
              onRetake={reset}
              saving={saving}
            />
          </motion.div>
        )}

        {phase === "barcode-result" && scannedProduct && (
          <BarcodeProductCard
            key="barcode-result"
            product={scannedProduct}
            defaultMealType={guessMealType()}
            onClose={reset}
            onAdd={handleAddBarcodeMeal}
            saving={saving}
          />
        )}

        {phase === "error" && (
          <motion.div key="error" {...fadeUp} transition={{ duration: 0.2 }} className="absolute inset-0">
            <ErrorScreen message={error || "Erreur inconnue"} onRetry={reset} onChangePhoto={handleChangePhoto} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode switcher pill */}
      {showModeSwitcher && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-40"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 130px)" }}
        >
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-1">
            <ModeBtn active={mode === "photo"} onClick={() => setMode("photo")} icon={<Camera size={16} />} label="Photo" />
            <ModeBtn active={mode === "barcode"} onClick={() => setMode("barcode")} icon={<Barcode size={16} />} label="Code-barres" />
            <ModeBtn active={mode === "voice"} onClick={() => setMode("voice")} icon={<Mic size={16} />} label="Voix" />
          </div>
        </div>
      )}

      <input ref={fallbackInputRef} type="file" accept="image/*" onChange={handleFallbackFile} className="hidden" />
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-colors duration-200 ${
        active ? "bg-primary text-primary-foreground" : "text-white/80"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
