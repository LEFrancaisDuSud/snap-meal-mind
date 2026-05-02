import { motion } from "framer-motion";
import { LogOut, Settings, Flame, Trophy, Target } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { xpProgress, ACTIVITY_LABELS, GOAL_LABELS } from "@/lib/tdee";

export default function ProfilePage() {
  const { profile } = useProfile();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnecté");
    window.location.href = "/auth";
  };

  if (!profile) return null;
  const xpInfo = xpProgress(profile.xp);

  return (
    <div className="absolute inset-0 overflow-y-auto scrollbar-hide px-5 pt-6 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground font-extrabold text-2xl">Profil</h1>
        <button className="text-muted-foreground p-1" aria-label="Paramètres">
          <Settings size={22} />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="mt-5 bg-card rounded-3xl p-5 flex items-center gap-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary text-2xl font-bold flex items-center justify-center">
          {(profile.display_name?.[0] || "T").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-foreground font-bold text-lg truncate">
            {profile.display_name || "Utilisateur"}
          </div>
          <div className="text-primary text-sm font-semibold">Niveau {xpInfo.level}</div>
          <div className="h-1.5 bg-surface-high rounded-full overflow-hidden mt-2">
            <div className="h-full bg-primary-glow rounded-full" style={{ width: `${xpInfo.pct}%` }} />
          </div>
          <div className="text-muted-foreground text-xs mt-1">
            {profile.xp} / {xpInfo.nextLevelAt} XP
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <Stat icon={<Flame size={18} />} value={`${profile.current_streak}j`} label="Série" />
        <Stat icon={<Trophy size={18} />} value={`${profile.best_streak}j`} label="Record" />
        <Stat icon={<Target size={18} />} value={`${profile.daily_calories}`} label="kcal/jour" />
      </div>

      <h2 className="text-foreground font-bold mt-6 mb-3">Mes objectifs</h2>
      <div className="bg-card rounded-3xl p-5 space-y-3">
        <Row label="Calories" value={`${profile.daily_calories} kcal`} />
        <Row label="Protéines" value={`${profile.daily_protein_g} g`} />
        <Row label="Glucides" value={`${profile.daily_carbs_g} g`} />
        <Row label="Lipides" value={`${profile.daily_fat_g} g`} />
      </div>

      <h2 className="text-foreground font-bold mt-6 mb-3">Mon profil</h2>
      <div className="bg-card rounded-3xl p-5 space-y-3">
        {profile.age && <Row label="Âge" value={`${profile.age} ans`} />}
        {profile.height_cm && <Row label="Taille" value={`${profile.height_cm} cm`} />}
        {profile.weight_kg && <Row label="Poids" value={`${profile.weight_kg} kg`} />}
        {profile.activity_level && <Row label="Activité" value={ACTIVITY_LABELS[profile.activity_level]} />}
        {profile.goal && <Row label="Objectif" value={GOAL_LABELS[profile.goal]} />}
      </div>

      <button
        onClick={handleLogout}
        className="w-full mt-6 bg-card border border-border text-destructive font-semibold py-4 rounded-full flex items-center justify-center gap-2"
      >
        <LogOut size={18} /> Se déconnecter
      </button>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-card rounded-2xl p-3 text-center">
      <div className="text-primary inline-flex">{icon}</div>
      <div className="text-foreground font-extrabold text-lg leading-none mt-1">{value}</div>
      <div className="text-muted-foreground text-[10px] uppercase tracking-wider font-bold mt-1">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-foreground font-semibold">{value}</span>
    </div>
  );
}
