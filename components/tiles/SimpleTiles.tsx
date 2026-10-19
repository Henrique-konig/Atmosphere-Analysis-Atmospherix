import { Droplet, Eye, Thermometer } from "lucide-react";
import { feelsLikeLabel, humidityLabel, visibilityLabel } from "@/lib/conditions";
import { formatTemp } from "@/lib/format";
import Card from "../Card";

export function FeelsLikeTile({
  actual,
  feels,
  humidity,
}: {
  actual: number;
  feels: number;
  humidity: number;
}) {
  return (
    <Card title="Sensação" icon={Thermometer} className="tile">
      <p className="tile-value">{formatTemp(feels)}</p>
      <p className="tile-text">{feelsLikeLabel(actual, feels, humidity)}</p>
    </Card>
  );
}

export function HumidityTile({ humidity, dewPoint }: { humidity: number; dewPoint: number }) {
  return (
    <Card title="Umidade" icon={Droplet} className="tile">
      <p className="tile-value">{Math.round(humidity)}%</p>
      <div className="meter" role="img" aria-label={`Umidade ${Math.round(humidity)}%`}>
        <span style={{ width: `${Math.min(100, humidity)}%` }} />
      </div>
      <p className="tile-text">{humidityLabel(dewPoint)}</p>
    </Card>
  );
}

export function VisibilityTile({ meters }: { meters: number }) {
  const km = meters / 1000;
  return (
    <Card title="Visibilidade" icon={Eye} className="tile">
      <p className="tile-value">
        {km >= 10 ? Math.round(km) : km.toFixed(1)} <small>km</small>
      </p>
      <p className="tile-text">{visibilityLabel(meters)}</p>
    </Card>
  );
}
