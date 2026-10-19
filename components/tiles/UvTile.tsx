import { Sun } from "lucide-react";
import { uvLevel } from "@/lib/conditions";
import Card from "../Card";

export default function UvTile({ uv, maxToday }: { uv: number; maxToday: number }) {
  const level = uvLevel(uv);
  return (
    <Card title="Índice UV" icon={Sun} className="tile">
      <p className="tile-value">{Math.round(uv)}</p>
      <p className="tile-label">{level.label}</p>
      <div className="uv-bar" role="img" aria-label={`Índice UV ${Math.round(uv)} de 11 ou mais`}>
        <span className="uv-dot" style={{ left: `${Math.min(100, (uv / 11) * 100)}%` }} />
      </div>
      <p className="tile-text">
        {level.advice} Máximo hoje: {Math.round(maxToday)}.
      </p>
    </Card>
  );
}
