import { ChevronDown, MapPin, Navigation } from "lucide-react";
import { describeWeather } from "@/lib/conditions";
import { formatLongDate, formatTemp } from "@/lib/format";
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
      <button type="button" className="hero-place" onClick={onOpenCities}>
        {place.current ? <Navigation size={14} aria-hidden /> : <MapPin size={14} aria-hidden />}
        <span className="hero-city">{place.name}</span>
        <ChevronDown size={16} aria-hidden />
        <span className="sr-only">Trocar cidade</span>
      </button>
      {place.current && <p className="hero-sub">Minha localização</p>}
      <p
        className="hero-temp"
        aria-label={`Temperatura agora: ${Math.round(current.temperature)} graus`}
      >
        {formatTemp(current.temperature)}
      </p>
      <p className="hero-condition">{condition.label}</p>
      <p className="hero-range">
        Máx.: {formatTemp(daily.temperatureMax[0])} · Mín.: {formatTemp(daily.temperatureMin[0])}
      </p>
      <p className="hero-date">{formatLongDate(current.time, timezone)}</p>
    </header>
  );
}
