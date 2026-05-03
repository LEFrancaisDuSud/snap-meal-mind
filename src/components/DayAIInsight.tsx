import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { MealRow } from "@/types/nutrition";

interface Props {
  meals: MealRow[];
  targets: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

export default function DayAIInsight({ meals, targets }: Props) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<"good" | "warn" | "bad" | null>(null);

  const handleAnalyze = async () => {
    if (meals.length === 0) {
      toast.info("Ajoute au moins un repas pour l'analyse.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        targets,
        meals: meals.map((m) => ({
          dish_name: m.dish_name,
          meal_type: m.meal_type,
          calories: Number(m.total_calories),
          protein_g: Number(m.total_protein_g),
          carbs_g: Number(m.total_carbs_g),
          fat_g: Number(m.total_fat_g),
        })),
      };
      const { data, error } = await supabase.functions.invoke("analyze-day", {
        body: payload,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setSummary((data as any).summary);
      setVerdict((data as any).verdict || "warn");
    } catch (e: any) {
      toast.error(e?.message || "Analyse indisponible");
    } finally {
      setLoading(false);
    }
  };

  const verdictBg =
    verdict === "good"
      ? "bg-primary/15 border-primary/40"
      : verdict === "bad"
      ? "bg-destructive/15 border-destructive/40"
      : "bg-tertiary/15 border-tertiary/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-5 mt-4 rounded-3xl p-4 border ${
        summary ? verdictBg : "border-border bg-card"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
          <Sparkles size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="text-foreground font-bold">Analyse IA</div>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="text-primary text-xs font-bold tracking-wider disabled:opacity-50 flex items-center gap-1"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : summary ? (
                "REFAIRE"
              ) : (
                "ANALYSER"
              )}
            </button>
          </div>
          <div className="text-muted-foreground text-sm mt-1 leading-relaxed">
            {summary || "Obtiens un résumé court de l'équilibre de ta journée."}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
