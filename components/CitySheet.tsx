"use client";

import { LoaderCircle, MapPin, Navigation, Search, Trash2, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { placeKey, usePlaceSummaries } from "@/hooks/usePlaceSummaries";
import { usePlaceSearch } from "@/hooks/usePlaceSearch";
import { describeWeather } from "@/lib/conditions";
import { formatTemp, formatTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import { placeDetails } from "@/lib/places";
import { fromSearch, samePlace, type SavedPlace } from "@/lib/storage";
import type { PlaceSummary } from "@/lib/types";
import { useLocale } from "./LocaleProvider";

interface Props {
  open: boolean;
  saved: SavedPlace[];
  /** The last device location, listed first as "Minha localização". */
  here: SavedPlace | null;
  active: SavedPlace | null;
  locating: boolean;
  locateError: string | null;
  onClose: () => void;
  onSelect: (place: SavedPlace) => void;
  onLocate: () => void;
  onRemove: (place: SavedPlace) => void;
}

export default function CitySheet(props: Props) {
  const {
    open,
    saved,
    here,
    active,
    locating,
    locateError,
    onClose,
    onSelect,
    onLocate,
    onRemove,
  } = props;
  const listed = useMemo(() => (here ? [here, ...saved] : saved), [here, saved]);
  const { summaries, now } = usePlaceSummaries(listed, open);
  const [query, setQuery] = useState("");
  const { locale } = useLocale();
  const { places, error, loading } = usePlaceSearch(query, locale);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listId = useId();
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const searching = query.trim().length >= 2;

  return (
    <dialog
      ref={dialogRef}
      className="sheet"
      aria-labelledby={titleId}
      onClose={() => {
        setQuery("");
        onClose();
      }}
      onClick={(e) => e.target === dialogRef.current && onClose()}
    >
      <div className="sheet-body">
        <header className="sheet-header">
          <h2 id={titleId}>{t("cities.title")}</h2>
          <button
            type="button"
            className="round-button"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <label className="search-field">
          <Search size={16} aria-hidden />
          <input
            ref={inputRef}
            type="search"
            placeholder={t("cities.search")}
            aria-label={t("cities.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-controls={listId}
            autoComplete="off"
          />
        </label>

        {searching ? (
          <ul
            id={listId}
            className="sheet-list"
            aria-label={t("cities.results")}
            aria-live="polite"
          >
            {loading && <li className="sheet-status">{t("cities.searching")}</li>}
            {error && <li className="sheet-status error">{error}</li>}
            {!loading && !error && places.length === 0 && (
              <li className="sheet-status">{t("cities.notFound")}</li>
            )}
            {places.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => onSelect(fromSearch(place, placeDetails(place)))}
                >
                  <MapPin size={16} aria-hidden />
                  <span>
                    <strong>{place.name}</strong>
                    <small>{placeDetails(place)}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <>
            {!here && (
              <button
                type="button"
                className="locate-button"
                onClick={onLocate}
                disabled={locating}
              >
                {locating ? (
                  <LoaderCircle size={16} className="spin" aria-hidden />
                ) : (
                  <Navigation size={16} aria-hidden />
                )}
                {t("cities.useLocation")}
              </button>
            )}
            {locateError && (
              <p className="sheet-status error" role="alert">
                {locateError}
              </p>
            )}
            <ul className="city-list" aria-label={t("cities.saved")}>
              {here && (
                <CityCard
                  place={here}
                  summary={summaries[placeKey(here)]}
                  now={now}
                  active={Boolean(active?.current)}
                  onSelect={() => {
                    // Show the last known position at once, then refresh it from the device.
                    onSelect(here);
                    onLocate();
                  }}
                />
              )}
              {saved.map((place) => (
                <CityCard
                  key={placeKey(place)}
                  place={place}
                  summary={summaries[placeKey(place)]}
                  now={now}
                  active={Boolean(active && !active.current && samePlace(place, active))}
                  onSelect={() => onSelect(place)}
                  onRemove={() => onRemove(place)}
                />
              ))}
            </ul>
            <p className="sheet-hint">
              {saved.length === 0 ? t("cities.hintEmpty") : t("cities.hint")}
            </p>
          </>
        )}
      </div>
    </dialog>
  );
}

interface CardProps {
  place: SavedPlace;
  summary: PlaceSummary | undefined;
  now: number;
  active: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}

/** One city in the list: name, local time, condition and temperatures, over its own sky. */
function CityCard({ place, summary, now, active, onSelect, onRemove }: CardProps) {
  const condition = summary ? describeWeather(summary.weatherCode, summary.isDay) : null;
  const region = place.detail?.split(",")[0];
  const sub = place.current
    ? place.name
    : [summary && formatTime(now, summary.timezone), region].filter(Boolean).join(" · ");
  return (
    <li className={`city-card theme-${condition?.theme ?? "cloudy-day"}${active ? " active" : ""}`}>
      <button
        type="button"
        className="city-card-main"
        onClick={onSelect}
        aria-current={active ? "true" : undefined}
      >
        <span className="city-card-left">
          <strong className="city-card-name">
            {place.current && <Navigation size={14} aria-hidden />}
            {place.current ? t("app.myLocation") : place.name}
          </strong>
          <small>{sub}</small>
          <span className="city-card-condition">{condition?.label ?? ""}</span>
        </span>
        <span className="city-card-right">
          <span className="city-card-temp">{summary ? formatTemp(summary.temperature) : ""}</span>
          {summary && (
            <small>
              {t("cities.max", { temp: formatTemp(summary.max) })}{" "}
              {t("cities.min", { temp: formatTemp(summary.min) })}
            </small>
          )}
        </span>
      </button>
      {onRemove && (
        <button
          type="button"
          className="round-button subtle city-card-remove"
          onClick={onRemove}
          aria-label={t("favorites.remove", { name: place.name })}
        >
          <Trash2 size={15} aria-hidden />
        </button>
      )}
    </li>
  );
}
