import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CameraScreen from "@/components/CameraScreen";
import AnalyzingScreen from "@/components/AnalyzingScreen";
import ResultsScreen from "@/components/ResultsScreen";
import ErrorScreen from "@/components/ErrorScreen";
import type { NutritionData, PortionMultiplier, Screen } from "@/types/nutrition";
import { analyzeFood } from "@/lib/analyze";

const screenVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("camera");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<NutritionData | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState<PortionMultiplier>(1);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);

  // Fallback file input for "Change photo" from error screen
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

  // Run analysis whenever we enter analyzing screen
  useEffect(() => {
    if (currentScreen !== "analyzing" || !selectedImage) return;
    let cancelled = false;
    const minDelay = new Promise((r) => setTimeout(r, 3000));

    Promise.all([analyzeFood(selectedImage), minDelay])
      .then(([data]) => {
        if (cancelled) return;
        setAnalysisResult(data);
        setCurrentScreen("results");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Something went wrong");
        setCurrentScreen("error");
      });

    return () => {
      cancelled = true;
    };
  }, [currentScreen, selectedImage]);

  const handleChangePhoto = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setError(null);
    setCurrentScreen("camera");
    // Trigger file input shortly after reset
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
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="phone-shell">
        <AnimatePresence mode="wait">
          {currentScreen === "camera" && (
            <motion.div
              key="camera"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <CameraScreen
                facingMode={facingMode}
                setFacingMode={setFacingMode}
                onCapture={handleCapture}
              />
            </motion.div>
          )}

          {currentScreen === "analyzing" && selectedImage && (
            <motion.div
              key="analyzing"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <AnalyzingScreen imageBase64={selectedImage} />
            </motion.div>
          )}

          {currentScreen === "results" && selectedImage && analysisResult && (
            <motion.div
              key="results"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <ResultsScreen
                imageBase64={selectedImage}
                data={analysisResult}
                setData={setAnalysisResult}
                portionMultiplier={portionMultiplier}
                setPortionMultiplier={setPortionMultiplier}
                onLogged={reset}
                onRetake={reset}
              />
            </motion.div>
          )}

          {currentScreen === "error" && (
            <motion.div
              key="error"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <ErrorScreen
                message={error || "Unknown error"}
                onRetry={reset}
                onChangePhoto={handleChangePhoto}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={fallbackInputRef}
          type="file"
          accept="image/*"
          onChange={handleFallbackFile}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default Index;
