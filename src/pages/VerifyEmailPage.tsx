import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const nav = useNavigate();
  const email = sessionStorage.getItem("ns:pending_email") || "your email";
  const [cooldown, setCooldown] = useState(60);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-redirect once user is signed in (clicked link)
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (sess) nav("/", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [nav]);

  async function resend() {
    if (cooldown > 0 || busy) return;
    setBusy(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Email sent"); setCooldown(60); }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 rounded-full bg-[#0D0D0D] border border-[#222] flex items-center justify-center mb-6 animate-pulse">
        <Mail className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-h2 mb-3">Check your inbox</h1>
      <p className="text-body text-[#888] max-w-xs mb-8">
        We sent a verification link to <span className="text-white">{email}</span>.
      </p>
      <button
        onClick={resend}
        disabled={cooldown > 0 || busy}
        className="h-[52px] px-8 rounded-[14px] bg-primary text-black font-bold disabled:opacity-50 disabled:bg-[#222] disabled:text-[#555] flex items-center gap-2"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
      </button>
      <button onClick={() => nav("/auth")} className="text-[#888] text-sm mt-6">Back to sign in</button>
    </div>
  );
}
