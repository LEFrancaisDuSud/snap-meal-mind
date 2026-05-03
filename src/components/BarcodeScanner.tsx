import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { motion } from "framer-motion";
import { CameraOff, X } from "lucide-react";

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
  paused?: boolean;
}

export default function BarcodeScanner({ onDetected, onClose, paused }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [denied, setDenied] = useState(false);
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    if (paused) return;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;
    let cancelled = false;

    (async () => {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (!result || cancelled) return;
            const text = result.getText();
            if (text && text !== lastRef.current) {
              lastRef.current = text;
              onDetected(text);
            }
          },
        );
        controlsRef.current = controls as any;
      } catch (e) {
        console.error("zxing init", e);
        setDenied(true);
      }
    })();

    return () => {
      cancelled = true;
      try {
        controlsRef.current?.stop();
      } catch {}
      readerRef.current = null;
    };
  }, [paused, onDetected]);

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      {!denied && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-5 pb-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
        <h1 className="text-white font-extrabold tracking-[0.2em] text-sm">
          CODE-BARRES
        </h1>
        <span className="w-10" />
      </div>

      {!denied && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div
            className="relative rounded-2xl border-2 border-primary"
            style={{
              width: "82%",
              maxWidth: 360,
              height: 180,
              boxShadow:
                "0 0 0 9999px rgba(0,0,0,0.55), 0 0 40px hsl(var(--primary) / 0.6)",
            }}
          >
            <motion.div
              className="absolute left-2 right-2 h-[2px] bg-primary rounded-full"
              animate={{ top: ["10%", "90%", "10%"] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary)))" }}
            />
          </div>
        </div>
      )}

      <div className="absolute bottom-10 left-0 right-0 text-center px-6 z-10">
        <div className="inline-block bg-black/55 backdrop-blur-md text-white/90 text-xs px-4 py-2 rounded-2xl">
          Aligne le code-barres dans le cadre
        </div>
      </div>

      {denied && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <CameraOff className="text-destructive" size={28} />
            </div>
            <h2 className="text-foreground font-bold text-lg mb-2">
              Caméra inaccessible
            </h2>
            <p className="text-muted-foreground text-sm">
              Autorise l'accès à la caméra pour scanner un code-barres.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
