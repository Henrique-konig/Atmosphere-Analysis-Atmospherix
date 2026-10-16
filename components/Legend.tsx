import { cssGradient } from "@/lib/colors";
import { getLayer } from "@/lib/layers";
import type { FieldLayer } from "@/lib/types";

export default function Legend({ layer }: { layer: FieldLayer }) {
  if (layer === "none") return null;
  const { title, scale, ticks } = getLayer(layer);
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
