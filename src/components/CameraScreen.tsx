import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Image as ImageIcon, RefreshCw, CameraOff, Settings } from "lucide-react";

interface Props {
  facingMode: "environment" | "user";
  setFacingMode: (m: "environment" | "user") => void;
  onCapture: (dataUrl: string) => void;
}

export default function CameraScreen({ facingMode, setFacingMode, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [flash, setFlash] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startStream = async () => {
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
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

  const flipCamera = () => {
    setFacingMode(facingMode === "environment" ? "user" : "environment");
  };

  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      {/* Live video */}
      {!permissionDenied && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Flash */}
      {flash && (
        <div
          className="absolute inset-0 z-30 pointer-events-none bg-white"
          style={{ opacity: 0.4, transition: "opacity 200ms ease-out" }}
        />
      )}

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pt-5 pb-4 bg-gradient-to-b from-black/60 to-transparent">
        <h1 className="text-foreground font-bold text-lg tracking-tight">
          TrackCal <span>🥗</span>
        </h1>
        <button className="text-foreground/80 hover:text-foreground p-2 rounded-full" aria-label="Settings">
          <Settings size={20} />
        </button>
      </div>

      {/* Viewfinder frame */}
      {!permissionDenied && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="relative" style={{ width: "78%", aspectRatio: "1 / 1.1", maxWidth: 340 }}>
            <div
              className="absolute inset-0 rounded-3xl"
              style={{
                border: "2px dashed hsl(var(--primary) / 0.55)",
              }}
            />
            {/* Corner brackets */}
            {[
              { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 },
              { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 },
              { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 18 },
              { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 18 },
            ].map((s, i) => (
              <span key={i} className="corner-bracket corner-glow" style={s as React.CSSProperties} />
            ))}
            <div className="absolute -bottom-10 left-0 right-0 text-center text-foreground/90 text-sm font-medium tracking-wide">
              Frame your food
            </div>
          </div>
        </div>
      )}

      {/* Permission denied state */}
      {permissionDenied && (
        <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center mx-auto mb-4">
              <CameraOff className="text-destructive" size={28} />
            </div>
            <h2 className="text-foreground font-bold text-lg mb-2">Camera access required</h2>
            <p className="text-muted-foreground text-sm mb-5">
              Allow camera access in your browser settings to use TrackCal
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-primary text-primary-foreground rounded-full py-3 font-semibold"
            >
              Upload a photo instead
            </button>
          </div>
        </div>
      )}

      {/* Bottom gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: 200,
          background: "linear-gradient(to top, #000 10%, rgba(0,0,0,0.7) 50%, transparent 100%)",
        }}
      />

      {/* Bottom action bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 px-8 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-foreground"
          aria-label="Upload from gallery"
        >
          <ImageIcon size={22} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleShutter}
          disabled={permissionDenied}
          className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center shadow-[0_0_0_4px_rgba(255,255,255,0.2)] disabled:opacity-50"
          aria-label="Capture photo"
        >
          <Camera size={28} className="text-black" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={flipCamera}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-foreground"
          aria-label="Flip camera"
        >
          <RefreshCw size={22} />
        </motion.button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
