import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Filter, Pencil, Search, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import EditPortionModal from "@/components/EditPortionModal";
import MealTypeIcon from "@/components/MealTypeIcon";
import type { MealRow, MealType } from "@/types/nutrition";
import { isoOf } from "@/lib/dates";

type Period = "today" | "week" | "month" | "all" | "custom";
const MEAL_FILTERS: ("Tous" | MealType)[] = [
  "Tous",
  "Petit-déjeuner",
  "Déjeuner",
  "Dîner",
  "Collation",
];

export default function HistoriquePage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [period, setPeriod] = useState<Period>("week");
  const [customDate, setCustomDate] = useState<string>(isoOf(new Date()));
  const [mealFilter, setMealFilter] = useState<"Tous" | MealType>("Tous");
  const [search, setSearch] = useState("");
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MealRow | null>(null);

  const range = useMemo(() => getRange(period, customDate), [period, customDate]);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false });
    if (range.from) q = q.gte("log_date", range.from);
    if (range.to) q = q.lte("log_date", range.to);
    if (mealFilter !== "Tous") q = q.eq("meal_type", mealFilter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    setMeals((data as any[] as MealRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, period, customDate, mealFilter]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return meals;
    return meals.filter((m) => m.dish_name.toLowerCase().includes(s));
  }, [meals, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, MealRow[]>();
    filtered.forEach((m) => {
      const arr = map.get(m.log_date) || [];
      arr.push(m);
      map.set(m.log_date, arr);
    });
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const handleDelete = async (m: MealRow) => {
    const { error } = await supabase.from("meals").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Repas supprimé");
    refresh();
  };

  const handleSavePortion = async (m: MealRow, newMult: number) => {
    const ratio = newMult / Number(m.portion_multiplier || 1);
    const { error } = await supabase
      .from("meals")
      .update({
        portion_multiplier: newMult,
        total_calories: Math.round(Number(m.total_calories) * ratio),
        total_protein_g: round1(Number(m.total_protein_g) * ratio),
        total_carbs_g: round1(Number(m.total_carbs_g) * ratio),
        total_fat_g: round1(Number(m.total_fat_g) * ratio),
      })
      .eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Portion mise à jour");
    setEditing(null);
    refresh();
  };

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-hide pb-4">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 flex items-center gap-3 border-b border-border">
        <button onClick={() => nav(-1)} className="text-foreground p-1" aria-label="Retour">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-foreground font-extrabold text-xl flex-1">Historique</h1>
        <CalendarDays size={20} className="text-muted-foreground" />
      </div>

      {/* Search */}
      <div className="px-5 pt-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un repas…"
            className="w-full bg-card border border-border rounded-2xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors duration-200"
          />
        </div>
      </div>

      {/* Period filters */}
      <div className="px-3 mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {(
          [
            ["today", "Aujourd'hui"],
            ["week", "Cette semaine"],
            ["month", "Ce mois"],
            ["all", "Tout"],
            ["custom", "Date…"],
          ] as [Period, string][]
        ).map(([k, label]) => {
          const active = period === k;
          return (
            <button
              key={k}
              onClick={() => setPeriod(k)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors duration-200 ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {period === "custom" && (
        <div className="px-5 mt-3">
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground"
          />
        </div>
      )}

      {/* Meal type filters */}
      <div className="px-3 mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {MEAL_FILTERS.map((t) => {
          const active = mealFilter === t;
          return (
            <button
              key={t}
              onClick={() => setMealFilter(t)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 ${
                active
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-card text-muted-foreground border border-border"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="px-5 mt-5 space-y-5">
        {loading && (
          <div className="text-center text-muted-foreground py-10">Chargement…</div>
        )}
        {!loading && grouped.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            Aucun repas trouvé
          </div>
        )}
        {grouped.map(([date, list]) => (
          <div key={date}>
            <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2">
              {formatDayHeader(date)} • {list.length} repas
            </div>
            <div className="space-y-2">
              {list.map((m) => (
                <motion.div
                  layout
                  key={m.id}
                  className="bg-card rounded-2xl p-3 flex items-center gap-3"
                >
                  {m.image_url ? (
                    <img
                      src={m.image_url}
                      alt={m.dish_name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <MealTypeIcon type={m.meal_type as MealType} size={48} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground font-semibold truncate">
                      {m.dish_name}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {m.meal_type} • {Number(m.portion_multiplier)}x
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-foreground font-bold text-sm">
                      {m.total_calories}
                    </div>
                    <div className="text-muted-foreground text-[10px] uppercase tracking-wider">
                      kcal
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => setEditing(m)}
                      className="text-muted-foreground hover:text-primary p-1"
                      aria-label="Modifier portion"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(m)}
                      className="text-muted-foreground hover:text-destructive p-1"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editing && (
          <EditPortionModal
            meal={editing}
            onClose={() => setEditing(null)}
            onSave={(m) => handleSavePortion(editing, m)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function getRange(period: Period, custom: string) {
  const today = new Date();
  const todayISO = isoOf(today);
  if (period === "today") return { from: todayISO, to: todayISO };
  if (period === "week") {
    const d = new Date(today);
    d.setDate(today.getDate() - 6);
    return { from: isoOf(d), to: todayISO };
  }
  if (period === "month") {
    const d = new Date(today);
    d.setMonth(today.getMonth() - 1);
    return { from: isoOf(d), to: todayISO };
  }
  if (period === "custom") return { from: custom, to: custom };
  return { from: null as any, to: null as any };
}

function formatDayHeader(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (isoOf(d) === isoOf(today)) return "Aujourd'hui";
  if (isoOf(d) === isoOf(yest)) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
