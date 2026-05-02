import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) return null;
  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Bienvenue ! Configurons ton profil 🎉");
        nav("/onboarding", { replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connecté !");
        nav("/", { replace: true });
      }
    } catch (err: any) {
      toast.error(err?.message || "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="phone-shell">
        <div className="absolute inset-0 px-6 pt-12 pb-8 overflow-y-auto scrollbar-hide flex flex-col">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 mb-1">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-2xl">
                🥗
              </div>
            </div>
            <h1 className="text-primary text-3xl font-extrabold mt-3">TrackCal</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Photographie. Analyse. Suis tes calories.
            </p>
          </motion.div>

          <motion.form
            onSubmit={submit}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-10 space-y-3"
          >
            {mode === "signup" && (
              <Field icon={<Mail size={18} />}>
                <input
                  type="text"
                  placeholder="Ton prénom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                />
              </Field>
            )}
            <Field icon={<Mail size={18} />}>
              <input
                type="email"
                required
                placeholder="Adresse e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </Field>
            <Field icon={<Lock size={18} />}>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mot de passe (6+ caractères)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </Field>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-full mt-3 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? "..." : mode === "signup" ? "Créer mon compte" : "Se connecter"}
              {!loading && <ArrowRight size={18} />}
            </motion.button>
          </motion.form>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-muted-foreground text-sm mt-6 text-center"
          >
            {mode === "login" ? (
              <>Pas encore de compte ? <span className="text-primary font-semibold">Créer un compte</span></>
            ) : (
              <>Déjà inscrit ? <span className="text-primary font-semibold">Se connecter</span></>
            )}
          </button>

          <p className="text-muted-foreground text-xs mt-auto pt-8 text-center leading-relaxed">
            En continuant tu acceptes nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 bg-surface rounded-2xl px-4 py-3.5 border border-border focus-within:border-primary/60 transition-colors">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </div>
  );
}
