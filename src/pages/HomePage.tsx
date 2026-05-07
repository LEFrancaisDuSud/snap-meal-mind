import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Trash2, ChevronDown, Flame, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNSUser } from "@/hooks/useNSUser";
import { useAuth } from "@/hooks/useAuth";
import { greeting } from "@/lib/tdee";
import { todayISO, formatDate } from "@/lib/dates";
import { isPremium, type FoodLog, type MealType } from "@/types/db";
import { toast } from "sonner";

const MEALS: { key: MealType; label: string; emoji: string }[] = [
  { key: "breakfast", label: "Breakfast", emoji: "🍳" },
  { key: "lunch", label: "Lunch", emoji: "🥗" },
  { key: "dinner", label: "Dinner", emoji: "🍽️" },
  { key: "snacks", label: "Snacks", emoji: "🍎" },
];

export default function HomePage() {
  const { user: authUser } = useAuth();
  const { user, refresh } = useNSUser();
  const nav = useNavigate();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!authUser) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", authUser.id)
      .eq("log_date", todayISO())
      .order("logged_at", { ascending: true });
    if (!error) setLogs((data as any) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [authUser]);

  const totals = useMemo(() => logs.reduce((a, l) => ({
    kcal: a.kcal + l.calories,
    p: a.p + Number(l.protein_g),
    c: a.c + Number(l.carbs_g),
    f: a.f + Number(l.fat_g),
  }), { kcal: 0, p: 0, c: 0, f: 0 }), [logs]);

  if (!user) return null;
  const premium = isPremium(user);
  const goal = user.daily_kcal_goal || 2000;
  const remaining = Math.max(0, goal - totals.kcal);
  const ringPct = Math.min(100, (totals.kcal / goal) * 100);
  const ringColor = ringPct > 100 ? "#FF3B30" : ringPct > 85 ? "#FF9500" : "#00FF85";

  async function handleDelete(id: string) {
    const { error } = await supabase.from("food_logs").delete().eq("id", id);
    if (error) { toast.error("Could not delete"); return; }
    setLogs((p) => p.filter((l) => l.id !== id));
    toast.success("Removed");
  }

  return (
    <div className="px-5 pt-12 pb-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-h3">{greeting()}, {user.name?.split(" ")[0] || "there"} 👋</p>
          <p className="text-caption text-[#888]">{formatDate()}</p>
        </div>
        <button onClick={() => nav("/profile")} className="w-11 h-11 rounded-full bg-[#0D0D0D] border border-[#222] flex items-center justify-center text-white font-bold">
          {user.avatar_url
            ? <img src={user.avatar_url} alt="me" className="w-full h-full rounded-full object-cover" />
            : (user.name?.[0] || user.email[0]).toUpperCase()}
        </button>
      </header>

      {/* Ring */}
      <div className="bg-[#0D0D0D] border border-[#222] rounded-[20px] p-5 mb-4 flex flex-col items-center">
        {!premium ? (
          <BlurredRing onUnlock={() => nav("/paywall")} />
        ) : (
          <CalorieRing kcal={totals.kcal} goal={goal} remaining={remaining} pct={ringPct} color={ringColor} />
        )}
        {premium && (
          <div className="grid grid-cols-3 gap-3 w-full mt-5">
            <MacroBar label="Protein" cur={totals.p} goal={user.protein_g_goal} color="#3B82F6" />
            <MacroBar label="Carbs" cur={totals.c} goal={user.carbs_g_goal} color="#FF9500" />
            <MacroBar label="Fat" cur={totals.f} goal={user.fat_g_goal} color="#FFD60A" />
          </div>
        )}
      </div>

      {/* Streak */}
      {premium && user.streak_days > 0 && (
        <div className="bg-[#0D0D0D] border border-[#222] rounded-[20px] p-4 mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#FF9500]/15 flex items-center justify-center">
            <Flame className="w-6 h-6 text-[#FF9500]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{user.streak_days}-day streak</p>
            <p className="text-caption text-[#888]">Best: {user.best_streak} days</p>
          </div>
        </div>
      )}

      {/* Meals */}
      <div className="flex flex-col gap-3">
        {MEALS.map((m) => {
          const items = logs.filter((l) => l.meal_type === m.key);
          const sum = items.reduce((a, l) => a + l.calories, 0);
          return (
            <MealSection
              key={m.key}
              meal={m}
              items={items}
              sum={sum}
              premium={premium}
              loading={loading}
              onAdd={() => nav(`/log?meal=${m.key}`)}
              onDelete={handleDelete}
            />
          );
        })}
      </div>
    </div>
  );
}

function BlurredRing({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="relative w-[260px] h-[260px] flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-[36px] border-[#1a1a1a] blur-sm" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <Lock className="w-7 h-7 text-[#555]" />
        <p className="text-caption text-[#888] text-center max-w-[160px]">Upgrade to see your progress</p>
        <button onClick={onUnlock} className="bg-primary text-black font-bold text-sm px-5 h-10 rounded-full glow-green active:scale-95">Unlock</button>
      </div>
    </div>
  );
}

function CalorieRing({ kcal, goal, remaining, pct, color }: any) {
  const r = 110, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative w-[260px] h-[260px]">
      <svg viewBox="0 0 240 240" className="w-full h-full -rotate-90">
        <circle cx="120" cy="120" r={r} stroke="#1a1a1a" strokeWidth="22" fill="none" />
        <motion.circle
          cx="120" cy="120" r={r}
          stroke={color} strokeWidth="22" fill="none" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-[44px] leading-none font-bold tabular-nums">{Math.round(kcal)}</p>
        <p className="text-caption text-[#888] mt-1">/ {goal} kcal</p>
        <p className="text-sm font-semibold mt-2" style={{ color }}>{remaining} remaining</p>
      </div>
    </div>
  );
}

function MacroBar({ label, cur, goal, color }: any) {
  const pct = Math.min(100, (cur / Math.max(1, goal)) * 100);
  return (
    <div>
      <div className="flex justify-between text-[11px] text-[#888] mb-1">
        <span className="font-bold uppercase tracking-wider">{label}</span>
        <span className="tabular-nums text-white">{Math.round(cur)}/{goal}g</span>
      </div>
      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
      </div>
    </div>
  );
}

function MealSection({ meal, items, sum, premium, loading, onAdd, onDelete }: any) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-[#0D0D0D] border border-[#222] rounded-[20px] overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meal.emoji}</span>
          <span className="font-semibold">{meal.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold tabular-nums ${sum > 0 ? "text-primary" : "text-[#555]"}`}>{sum} kcal</span>
          <ChevronDown className={`w-4 h-4 text-[#555] transition ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
          {loading ? (
            <div className="h-12 rounded-[12px] skeleton" />
          ) : items.length === 0 ? (
            <button onClick={onAdd} className="border border-dashed border-[#222] rounded-[12px] py-4 text-[#555] text-sm flex items-center justify-center gap-2 active:bg-[#141414]">
              <Plus className="w-4 h-4" /> Tap to log {meal.label}
            </button>
          ) : (
            <>
              {items.map((it: FoodLog) => (
                <div key={it.id} className="flex items-center gap-3 bg-[#141414] rounded-[12px] p-3 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{it.food_name}</p>
                    {premium && (
                      <p className="text-[11px] text-[#888] tabular-nums">P {Math.round(Number(it.protein_g))}g · C {Math.round(Number(it.carbs_g))}g · F {Math.round(Number(it.fat_g))}g</p>
                    )}
                  </div>
                  <span className="text-sm font-bold tabular-nums">{it.calories}</span>
                  <button onClick={() => onDelete(it.id)} className="text-[#555] hover:text-destructive p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={onAdd} className="text-primary text-sm font-medium py-2 active:opacity-70">+ Add to {meal.label}</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
