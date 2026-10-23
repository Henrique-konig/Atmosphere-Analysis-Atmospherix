import { Droplets } from "lucide-react";
import {
  formatHour,
  formatRain,
  formatRainAmount,
  formatWeekday,
  precipitationUnit,
  present,
} from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Forecast } from "@/lib/types";
import Card from "../Card";

export default function PrecipitationTile({ forecast }: { forecast: Forecast }) {
  const { daily, hourly, timezone } = forecast;
  const today = daily.precipitationSum[0];
  const next24 = present(hourly.precipitation.slice(0, 24)).reduce((a, b) => a + b, 0);
  const nextRainHour = hourly.time.findIndex((_, i) => (hourly.precipitation[i] ?? 0) >= 0.2);
  const nextRainDay = daily.time.findIndex(
    (_, i) => i > 0 && (daily.precipitationSum[i] ?? 0) >= 1,
  );

  let text: string;
  if (nextRainHour === 0) text = t("precip.now", { mm: formatRainAmount(next24) });
  else if (nextRainHour > 0) {
    const time = hourly.time[nextRainHour];
    const day = formatWeekday(time, timezone);
    const hour = formatHour(time, timezone);
    text =
      day !== formatWeekday(hourly.time[0], timezone)
        ? t("precip.fromDay", { hour, day })
        : t("precip.from", { hour });
  } else if (nextRainDay > 0)
    text = t("precip.next", {
      day: formatWeekday(daily.time[nextRainDay], timezone),
      mm: formatRainAmount(daily.precipitationSum[nextRainDay]),
    });
  else text = t("precip.none");

  return (
    <Card title={t("common.precipitation")} icon={Droplets} className="tile">
      <p className="tile-value">
        {formatRain(today)} {today != null && <small>{precipitationUnit()}</small>}
      </p>
      <p className="tile-label">{t("precip.today")}</p>
      <p className="tile-text">{text}</p>
    </Card>
  );
}
