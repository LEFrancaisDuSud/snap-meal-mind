import type { MealType } from "@/types/nutrition";
import { Coffee, UtensilsCrossed, Moon, Cookie } from "lucide-react";

const MAP: Record<MealType, { Icon: any; bg: string; color: string; emoji: string }> = {
  "Petit-déjeuner": { Icon: Coffee, bg: "bg-primary/15", color: "text-primary", emoji: "☕" },
  "Déjeuner":       { Icon: UtensilsCrossed, bg: "bg-tertiary/15", color: "text-tertiary", emoji: "🍽️" },
  "Dîner":          { Icon: Moon, bg: "bg-secondary/15", color: "text-secondary", emoji: "🌙" },
  "Collation":      { Icon: Cookie, bg: "bg-surface-high", color: "text-muted-foreground", emoji: "🍪" },
};

export default function MealTypeIcon({ type, size = 40 }: { type: MealType; size?: number }) {
  const m = MAP[type];
  return (
    <div className={`rounded-2xl flex items-center justify-center ${m.bg}`} style={{ width: size, height: size }}>
      <m.Icon size={size * 0.5} className={m.color} strokeWidth={2.2} />
    </div>
  );
}

export function mealTypeMeta(type: MealType) {
  return MAP[type];
}
