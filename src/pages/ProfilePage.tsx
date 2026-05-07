import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useNSUser } from "@/hooks/useNSUser";
import { isPremium } from "@/types/db";
import { LogOut, Crown, Star } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useNSUser();
  const nav = useNavigate();
  if (!user) return null;
  const premium = isPremium(user);
  const annual = user.subscription_status === "premium_annual";

  async function signOut() {
    await supabase.auth.signOut();
    nav("/auth", { replace: true });
    toast.success("Signed out");
  }

  return (
    <div className="px-5 pt-12 pb-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-[#0D0D0D] border border-[#222] flex items-center justify-center text-h2 font-bold">
          {user.avatar_url ? <img src={user.avatar_url} alt="me" className="w-full h-full rounded-full object-cover" /> : (user.name?.[0] || user.email[0]).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-h3 truncate">{user.name || "User"}</p>
          <p className="text-caption text-[#888] truncate">{user.email}</p>
          <span className={`inline-flex items-center gap-1 mt-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
            ${annual ? "bg-gold/15 text-gold" : premium ? "bg-primary/15 text-primary" : "bg-[#222] text-[#888]"}`}>
            {annual ? <><Crown className="w-3 h-3" /> Annual</> : premium ? <><Star className="w-3 h-3" /> Premium</> : "Free"}
          </span>
        </div>
      </div>

      <Section title="Personal">
        <Row label="Daily calories" value={`${user.daily_kcal_goal} kcal`} />
        <Row label="Protein goal" value={`${user.protein_g_goal} g`} />
        <Row label="Carbs goal" value={`${user.carbs_g_goal} g`} />
        <Row label="Fat goal" value={`${user.fat_g_goal} g`} />
        <Row label="Streak" value={`${user.streak_days} days`} />
      </Section>

      <Section title="Subscription">
        {premium ? (
          <p className="text-caption text-[#888]">
            {annual ? "Annual" : "Monthly"} active
            {user.premium_expires_at && ` · renews ${new Date(user.premium_expires_at).toLocaleDateString()}`}
          </p>
        ) : (
          <button onClick={() => nav("/paywall")} className="w-full h-11 bg-primary text-black font-bold rounded-[12px] glow-green">
            Upgrade to Premium
          </button>
        )}
      </Section>

      <button onClick={signOut} className="w-full h-12 bg-[#0D0D0D] border border-[#222] rounded-[14px] flex items-center justify-center gap-2 text-destructive font-medium mt-4">
        <LogOut className="w-4 h-4" /> Sign out
      </button>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="mb-5">
      <p className="text-label text-[#888] mb-2 px-1">{title}</p>
      <div className="bg-[#0D0D0D] border border-[#222] rounded-[16px] p-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}
function Row({ label, value }: any) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-[#888]">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}
