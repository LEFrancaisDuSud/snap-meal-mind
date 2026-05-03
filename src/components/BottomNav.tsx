import { Home, History, ScanLine, BookOpen, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const ITEMS = [
  { to: "/", icon: Home, label: "HOME" },
  { to: "/historique", icon: History, label: "HISTO" },
  { to: "/scanner", icon: ScanLine, label: "SCANNER", center: true },
  { to: "/journal", icon: BookOpen, label: "JOURNAL" },
  { to: "/profil", icon: User, label: "PROFIL" },
];

export default function BottomNav() {
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <nav
      className="absolute bottom-0 left-0 right-0 z-30 px-3 pt-2 pb-3 bg-background/95 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="flex items-end justify-between">
        {ITEMS.map(({ to, icon: Icon, label, center }) => {
          const active = loc.pathname === to;
          if (center) {
            return (
              <li key={to} className="flex-1 flex justify-center">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => nav(to)}
                  className={`-mt-7 w-14 h-14 rounded-full flex items-center justify-center text-primary-foreground glow-primary ${
                    active ? "bg-primary" : "bg-primary"
                  }`}
                  aria-label={label}
                >
                  <Icon size={26} strokeWidth={2.4} />
                </motion.button>
              </li>
            );
          }
          return (
            <li key={to} className="flex-1">
              <button
                onClick={() => nav(to)}
                className="w-full flex flex-col items-center gap-1 py-1"
                aria-label={label}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.4 : 2}
                  className={active ? "text-primary" : "text-muted-foreground"}
                />
                <span
                  className={`text-[10px] font-bold tracking-wider ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
