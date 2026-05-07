import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNSUser } from "@/hooks/useNSUser";
import { computePlan } from "@/lib/tdee";
import type { ActivityLevel, Gender, Goal } from "@/types/db";

const STORAGE_KEY = "ns:onboarding";

interface State {
  step: number;
  name: string;
  age: number;
  gender: Gender | "";
  weight_kg: number;
  target_weight_kg: number;
  height_cm: number;
  units: "metric" | "imperial";
  activity: ActivityLevel | "";
  goal: Goal | "";
  diets: string[];
}

const DEFAULT: State = {
  step: 1, name: "", age: 25, gender: "",
  weight_kg: 70, target_weight_kg: 65, height_cm: 170, units: "metric",
  activity: "", goal: "", diets: [],
};

const ACTIVITIES: { v: ActivityLevel; emoji: string; label: string; mult: string }[] = [
  { v: "sedentary", emoji: "🪑", label: "Sedentary", mult: "Little or no exercise" },
  { v: "light", emoji: "🚶", label: "Light", mult: "1–3 days/week" },
  { v: "moderate", emoji: "🏃", label: "Moderate", mult: "3–5 days/week" },
  { v: "active", emoji: "🏋️", label: "Active", mult: "6–7 days/week" },
  { v: "athlete", emoji: "⚡", label: "Athlete", mult: "2× daily / hard training" },
];

const GOALS: { v: Goal; emoji: string; label: string }[] = [
  { v: "lose", emoji: "🔥", label: "Lose weight" },
  { v: "maintain", emoji: "⚖️", label: "Maintain" },
  { v: "gain", emoji: "💪", label: "Gain muscle" },
  { v: "health", emoji: "🌿", label: "Eat healthier" },
];

const DIETS = ["Vegan", "Vegetarian", "Pescatarian", "Gluten-free", "Dairy-free", "Halal", "Kosher", "Keto", "Paleo", "Low-carb", "None"];

export default function OnboardingPage() {
  const { user, update } = useNSUser();
  const nav = useNavigate();
  const [s, setS] = useState<State>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT;
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }, [s]);
  useEffect(() => { if (user?.name && !s.name) setS((p) => ({ ...p, name: user.name || "" })); /* eslint-disable-next-line */ }, [user]);

  function next() { setS((p) => ({ ...p, step: Math.min(6, p.step + 1) })); }
  function back() { setS((p) => ({ ...p, step: Math.max(1, p.step - 1) })); }

  async function finish() {
    if (!user) return;
    setBusy(true);
    const plan = computePlan({
      age: s.age, gender: s.gender as Gender,
      weight_kg: s.weight_kg, height_cm: s.height_cm, target_weight_kg: s.target_weight_kg,
      activity: s.activity as ActivityLevel, goal: s.goal as Goal,
    });
    const { error } = await update({
      name: s.name, age: s.age, gender: s.gender as Gender,
      weight_kg: s.weight_kg, target_weight_kg: s.target_weight_kg, height_cm: s.height_cm,
      units: s.units, activity_level: s.activity as ActivityLevel, goal: s.goal as Goal,
      dietary_prefs: s.diets,
      daily_kcal_goal: plan.daily_kcal,
      protein_g_goal: plan.protein_g, carbs_g_goal: plan.carbs_g, fat_g_goal: plan.fat_g,
      onboarding_complete: true,
    });
    setBusy(false);
    if (error) { toast.error("Could not save. Try again."); return; }
    localStorage.removeItem(STORAGE_KEY);
    nav("/paywall", { replace: true });
  }

  const progress = (s.step / 6) * 100;

  const valid =
    (s.step === 1 && s.name.trim().length > 1 && s.gender) ||
    (s.step === 2 && s.weight_kg > 0 && s.height_cm > 0 && s.target_weight_kg > 0) ||
    (s.step === 3 && s.activity) ||
    (s.step === 4 && s.goal) ||
    (s.step === 5) ||
    (s.step === 6);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="h-1 bg-[#0D0D0D]">
        <motion.div className="h-full bg-primary" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
      </div>
      <div className="px-6 pt-4 pb-2 flex items-center">
        {s.step > 1 && (
          <button onClick={back} className="text-white p-2 -ml-2"><ChevronLeft className="w-6 h-6" /></button>
        )}
        <span className="ml-auto text-[#555] text-sm font-bold">{s.step}/6</span>
      </div>

      <div className="flex-1 px-6 pb-6 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={s.step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {s.step === 1 && <Step1 s={s} setS={setS} />}
            {s.step === 2 && <Step2 s={s} setS={setS} />}
            {s.step === 3 && <Step3 s={s} setS={setS} />}
            {s.step === 4 && <Step4 s={s} setS={setS} />}
            {s.step === 5 && <Step5 s={s} setS={setS} />}
            {s.step === 6 && <Step6 s={s} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 pb-8 pt-3 bg-black">
        <button
          onClick={s.step < 6 ? next : finish}
          disabled={!valid || busy}
          className="w-full h-[52px] rounded-[14px] bg-primary text-black font-bold flex items-center justify-center disabled:opacity-30 disabled:bg-[#222] disabled:text-[#555] active:scale-[0.98] transition glow-green"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : s.step < 6 ? "Continue" : "Start my journey"}
        </button>
      </div>
    </div>
  );
}

function Step1({ s, setS }: any) {
  return (
    <div>
      <h1 className="text-h1 mb-2">Tell us about you</h1>
      <p className="text-body text-[#888] mb-8">We'll personalize your plan.</p>
      <label className="text-label text-[#888] block mb-2">Your name</label>
      <input
        autoFocus
        value={s.name}
        onChange={(e) => setS({ ...s, name: e.target.value })}
        placeholder="Alex"
        className="w-full h-[52px] bg-[#141414] border border-[#222] rounded-[12px] px-4 text-white placeholder:text-[#555] focus:outline-none focus:border-primary mb-6"
      />
      <label className="text-label text-[#888] block mb-2">Age</label>
      <div className="bg-[#141414] border border-[#222] rounded-[12px] p-4 mb-6 flex items-center justify-center gap-6">
        <button onClick={() => setS({ ...s, age: Math.max(13, s.age - 1) })} className="w-10 h-10 rounded-full bg-[#222] text-white text-xl font-bold">−</button>
        <span className="text-h1 w-20 text-center">{s.age}</span>
        <button onClick={() => setS({ ...s, age: Math.min(100, s.age + 1) })} className="w-10 h-10 rounded-full bg-[#222] text-white text-xl font-bold">+</button>
      </div>
      <label className="text-label text-[#888] block mb-2">Gender</label>
      <div className="grid grid-cols-3 gap-2">
        {(["male", "female", "other"] as Gender[]).map((g) => (
          <button
            key={g}
            onClick={() => setS({ ...s, gender: g })}
            className={`h-[52px] rounded-[12px] border font-medium capitalize ${s.gender === g ? "border-primary bg-primary/10 text-primary" : "border-[#222] bg-[#141414] text-white"}`}
          >{g}</button>
        ))}
      </div>
    </div>
  );
}

function NumberRow({ label, value, onChange, suffix }: any) {
  return (
    <div className="mb-5">
      <label className="text-label text-[#888] block mb-2">{label}</label>
      <div className="bg-[#141414] border border-[#222] rounded-[12px] px-4 h-[52px] flex items-center">
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 bg-transparent text-white focus:outline-none" />
        <span className="text-[#555] text-sm">{suffix}</span>
      </div>
    </div>
  );
}

function Step2({ s, setS }: any) {
  const isMetric = s.units === "metric";
  return (
    <div>
      <h1 className="text-h1 mb-2">Your body</h1>
      <p className="text-body text-[#888] mb-6">Used to calculate calorie needs.</p>
      <div className="flex bg-[#141414] border border-[#222] rounded-[12px] p-1 mb-6">
        <button onClick={() => setS({ ...s, units: "metric" })} className={`flex-1 h-10 rounded-[10px] font-medium ${isMetric ? "bg-primary text-black" : "text-[#888]"}`}>kg / cm</button>
        <button onClick={() => setS({ ...s, units: "imperial" })} className={`flex-1 h-10 rounded-[10px] font-medium ${!isMetric ? "bg-primary text-black" : "text-[#888]"}`}>lbs / ft</button>
      </div>
      <NumberRow label="Current weight" value={s.weight_kg} onChange={(v: number) => setS({ ...s, weight_kg: v })} suffix={isMetric ? "kg" : "lbs"} />
      <NumberRow label="Target weight" value={s.target_weight_kg} onChange={(v: number) => setS({ ...s, target_weight_kg: v })} suffix={isMetric ? "kg" : "lbs"} />
      <NumberRow label="Height" value={s.height_cm} onChange={(v: number) => setS({ ...s, height_cm: v })} suffix={isMetric ? "cm" : "in"} />
    </div>
  );
}

function Step3({ s, setS }: any) {
  return (
    <div>
      <h1 className="text-h1 mb-2">Activity level</h1>
      <p className="text-body text-[#888] mb-6">How active are you weekly?</p>
      <div className="flex flex-col gap-2">
        {ACTIVITIES.map((a) => (
          <button
            key={a.v}
            onClick={() => setS({ ...s, activity: a.v })}
            className={`flex items-center gap-4 p-4 rounded-[14px] border transition ${s.activity === a.v ? "border-primary bg-primary/10" : "border-[#222] bg-[#0D0D0D]"}`}
          >
            <span className="text-3xl">{a.emoji}</span>
            <div className="flex-1 text-left">
              <p className="font-semibold">{a.label}</p>
              <p className="text-caption text-[#888]">{a.mult}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step4({ s, setS }: any) {
  return (
    <div>
      <h1 className="text-h1 mb-2">Your goal</h1>
      <p className="text-body text-[#888] mb-6">What do you want to achieve?</p>
      <div className="grid grid-cols-2 gap-3">
        {GOALS.map((g) => (
          <button
            key={g.v}
            onClick={() => setS({ ...s, goal: g.v })}
            className={`aspect-square rounded-[16px] border flex flex-col items-center justify-center gap-2 transition ${s.goal === g.v ? "border-primary bg-primary/10" : "border-[#222] bg-[#0D0D0D]"}`}
          >
            <span className="text-4xl">{g.emoji}</span>
            <span className="text-sm font-semibold text-center px-2">{g.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step5({ s, setS }: any) {
  function toggle(d: string) {
    const has = s.diets.includes(d);
    setS({ ...s, diets: has ? s.diets.filter((x: string) => x !== d) : [...s.diets, d] });
  }
  return (
    <div>
      <h1 className="text-h1 mb-2">Diet preferences</h1>
      <p className="text-body text-[#888] mb-6">Optional. Helps personalize meal plans.</p>
      <div className="flex flex-wrap gap-2">
        {DIETS.map((d) => (
          <button
            key={d}
            onClick={() => toggle(d)}
            className={`px-4 h-10 rounded-full border text-sm font-medium ${s.diets.includes(d) ? "border-primary bg-primary text-black" : "border-[#222] bg-[#0D0D0D] text-white"}`}
          >{d}</button>
        ))}
      </div>
    </div>
  );
}

function Step6({ s }: any) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 1800); return () => clearTimeout(t); }, []);
  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-body text-[#888]">Calculating your plan…</p>
      </div>
    );
  }
  const plan = computePlan({
    age: s.age, gender: s.gender, weight_kg: s.weight_kg, height_cm: s.height_cm,
    target_weight_kg: s.target_weight_kg, activity: s.activity, goal: s.goal,
  });
  return (
    <div className="animate-fade-up">
      <h1 className="text-h1 mb-2">Your custom plan</h1>
      <p className="text-body text-[#888] mb-6">Built from {s.weight_kg}kg, {s.height_cm}cm, {s.age}y.</p>
      <div className="bg-[#0D0D0D] border border-primary rounded-[20px] p-6 glow-green">
        <p className="text-label text-primary mb-2">Daily calories</p>
        <p className="text-h1 text-white mb-4">{plan.daily_kcal} <span className="text-base font-normal text-[#888]">kcal</span></p>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Macro label="Protein" value={plan.protein_g} color="#3B82F6" />
          <Macro label="Carbs" value={plan.carbs_g} color="#FF9500" />
          <Macro label="Fat" value={plan.fat_g} color="#FFD60A" />
        </div>
        <div className="border-t border-[#222] pt-4">
          <p className="text-caption text-[#888]">Estimated time to goal</p>
          <p className="text-h3 text-white">~{plan.weeks_to_goal} weeks</p>
        </div>
      </div>
    </div>
  );
}
function Macro({ label, value, color }: any) {
  return (
    <div className="bg-black rounded-[12px] p-3 border border-[#222] text-center">
      <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: color }} />
      <p className="text-h3 text-white">{value}<span className="text-xs font-normal text-[#888]">g</span></p>
      <p className="text-[10px] uppercase tracking-wider text-[#555] font-bold">{label}</p>
    </div>
  );
}
