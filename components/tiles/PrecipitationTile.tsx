import { Droplets } from "lucide-react";
import { formatHour, formatWeekday } from "@/lib/format";
import type { Forecast } from "@/lib/types";
import Card from "../Card";

export default function PrecipitationTile({ forecast }: { forecast: Forecast }) {
  const { daily, hourly, timezone } = forecast;
  const today = daily.precipitationSum[0];
  const next24 = hourly.precipitation.slice(0, 24).reduce((a, b) => a + b, 0);
  const nextRainHour = hourly.time.findIndex((_, i) => hourly.precipitation[i] >= 0.2);
  const nextRainDay = daily.time.findIndex((_, i) => i > 0 && daily.precipitationSum[i] >= 1);

  let text: string;
  if (nextRainHour === 0)
    text = `Chovendo agora. ${next24.toFixed(1)} mm previstos nas próximas 24 h.`;
  else if (nextRainHour > 0)
    text = `Chuva prevista a partir das ${formatHour(hourly.time[nextRainHour], timezone)}${
      formatWeekday(hourly.time[nextRainHour], timezone) !== formatWeekday(hourly.time[0], timezone)
        ? ` de ${formatWeekday(hourly.time[nextRainHour], timezone)}`
        : ""
    }.`;
  else if (nextRainDay > 0)
    text = `Próxima chuva: ${formatWeekday(daily.time[nextRainDay], timezone)}, ${daily.precipitationSum[
      nextRainDay
    ].toFixed(0)} mm.`;
  else text = "Nenhuma chuva prevista nos próximos dias.";

  return (
    <Card title="Precipitação" icon={Droplets} className="tile">
      <p className="tile-value">
        {today.toFixed(today >= 10 ? 0 : 1)} <small>mm</small>
      </p>
      <p className="tile-label">Hoje</p>
      <p className="tile-text">{text}</p>
    </Card>
  );
}
