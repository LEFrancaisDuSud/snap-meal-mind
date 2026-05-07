import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, X, Loader2, Trophy, Lock, Star, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useNSUser } from "@/hooks/useNSUser";

type Plan = "monthly" | "annual";

export default function PaywallPage() {
  const { user, update } = useNSUser();
  const nav = useNavigate();
  const [plan, setPlan] = useState<Plan>("annual");
  const [showSkip, setShowSkip] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 8000);
    return () => clearTimeout(t);
  }, []);

  // Admin: @nutriscan.app → already premium_annual via DB trigger
  useEffect(() => {
    if (user && user.subscription_status !== "free") nav("/", { replace: true });
  }, [user, nav]);

  async function startTrial() {
    setBusy(true);
    // Lot 1: Stripe payments not yet enabled. We grant the trial directly so the app is fully usable.
    // Lot 4 will replace this with a real Stripe checkout.
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 5);
    const { error } = await update({
      subscription_status: plan === "annual" ? "premium_annual" : "premium_monthly",
      premium_expires_at: expiresAt.toISOString(),
    });
    setBusy(false);
    if (error) { toast.error("Could not activate trial. Try again."); return; }
    toast.success("Welcome to Premium 🎉");
    nav("/", { replace: true });
  }

  async function continueFree() {
    setBusy(true);
    const { error } = await update({ subscription_status: "free" });
    setBusy(false);
    if (error) { toast.error("Try again"); return; }
    nav("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-black flex flex-col px-5 pt-10 pb-8 max-w-[430px] mx-auto">
      <div className="text-center mb-6 animate-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4 glow-green">
          <Trophy className="w-7 h-7 text-black" />
        </div>
        <h1 className="text-h1 mb-2">Unlock your full potential</h1>
        <p className="text-body text-[#888]">Track everything. Reach your goals faster.</p>
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto scrollbar-hide">
        <PlanCard
          selected={plan === "annual"}
          onSelect={() => setPlan("annual")}
          highlighted
          badge="BEST VALUE 🏆"
          title="Annual"
          price="34.99€"
          period="/year"
          subline="= 2.92€/month · Save 42%"
          features={[
            "Everything in Monthly +",
            "Unlimited history & meal plans",
            "Body composition tracking",
            "Sunday AI weekly report",
            "Referral program",
          ]}
        />
        <PlanCard
          selected={plan === "monthly"}
          onSelect={() => setPlan("monthly")}
          title="Monthly"
          price="4.99€"
          period="/month"
          features={[
            "Unlimited logs / scans / searches",
            "Full macros + 12 micronutrients",
            "All charts + AI meal plans",
            "Barcode + voice + streaks",
            "30-day history",
          ]}
        />
        <FreeRecap />
      </div>

      <div className="pt-4">
        <button
          onClick={startTrial}
          disabled={busy}
          className="w-full h-[52px] rounded-[14px] bg-primary text-black font-bold flex items-center justify-center disabled:opacity-60 active:scale-[0.98] glow-green"
        >
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start 5-day free trial"}
        </button>
        <p className="text-[#888] text-[12px] text-center mt-3">No credit card required · Cancel anytime</p>
        <div className="flex justify-center gap-4 mt-3 text-[#555] text-[11px]">
          <span>🔒 Secure</span><span>⭐ 4.8/5</span><span>🔄 Cancel anytime</span>
        </div>
        {showSkip && (
          <button onClick={continueFree} disabled={busy} className="w-full h-12 mt-2 text-[#888] text-sm animate-fade-up">
            Continue with Free
          </button>
        )}
      </div>
    </div>
  );
}

function PlanCard({ selected, onSelect, highlighted, badge, title, price, period, subline, features }: any) {
  const border = highlighted ? "border-primary" : selected ? "border-[#444]" : "border-[#222]";
  return (
    <button
      onClick={onSelect}
      className={`relative text-left p-5 rounded-[20px] bg-[#0D0D0D] border-2 ${border} transition active:scale-[0.99]`}
    >
      {badge && (
        <span className="absolute -top-3 left-4 bg-primary text-black text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">{badge}</span>
      )}
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-h3">{title}</span>
        <span className="text-h2">{price}<span className="text-sm text-[#888] font-normal">{period}</span></span>
      </div>
      {subline && <p className="text-caption text-primary mb-3">{subline}</p>}
      <ul className="flex flex-col gap-1.5 mt-3">
        {features.map((f: string) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-primary flex-shrink-0" /> <span>{f}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}

function FreeRecap() {
  return (
    <div className="p-5 rounded-[20px] bg-[#0D0D0D] border border-[#222]">
      <p className="text-label text-[#888] mb-2">Free includes</p>
      <ul className="flex flex-col gap-1.5 text-sm text-[#888]">
        <li className="flex gap-2"><Check className="w-4 h-4 text-[#555]" /> 2 logs / 1 scan / 1 search per day</li>
        <li className="flex gap-2"><X className="w-4 h-4 text-[#555]" /> No macros, charts, barcode, voice, streak</li>
      </ul>
    </div>
  );
}
