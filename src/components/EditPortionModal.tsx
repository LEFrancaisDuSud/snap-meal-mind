import { motion } from "framer-motion";
import { useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { MealRow } from "@/types/nutrition";

interface Props {
  meal: MealRow;
  onClose: () => void;
  onSave: (newMultiplier: number) => Promise<void> | void;
}

const PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2];

export default function EditPortionModal({ meal, onClose, onSave }: Props) {
  const [multiplier, setMultiplier] = useState<number>(
    Number(meal.portion_multiplier) || 1,
  );
  const [saving, setSaving] = useState(false);

  const cal = Math.round(Number(meal.total_calories) * (multiplier / Number(meal.portion_multiplier || 1)));
  const p = round1(Number(meal.total_protein_g) * (multiplier / Number(meal.portion_multiplier || 1)));
  const c = round1(Number(meal.total_carbs_g) * (multiplier / Number(meal.portion_multiplier || 1)));
  const f = round1(Number(meal.total_fat_g) * (multiplier / Number(meal.portion_multiplier || 1)));

  const handleSave = async () => {
    setSaving(true);
    await onSave(multiplier);
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 280 }}
        className="bg-card w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 m-0 sm:m-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-foreground font-bold">{meal.dish_name}</div>
            <div className="text-muted-foreground text-xs">Ajuster la portion</div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface text-muted-foreground flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between bg-surface rounded-2xl p-3">
          <button
            onClick={() => setMultiplier((m) => Math.max(0.25, +(m - 0.25).toFixed(2)))}
            className="w-10 h-10 rounded-full bg-card text-foreground flex items-center justify-center"
          >
            <Minus size={18} />
          </button>
          <div className="text-center">
            <div className="text-foreground font-extrabold text-3xl leading-none">
              {multiplier}x
            </div>
            <div className="text-muted-foreground text-xs mt-1">portion</div>
          </div>
          <button
            onClick={() => setMultiplier((m) => +(m + 0.25).toFixed(2))}
            className="w-10 h-10 rounded-full bg-card text-foreground flex items-center justify-center"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="grid grid-cols-6 gap-1.5 mt-3">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => setMultiplier(p)}
              className={`py-2 text-xs font-bold rounded-xl transition-colors duration-200 ${
                multiplier === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground"
              }`}
            >
              {p}x
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          <Stat label="kcal" value={cal} />
          <Stat label="P" value={`${p}g`} color="hsl(var(--macro-protein))" />
          <Stat label="G" value={`${c}g`} color="hsl(var(--macro-carbs))" />
          <Stat label="L" value={`${f}g`} color="hsl(var(--macro-fat))" />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-full mt-5 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </motion.div>
    </motion.div>
  );
}

function Stat({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div className="bg-surface rounded-xl py-2 text-center">
      <div className="text-foreground font-bold text-sm" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="text-muted-foreground text-[10px] uppercase mt-0.5">{label}</div>
    </div>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
