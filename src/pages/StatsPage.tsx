import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { isoOf } from "@/lib/dates";

export default function StatsPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [days, setDays] = useState<{ date: string; cal: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    const start = new Date();
    start.setDate(start.getDate() - 6);
    supabase
      .from("meals")
      .select("log_date,total_calories")
      .eq("user_id", user.id)
      .gte("log_date", isoOf(start))
      .then(({ data }) => {
        const byDate = new Map<string, number>();
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          byDate.set(isoOf(d), 0);
        }
        (data || []).forEach((m: any) => {
          byDate.set(m.log_date, (byDate.get(m.log_date) || 0) + Number(m.total_calories));
        });
        setDays(Array.from(byDate.entries()).map(([date, cal]) => ({ date, cal })));
      });
  }, [user]);

  const target = profile?.daily_calories || 2000;
  const max = Math.max(target, ...days.map((d) => d.cal), 1);
  const avg = Math.round(days.reduce((s, d) => s + d.cal, 0) / Math.max(1, days.length));

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-hide px-5 pt-6 pb-4">
      <div className="flex items-center gap-3">
        <BarChart3 size={26} className="text-primary" />
        <h1 className="text-foreground font-extrabold text-2xl">Statistiques</h1>
      </div>
      <p className="text-muted-foreground text-sm mt-1">Tes 7 derniers jours</p>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <StatCard label="MOYENNE" value={`${avg}`} unit="kcal/jour" />
        <StatCard label="OBJECTIF" value={`${target}`} unit="kcal/jour" />
        <StatCard label="SÉRIE" value={`${profile?.current_streak || 0}j`} unit="actuelle" />
        <StatCard label="RECORD" value={`${profile?.best_streak || 0}j`} unit="meilleure série" />
      </div>

      <div className="bg-card rounded-3xl p-5 mt-5">
        <div className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-4">Calories par jour</div>
        <div className="flex items-end gap-2 h-40">
          {days.map((d, i) => {
            const pct = (d.cal / max) * 100;
            const dt = new Date(d.date);
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex-1 w-full flex items-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${pct}%` }}
                    transition={{ delay: i * 0.05, duration: 0.6 }}
                    className="w-full rounded-t-xl"
                    style={{
                      background: d.cal >= target * 0.9 && d.cal <= target * 1.1
                        ? "hsl(var(--primary))"
                        : d.cal > target
                        ? "hsl(var(--secondary))"
                        : "hsl(var(--surface-bright))",
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-bold">
                  {dt.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 1).toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-card rounded-3xl p-4">
      <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">{label}</div>
      <div className="text-foreground font-extrabold text-2xl mt-1">{value}</div>
      <div className="text-muted-foreground text-xs">{unit}</div>
    </div>
  );
}
