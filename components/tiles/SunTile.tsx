import { Sunrise, Sunset } from "lucide-react";
import { formatDuration, formatTime, MISSING } from "@/lib/format";
import { t } from "@/lib/i18n";
import Card from "../Card";

interface Props {
  now: number;
  sunrise: number | null;
  sunset: number | null;
  nextSunrise: number | null;
  daylight: number | null;
  timezone: string;
}

/** Sun path as an arc from sunrise (left) to sunset (right), with the sun's position. */
export default function SunTile({ now, sunrise, sunset, nextSunrise, daylight, timezone }: Props) {
  // Polar day or night, or data the model did not provide.
  if (sunrise == null || sunset == null) {
    return (
      <Card title={t("day.sun")} icon={Sunrise} className="tile">
        <p className="tile-value">{MISSING}</p>
        <p className="tile-text">{t("sun.unavailable")}</p>
      </Card>
    );
  }
  const beforeSunset = now < sunset;
  const progress = Math.min(1, Math.max(0, (now - sunrise) / (sunset - sunrise)));
  const isDay = now >= sunrise && now <= sunset;
  const angle = Math.PI * (1 - progress);
  const sunX = 50 + 40 * Math.cos(angle);
  const sunY = 50 - 40 * Math.sin(angle);
  const headline = beforeSunset ? sunset : (nextSunrise ?? sunrise);

  return (
    <Card
      title={beforeSunset ? t("common.sunset") : t("sun.sunriseTitle")}
      icon={beforeSunset ? Sunset : Sunrise}
      className="tile"
    >
      <p className="tile-value">{formatTime(headline, timezone)}</p>
      <svg viewBox="0 0 100 58" className="sun-arc" aria-hidden>
        <line x1="4" y1="50" x2="96" y2="50" className="sun-horizon" />
        <path d="M 10 50 A 40 40 0 0 1 90 50" className="sun-path" />
        {isDay && <path d={`M 10 50 A 40 40 0 0 1 ${sunX} ${sunY}`} className="sun-path-done" />}
        {isDay && <circle cx={sunX} cy={sunY} r="5" className="sun-dot" />}
      </svg>
      <p className="tile-text">
        {beforeSunset
          ? t("sun.sunriseAt", { time: formatTime(sunrise, timezone) })
          : t("sun.sunsetAt", { time: formatTime(sunset, timezone) })}
        <br />
        {t("sun.daylight", { duration: daylight == null ? MISSING : formatDuration(daylight) })}
      </p>
    </Card>
  );
}
