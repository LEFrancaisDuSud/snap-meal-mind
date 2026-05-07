import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

export default function ResetPasswordPage() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    nav("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <h1 className="text-h2 mb-6">Set new password</h1>
      <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-3">
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
          <input
            type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password"
            className="w-full h-[52px] bg-[#141414] border border-[#222] rounded-[12px] pl-12 pr-4 text-white placeholder:text-[#555] focus:outline-none focus:border-primary"
            autoFocus
          />
        </div>
        <button type="submit" disabled={busy} className="h-[52px] rounded-[14px] bg-primary text-black font-bold flex items-center justify-center disabled:opacity-60 glow-green">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update password"}
        </button>
      </form>
    </div>
  );
}
