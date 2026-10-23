import { Leaf } from "lucide-react";
import { aqiLevel } from "@/lib/conditions";
import { formatNumber, MISSING } from "@/lib/format";
import { t } from "@/lib/i18n";
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
    <Card title={t("air.title")} icon={Leaf} className="tile tile-wide air">
      <div className="air-main">
        <p className="tile-value">{formatNumber(aqi)}</p>
        <p className="tile-label">{level ? level.label : t("common.unavailable")}</p>
        <div
          className="aqi-bar"
          role="img"
          aria-label={
            aqi == null
              ? t("air.unavailable")
              : t("air.index", { aqi: Math.round(aqi), level: level?.label.toLowerCase() ?? "" })
          }
        >
          {aqi != null && (
            <span className="uv-dot" style={{ left: `${Math.min(100, (aqi / BAR_MAX) * 100)}%` }} />
          )}
        </div>
        <p className="tile-text">{level ? level.advice : t("air.noData")}</p>
      </div>
      <dl className="wind-rows air-rows">
        <div>
          <dt>{t("air.pm25")}</dt>
          <dd>{microgram(c?.pm25 ?? null)}</dd>
        </div>
        <div>
          <dt>PM10</dt>
          <dd>{microgram(c?.pm10 ?? null)}</dd>
        </div>
        <div>
          <dt>{t("air.ozone")}</dt>
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
