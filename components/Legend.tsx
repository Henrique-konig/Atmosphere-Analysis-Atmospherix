import { cssGradient, PRECIPITATION_SCALE, TEMPERATURE_SCALE } from "@/lib/colors";
import type { FieldLayer } from "@/lib/types";

const LEGENDS = {
  temperature: { title: "Temperatura (°C)", scale: TEMPERATURE_SCALE },
  precipitation: { title: "Chuva (mm/h)", scale: PRECIPITATION_SCALE },
};

export default function Legend({ layer }: { layer: FieldLayer }) {
  if (layer === "none") return null;
  const { title, scale } = LEGENDS[layer];
  const ticks = [scale[0][0], scale[Math.floor(scale.length / 2)][0], scale[scale.length - 1][0]];
  return (
    <div className="panel legend">
      <span className="legend-title">{title}</span>
      <div className="legend-bar" style={{ background: cssGradient(scale) }} />
      <div className="legend-ticks">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}
