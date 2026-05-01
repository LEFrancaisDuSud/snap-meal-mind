import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils } from "lucide-react";

interface Props {
  imageBase64: string;
}

const TAGS = [
  "🔍 Detecting ingredients...",
  "⚡ Calculating calories...",
  "✅ Almost done!",
];

export default function AnalyzingScreen({ imageBase64 }: Props) {
  const [visibleTags, setVisibleTags] = useState(0);

  useEffect(() => {
    const timers = TAGS.map((_, i) =>
      setTimeout(() => setVisibleTags((v) => Math.max(v, i + 1)), i * 1000 + 200),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${imageBase64})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(20px)",
          transform: "scale(1.15)",
        }}
      />
      <div className="absolute inset-0 bg-black/65" />

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl"
        >
          <div className="flex flex-col items-center">
            <div className="relative mb-5 w-20 h-20 flex items-center justify-center">
              <span
                className="absolute inset-0 rounded-full pulse-ring"
                style={{ background: "hsl(var(--primary) / 0.35)" }}
              />
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: "hsl(var(--primary) / 0.18)" }}
              />
              <Utensils size={36} className="relative text-primary" />
            </div>

            <h2 className="text-foreground font-bold text-xl text-center">
              Analyzing your meal...
            </h2>
            <p className="text-muted-foreground text-sm mt-1 text-center">
              AI is identifying your food
            </p>

            <div className="w-full mt-6 h-2 bg-surface rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4, ease: "easeOut" }}
              />
            </div>

            <div className="mt-6 w-full space-y-2 min-h-[112px]">
              <AnimatePresence>
                {TAGS.slice(0, visibleTags).map((t, i) => (
                  <motion.div
                    key={t}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="bg-surface text-foreground/90 text-sm rounded-xl px-3 py-2"
                  >
                    {t}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
