import { motion } from "framer-motion";
import { XCircle } from "lucide-react";

interface Props {
  message: string;
  onRetry: () => void;
  onChangePhoto: () => void;
}

export default function ErrorScreen({ message, onRetry, onChangePhoto }: Props) {
  return (
    <div className="absolute inset-0 bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="w-20 h-20 rounded-full bg-destructive flex items-center justify-center mb-5"
        >
          <XCircle size={42} className="text-destructive-foreground" />
        </motion.div>
        <h2 className="text-foreground font-bold text-[22px]">Analyse impossible</h2>
        <p className="text-muted-foreground text-sm mt-2 mb-6 break-words">{message}</p>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="w-full bg-primary text-primary-foreground rounded-full py-4 font-bold"
        >
          Réessayer
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onChangePhoto}
          className="w-full mt-2 border border-border text-foreground rounded-full py-4 font-medium"
        >
          Changer de photo
        </motion.button>
      </div>
    </div>
  );
}
