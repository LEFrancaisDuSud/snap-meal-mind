import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, Lock, User as UserIcon, Eye, EyeOff, Check } from "lucide-react";

type Mode = "welcome" | "signup" | "signin" | "forgot";

const ERROR_MAP: Record<string, string> = {
  invalid_credentials: "Wrong email or password",
  invalid_login_credentials: "Wrong email or password",
  email_not_confirmed: "Please verify your email first",
  user_already_exists: "Account exists. Sign in instead",
  user_already_registered: "Account exists. Sign in instead",
  over_email_send_rate_limit: "Too many attempts. Try again in a minute.",
};
function mapError(msg: string): string {
  if (!navigator.onLine) return "No internet connection";
  const key = msg.toLowerCase().replace(/ /g, "_");
  for (const k of Object.keys(ERROR_MAP)) if (key.includes(k)) return ERROR_MAP[k];
  return msg;
}

function passwordStrength(pw: string): { label: string; color: string; pct: number } {
  if (pw.length < 8) return { label: "Too short", color: "#FF3B30", pct: 25 };
  const hasMixed = /[a-z]/.test(pw) && /[A-Z]/.test(pw);
  const hasNum = /\d/.test(pw);
  if (hasMixed && hasNum) return { label: "Strong", color: "#00FF85", pct: 100 };
  if (hasMixed || hasNum) return { label: "Medium", color: "#FF9500", pct: 65 };
  return { label: "Weak", color: "#FF3B30", pct: 35 };
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("welcome");
  const nav = useNavigate();

  return (
    <div className="phone-shell !mx-auto bg-black flex flex-col px-6 pt-16 pb-10 mx-auto" style={{ maxWidth: 430 }}>
      {/* Logo */}
      <div className="flex flex-col items-center mb-12 animate-fade-up">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-5 glow-green">
          <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4 L20 12 L16 12 L16 20 L8 20 L8 12 L4 12 Z" />
          </svg>
        </div>
        <h1 className="text-h1 mb-2">NutriScan</h1>
        <p className="text-body text-[#888] text-center">Know exactly what you eat.</p>
      </div>

      {mode === "welcome" && <Welcome onMode={setMode} />}
      {mode === "signup" && <SignUp onBack={() => setMode("welcome")} onSwitch={() => setMode("signin")} onDone={() => nav("/verify-email")} />}
      {mode === "signin" && <SignIn onBack={() => setMode("welcome")} onSwitch={() => setMode("signup")} onForgot={() => setMode("forgot")} onDone={() => nav("/", { replace: true })} />}
      {mode === "forgot" && <Forgot onBack={() => setMode("signin")} />}
    </div>
  );
}

function Welcome({ onMode }: { onMode: (m: Mode) => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function oauth(provider: "apple" | "google") {
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error(mapError(error.message));
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 animate-fade-up">
      <button
        disabled={!!loading}
        onClick={() => oauth("apple")}
        className="h-[52px] rounded-[14px] bg-white text-black font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60"
      >
        {loading === "apple" ? <Loader2 className="w-5 h-5 animate-spin" /> : <>
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          Continue with Apple
        </>}
      </button>
      <button
        disabled={!!loading}
        onClick={() => oauth("google")}
        className="h-[52px] rounded-[14px] bg-transparent border border-[#333] text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60"
      >
        {loading === "google" ? <Loader2 className="w-5 h-5 animate-spin" /> : <>
          <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </>}
      </button>
      <button
        onClick={() => onMode("signup")}
        className="h-[52px] rounded-[14px] bg-primary text-black font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition glow-green"
      >
        <Mail className="w-5 h-5" /> Continue with email
      </button>
      <button onClick={() => onMode("signin")} className="text-primary text-sm font-medium mt-3 active:opacity-70">
        Already have an account? Sign in
      </button>
      <p className="text-[#555] text-[11px] text-center mt-6 leading-relaxed">
        By continuing you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

function Field({ icon: Icon, ...props }: any) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
      <input
        {...props}
        className="w-full h-[52px] bg-[#141414] border border-[#222] rounded-[12px] pl-12 pr-4 text-white placeholder:text-[#555] focus:outline-none focus:border-primary transition"
      />
    </div>
  );
}

function SignUp({ onBack, onSwitch, onDone }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const strength = passwordStrength(pw);
  const nameValid = name.trim().length >= 2;
  const emailValid = /\S+@\S+\.\S+/.test(email);
  const pwValid = pw.length >= 8;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!nameValid || !emailValid || !pwValid) {
      toast.error("Please fill all fields correctly");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name },
      },
    });
    setBusy(false);
    if (error) { toast.error(mapError(error.message)); return; }
    sessionStorage.setItem("ns:pending_email", email);
    onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 animate-fade-up">
      <button type="button" onClick={onBack} className="text-[#888] text-sm self-start mb-2">← Back</button>
      <div className="relative">
        <Field icon={UserIcon} type="text" placeholder="Your name" value={name} onChange={(e: any) => setName(e.target.value)} autoFocus />
        {nameValid && <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />}
      </div>
      <div className="relative">
        <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={(e: any) => setEmail(e.target.value)} autoComplete="email" />
        {emailValid && <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />}
      </div>
      <div className="relative">
        <Field icon={Lock} type={show ? "text" : "password"} placeholder="Password (8+ chars)" value={pw} onChange={(e: any) => setPw(e.target.value)} autoComplete="new-password" />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555]">
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {pw.length > 0 && (
        <div className="px-1">
          <div className="h-1 bg-[#222] rounded-full overflow-hidden">
            <div className="h-full transition-all duration-300" style={{ width: `${strength.pct}%`, background: strength.color }} />
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: strength.color }}>{strength.label}</p>
        </div>
      )}
      <button type="submit" disabled={busy} className="h-[52px] rounded-[14px] bg-primary text-black font-bold mt-2 flex items-center justify-center disabled:opacity-60 active:scale-[0.98] transition glow-green">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create account"}
      </button>
      <button type="button" onClick={onSwitch} className="text-primary text-sm mt-2">Already have an account? Sign in</button>
    </form>
  );
}

function SignIn({ onBack, onSwitch, onForgot, onDone }: any) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) { toast.error(mapError(error.message)); return; }
    onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 animate-fade-up">
      <button type="button" onClick={onBack} className="text-[#888] text-sm self-start mb-2">← Back</button>
      <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={(e: any) => setEmail(e.target.value)} autoFocus autoComplete="email" />
      <div className="relative">
        <Field icon={Lock} type={show ? "text" : "password"} placeholder="Password" value={pw} onChange={(e: any) => setPw(e.target.value)} autoComplete="current-password" />
        <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555]">
          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      <button type="button" onClick={onForgot} className="text-[#888] text-sm self-end">Forgot password?</button>
      <button type="submit" disabled={busy} className="h-[52px] rounded-[14px] bg-primary text-black font-bold mt-2 flex items-center justify-center disabled:opacity-60 active:scale-[0.98] glow-green">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
      </button>
      <button type="button" onClick={onSwitch} className="text-primary text-sm mt-2">Don't have an account? Sign up</button>
    </form>
  );
}

function Forgot({ onBack }: any) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) { toast.error(mapError(error.message)); return; }
    setSent(true);
    toast.success("Reset email sent");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 animate-fade-up">
      <button type="button" onClick={onBack} className="text-[#888] text-sm self-start mb-2">← Back</button>
      <h2 className="text-h2 mb-1">Reset password</h2>
      <p className="text-body text-[#888] mb-3">Enter your email and we'll send you a reset link.</p>
      <Field icon={Mail} type="email" placeholder="Email" value={email} onChange={(e: any) => setEmail(e.target.value)} autoFocus />
      <button type="submit" disabled={busy || sent} className="h-[52px] rounded-[14px] bg-primary text-black font-bold mt-2 flex items-center justify-center disabled:opacity-60 glow-green">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : sent ? "Email sent ✓" : "Send reset link"}
      </button>
    </form>
  );
}
