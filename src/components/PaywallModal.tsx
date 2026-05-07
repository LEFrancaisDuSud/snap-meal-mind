import { motion } from "framer-motion";

export default function PaywallModal({
  open,
  onClose,
  onUpgrade,
  showCloseAfterMs = 8000,
}: {
  open: boolean;
  onClose: () => void;
  onUpgrade: (plan: "monthly" | "annual") => Promise<void> | void;
  showCloseAfterMs?: number;
}) {
  return null; // dedicated full Paywall page used instead — see PaywallPage
}
