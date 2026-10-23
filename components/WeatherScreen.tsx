"use client";

import { Download, LoaderCircle, Navigation, RefreshCw, Search, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForecast } from "@/hooks/useForecast";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { describeWeather } from "@/lib/conditions";
import { reverseGeocode } from "@/lib/reverseGeocode";
import { detectRisks, isSevereWeather } from "@/lib/risks";
import {
  loadHere,
  loadLastPlace,
  loadSavedPlaces,
  samePlace,
  storeHere,
  storeLastPlace,
  storeSavedPlaces,
  toggleFavorite,
  type SavedPlace,
} from "@/lib/storage";
import CitySheet from "./CitySheet";
import DailyCard from "./DailyCard";
import DaySheet from "./DaySheet";
import Hero from "./Hero";
import HourlyCard from "./HourlyCard";
import OfflineBanner from "./OfflineBanner";
import RainMap from "./RainMap";
import RiskBanner from "./RiskBanner";
import SevereAlert from "./SevereAlert";
import TrendsCard from "./TrendsCard";
import AirQualityTile from "./tiles/AirQualityTile";
import AveragesTile from "./tiles/AveragesTile";
import MoonTile from "./tiles/MoonTile";
import PrecipitationTile from "./tiles/PrecipitationTile";
import PressureTile from "./tiles/PressureTile";
import { FeelsLikeTile, HumidityTile, VisibilityTile } from "./tiles/SimpleTiles";
import SunTile from "./tiles/SunTile";
import UvTile from "./tiles/UvTile";
import WindTile from "./tiles/WindTile";

/** Shown when there is no saved place and the location is unavailable. */
const DEFAULT_PLACE: SavedPlace = {
  name: "Porto Alegre",
  detail: "Rio Grande do Sul, Brasil",
  latitude: -30.0346,
  longitude: -51.2177,
};

function geolocationError(err: GeolocationPositionError): string {
  return err.code === err.PERMISSION_DENIED
    ? "Permissão de localização negada. Ative-a nas configurações do navegador."
    : "Não foi possível obter sua localização.";
}

/** Asks the browser for the position and names it via reverse geocoding. */
function requestCurrentPlace(
  onPlace: (place: SavedPlace) => void,
  onError: (message: string) => void,
) {
  if (!("geolocation" in navigator)) {
    onError("Seu navegador não permite obter a localização.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      const named = await reverseGeocode(latitude, longitude);
      onPlace({
        name: named?.name ?? "Minha localização",
        detail: named?.detail,
        latitude,
        longitude,
        current: true,
      });
    },
    (err) => onError(geolocationError(err)),
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60 * 1000 },
  );
}

/** True when the user already allowed location, so asking again shows no prompt. */
async function locationGranted(): Promise<boolean> {
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state === "granted";
  } catch {
    return false;
  }
}

export default function WeatherScreen() {
  // Rendered client-only, so storage can be read during the first render.
  const [place, setPlace] = useState<SavedPlace | null>(() => loadLastPlace());
  const [saved, setSaved] = useState<SavedPlace[]>(() => loadSavedPlaces());
  const [here, setHere] = useState<SavedPlace | null>(
    () => loadHere() ?? (place?.current ? place : null),
  );
  const [locating, setLocating] = useState(() => place === null);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [day, setDay] = useState<number | null>(null);
  const { canInstall, install } = useInstallPrompt();

  const choose = useCallback((next: SavedPlace) => {
    setPlace(next);
    storeLastPlace(next);
    setSheetOpen(false);
    setDay(null);
    if (next.current) {
      setHere(next);
      storeHere(next);
    }
  }, []);

  const locate = useCallback(() => {
    setLocating(true);
    setLocateError(null);
    requestCurrentPlace(
      (p) => {
        setLocating(false);
        choose(p);
      },
      (message) => {
        setLocating(false);
        setLocateError(message);
      },
    );
  }, [choose]);

  // First visit: try the device location, falling back to a default city.
  // Later visits: if location is already allowed, quietly refresh it so
  // "Minha localização" follows the device without asking again.
  useEffect(() => {
    if (place) {
      locationGranted().then((granted) => {
        if (!granted) return;
        requestCurrentPlace(
          (p) => {
            setHere(p);
            storeHere(p);
            setPlace((cur) => {
              if (!cur?.current || samePlace(cur, p)) return cur;
              storeLastPlace(p);
              return p;
            });
          },
          () => {},
        );
      });
      return;
    }
    requestCurrentPlace(
      (p) => {
        setLocating(false);
        choose(p);
      },
      (message) => {
        setLocating(false);
        setLocateError(message);
        setPlace(DEFAULT_PLACE);
      },
    );
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => storeSavedPlaces(saved), [saved]);

  const favorite = Boolean(place && !place.current && saved.some((p) => samePlace(p, place)));

  const coords = place ? { lat: place.latitude, lon: place.longitude } : null;
  const { data, error, loading, savedAt, stale, offline, refresh } = useForecast(coords);
  const forecast = data?.forecast;

  const risks = useMemo(() => (forecast ? detectRisks(forecast) : []), [forecast]);
  const severe = risks.filter(isSevereWeather);
  const otherRisks = risks.filter((r) => !isSevereWeather(r));
  const theme = forecast
    ? describeWeather(forecast.current.weatherCode, forecast.current.isDay).theme
    : "cloudy-day";

  return (
    <main className={`screen theme-${theme}`}>
      <div className="topbar">
        {canInstall && (
          <button type="button" className="install-button" onClick={install}>
            <Download size={16} aria-hidden /> Instalar app
          </button>
        )}
        <button
          type="button"
          className="round-button"
          onClick={locate}
          disabled={locating}
          aria-label="Usar minha localização"
          title="Usar minha localização"
        >
          {locating ? (
            <LoaderCircle size={18} className="spin" aria-hidden />
          ) : (
            <Navigation size={18} aria-hidden />
          )}
        </button>
        {place && !place.current && (
          <button
            type="button"
            className={`round-button${favorite ? " on" : ""}`}
            onClick={() => setSaved((list) => toggleFavorite(list, place))}
            aria-pressed={favorite}
            aria-label={
              favorite ? `Remover ${place.name} dos favoritos` : `Favoritar ${place.name}`
            }
            title={favorite ? "Remover dos favoritos" : "Favoritar cidade"}
          >
            <Star size={18} fill={favorite ? "currentColor" : "none"} aria-hidden />
          </button>
        )}
        <button
          type="button"
          className="round-button"
          onClick={() => setSheetOpen(true)}
          aria-label="Buscar cidade"
          title="Buscar cidade"
        >
          <Search size={18} aria-hidden />
        </button>
      </div>

      {!place || (!forecast && !error) ? (
        <div className="placeholder" role="status">
          <p className="hero-city">{place?.name ?? "Localizando…"}</p>
          <p className="hero-condition">
            {locating ? "Obtendo sua localização…" : "Carregando previsão…"}
          </p>
        </div>
      ) : !forecast ? (
        <div className="placeholder" role="alert">
          <p className="hero-city">{place.name}</p>
          <p className="hero-condition">{error}</p>
          <button type="button" className="locate-button" onClick={refresh}>
            <RefreshCw size={16} aria-hidden /> Tentar de novo
          </button>
        </div>
      ) : (
        <>
          {stale && savedAt && (
            <OfflineBanner savedAt={savedAt} offline={offline} onRetry={refresh} />
          )}
          <Hero place={place} forecast={forecast} onOpenCities={() => setSheetOpen(true)} />
          <div className={`layout${loading ? " refreshing" : ""}`}>
            <SevereAlert risks={severe} timezone={forecast.timezone} now={forecast.current.time} />
            <RiskBanner
              risks={otherRisks}
              timezone={forecast.timezone}
              now={forecast.current.time}
              afterSevere={severe.length > 0}
            />
            <HourlyCard forecast={forecast} airQuality={data.airQuality} />
            <div className="columns">
              <div className="col-main">
                <DailyCard forecast={forecast} onSelectDay={setDay} />
                <TrendsCard forecast={forecast} />
                <RainMap
                  latitude={place.latitude}
                  longitude={place.longitude}
                  timezone={forecast.timezone}
                />
              </div>
              <div className="col-tiles">
                <UvTile uv={forecast.current.uvIndex} maxToday={forecast.daily.uvIndexMax[0]} />
                <SunTile
                  now={forecast.current.time}
                  sunrise={forecast.daily.sunrise[0]}
                  sunset={forecast.daily.sunset[0]}
                  nextSunrise={forecast.daily.sunrise[1] ?? null}
                  daylight={forecast.daily.daylightDuration[0]}
                  timezone={forecast.timezone}
                />
                <WindTile
                  speed={forecast.current.windSpeed}
                  gusts={forecast.current.windGusts}
                  direction={forecast.current.windDirection}
                />
                <AirQualityTile air={data.airQuality} />
                <PrecipitationTile forecast={forecast} />
                <FeelsLikeTile
                  actual={forecast.current.temperature}
                  feels={forecast.current.apparentTemperature}
                  humidity={forecast.current.humidity}
                />
                <HumidityTile
                  humidity={forecast.current.humidity}
                  dewPoint={forecast.current.dewPoint}
                />
                <VisibilityTile meters={forecast.current.visibility} />
                <PressureTile
                  now={forecast.current.pressure}
                  later={forecast.hourly.pressure[3] ?? forecast.current.pressure}
                />
                <AveragesTile
                  todayMax={forecast.daily.temperatureMax[0]}
                  averages={data.averages}
                />
                <MoonTile now={forecast.current.time} latitude={forecast.latitude} />
              </div>
            </div>
          </div>
          <footer className="footer">
            Dados: <a href="https://open-meteo.com/">Open-Meteo</a> (qualidade do ar: CAMS) · Mapa:
            Esri, OpenStreetMap ·{" "}
            <a href="https://github.com/Henrique-konig/Atmosphere-Analysis-Atmospherix">Código</a>
          </footer>
          <DaySheet
            forecast={forecast}
            airQuality={data.airQuality}
            day={day}
            onSelectDay={setDay}
            onClose={() => setDay(null)}
          />
        </>
      )}

      <CitySheet
        open={sheetOpen}
        saved={saved}
        here={here}
        active={place}
        locating={locating}
        locateError={locateError}
        onClose={() => setSheetOpen(false)}
        onSelect={choose}
        onLocate={locate}
        onRemove={(p) => setSaved((list) => list.filter((x) => !samePlace(x, p)))}
      />
    </main>
  );
}
