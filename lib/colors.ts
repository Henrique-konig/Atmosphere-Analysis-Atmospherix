export type ColorStop = [value: number, rgba: [number, number, number, number]];

/** Temperature (°C), inspired by the palettes used by Windy/Ventusky. */
export const TEMPERATURE_SCALE: ColorStop[] = [
  [-20, [130, 22, 146, 255]],
  [-10, [64, 64, 200, 255]],
  [0, [34, 136, 220, 255]],
  [8, [40, 190, 200, 255]],
  [15, [80, 200, 110, 255]],
  [20, [190, 220, 60, 255]],
  [25, [250, 200, 40, 255]],
  [30, [245, 130, 30, 255]],
  [35, [220, 40, 40, 255]],
  [42, [140, 0, 40, 255]],
];

/** Precipitation (mm/h); transparent when dry. */
export const PRECIPITATION_SCALE: ColorStop[] = [
  [0, [0, 0, 0, 0]],
  [0.1, [120, 190, 255, 90]],
  [1, [40, 130, 240, 170]],
  [3, [30, 200, 90, 200]],
  [7, [250, 220, 30, 220]],
  [15, [245, 100, 30, 230]],
  [30, [200, 20, 160, 240]],
];

export function colorAt(scale: ColorStop[], value: number): [number, number, number, number] {
  if (!Number.isFinite(value)) return [0, 0, 0, 0];
  if (value <= scale[0][0]) return scale[0][1];
  const last = scale[scale.length - 1];
  if (value >= last[0]) return last[1];
  for (let i = 1; i < scale.length; i++) {
    const [v1, c1] = scale[i];
    if (value <= v1) {
      const [v0, c0] = scale[i - 1];
      const t = (value - v0) / (v1 - v0);
      return [0, 1, 2, 3].map((k) => Math.round(c0[k] + (c1[k] - c0[k]) * t)) as [
        number,
        number,
        number,
        number,
      ];
    }
  }
  return last[1];
}

export function cssGradient(scale: ColorStop[]): string {
  const min = scale[0][0];
  const span = scale[scale.length - 1][0] - min;
  const stops = scale.map(([v, [r, g, b, a]]) => {
    const pct = ((v - min) / span) * 100;
    return `rgba(${r},${g},${b},${Math.max(a, 120) / 255}) ${pct.toFixed(1)}%`;
  });
  return `linear-gradient(to right, ${stops.join(", ")})`;
}
