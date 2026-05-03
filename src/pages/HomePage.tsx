import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Flame, Shield, Check, Plus, TrendingUp, Target } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useMeals, totalsFromMeals, groupMealsByType, MEAL_TYPES } from "@/hooks/useMeals";
import { useCountUp } from "@/hooks/useCountUp";
import { xpProgress, GOAL_LABELS } from "@/lib/tdee";
import { todayISO } from "@/lib/dates";
import ProgressRing from "@/components/ProgressRing";
import MealTypeIcon from "@/components/MealTypeIcon";
import type { MealType } from "@/types/nutrition";

const LEVEL_NAMES = [
  "", "Débutant", "Initié", "Actif",
  "Guerrier", "Expert", "Maître", "Légende"
];

const BADGES = [
  { emoji: "🥗", label: "1er Scan" },
  { emoji: "🔥", label: "Série 5j" },
  { emoji: "💪", label: "Protéines" },
  { emoji: "📅", label: "7 Jours" },
  { emoji: "⚡", label: "Pro" },
];

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut", delay: i * 0.07 },
});

export default function HomePage() {
  const { profile } = useProfile();
  const today = todayISO();
  const { meals } = useMeals(today);
  const nav = useNavigate();

  const totals = totalsFromMeals(meals);
  const groups = groupMealsByType(meals);

  const target = profile?.daily_calories || 2000;
  const consumed = Math.round(totals.cal);
  const remaining = Math.max(0, target - consumed);
  const animatedRemaining = useCountUp(remaining, 1000);
  const consumedPct = Math.min(100, Math.round((consumed / target) * 100));

  const xp = profile?.xp || 0;
  const xpInfo = xpProgress(xp);
  const levelName = LEVEL_NAMES[Math.min(xpInfo.level, LEVEL_NAMES.length - 1)];

  const streakDays = profile?.current_streak || 0;
  const bestStreak = profile?.best_streak || streakDays;

  const today_d = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today_d);
    d.setDate(today_d.getDate() - today_d.getDay() + 1 + i);
    return d;
  });

  const isCompleted = (idx: number) => {
    const todayDow = today_d.getDay();
    const diff = idx - (todayDow === 0 ? 6 : todayDow - 1);
    return diff <= 0 && diff > -streakDays;
  };
  const isToday = (idx: number) =>
    weekDays[idx].toDateString() === today_d.toDateString();

  const goalLabel = profile?.goal ? GOAL_LABELS[profile.goal] : null;

  return (
    <div
      className="absolute inset-0 overflow-y-auto scrollbar-hide bg-background"
      style={{ paddingBottom: "calc(88px + env(safe-area-inset-bottom))" }}
    >

      {/* ── HEADER ── */}
      <div className="px-5 pt-12 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/20 text-primary font-extrabold text-lg flex items-center justify-center ring-2 ring-primary/30">
            {(profile?.display_name?.[0] || "T").toUpperCase()}
          </div>
          <div>
            <div className="text-muted-foreground text-xs leading-none mb-0.5">Bonjour</div>
            <div className="text-foreground font-bold text-base leading-none">
              {profile?.display_name || "Toi"} 👋
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {streakDays > 0 && (
            <div className="bg-orange-500/15 text-orange-400 px-3 py-1.5 rounded-full font-bold text-sm flex items-center gap-1">
              <Flame size={13} fill="currentColor" />
              {streakDays}
            </div>
          )}
          <button className="w-9 h-9 rounded-full bg-card flex items-center justify-center text-muted-foreground">
            <Bell size={18} />
          </button>
        </div>
      </div>

      {/* ── NIVEAU / XP ── */}
      <motion.div {...stagger(0)} className="mx-5 mt-4 bg-card rounded-3xl p-4 flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
            <Shield size={26} strokeWidth={2.2} />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
            {xpInfo.level}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-primary font-extrabold text-sm uppercase tracking-wide">
              Niveau {xpInfo.level} — {levelName}
            </span>
            <span className="text-muted-foreground text-xs">{xpInfo.pct}%</span>
          </div>
          <div className="h-2 bg-surface-high rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpInfo.pct}%` }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
          </div>
          <div className="text-muted-foreground text-xs mt-1">
            {xp} / {xpInfo.nextLevelAt} XP — prochain niveau
          </div>
        </div>
      </motion.div>

      {/* ── CALORIES DU JOUR ── */}
      <motion.div
        {...stagger(1)}
        className="mx-5 mt-3 rounded-3xl p-5 overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--primary)/.08) 100%)" }}
      >
        {/* Subtle glow */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        <div className="text-center text-muted-foreground text-[11px] font-bold uppercase tracking-widest mb-3">
          Aujourd'hui
        </div>

        <div className="flex items-center gap-5">
          {/* Ring */}
          <div className="shrink-0">
            <ProgressRing
              size={130}
              stroke={11}
              pct={consumedPct}
              color="hsl(var(--primary))"
              trackColor="hsl(var(--surface-high))"
            >
              <div className="text-center">
                <div className="text-foreground font-extrabold tabular-nums" style={{ fontSize: 26 }}>
                  {Math.round(animatedRemaining).toLocaleString("fr-FR")}
                </div>
                <div className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider mt-0.5">
                  kcal rest.
                </div>
              </div>
            </ProgressRing>
          </div>

          {/* Stats col */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Consommé</span>
              <span className="text-foreground font-bold tabular-nums">
                {consumed.toLocaleString("fr-FR")} kcal
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Objectif</span>
              <span className="text-foreground font-bold tabular-nums">
                {target.toLocaleString("fr-FR")} kcal
              </span>
            </div>
            {goalLabel && (
              <div className="bg-primary/10 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                <Target size={11} className="text-primary shrink-0" />
                <span className="text-primary text-[11px] font-semibold">{goalLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <MacroBar label="PROTÉINES" value={totals.p} target={profile?.daily_protein_g || 150} color="hsl(var(--macro-protein))" />
          <MacroBar label="GLUCIDES"  value={totals.c} target={profile?.daily_carbs_g   || 200} color="hsl(var(--macro-carbs))"   />
          <MacroBar label="LIPIDES"   value={totals.f} target={profile?.daily_fat_g     || 70}  color="hsl(var(--macro-fat))"     />
        </div>
      </motion.div>

      {/* ── STREAK ── */}
      <motion.div {...stagger(2)} className="mx-5 mt-3 bg-card rounded-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-foreground font-bold text-sm">Série en cours</div>
            <div className="text-orange-400 text-xs font-semibold mt-0.5">
              {streakDays} {streakDays <= 1 ? "jour" : "jours"} consécutif{streakDays <= 1 ? "" : "s"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">Record</div>
            <div className="text-foreground font-extrabold">{bestStreak}j 🏆</div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {["L", "M", "M", "J", "V", "S", "D"].map((label, i) => {
            const done = isCompleted(i);
            const todayDay = isToday(i);
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  todayDay
                    ? "border-2 border-orange-400 text-orange-400 bg-orange-400/10"
                    : done
                    ? "bg-primary text-white"
                    : "bg-surface-high text-muted-foreground"
                }`}>
                  {done && !todayDay ? <Check size={12} strokeWidth={3} /> : label}
                </div>
                {todayDay && <Flame size={10} className="text-orange-400" fill="currentColor" />}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── BADGES ── */}
      <motion.div {...stagger(3)} className="mx-5 mt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-foreground font-bold text-sm">Mes badges</div>
            <div className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
              2/{BADGES.length}
            </div>
          </div>
          <button className="text-primary text-xs font-bold tracking-wide">VOIR TOUT</button>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {BADGES.map((b, i) => (
            <div key={i} className={`shrink-0 flex flex-col items-center gap-1.5 w-[68px] bg-card rounded-2xl py-3 px-2 ${
              i < 2 ? "ring-1 ring-primary/40" : "opacity-40"
            }`}>
              <span className="text-2xl">{b.emoji}</span>
              <span className="text-muted-foreground text-[10px] font-semibold text-center leading-tight">
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── REPAS DU JOUR ── */}
      <motion.div {...stagger(4)} className="mx-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-foreground font-bold text-sm">Repas du jour</div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <TrendingUp size={12} />
            {consumed > 0 ? `${consumedPct}% de l'objectif` : "Aucun repas"}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {MEAL_TYPES.map((type, i) => {
            const list = groups.get(type) || [];
            const cal = Math.round(list.reduce((s, m) => s + Number(m.total_calories), 0));
            const empty = list.length === 0;
            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.28 + i * 0.06, duration: 0.3 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => nav("/journal")}
                className={`bg-card rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all ${
                  !empty ? "border-l-[3px] border-primary" : "border border-surface-high"
                }`}
              >
                {!empty && list[0].image_url ? (
                  <img
                    src={list[0].image_url}
                    alt={list[0].dish_name}
                    className="w-11 h-11 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <MealTypeIcon type={type} size={44} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-foreground font-semibold text-sm">{type}</div>
                  {empty ? (
                    <div className="text-muted-foreground text-xs mt-0.5">{placeholderText(type)}</div>
                  ) : (
                    <>
                      <div className="text-muted-foreground text-xs truncate mt-0.5">
                        {list.map((m) => m.dish_name).join(", ")}
                      </div>
                      <div className="text-primary font-bold text-xs mt-1">
                        {cal.toLocaleString("fr-FR")} kcal
                      </div>
                    </>
                  )}
                </div>
                {empty ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); nav("/scanner"); }}
                    className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary shrink-0"
                  >
                    <Plus size={18} strokeWidth={2.8} />
                  </button>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Check size={16} className="text-primary" strokeWidth={3} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}

function placeholderText(type: MealType) {
  switch (type) {
    case "Petit-déjeuner": return "Démarre ta journée…";
    case "Déjeuner":       return "Ajoute ton repas…";
    case "Dîner":          return "Planifie ta soirée…";
    case "Collation":      return "Un petit creux ?";
  }
}

function MacroBar({ label, value, target, color }: {
  label: string; value: number; target: number; color: string;
}) {
  const rounded = Math.round(value);
  const pct = Math.min(100, target > 0 ? (rounded / target) * 100 : 0);
  return (
    <div className="bg-surface-high/50 rounded-2xl p-3 text-center">
      <div className="text-[9px] font-bold tracking-wider mb-1" style={{ color }}>{label}</div>
      <div className="text-foreground font-extrabold text-sm tabular-nums">{rounded}g</div>
      <div className="text-muted-foreground text-[9px] mb-1.5">/ {target}g</div>
      <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
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
