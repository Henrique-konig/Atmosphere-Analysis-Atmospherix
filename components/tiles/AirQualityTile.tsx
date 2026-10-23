import { Leaf } from "lucide-react";
import { aqiLevel } from "@/lib/conditions";
import { formatNumber, MISSING } from "@/lib/format";
import type { AirQuality } from "@/lib/types";
import Card from "../Card";

/** The US AQI scale goes up to 500, but the bar stops at 300 like most weather apps. */
const BAR_MAX = 300;

const microgram = (v: number | null) => (v == null ? MISSING : `${Math.round(v)} µg/m³`);

export default function AirQualityTile({ air }: { air: AirQuality | null }) {
  const c = air?.current;
  const aqi = c?.aqi ?? null;
  const level = aqi == null ? null : aqiLevel(aqi);
  return (
    <Card title="Qualidade do ar" icon={Leaf} className="tile tile-wide air">
      <div className="air-main">
        <p className="tile-value">{formatNumber(aqi)}</p>
        <p className="tile-label">{level ? level.label : "Indisponível"}</p>
        <div
          className="aqi-bar"
          role="img"
          aria-label={
            aqi == null
              ? "Qualidade do ar indisponível"
              : `Índice de qualidade do ar ${Math.round(aqi)}, ${level?.label.toLowerCase()}`
          }
        >
          {aqi != null && (
            <span className="uv-dot" style={{ left: `${Math.min(100, (aqi / BAR_MAX) * 100)}%` }} />
          )}
        </div>
        <p className="tile-text">
          {level ? level.advice : "Sem dados de qualidade do ar para este local agora."}
        </p>
      </div>
      <dl className="wind-rows air-rows">
        <div>
          <dt>PM2,5</dt>
          <dd>{microgram(c?.pm25 ?? null)}</dd>
        </div>
        <div>
          <dt>PM10</dt>
          <dd>{microgram(c?.pm10 ?? null)}</dd>
        </div>
        <div>
          <dt>Ozônio</dt>
          <dd>{microgram(c?.ozone ?? null)}</dd>
        </div>
        <div>
          <dt>NO₂</dt>
          <dd>{microgram(c?.nitrogenDioxide ?? null)}</dd>
        </div>
      </dl>
    </Card>
  );
}
