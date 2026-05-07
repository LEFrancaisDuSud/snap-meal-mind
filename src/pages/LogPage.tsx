import { useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNSUser } from "@/hooks/useNSUser";
import { isPremium, FREE_LIMITS, type MealType } from "@/types/db";
import { todayISO } from "@/lib/dates";

export default function LogPage() {
  const { user: authUser } = useAuth();
  const { user, refresh } = useNSUser();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initialMeal = (params.get("meal") as MealType) || "lunch";

  const [meal, setMeal] = useState<MealType>(initialMeal);
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user || !authUser) return null;
  const premium = isPremium(user);

  // Reset daily counters if needed
  const needsReset = user.last_reset_date !== todayISO();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !kcal) { toast.error("Name and calories are required"); return; }

    // Free limit check
    if (!premium) {
      const used = needsReset ? 0 : user.logs_today;
      if (used >= FREE_LIMITS.food_logs) {
        toast.error("Daily limit reached. Upgrade for unlimited logs.");
        nav("/paywall");
        return;
      }
    }

    setBusy(true);

    // Reset counters at midnight UTC
    if (needsReset) {
      await supabase.from("users").update({
        scans_today: 0, logs_today: 0, searches_today: 0, last_reset_date: todayISO(),
      } as any).eq("id", authUser.id);
    }

    const { error } = await supabase.from("food_logs").insert({
      user_id: authUser.id,
      food_name: name.trim(),
      meal_type: meal,
      calories: Math.round(Number(kcal)),
      protein_g: Number(p) || 0,
      carbs_g: Number(c) || 0,
      fat_g: Number(f) || 0,
      input_method: "manual",
      portion_multiplier: 1,
    } as any);

    setBusy(false);
    if (error) { toast.error("Could not save"); return; }
    await refresh();
    toast.success(`Added to ${meal}`);
    nav("/", { replace: true });
  }

  const meals: { v: MealType; emoji: string }[] = [
    { v: "breakfast", emoji: "🍳" },
    { v: "lunch", emoji: "🥗" },
    { v: "dinner", emoji: "🍽️" },
    { v: "snacks", emoji: "🍎" },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col px-5 pt-10 pb-6">
      <button onClick={() => nav(-1)} className="self-start text-white p-2 -ml-2 mb-2"><ArrowLeft className="w-6 h-6" /></button>
      <h1 className="text-h1 mb-1">Log food</h1>
      <p className="text-body text-[#888] mb-6">Manual entry. Photo, barcode and voice come in the next update.</p>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {meals.map((m) => (
          <button
            key={m.v}
            onClick={() => setMeal(m.v)}
            className={`px-4 h-10 rounded-full border text-sm font-medium capitalize whitespace-nowrap flex items-center gap-1.5
              ${meal === m.v ? "border-primary bg-primary text-black" : "border-[#222] bg-[#0D0D0D] text-white"}`}
          >
            <span>{m.emoji}</span> {m.v}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="Food name" value={name} onChange={setName} placeholder="e.g. Grilled chicken bowl" autoFocus />
        <Field label="Calories" value={kcal} onChange={setKcal} placeholder="e.g. 450" type="number" />
        <div className="grid grid-cols-3 gap-2">
          <Field label="Protein (g)" value={p} onChange={setP} type="number" small />
          <Field label="Carbs (g)" value={c} onChange={setC} type="number" small />
          <Field label="Fat (g)" value={f} onChange={setF} type="number" small />
        </div>
        <button type="submit" disabled={busy} className="h-[52px] rounded-[14px] bg-primary text-black font-bold mt-3 flex items-center justify-center disabled:opacity-60 active:scale-[0.98] glow-green">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : `Add to ${meal}`}
        </button>
        {!premium && (
          <p className="text-caption text-[#888] text-center mt-1">
            {Math.max(0, FREE_LIMITS.food_logs - (needsReset ? 0 : user.logs_today))} of {FREE_LIMITS.food_logs} free logs left today
          </p>
        )}
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", small, autoFocus }: any) {
  return (
    <div>
      <label className="text-label text-[#888] block mb-1.5 px-1">{label}</label>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`w-full ${small ? "h-12" : "h-[52px]"} bg-[#141414] border border-[#222] rounded-[12px] px-4 text-white placeholder:text-[#555] focus:outline-none focus:border-primary`}
      />
    </div>
  );
}
