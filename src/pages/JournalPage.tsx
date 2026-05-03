import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, Bell, Plus, Rocket, Trash2, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useMeals, totalsFromMeals, groupMealsByType, MEAL_TYPES } from "@/hooks/useMeals";
import { isoOf, weekAround, shortDay, dayNumber } from "@/lib/dates";
import ProgressRing from "@/components/ProgressRing";
import MealTypeIcon, { mealTypeMeta } from "@/components/MealTypeIcon";
import DayAIInsight from "@/components/DayAIInsight";
import EditPortionModal from "@/components/EditPortionModal";
import type { MealRow, MealType } from "@/types/nutrition";

export default function JournalPage() {
  const { profile } = useProfile();
  const [selected, setSelected] = useState<Date>(new Date());
  const dateISO = isoOf(selected);
  const { meals, refresh } = useMeals(dateISO);
  const nav = useNavigate();

  const totals = totalsFromMeals(meals);
  const groups = useMemo(() => groupMealsByType(meals), [meals]);

  const target = profile?.daily_calories || 2000;
  const remaining = Math.max(0, target - totals.cal);
  const consumedPct = Math.min(100, (totals.cal / target) * 100);

  const days = weekAround(selected, 3, 3);

  const proteinTarget = profile?.daily_protein_g || 120;
  const challengePct = Math.min(100, Math.round((totals.p / proteinTarget) * 100));

  const [openType, setOpenType] = useState<MealType | null>("Petit-déjeuner");
  const [editing, setEditing] = useState<MealRow | null>(null);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Repas supprimé");
      refresh();
    }
  };

  const handleSavePortion = async (m: MealRow, newMult: number) => {
    const ratio = newMult / Number(m.portion_multiplier || 1);
    const { error } = await supabase
      .from("meals")
      .update({
        portion_multiplier: newMult,
        total_calories: Math.round(Number(m.total_calories) * ratio),
        total_protein_g: Math.round(Number(m.total_protein_g) * ratio * 10) / 10,
        total_carbs_g: Math.round(Number(m.total_carbs_g) * ratio * 10) / 10,
        total_fat_g: Math.round(Number(m.total_fat_g) * ratio * 10) / 10,
      })
      .eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Portion mise à jour");
    setEditing(null);
    refresh();
  };

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between border-b border-border">
        <button className="text-foreground p-1" aria-label="Menu">
          <Menu size={22} />
        </button>
        <h1 className="text-primary font-extrabold text-xl">TrackCal</h1>
        <button className="text-primary p-1" aria-label="Notifications">
          <Bell size={22} />
        </button>
      </div>

      {/* Date picker */}
      <div className="px-3 py-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {days.map((d) => {
          const active = isoOf(d) === dateISO;
          return (
            <button
              key={d.toISOString()}
              onClick={() => setSelected(d)}
              className={`shrink-0 w-14 h-16 rounded-2xl flex flex-col items-center justify-center transition-colors ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <span className="text-[10px] font-bold tracking-wider">{shortDay(d)}</span>
              <span className="text-xl font-extrabold leading-none mt-1">{dayNumber(d)}</span>
            </button>
          );
        })}
      </div>

      {/* Energy summary */}
      <div className="mx-5 bg-card rounded-3xl p-5 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-foreground font-extrabold text-3xl">{totals.cal}</span>
            <span className="text-muted-foreground text-sm">/ {target} kcal</span>
          </div>
          <div className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest mt-0.5">
            Énergie restante
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <MacroBarLabel label="PRO" value={totals.p} target={profile?.daily_protein_g || 150} color="hsl(var(--macro-protein))" />
            <MacroBarLabel label="GLU" value={totals.c} target={profile?.daily_carbs_g || 200} color="hsl(var(--macro-carbs))" />
            <MacroBarLabel label="LIP" value={totals.f} target={profile?.daily_fat_g || 70} color="hsl(var(--macro-fat))" />
          </div>
        </div>
        <ProgressRing size={96} stroke={10} pct={consumedPct} color="hsl(var(--primary))">
          <div className="text-center">
            <div className="text-foreground font-bold text-sm leading-none">{Math.round(consumedPct)}%</div>
          </div>
        </ProgressRing>
      </div>

      {/* Daily Challenge */}
      <div
        className="mx-5 mt-4 rounded-3xl p-4 border-l-2 border-primary-glow"
        style={{ background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--surface)) 100%)" }}
      >
        <div className="flex items-start gap-3">
          <Rocket size={22} className="text-primary mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="text-foreground font-bold">Daily Challenge</div>
              <span className="text-primary text-[11px] font-bold border border-primary/40 rounded-full px-2 py-0.5">
                +50 XP
              </span>
            </div>
            <div className="text-foreground text-sm mt-1">
              Atteins {proteinTarget}g de protéines
            </div>
            <div className="flex items-center justify-between text-xs mt-2 text-muted-foreground">
              <span>{Math.round(totals.p)}g / {proteinTarget}g</span>
              <span className="text-primary font-bold">{challengePct}%</span>
            </div>
            <div className="h-2 bg-surface-high rounded-full overflow-hidden mt-1.5">
              <motion.div
                className="h-full bg-primary-glow rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${challengePct}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Meals accordion */}
      <div className="px-5 mt-5 space-y-3 pb-4">
        {MEAL_TYPES.map((type) => {
          const list = groups.get(type) || [];
          const cal = list.reduce((s, m) => s + Number(m.total_calories), 0);
          const open = openType === type;
          const empty = list.length === 0;
          const meta = mealTypeMeta(type);
          return (
            <div key={type} className="bg-card rounded-3xl overflow-hidden">
              <button
                className="w-full p-4 flex items-center gap-3"
                onClick={() => setOpenType(open ? null : type)}
              >
                <MealTypeIcon type={type} size={42} />
                <div className="flex-1 text-left">
                  <div className="text-foreground font-bold">{type}</div>
                  <div className="text-muted-foreground text-xs">
                    {empty ? "Ajouter des aliments" : `${cal} kcal`}
                  </div>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {list.flatMap((m) =>
                        m.components.map((c, i) => (
                          <div key={`${m.id}-${i}`} className="flex items-center gap-3 py-1">
                            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-base">
                              {c.emoji}
                            </div>
                            <div className="flex-1 text-foreground text-sm font-medium truncate">
                              {c.name}
                            </div>
                            <div className="text-muted-foreground text-sm tabular-nums">
                              {Math.round(c.calories * Number(m.portion_multiplier))} kcal
                            </div>
                          </div>
                        )),
                      )}
                      {list.map((m) => (
                        <div key={`del-${m.id}`} className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <span className="truncate">📷 {m.dish_name} • {Number(m.portion_multiplier)}x</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setEditing(m)}
                              className="p-1 hover:text-primary"
                              aria-label="Modifier portion"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(m.id)}
                              className="p-1 hover:text-destructive"
                              aria-label="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => nav("/scanner")}
                        className="w-full mt-2 border border-dashed border-border rounded-2xl py-3 text-muted-foreground text-xs font-bold tracking-widest hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={14} /> AJOUTER UN ALIMENT
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MacroBarLabel({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  return (
    <div>
      <div className="text-[10px] font-bold tracking-wider text-center" style={{ color }}>{label}</div>
      <div className="h-1.5 bg-surface-high rounded-full overflow-hidden mt-1.5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9 }}
        />
      </div>

      <AnimatePresence>
        {editing && (
          <EditPortionModal
            meal={editing}
            onClose={() => setEditing(null)}
            onSave={async (m) => { await handleSavePortion(editing, m); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
