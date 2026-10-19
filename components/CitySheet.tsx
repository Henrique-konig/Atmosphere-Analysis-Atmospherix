"use client";

import { LoaderCircle, MapPin, Navigation, Search, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { usePlaceSearch } from "@/hooks/usePlaceSearch";
import { placeDetails } from "@/lib/places";
import { fromSearch, samePlace, type SavedPlace } from "@/lib/storage";

interface Props {
  open: boolean;
  saved: SavedPlace[];
  active: SavedPlace | null;
  locating: boolean;
  locateError: string | null;
  onClose: () => void;
  onSelect: (place: SavedPlace) => void;
  onLocate: () => void;
  onRemove: (place: SavedPlace) => void;
}

export default function CitySheet(props: Props) {
  const { open, saved, active, locating, locateError, onClose, onSelect, onLocate, onRemove } =
    props;
  const [query, setQuery] = useState("");
  const { places, error, loading } = usePlaceSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listId = useId();

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
      aria-label="Escolher cidade"
      onClose={() => {
        setQuery("");
        onClose();
      }}
      onClick={(e) => e.target === dialogRef.current && onClose()}
    >
      <div className="sheet-body">
        <header className="sheet-header">
          <h2>Cidades</h2>
          <button type="button" className="round-button" onClick={onClose} aria-label="Fechar">
            <X size={18} aria-hidden />
          </button>
        </header>

        <label className="search-field">
          <Search size={16} aria-hidden />
          <input
            ref={inputRef}
            type="search"
            placeholder="Buscar cidade"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-controls={listId}
            autoComplete="off"
          />
        </label>

        {searching ? (
          <ul id={listId} className="sheet-list" aria-label="Resultados">
            {loading && <li className="sheet-status">Buscando…</li>}
            {error && <li className="sheet-status error">{error}</li>}
            {!loading && !error && places.length === 0 && (
              <li className="sheet-status">Nenhuma cidade encontrada</li>
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
            <button type="button" className="locate-button" onClick={onLocate} disabled={locating}>
              {locating ? (
                <LoaderCircle size={16} className="spin" aria-hidden />
              ) : (
                <Navigation size={16} aria-hidden />
              )}
              Usar minha localização
            </button>
            {locateError && <p className="sheet-status error">{locateError}</p>}
            {saved.length > 0 && (
              <ul className="sheet-list" aria-label="Cidades salvas">
                {saved.map((place) => (
                  <li
                    key={`${place.latitude},${place.longitude}`}
                    className={active && samePlace(place, active) ? "active" : ""}
                  >
                    <button type="button" onClick={() => onSelect(place)}>
                      <MapPin size={16} aria-hidden />
                      <span>
                        <strong>{place.name}</strong>
                        {place.detail && <small>{place.detail}</small>}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="round-button subtle"
                      onClick={() => onRemove(place)}
                      aria-label={`Remover ${place.name}`}
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}
