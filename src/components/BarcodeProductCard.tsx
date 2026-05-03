import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Minus, Plus, X, Check } from "lucide-react";
import type { OFFProduct } from "@/lib/openfoodfacts";
import { nutriScoreToHealth } from "@/lib/openfoodfacts";
import type { MealType } from "@/types/nutrition";

const MEAL_TYPES: MealType[] = [
  "Petit-déjeuner",
  "Déjeuner",
  "Dîner",
  "Collation",
];

interface Props {
  product: OFFProduct;
  defaultMealType: MealType;
  onClose: () => void;
  onAdd: (grams: number, mealType: MealType) => void;
  saving?: boolean;
}

export default function BarcodeProductCard({
  product,
  defaultMealType,
  onClose,
  onAdd,
  saving,
}: Props) {
  const [grams, setGrams] = useState(product.servingSizeG || 100);
  const [mealType, setMealType] = useState<MealType>(defaultMealType);

  const health = useMemo(
    () => nutriScoreToHealth(product.nutriScore),
    [product],
  );

  const ratio = grams / 100;
  const cal = Math.round(product.per100g.calories * ratio);
  const p = Math.round(product.per100g.protein_g * ratio * 10) / 10;
  const c = Math.round(product.per100g.carbs_g * ratio * 10) / 10;
  const f = Math.round(product.per100g.fat_g * ratio * 10) / 10;

  const healthBg =
    health.color === "green"
      ? "bg-primary/20 text-primary"
      : health.color === "orange"
      ? "bg-tertiary/20 text-tertiary"
      : "bg-destructive/20 text-destructive";

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="absolute inset-0 z-40 flex flex-col bg-background"
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-surface text-foreground flex items-center justify-center"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
        <div className="text-foreground font-bold">Produit scanné</div>
        <span className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pb-40">
        <div className="bg-card rounded-3xl p-4 flex gap-4 items-center">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface shrink-0 flex items-center justify-center">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl">🛒</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-foreground font-bold leading-tight line-clamp-2">
              {product.name}
            </div>
            {product.brand && (
              <div className="text-muted-foreground text-xs mt-1 truncate">
                {product.brand}
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              {product.nutriScore && (
                <span
                  className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full ${healthBg}`}
                >
                  Nutri-Score {product.nutriScore.toUpperCase()}
                </span>
              )}
              <span className="text-muted-foreground text-[11px]">
                {product.per100g.calories} kcal / 100g
              </span>
            </div>
          </div>
        </div>

        <div
          className={`mt-3 rounded-2xl p-3 text-sm ${healthBg} flex items-center gap-2`}
        >
          {health.color === "green" ? (
            <Check size={16} />
          ) : (
            <span className="text-base">⚠️</span>
          )}
          <span className="font-medium">{health.tip}</span>
        </div>

        <div className="mt-5 bg-card rounded-3xl p-4">
          <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
            Quantité
          </div>
          <div className="flex items-center justify-between gap-3 mt-2">
            <button
              onClick={() => setGrams((g) => Math.max(5, g - 10))}
              className="w-10 h-10 rounded-full bg-surface text-foreground flex items-center justify-center"
              aria-label="Moins"
            >
              <Minus size={18} />
            </button>
            <div className="flex-1 text-center">
              <input
                type="number"
                value={grams}
                onChange={(e) =>
                  setGrams(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-full bg-transparent text-foreground font-extrabold text-3xl text-center outline-none"
              />
              <div className="text-muted-foreground text-xs">grammes</div>
            </div>
            <button
              onClick={() => setGrams((g) => g + 10)}
              className="w-10 h-10 rounded-full bg-surface text-foreground flex items-center justify-center"
              aria-label="Plus"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4">
            <Stat label="kcal" value={cal} />
            <Stat label="P" value={`${p}g`} color="hsl(var(--macro-protein))" />
            <Stat label="G" value={`${c}g`} color="hsl(var(--macro-carbs))" />
            <Stat label="L" value={`${f}g`} color="hsl(var(--macro-fat))" />
          </div>
        </div>

        <div className="mt-5">
          <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2">
            Type de repas
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MEAL_TYPES.map((t) => {
              const active = mealType === t;
              return (
                <button
                  key={t}
                  onClick={() => setMealType(t)}
                  className={`py-3 rounded-2xl text-sm font-semibold transition-colors duration-200 ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground border border-border"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-6 bg-gradient-to-t from-background via-background/95 to-transparent">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onAdd(grams, mealType)}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-full disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "✅ Ajouter au repas"}
        </motion.button>
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-surface rounded-xl py-2 text-center">
      <div
        className="text-foreground font-extrabold text-base leading-none"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}
