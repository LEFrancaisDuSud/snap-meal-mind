import { Lock } from "lucide-react";
import { useNSUser } from "@/hooks/useNSUser";
import { isPremium } from "@/types/db";
import { useNavigate } from "react-router-dom";

export default function ProgressPage() {
  const { user } = useNSUser();
  const nav = useNavigate();
  const premium = isPremium(user);
  return (
    <div className="px-5 pt-12 pb-6">
      <h1 className="text-h1 mb-6">Progress</h1>
      {!premium ? (
        <div className="bg-[#0D0D0D] border border-[#222] rounded-[20px] p-8 flex flex-col items-center text-center">
          <Lock className="w-8 h-8 text-[#555] mb-3" />
          <h3 className="text-h3 mb-2">Unlock Progress 📊</h3>
          <p className="text-body text-[#888] mb-6 max-w-xs">Charts, body composition, and badges with Premium.</p>
          <button onClick={() => nav("/paywall")} className="h-11 px-6 bg-primary text-black rounded-[12px] font-bold glow-green">Upgrade</button>
        </div>
      ) : (
        <div className="bg-[#0D0D0D] border border-[#222] rounded-[20px] p-8 text-center">
          <p className="text-body text-[#888]">Charts and body composition coming in the next update.</p>
        </div>
      )}
    </div>
  );
}
