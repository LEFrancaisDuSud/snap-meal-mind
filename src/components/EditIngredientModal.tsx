import { useState } from "react";
import { motion } from "framer-motion";
import type { IngredientItem } from "@/types/nutrition";

interface Props {
  ingredient: IngredientItem;
  onSave: (updated: IngredientItem) => void;
  onClose: () => void;
}

export default function EditIngredientModal({ ingredient, onSave, onClose }: Props) {
  const [form, setForm] = useState<IngredientItem>({ ...ingredient });

  const update = (key: keyof IngredientItem, value: string) => {
    setForm((f) => ({
      ...f,
      [key]:
        key === "name" || key === "emoji" || key === "quantity_estimate"
          ? value
          : Number(value) || 0,
    }));
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[430px] bg-card rounded-t-3xl p-6 pb-8 shadow-2xl"
      >
        <div className="mx-auto w-10 h-1 rounded-full bg-foreground/20 mb-4" />
        <h3 className="text-foreground font-bold text-lg">Modifier l'ingrédient</h3>
        <p className="text-muted-foreground text-sm mt-1">{ingredient.emoji} {ingredient.name}</p>

        <div className="mt-5 space-y-3 max-h-[55vh] overflow-y-auto scrollbar-hide">
          <Field label="Nom">
            <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)}
              className="w-full bg-surface text-foreground rounded-xl p-3 outline-none border border-transparent focus:border-primary/50" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Calories">
              <input type="number" value={form.calories} onChange={(e) => update("calories", e.target.value)}
                className="w-full bg-surface text-foreground rounded-xl p-3 outline-none border border-transparent focus:border-primary/50" />
            </Field>
            <Field label="Protéines (g)">
              <input type="number" value={form.protein_g} onChange={(e) => update("protein_g", e.target.value)}
                className="w-full bg-surface text-foreground rounded-xl p-3 outline-none border border-transparent focus:border-primary/50" />
            </Field>
            <Field label="Glucides (g)">
              <input type="number" value={form.carbs_g} onChange={(e) => update("carbs_g", e.target.value)}
                className="w-full bg-surface text-foreground rounded-xl p-3 outline-none border border-transparent focus:border-primary/50" />
            </Field>
            <Field label="Lipides (g)">
              <input type="number" value={form.fat_g} onChange={(e) => update("fat_g", e.target.value)}
                className="w-full bg-surface text-foreground rounded-xl p-3 outline-none border border-transparent focus:border-primary/50" />
            </Field>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => onSave(form)}
            className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-full">
            Enregistrer
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
            className="w-full border border-border text-foreground py-3.5 rounded-full">
            Annuler
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-muted-foreground text-xs font-medium block mb-1.5">{label}</span>
      {children}
    </label>
  );
}
