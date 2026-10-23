import { Sun } from "lucide-react";
import { uvLevel } from "@/lib/conditions";
import { formatNumber } from "@/lib/format";
import { t } from "@/lib/i18n";
import Card from "../Card";

export default function UvTile({ uv, maxToday }: { uv: number | null; maxToday: number | null }) {
  const level = uv == null ? null : uvLevel(uv);
  return (
    <Card title={t("uv.title")} icon={Sun} className="tile">
      <p className="tile-value">{formatNumber(uv)}</p>
      {level && <p className="tile-label">{level.label}</p>}
      <div className="uv-bar" role="img" aria-label={t("uv.scale", { uv: formatNumber(uv) })}>
        {uv != null && (
          <span className="uv-dot" style={{ left: `${Math.min(100, (uv / 11) * 100)}%` }} />
        )}
      </div>
      <p className="tile-text">
        {level?.advice} {t("uv.maxToday", { uv: formatNumber(maxToday) })}
      </p>
    </Card>
  );
}
