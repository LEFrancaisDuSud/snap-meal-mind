export function todayISO(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDate(d: Date = new Date()): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}
