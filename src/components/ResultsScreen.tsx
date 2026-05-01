import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { NutritionData, PortionMultiplier, IngredientItem } from "@/types/nutrition";
import { useCountUp } from "@/hooks/useCountUp";
import EditIngredientModal from "./EditIngredientModal";

interface Props {
  imageBase64: string;
  data: NutritionData;
  setData: (d: NutritionData) => void;
  portionMultiplier: PortionMultiplier;
  setPortionMultiplier: (p: PortionMultiplier) => void;
  onLogged: () => void;
  onRetake: () => void;
}

const MEAL_EMOJI: Record<NutritionData["meal_type"], string> = {
  Breakfast: "🌅",
  Lunch: "☀️",
  Dinner: "🌙",
  Snack: "🍎",
};

const PORTIONS: PortionMultiplier[] = [0.5, 1, 1.5, 2];

export default function ResultsScreen({
  imageBase64,
  data,
  setData,
  portionMultiplier,
  setPortionMultiplier,
  onLogged,
  onRetake,
}: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);

  const totalCals = data.total_calories * portionMultiplier;
  const animatedCals = useCountUp(Math.round(totalCals), 1000);

  const macroValues = useMemo(
    () => ({
      protein: round1(data.total_protein_g * portionMultiplier),
      carbs: round1(data.total_carbs_g * portionMultiplier),
      fat: round1(data.total_fat_g * portionMultiplier),
    }),
    [data, portionMultiplier],
  );

  const healthColor =
    data.health_score >= 7
      ? "hsl(var(--primary))"
      : data.health_score >= 4
      ? "hsl(var(--accent))"
      : "hsl(var(--destructive))";

  const handleSaveIngredient = (updated: IngredientItem) => {
    if (editingIndex === null) return;
    const components = data.components.map((c, i) => (i === editingIndex ? updated : c));
    const totals = components.reduce(
      (acc, c) => ({
        cal: acc.cal + (Number(c.calories) || 0),
        p: acc.p + (Number(c.protein_g) || 0),
        c: acc.c + (Number(c.carbs_g) || 0),
        f: acc.f + (Number(c.fat_g) || 0),
      }),
      { cal: 0, p: 0, c: 0, f: 0 },
    );
    setData({
      ...data,
      components,
      total_calories: Math.round(totals.cal),
      total_protein_g: round1(totals.p),
      total_carbs_g: round1(totals.c),
      total_fat_g: round1(totals.f),
    });
    const idx = editingIndex;
    setEditingIndex(null);
    setFlashIndex(idx);
    setTimeout(() => setFlashIndex(null), 700);
  };

  const handleLog = () => {
    toast.success("Meal logged! 🎉", { duration: 2000 });
    setTimeout(onLogged, 600);
  };

  // Distribute pills: first 2 top-left, rest bottom-right
  const pills = data.components.slice(0, 6);

  return (
    <div className="absolute inset-0 bg-background overflow-hidden flex flex-col">
      {/* Top photo section */}
      <div className="relative w-full shrink-0" style={{ height: 220 }}>
        <img
          src={imageBase64}
          alt={data.dish_name}
          className="absolute inset-0 w-full h-full object-cover rounded-b-3xl"
        />
        <div
          className="absolute inset-0 rounded-b-3xl"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 60%, rgba(10,10,10,0.85) 100%)",
          }}
        />
        {pills.map((c, i) => {
          const topLeft = i < 2;
          const style: React.CSSProperties = topLeft
            ? { top: 14 + i * 30, left: 14 }
            : { bottom: 14 + (i - 2) * 30, right: 14 };
          return (
            <motion.div
              key={`${c.name}-${i}`}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 * i, type: "spring", stiffness: 260, damping: 18 }}
              className="absolute bg-white/95 text-black text-xs font-medium px-2 py-1 rounded-full shadow-md max-w-[55%] truncate"
              style={style}
            >
              {c.emoji} {c.name}
            </motion.div>
          );
        })}
      </div>

      {/* Scrollable sheet */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 -mt-6 bg-background rounded-t-3xl relative overflow-hidden flex flex-col"
      >
        <div className="mx-auto w-10 h-1 rounded-full bg-foreground/20 mt-3 shrink-0" />

        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pt-3 pb-32">
          {/* Title row */}
          <div className="flex items-center gap-3">
            <h2 className="text-foreground font-bold text-xl truncate flex-1">
              {data.dish_name}
            </h2>
            <span className="bg-primary/15 text-primary text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
              {MEAL_EMOJI[data.meal_type]} {data.meal_type}
            </span>
          </div>

          {/* Calorie hero */}
          <div className="my-5 text-center">
            <div className="text-foreground font-bold leading-none" style={{ fontSize: 56 }}>
              {animatedCals}
            </div>
            <div className="text-primary text-lg font-semibold mt-1">kcal</div>
          </div>

          {/* Macros row */}
          <div className="grid grid-cols-3 gap-2">
            <MacroCard color="hsl(var(--macro-protein))" label="Protein" value={macroValues.protein} />
            <MacroCard color="hsl(var(--macro-carbs))" label="Carbs" value={macroValues.carbs} />
            <MacroCard color="hsl(var(--macro-fat))" label="Fat" value={macroValues.fat} />
          </div>

          {/* Health score */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <span className="text-foreground font-semibold text-sm">Health Score</span>
              <span className="font-bold text-sm" style={{ color: healthColor }}>
                {data.health_score}/10
              </span>
            </div>
            <div className="mt-2 h-2 bg-surface rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(data.health_score / 10) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{ background: healthColor }}
              />
            </div>
            {data.health_tip && (
              <p className="text-muted-foreground italic text-sm mt-2 leading-relaxed">
                {data.health_tip}
              </p>
            )}
          </div>

          {/* Ingredients */}
          <h3 className="text-foreground font-bold mt-6 mb-3">Detected Ingredients</h3>
          <div className="space-y-2">
            {data.components.length === 0 && (
              <div className="text-muted-foreground text-sm bg-card rounded-2xl p-4">
                No ingredients detected.
              </div>
            )}
            {data.components.map((c, i) => {
              const total = (c.protein_g + c.carbs_g + c.fat_g) || 1;
              const pPct = (c.protein_g / total) * 100;
              const cPct = (c.carbs_g / total) * 100;
              const fPct = (c.fat_g / total) * 100;
              return (
                <motion.div
                  key={i}
                  animate={
                    flashIndex === i
                      ? { backgroundColor: ["hsl(var(--primary) / 0.3)", "hsl(var(--card))"] }
                      : {}
                  }
                  transition={{ duration: 0.7 }}
                  className="bg-card rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl leading-none mt-0.5">{c.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground font-semibold truncate">{c.name}</div>
                      <div className="text-muted-foreground text-xs mt-0.5 truncate">
                        {c.quantity_estimate}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-foreground font-bold text-sm whitespace-nowrap">
                        {Math.round(c.calories * portionMultiplier)} kcal
                      </div>
                      <button
                        onClick={() => setEditingIndex(i)}
                        className="text-muted-foreground hover:text-foreground p-1"
                        aria-label="Edit ingredient"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex h-1 w-full rounded-full overflow-hidden bg-surface">
                    <div style={{ width: `${pPct}%`, background: "hsl(var(--macro-protein))" }} />
                    <div style={{ width: `${cPct}%`, background: "hsl(var(--macro-carbs))" }} />
                    <div style={{ width: `${fPct}%`, background: "hsl(var(--macro-fat))" }} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Portion */}
          <div className="mt-6">
            <div className="text-muted-foreground text-sm mb-2">Portion size</div>
            <div className="flex gap-2">
              {PORTIONS.map((p) => {
                const selected = p === portionMultiplier;
                return (
                  <motion.button
                    key={p}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setPortionMultiplier(p)}
                    className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground border border-border"
                    }`}
                  >
                    {p}x
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky bottom buttons */}
        <div
          className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-6 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 40%)",
          }}
        >
          <div className="pointer-events-auto space-y-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleLog}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-full"
            >
              ✅ Log this meal
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onRetake}
              className="w-full border border-foreground/20 text-foreground py-4 rounded-full"
            >
              📷 Retake photo
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {editingIndex !== null && (
          <EditIngredientModal
            ingredient={data.components[editingIndex]}
            onSave={handleSaveIngredient}
            onClose={() => setEditingIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MacroCard({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="bg-card rounded-xl p-3 text-center relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: 3, background: color }}
      />
      <div className="text-foreground font-bold text-base mt-1">{value}g</div>
      <div className="text-muted-foreground text-xs mt-0.5">{label}</div>
    </div>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
