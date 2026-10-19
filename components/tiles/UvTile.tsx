import { Sun } from "lucide-react";
import { uvLevel } from "@/lib/conditions";
import { formatNumber } from "@/lib/format";
import Card from "../Card";

export default function UvTile({ uv, maxToday }: { uv: number | null; maxToday: number | null }) {
  const level = uv == null ? null : uvLevel(uv);
  return (
    <Card title="Índice UV" icon={Sun} className="tile">
      <p className="tile-value">{formatNumber(uv)}</p>
      {level && <p className="tile-label">{level.label}</p>}
      <div className="uv-bar" role="img" aria-label={`Índice UV ${formatNumber(uv)} de 11 ou mais`}>
        {uv != null && (
          <span className="uv-dot" style={{ left: `${Math.min(100, (uv / 11) * 100)}%` }} />
        )}
      </div>
      <p className="tile-text">
        {level?.advice} Máximo hoje: {formatNumber(maxToday)}.
      </p>
    </Card>
  );
}
