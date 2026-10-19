import { Droplet, Eye, Thermometer } from "lucide-react";
import { feelsLikeLabel, humidityLabel, visibilityLabel } from "@/lib/conditions";
import { formatNumber, formatTemp } from "@/lib/format";
import Card from "../Card";

export function FeelsLikeTile({
  actual,
  feels,
  humidity,
}: {
  actual: number | null;
  feels: number | null;
  humidity: number | null;
}) {
  return (
    <Card title="Sensação" icon={Thermometer} className="tile">
      <p className="tile-value">{formatTemp(feels)}</p>
      {actual != null && feels != null && (
        <p className="tile-text">{feelsLikeLabel(actual, feels, humidity)}</p>
      )}
    </Card>
  );
}

export function HumidityTile({
  humidity,
  dewPoint,
}: {
  humidity: number | null;
  dewPoint: number | null;
}) {
  return (
    <Card title="Umidade" icon={Droplet} className="tile">
      <p className="tile-value">
        {formatNumber(humidity)}
        {humidity != null && "%"}
      </p>
      <div
        className="meter"
        role="img"
        aria-label={humidity == null ? "Umidade indisponível" : `Umidade ${Math.round(humidity)}%`}
      >
        {humidity != null && <span style={{ width: `${Math.min(100, humidity)}%` }} />}
      </div>
      {dewPoint != null && <p className="tile-text">{humidityLabel(dewPoint)}</p>}
    </Card>
  );
}

export function VisibilityTile({ meters }: { meters: number | null }) {
  const km = meters == null ? null : meters / 1000;
  return (
    <Card title="Visibilidade" icon={Eye} className="tile">
      <p className="tile-value">
        {formatNumber(km, km != null && km < 10 ? 1 : 0)} {km != null && <small>km</small>}
      </p>
      {meters != null && <p className="tile-text">{visibilityLabel(meters)}</p>}
    </Card>
  );
}
