import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, Flame, Shield, Check, Plus } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useMeals, totalsFromMeals, groupMealsByType, MEAL_TYPES } from "@/hooks/useMeals";
import { useCountUp } from "@/hooks/useCountUp";
import { xpProgress } from "@/lib/tdee";
import { todayISO } from "@/lib/dates";
import ProgressRing from "@/components/ProgressRing";
import MealTypeIcon, { mealTypeMeta } from "@/components/MealTypeIcon";
import type { MealType } from "@/types/nutrition";

export default function HomePage() {
  const { profile } = useProfile();
  const today = todayISO();
  const { meals } = useMeals(today);
  const nav = useNavigate();

  const totals = totalsFromMeals(meals);
  const groups = groupMealsByType(meals);

  const target = profile?.daily_calories || 2000;
  // ✅ FIX 1 — Math.round() avant useCountUp
  const remaining = Math.round(Math.max(0, target - totals.cal));
  const animatedRemaining = useCountUp(remaining, 900);
  const consumedPct = Math.min(100, Math.round((totals.cal / target) * 100));

  const xp = profile?.xp || 0;
  const xpInfo = xpProgress(xp);

  const today_d = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today_d);
    d.setDate(today_d.getDate() - today_d.getDay() + 1 + i);
    return d;
  });

  const streakDays = profile?.current_streak || 0;
  const isCompleted = (idx: number) => {
    const todayDow = today_d.getDay();
    const diff = idx - (todayDow === 0 ? 6 : todayDow - 1);
    return diff <= 0 && diff > -streakDays;
  };
  const isToday = (idx: number) =>
    weekDays[idx].toDateString() === today_d.toDateString();

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
      {/* Top header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-primary font-extrabold text-2xl">TrackCal</h1>
        <button className="text-primary p-2" aria-label="Notifications">
          <Bell size={22} />
        </button>
      </div>

      {/* User greeting */}
      <div className="px-5 pb-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">
          {(profile?.display_name?.[0] || "T").toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="text-muted-foreground text-xs">Bonjour</div>
          <div className="text-foreground font-bold">
            {profile?.display_name || "Toi"} 👋
          </div>
        </div>
        <div className="bg-tertiary/15 text-tertiary px-3 py-1.5 rounded-full font-bold text-sm flex items-center gap-1">
          <Flame size={14} fill="currentColor" />
          {/* ✅ FIX 2 — pluriel conditionnel */}
          {streakDays}
        </div>
      </div>

      {/* Level card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-5 bg-card rounded-3xl p-4 flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
          <Shield size={28} strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-primary font-extrabold text-lg leading-none">
              NIVEAU {xpInfo.level}
            </span>
          </div>
          <div className="text-foreground font-semibold text-sm mt-0.5">
            Guerrier Nutritionnel
          </div>
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-muted-foreground">
              Prochain niveau : {xpInfo.nextLevelAt} XP
            </span>
            <span className="text-foreground font-bold">{xpInfo.pct}%</span>
          </div>
          <div className="h-2 bg-surface-high rounded-full overflow-hidden mt-1.5">
            <motion.div
              className="h-full bg-primary-glow rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpInfo.pct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Today's energy */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mx-5 bg-card rounded-3xl p-5 mt-4"
      >
        <div className="text-center text-muted-foreground text-xs font-bold uppercase tracking-widest">
          Aujourd'hui
        </div>
        <div className="flex justify-center mt-3">
          <ProgressRing
            size={170}
            stroke={14}
            pct={consumedPct}
            color="hsl(var(--primary))"
            trackColor="hsl(var(--surface-high))"
          >
            <div className="text-center">
              {/* ✅ FIX 1 — Math.round() sur animatedRemaining */}
              <div
                className="text-foreground font-extrabold leading-none"
                style={{ fontSize: 38 }}
              >
                {Math.round(animatedRemaining).toLocaleString("fr-FR")}
              </div>
              <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">
                kcal restantes
              </div>
            </div>
          </ProgressRing>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <MacroBar
            label="PROTÉINES"
            value={totals.p}
            target={profile?.daily_protein_g || 150}
            color="hsl(var(--macro-protein))"
          />
          <MacroBar
            label="GLUCIDES"
            value={totals.c}
            target={profile?.daily_carbs_g || 200}
            color="hsl(var(--macro-carbs))"
          />
          <MacroBar
            label="LIPIDES"
            value={totals.f}
            target={profile?.daily_fat_g || 70}
            color="hsl(var(--macro-fat))"
          />
        </div>
      </motion.div>

      {/* Streak card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-5 bg-card rounded-3xl p-5 mt-4"
      >
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-foreground font-bold">Série en cours</div>
            {/* ✅ FIX 2 — singulier/pluriel */}
            <div className="text-primary text-sm font-semibold">
              {streakDays} {streakDays <= 1 ? "jour" : "jours"} consécutif{streakDays <= 1 ? "" : "s"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              Record
            </div>
            <div className="text-foreground font-extrabold">
              {profile?.best_streak || streakDays}j
            </div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2 mt-4">
          {["L", "M", "M", "J", "V", "S", "D"].map((label, i) => {
            const done = isCompleted(i);
            const todayDay = isToday(i);
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                    todayDay
                      ? "bg-transparent border-2 border-primary text-primary"
                      : done
                      ? "bg-primary/85 text-primary-foreground"
                      : "bg-surface-high text-muted-foreground"
                  }`}
                >
                  {label}
                </div>
                {todayDay ? (
                  <Flame size={14} className="text-tertiary" fill="currentColor" />
                ) : done ? (
                  <Check size={14} className="text-primary" strokeWidth={3} />
                ) : (
                  <div className="w-1 h-1 rounded-full bg-muted" />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Badges */}
      <div className="mx-5 mt-5 flex items-center justify-between">
        <h2 className="text-foreground font-bold">Mes badges</h2>
        <button className="text-primary text-xs font-bold tracking-wider">
          VOIR TOUT
        </button>
      </div>
      <div className="px-5 mt-2 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {["🥗", "🔥", "💪", "📅", "⚡"].map((e, i) => (
          <div
            key={i}
            className="shrink-0 w-16 h-16 bg-card rounded-2xl flex items-center justify-center text-3xl"
          >
            {e}
          </div>
        ))}
      </div>

      {/* Meals of the day */}
      <h2 className="text-foreground font-bold mx-5 mt-6 mb-3">Repas du jour</h2>
      <div className="px-5 space-y-2 pb-4">
        {MEAL_TYPES.map((type) => {
          const list = groups.get(type) || [];
          // ✅ FIX 3 — Math.round() sur les calories des repas
          const cal = Math.round(
            list.reduce((s, m) => s + Number(m.total_calories), 0)
          );
          const empty = list.length === 0;
          return (
            <motion.div
              key={type}
              whileTap={{ scale: 0.99 }}
              onClick={() => nav("/journal")}
              className={`bg-card rounded-3xl p-4 flex items-center gap-3 cursor-pointer ${
                !empty ? "border-l-2 border-primary-glow" : ""
              }`}
            >
              {!empty && list[0].image_url ? (
                <img
                  src={list[0].image_url}
                  alt={list[0].dish_name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <MealTypeIcon type={type} size={48} />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-foreground font-bold">{type}</div>
                {empty ? (
                  <div className="text-muted-foreground text-xs italic">
                    {placeholderText(type)}
                  </div>
                ) : (
                  <>
                    <div className="text-muted-foreground text-xs truncate">
                      {list.map((m) => m.dish_name).join(", ")}
                    </div>
                    <div className="text-primary font-bold text-sm mt-0.5">
                      {cal.toLocaleString("fr-FR")} kcal{" "}
                      <span className="text-muted-foreground font-normal">
                        • COMPLET
                      </span>
                    </div>
                  </>
                )}
              </div>
              {empty ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nav("/scanner");
                  }}
                  className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary"
                  aria-label="Ajouter"
                >
                  <Plus size={20} strokeWidth={2.6} />
                </button>
              ) : (
                <Check size={22} className="text-primary" strokeWidth={3} />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function placeholderText(type: MealType) {
  switch (type) {
    case "Petit-déjeuner": return "Démarre ta journée…";
    case "Déjeuner":       return "Ajoutez votre repas…";
    case "Dîner":          return "Planifiez votre soirée…";
    case "Collation":      return "Un petit creux ?";
  }
}

function MacroBar({
  label, value, target, color,
}: {
  label: string; value: number; target: number; color: string;
}) {
  const pct = Math.min(100, target > 0 ? (Math.round(value) / target) * 100 : 0);
  return (
    <div className="text-center">
      <div className="text-[10px] font-bold tracking-wider" style={{ color }}>
        {label}
      </div>
      {/* ✅ FIX 3 — valeurs macro arrondies */}
      <div className="text-foreground font-bold text-xs mt-0.5">
        {Math.round(value)}g
      </div>
      <div className="h-1.5 bg-surface-high rounded-full overflow-hidden mt-1.5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
