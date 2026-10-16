const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const hourFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit" });

export const formatDateTime = (unix: number) => timeFormatter.format(unix * 1000);
export const formatHour = (unix: number) => hourFormatter.format(unix * 1000);
export const formatDay = (unix: number) => dayFormatter.format(unix * 1000);

const COMPASS = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
export function compassPoint(deg: number): string {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

/** Index of the forecast step closest to now. */
export function closestStep(times: number[], now = Date.now() / 1000): number {
  let best = 0;
  for (let i = 1; i < times.length; i++) {
    if (Math.abs(times[i] - now) < Math.abs(times[best] - now)) best = i;
  }
  return best;
}
