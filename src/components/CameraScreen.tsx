import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Zap, Image as ImageIcon, RefreshCw, CameraOff, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  facingMode: "environment" | "user";
  setFacingMode: (m: "environment" | "user") => void;
  onCapture: (dataUrl: string) => void;
  onClose?: () => void;
}

export default function CameraScreen({ facingMode, setFacingMode, onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [flash, setFlash] = useState(false);
  const nav = useNavigate();

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startStream = async () => {
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setPermissionDenied(false);
    } catch (err) {
      console.error("Camera error", err);
      setPermissionDenied(true);
    }
  };

  useEffect(() => {
    startStream();
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const handleShutter = () => {
    if (!videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    stopStream();
    onCapture(dataUrl);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      stopStream();
      onCapture(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const flipCamera = () => setFacingMode(facingMode === "environment" ? "user" : "environment");
  const handleBack = () => { stopStream(); onClose ? onClose() : nav("/"); };

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      {!permissionDenied && (
        <video
          ref={videoRef}
          autoPlay playsInline muted
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {flash && (
        <div className="absolute inset-0 z-30 pointer-events-none bg-white" style={{ opacity: 0.5 }} />
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-5 pb-4 bg-gradient-to-b from-black/70 via-black/30 to-transparent">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white"
          aria-label="Retour"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-white font-extrabold tracking-[0.2em] text-sm">SCANNER</h1>
        <button
          className="w-10 h-10 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white"
          aria-label="Flash"
        >
          <Zap size={20} />
        </button>
      </div>

      {/* Hint pill */}
      {!permissionDenied && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute z-20 left-1/2 -translate-x-1/2 top-[72px]"
        >
          <div className="bg-primary-container text-primary-foreground text-xs font-extrabold tracking-widest px-5 py-2 rounded-full shadow-lg">
            CADRE TON REPAS
          </div>
        </motion.div>
      )}

      {/* Viewfinder */}
      {!permissionDenied && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="relative" style={{ width: "78%", aspectRatio: "1 / 1.3", maxWidth: 340 }}>
            {[
              { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 22 },
              { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 22 },
              { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 22 },
              { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 22 },
            ].map((s, i) => (
              <span key={i} className="corner-bracket corner-glow" style={s as React.CSSProperties} />
            ))}
            {/* close hint icon top-left */}
            <button
              onClick={handleBack}
              className="pointer-events-auto absolute top-3 left-3 w-8 h-8 rounded-full bg-black/35 backdrop-blur-md flex items-center justify-center text-white"
              aria-label="Annuler"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Permission denied */}
      {permissionDenied && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <CameraOff className="text-destructive" size={28} />
            </div>
            <h2 className="text-foreground font-bold text-lg mb-2">Accès caméra requis</h2>
            <p className="text-muted-foreground text-sm mb-5">
              Autorise l'accès à la caméra ou choisis une photo dans ta galerie.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold"
            >
              Choisir une photo
            </button>
          </div>
        </div>
      )}

      {/* Bottom hint */}
      {!permissionDenied && (
        <div className="absolute z-10 bottom-32 left-0 right-0 text-center px-6">
          <div className="inline-block bg-black/45 backdrop-blur-md text-white/90 text-xs px-4 py-2 rounded-2xl">
            Appuie pour analyser • Maintiens pour vidéo (bientôt)
          </div>
        </div>
      )}

      {/* Bottom gradient + actions */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{ height: 180, background: "linear-gradient(to top, #000 5%, rgba(0,0,0,0.6) 60%, transparent 100%)" }}
      />
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 px-8 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"
          aria-label="Galerie"
        >
          <ImageIcon size={22} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleShutter}
          disabled={permissionDenied}
          className="w-[78px] h-[78px] rounded-full bg-white flex items-center justify-center disabled:opacity-50"
          style={{ boxShadow: "0 0 0 5px rgba(255,255,255,0.25), 0 0 0 8px rgba(255,255,255,0.1)" }}
          aria-label="Capturer"
        />

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={flipCamera}
          className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white"
          aria-label="Retourner caméra"
        >
          <RefreshCw size={22} />
        </motion.button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}
