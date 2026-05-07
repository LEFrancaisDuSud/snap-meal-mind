import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MealsPage() {
  const nav = useNavigate();
  return (
    <div className="px-5 pt-12 pb-6">
      <h1 className="text-h1 mb-6">Meals</h1>
      <div className="bg-[#0D0D0D] border border-[#222] rounded-[20px] p-8 flex flex-col items-center text-center">
        <Lock className="w-8 h-8 text-[#555] mb-3" />
        <h3 className="text-h3 mb-2">AI Meal Plans</h3>
        <p className="text-body text-[#888] mb-6 max-w-xs">Personalized 7-day plans, favorites and recipes are coming in the next update.</p>
        <button onClick={() => nav("/")} className="h-11 px-6 bg-[#222] text-white rounded-[12px] font-medium">Back to Home</button>
      </div>
    </div>
  );
}
