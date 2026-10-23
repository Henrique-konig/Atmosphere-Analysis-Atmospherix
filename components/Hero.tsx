import { ChevronDown, MapPin, Navigation } from "lucide-react";
import { describeWeather } from "@/lib/conditions";
import { formatLongDate, formatTemp, formatTempNumber } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { SavedPlace } from "@/lib/storage";
import type { Forecast } from "@/lib/types";

interface Props {
  place: SavedPlace;
  forecast: Forecast;
  onOpenCities: () => void;
}

export default function Hero({ place, forecast, onOpenCities }: Props) {
  const { current, daily, timezone } = forecast;
  const condition = describeWeather(current.weatherCode, current.isDay);
  return (
    <header className="hero">
      <h1 className="sr-only">{t("app.heading", { city: place.name })}</h1>
      <button type="button" className="hero-place" onClick={onOpenCities}>
        {place.current ? <Navigation size={14} aria-hidden /> : <MapPin size={14} aria-hidden />}
        <span className="hero-city">{place.name}</span>
        <ChevronDown size={16} aria-hidden />
        <span className="sr-only">{t("hero.changeCity")}</span>
      </button>
      {place.current && <p className="hero-sub">{t("app.myLocation")}</p>}
      <p
        className="hero-temp"
        aria-label={t("hero.tempNow", { temp: formatTempNumber(current.temperature) })}
      >
        {formatTemp(current.temperature)}
      </p>
      <p className="hero-condition">{condition.label}</p>
      <p className="hero-range">
        {t("hero.max", { temp: formatTemp(daily.temperatureMax[0]) })} ·{" "}
        {t("hero.min", { temp: formatTemp(daily.temperatureMin[0]) })}
      </p>
      <p className="hero-date">{formatLongDate(current.time, timezone)}</p>
    </header>
  );
}
