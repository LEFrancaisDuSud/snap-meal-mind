import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, X, Loader2 } from "lucide-react";

interface Props {
  onTranscript: (text: string) => void;
  onClose: () => void;
}

// Web Speech API typing
type SR = any;

export default function VoiceCapture({ onTranscript, onClose }: Props) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    const Ctor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const rec: SR = new Ctor();
    rec.lang = "fr-FR";
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e: any) => {
      let finalT = "";
      let interimT = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalT += r[0].transcript;
        else interimT += r[0].transcript;
      }
      if (finalT) setText((p) => (p + " " + finalT).trim());
      setInterim(interimT);
    };
    rec.onerror = (e: any) => {
      setError(e?.error || "Erreur micro");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => {
      try {
        rec.stop();
      } catch {}
    };
  }, []);

  const start = () => {
    if (!recRef.current) return;
    setError(null);
    setText("");
    setInterim("");
    try {
      recRef.current.start();
      setListening(true);
    } catch (e: any) {
      setError(e?.message || "Impossible de démarrer le micro");
    }
  };

  const stop = () => {
    try {
      recRef.current?.stop();
    } catch {}
    setListening(false);
  };

  const submit = () => {
    const finalText = (text + " " + interim).trim();
    if (!finalText) return;
    onTranscript(finalText);
  };

  return (
    <div className="absolute inset-0 z-40 bg-background flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-surface text-foreground flex items-center justify-center"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
        <div className="text-foreground font-bold">Saisie vocale</div>
        <span className="w-10" />
      </div>

      <div className="flex-1 px-6 flex flex-col items-center justify-center text-center">
        {!supported ? (
          <div className="text-muted-foreground">
            La saisie vocale n'est pas supportée sur ce navigateur.
            <br />
            Essaie Chrome ou Safari récent.
          </div>
        ) : (
          <>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={listening ? stop : start}
              className={`w-32 h-32 rounded-full flex items-center justify-center text-primary-foreground ${
                listening ? "bg-destructive" : "bg-primary"
              }`}
              style={{ boxShadow: "0 0 0 8px hsl(var(--primary) / 0.18)" }}
              aria-label={listening ? "Arrêter" : "Démarrer"}
            >
              {listening ? (
                <motion.div
                  animate={{ scale: [1, 1.18, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Mic size={48} />
                </motion.div>
              ) : (
                <Mic size={48} />
              )}
            </motion.button>

            <div className="mt-6 text-foreground font-bold">
              {listening ? "Écoute en cours…" : "Appuie pour parler"}
            </div>
            <div className="text-muted-foreground text-sm mt-1">
              Ex : « J'ai mangé un avocat et deux œufs »
            </div>

            <div className="mt-6 w-full max-w-md min-h-[80px] bg-card rounded-2xl p-4 text-left">
              <div className="text-foreground text-sm">
                {text}
                <span className="text-muted-foreground italic"> {interim}</span>
                {!text && !interim && (
                  <span className="text-muted-foreground italic">
                    La transcription apparaîtra ici…
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="text-destructive text-sm mt-3">{error}</div>
            )}
          </>
        )}
      </div>

      <div className="px-5 pb-6 pt-3 bg-gradient-to-t from-background via-background/95 to-transparent">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={submit}
          disabled={!text && !interim}
          className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-full disabled:opacity-50"
        >
          ✨ Analyser et ajouter
        </motion.button>
      </div>
    </div>
  );
}
