import { NavLink, useNavigate } from "react-router-dom";
import { Home, Utensils, BarChart3, User, Plus } from "lucide-react";

export default function BottomNav() {
  const nav = useNavigate();
  const items = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/meals", icon: Utensils, label: "Meals" },
    { to: "/progress", icon: BarChart3, label: "Progress" },
    { to: "/profile", icon: User, label: "Profile" },
  ];
  return (
    <nav
      className="absolute bottom-0 left-0 right-0 bg-black border-t border-[#222] flex items-center justify-around px-2"
      style={{ height: "calc(72px + env(safe-area-inset-bottom))", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.slice(0, 2).map((it) => (
        <NavTab key={it.to} {...it} />
      ))}
      <button
        onClick={() => nav("/log")}
        aria-label="Log food"
        className="w-14 h-14 -mt-6 rounded-full bg-primary text-black flex items-center justify-center glow-green active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7" strokeWidth={3} />
      </button>
      {items.slice(2).map((it) => (
        <NavTab key={it.to} {...it} />
      ))}
    </nav>
  );
}

function NavTab({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 w-16 py-2 ${isActive ? "text-primary" : "text-[#555]"}`
      }
    >
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </NavLink>
  );
}
