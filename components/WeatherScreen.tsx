"use client";

import {
  Bell,
  BellRing,
  Download,
  LoaderCircle,
  Navigation,
  RefreshCw,
  Search,
  Settings2,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForecast } from "@/hooks/useForecast";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useWeatherNotifications } from "@/hooks/useWeatherNotifications";
import { describeWeather } from "@/lib/conditions";
import { t } from "@/lib/i18n";
import { reverseGeocode } from "@/lib/reverseGeocode";
import { detectRisks, isSevereWeather } from "@/lib/risks";
import {
  loadHere,
  loadLastPlace,
  loadSavedPlaces,
  loadTheme,
  loadUnits,
  samePlace,
  storeHere,
  storeLastPlace,
  storeSavedPlaces,
  storeTheme,
  storeUnits,
  toggleFavorite,
  type SavedPlace,
} from "@/lib/storage";
import { applyTheme, watchSystemTheme, type ThemePreference } from "@/lib/theme";
import { setUnits, type Units } from "@/lib/units";
import CitySheet from "./CitySheet";
import DailyCard from "./DailyCard";
import DaySheet from "./DaySheet";
import Hero from "./Hero";
import HourlyCard from "./HourlyCard";
import { useLocale } from "./LocaleProvider";
import NotificationSheet from "./NotificationSheet";
import OfflineBanner from "./OfflineBanner";
import RainMap from "./RainMap";
import RiskBanner from "./RiskBanner";
import SettingsSheet from "./SettingsSheet";
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
  return err.code === err.PERMISSION_DENIED ? t("geo.denied") : t("geo.failed");
}

/** Asks the browser for the position and names it via reverse geocoding. */
function requestCurrentPlace(
  onPlace: (place: SavedPlace) => void,
  onError: (message: string) => void,
) {
  if (!("geolocation" in navigator)) {
    onError(t("geo.unsupported"));
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      const named = await reverseGeocode(latitude, longitude);
      onPlace({
        name: named?.name ?? t("app.myLocation"),
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [units, setUnitsState] = useState<Units>(() => {
    const stored = loadUnits();
    // The formatters read the units from lib/units; set them before the first render.
    setUnits(stored);
    return stored;
  });
  const [themePref, setThemePref] = useState<ThemePreference>(() => loadTheme());
  const [notifyOpen, setNotifyOpen] = useState(false);
  const { canInstall, install } = useInstallPrompt();
  // Subscribing to the language re-renders the whole screen, texts included, when it changes.
  const { locale } = useLocale();

  const changeUnits = useCallback((next: Units) => {
    setUnits(next);
    storeUnits(next);
    setUnitsState(next);
  }, []);

  const changeTheme = useCallback((next: ThemePreference) => {
    storeTheme(next);
    setThemePref(next);
  }, []);

  useEffect(() => {
    applyTheme(themePref);
    if (themePref !== "auto") return;
    return watchSystemTheme(() => applyTheme("auto"));
  }, [themePref]);

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

  const notifyPlace = useMemo(
    () =>
      place
        ? { key: `${place.latitude.toFixed(2)},${place.longitude.toFixed(2)}`, name: place.name }
        : null,
    [place],
  );
  const notifications = useWeatherNotifications(forecast, notifyPlace);
  const notifying =
    notifications.permission === "granted" &&
    (notifications.settings.rain || notifications.settings.severe);

  // Risk texts include values and words, so they are rebuilt when units or language change.
  const risks = useMemo(
    () => (forecast ? detectRisks(forecast) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [forecast, units, locale],
  );
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
            <Download size={16} aria-hidden /> {t("app.install")}
          </button>
        )}
        <button
          type="button"
          className={`round-button notify-button${notifying ? " on" : ""}`}
          onClick={() => setNotifyOpen(true)}
          aria-label={notifying ? t("notify.on") : t("notify.title")}
          title={t("notify.title")}
        >
          {notifying ? <BellRing size={18} aria-hidden /> : <Bell size={18} aria-hidden />}
        </button>
        <button
          type="button"
          className="round-button"
          onClick={locate}
          disabled={locating}
          aria-label={t("cities.useLocation")}
          title={t("cities.useLocation")}
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
              favorite
                ? t("favorites.remove", { name: place.name })
                : t("favorites.add", { name: place.name })
            }
            title={favorite ? t("favorites.removeTitle") : t("favorites.addTitle")}
          >
            <Star size={18} fill={favorite ? "currentColor" : "none"} aria-hidden />
          </button>
        )}
        <button
          type="button"
          className="round-button"
          onClick={() => setSettingsOpen(true)}
          aria-label={t("settings.label")}
          title={t("settings.title")}
        >
          <Settings2 size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="round-button"
          onClick={() => setSheetOpen(true)}
          aria-label={t("app.searchCity")}
          title={t("app.searchCity")}
        >
          <Search size={18} aria-hidden />
        </button>
      </div>

      {!place || (!forecast && !error) ? (
        <div className="placeholder" role="status">
          <p className="hero-city">{place?.name ?? t("app.locating")}</p>
          <p className="hero-condition">
            {locating ? t("app.gettingLocation") : t("app.loadingForecast")}
          </p>
        </div>
      ) : !forecast ? (
        <div className="placeholder" role="alert">
          <p className="hero-city">{place.name}</p>
          <p className="hero-condition">{error}</p>
          <button type="button" className="locate-button" onClick={refresh}>
            <RefreshCw size={16} aria-hidden /> {t("app.retry")}
          </button>
        </div>
      ) : (
        <>
          {stale && savedAt && (
            <OfflineBanner savedAt={savedAt} offline={offline} onRetry={refresh} />
          )}
          <Hero place={place} forecast={forecast} onOpenCities={() => setSheetOpen(true)} />
          <div className={`layout${loading ? " refreshing" : ""}`} aria-busy={loading}>
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
            {t("app.footerData")}: <a href="https://open-meteo.com/">Open-Meteo</a> (
            {t("app.footerAir")}: CAMS) · {t("app.footerMap")}: Esri, OpenStreetMap ·{" "}
            <a href="https://github.com/Henrique-konig/Atmosphere-Analysis-Atmospherix">
              {t("app.footerCode")}
            </a>
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

      <NotificationSheet
        open={notifyOpen}
        placeName={place?.name ?? null}
        settings={notifications.settings}
        permission={notifications.permission}
        onChange={(next) => void notifications.update(next)}
        onTest={() => void notifications.sendTest()}
        onClose={() => setNotifyOpen(false)}
      />

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

      <SettingsSheet
        open={settingsOpen}
        units={units}
        theme={themePref}
        onClose={() => setSettingsOpen(false)}
        onUnitsChange={changeUnits}
        onThemeChange={changeTheme}
      />
    </main>
  );
}
