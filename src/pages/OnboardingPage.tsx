import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { computeTDEE, ACTIVITY_LABELS, GOAL_LABELS } from "@/lib/tdee";
import type { Profile } from "@/types/nutrition";

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0..5 questions, 6 = result

const ACTIVITY_DESC: Record<NonNullable<Profile["activity_level"]>, string> = {
  sedentary: "Peu ou pas d'exercice",
  light: "1-3 jours/semaine",
  moderate: "3-5 jours/semaine",
  active: "6-7 jours/semaine",
  very_active: "Sport intense quotidien",
};

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const { profile, refresh } = useProfile();
  const nav = useNavigate();

  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [sex, setSex] = useState<"male" | "female" | null>(null);
  const [age, setAge] = useState(28);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [activity, setActivity] = useState<Profile["activity_level"]>(null);
  const [goal, setGoal] = useState<Profile["goal"]>(null);
  const [computed, setComputed] = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (profile?.onboarding_completed) return <Navigate to="/" replace />;

  const next = () => setStep((s) => (s + 1) as Step);
  const prev = () => setStep((s) => Math.max(0, s - 1) as Step);

  const handleCompute = () => {
    if (!sex || !activity || !goal) return;
    const r = computeTDEE({ age, sex, height_cm: height, weight_kg: weight, activity_level: activity, goal });
    setComputed(r);
    setStep(6);
  };

  const handleFinish = async () => {
    if (!computed || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: name || profile?.display_name,
          age, sex, height_cm: height, weight_kg: weight,
          activity_level: activity, goal,
          daily_calories: computed.calories,
          daily_protein_g: computed.protein,
          daily_carbs_g: computed.carbs,
          daily_fat_g: computed.fat,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      // Award welcome badge & XP
      await supabase.from("user_badges").insert({
        user_id: user.id,
        badge_key: "beginner",
        badge_emoji: "⭐",
        badge_name: "Débutant",
      });
      await supabase
        .from("profiles")
        .update({ xp: 100 })
        .eq("user_id", user.id);
      await refresh();
      toast.success("Profil prêt 🎉");
      nav("/", { replace: true });
    } catch (err: any) {
      toast.error(err?.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const canNext = (() => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return sex !== null;
    if (step === 2) return age >= 10 && age <= 100;
    if (step === 3) return height >= 100 && height <= 230;
    if (step === 4) return weight >= 30 && weight <= 250;
    if (step === 5) return activity !== null && goal !== null;
    return true;
  })();

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="phone-shell">
        <div className="absolute inset-0 px-6 pt-6 pb-6 flex flex-col">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-6">
            {step > 0 && step < 6 && (
              <button onClick={prev} className="text-muted-foreground p-1">
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${((step + 1) / 7) * 100}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
              />
            </div>
            <span className="text-muted-foreground text-xs font-semibold tabular-nums">
              {Math.min(step + 1, 7)}/7
            </span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <StepFrame key="0" title="Comment tu t'appelles ?" sub="On personnalisera ton expérience.">
                  <input
                    autoFocus
                    placeholder="Ton prénom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface text-foreground text-lg rounded-2xl px-5 py-4 outline-none border border-border focus:border-primary/60"
                  />
                </StepFrame>
              )}

              {step === 1 && (
                <StepFrame key="1" title="Tu es..." sub="Pour calculer ton métabolisme.">
                  <div className="grid grid-cols-2 gap-3">
                    <Choice active={sex === "male"} onClick={() => setSex("male")} emoji="♂️" label="Homme" />
                    <Choice active={sex === "female"} onClick={() => setSex("female")} emoji="♀️" label="Femme" />
                  </div>
                </StepFrame>
              )}

              {step === 2 && (
                <StepFrame key="2" title="Quel âge as-tu ?" sub={`${age} ans`}>
                  <NumberStepper value={age} onChange={setAge} min={10} max={100} unit="ans" />
                </StepFrame>
              )}

              {step === 3 && (
                <StepFrame key="3" title="Ta taille ?" sub={`${height} cm`}>
                  <NumberStepper value={height} onChange={setHeight} min={100} max={230} unit="cm" step={1} />
                </StepFrame>
              )}

              {step === 4 && (
                <StepFrame key="4" title="Ton poids ?" sub={`${weight} kg`}>
                  <NumberStepper value={weight} onChange={setWeight} min={30} max={250} unit="kg" step={1} />
                </StepFrame>
              )}

              {step === 5 && (
                <StepFrame key="5" title="Ton mode de vie" sub="Activité physique et objectif">
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mt-2">Activité</p>
                    {(Object.keys(ACTIVITY_LABELS) as Array<NonNullable<Profile["activity_level"]>>).map((k) => (
                      <Row
                        key={k}
                        active={activity === k}
                        onClick={() => setActivity(k)}
                        title={ACTIVITY_LABELS[k]}
                        sub={ACTIVITY_DESC[k]}
                      />
                    ))}
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mt-5">Objectif</p>
                    {(Object.keys(GOAL_LABELS) as Array<NonNullable<Profile["goal"]>>).map((k) => (
                      <Row
                        key={k}
                        active={goal === k}
                        onClick={() => setGoal(k)}
                        title={GOAL_LABELS[k]}
                      />
                    ))}
                  </div>
                </StepFrame>
              )}

              {step === 6 && computed && (
                <ResultStep key="6" computed={computed} onClose={() => setStep(5)} onFinish={handleFinish} saving={saving} />
              )}
            </AnimatePresence>
          </div>

          {step < 6 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!canNext}
              onClick={() => (step === 5 ? handleCompute() : next())}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-full mt-4 flex items-center justify-center gap-2 disabled:opacity-40 disabled:bg-surface disabled:text-muted-foreground"
            >
              {step === 5 ? "Calculer mes besoins" : "Continuer"}
              <ArrowRight size={18} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepFrame({
  title, sub, children,
}: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
    >
      <h1 className="text-foreground font-extrabold text-2xl leading-tight">{title}</h1>
      {sub && <p className="text-muted-foreground text-sm mt-1">{sub}</p>}
      <div className="mt-6">{children}</div>
    </motion.div>
  );
}

function Choice({ active, onClick, emoji, label }: { active: boolean; onClick: () => void; emoji: string; label: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`aspect-square rounded-3xl flex flex-col items-center justify-center gap-2 transition-colors border-2 ${
        active
          ? "bg-primary/15 border-primary text-foreground"
          : "bg-surface border-transparent text-muted-foreground"
      }`}
    >
      <span className="text-4xl">{emoji}</span>
      <span className="font-semibold">{label}</span>
    </motion.button>
  );
}

function Row({ active, onClick, title, sub }: { active: boolean; onClick: () => void; title: string; sub?: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left rounded-2xl px-4 py-3.5 flex items-center justify-between border transition-colors ${
        active ? "bg-primary/15 border-primary" : "bg-surface border-transparent"
      }`}
    >
      <div>
        <div className="text-foreground font-semibold">{title}</div>
        {sub && <div className="text-muted-foreground text-xs mt-0.5">{sub}</div>}
      </div>
      {active && (
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check size={14} className="text-primary-foreground" strokeWidth={3} />
        </div>
      )}
    </motion.button>
  );
}

function NumberStepper({
  value, onChange, min, max, unit, step = 1,
}: { value: number; onChange: (n: number) => void; min: number; max: number; unit: string; step?: number }) {
  return (
    <div className="bg-surface rounded-3xl p-6">
      <div className="text-center">
        <div className="text-primary font-extrabold leading-none" style={{ fontSize: 80 }}>
          {value}
        </div>
        <div className="text-muted-foreground text-sm mt-2 uppercase tracking-widest">{unit}</div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full mt-4 accent-primary"
      />
      <div className="flex items-center justify-between mt-1 text-muted-foreground text-xs">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function ResultStep({
  computed, onClose, onFinish, saving,
}: {
  computed: { calories: number; protein: number; carbs: number; fat: number };
  onClose: () => void;
  onFinish: () => void;
  saving: boolean;
}) {
  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="relative"
    >
      <button onClick={onClose} className="absolute top-0 right-0 text-muted-foreground p-1">
        <X size={22} />
      </button>

      <div className="flex flex-col items-center pt-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mb-5 glow-primary"
        >
          <Check size={36} className="text-primary-foreground" strokeWidth={3} />
        </motion.div>
        <h2 className="text-foreground font-extrabold text-2xl text-center">Tes besoins quotidiens</h2>
      </div>

      <div className="bg-surface rounded-3xl p-6 mt-6">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-primary font-extrabold leading-none"
            style={{ fontSize: 72 }}
          >
            {computed.calories}
          </motion.div>
          <div className="text-muted-foreground text-sm mt-2 uppercase tracking-[0.3em]">kcal / jour</div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-6">
          <MacroPill color="hsl(var(--macro-protein))" label="Protéines" value={computed.protein} />
          <MacroPill color="hsl(var(--macro-carbs))" label="Glucides" value={computed.carbs} />
          <MacroPill color="hsl(var(--macro-fat))" label="Lipides" value={computed.fat} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-surface rounded-3xl p-4 mt-4 border-l-4 border-primary-glow flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">⭐</div>
        <div className="flex-1">
          <div className="text-primary font-bold text-xl leading-none">+100 XP</div>
          <div className="text-foreground text-sm font-semibold mt-1">Badge Débutant débloqué</div>
        </div>
      </motion.div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onFinish}
        disabled={saving}
        className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-full mt-6 flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {saving ? "..." : "Allons-y !"}
        {!saving && <ArrowRight size={18} />}
      </motion.button>

      <p className="text-muted-foreground text-xs text-center mt-4 leading-relaxed">
        Ces valeurs sont des estimations basées sur ton métabolisme de base. Tu pourras ajuster tes macros à tout moment depuis ton profil.
      </p>
    </motion.div>
  );
}

function MacroPill({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="bg-background rounded-2xl p-3 text-center border" style={{ borderColor: `${color.replace("hsl(", "hsla(").replace(")", " / 0.4)")}` }}>
      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{label}</div>
      <div className="text-foreground font-bold text-xl mt-0.5">{value}g</div>
    </div>
  );
}
