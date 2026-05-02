// Date helpers — French locale, today/short formats
const DAYS_SHORT = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
const DAYS_FULL = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isoOf(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shortDay(d: Date) {
  return DAYS_SHORT[d.getDay()];
}
export function dayNumber(d: Date) {
  return d.getDate();
}
export function fullDay(d: Date) {
  return DAYS_FULL[d.getDay()];
}

export function weekAround(center: Date, daysBefore = 3, daysAfter = 3) {
  const list: Date[] = [];
  for (let i = -daysBefore; i <= daysAfter; i++) {
    const d = new Date(center);
    d.setDate(center.getDate() + i);
    list.push(d);
  }
  return list;
}
