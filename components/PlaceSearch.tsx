"use client";

import { useId, useState } from "react";
import { usePlaceSearch } from "@/hooks/usePlaceSearch";
import { placeDetails } from "@/lib/places";
import type { Place } from "@/lib/types";

interface Props {
  onSelect: (place: Place) => void;
  onLocate: () => void;
  locating: boolean;
}

export default function PlaceSearch({ onSelect, onLocate, locating }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const { places, error, loading } = usePlaceSearch(query);
  const listId = useId();

  const showList = open && query.trim().length >= 2;
  const active = Math.min(highlighted, Math.max(0, places.length - 1));

  function choose(place: Place) {
    onSelect(place);
    setQuery(place.name);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      if (places.length === 0) return;
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setHighlighted((active + delta + places.length) % places.length);
    } else if (e.key === "Enter" && showList && places[active]) {
      e.preventDefault();
      choose(places[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="search">
      <div className="search-row">
        <input
          type="search"
          role="combobox"
          placeholder="Buscar cidade…"
          aria-label="Buscar cidade"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && places[active] ? `${listId}-${active}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlighted(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button
          type="button"
          className="icon-button"
          onClick={onLocate}
          disabled={locating}
          aria-label="Usar minha localização"
          title="Usar minha localização"
        >
          {locating ? "…" : "◎"}
        </button>
      </div>

      {showList && (
        <ul id={listId} role="listbox" className="search-results">
          {loading && <li className="muted search-status">Buscando…</li>}
          {error && <li className="error search-status">{error}</li>}
          {!loading && !error && places.length === 0 && (
            <li className="muted search-status">Nenhum local encontrado</li>
          )}
          {places.map((place, i) => (
            <li
              key={place.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown fires before the input's blur closes the list.
              onMouseDown={(e) => {
                e.preventDefault();
                choose(place);
              }}
              onMouseEnter={() => setHighlighted(i)}
            >
              <span>{place.name}</span>
              <span className="muted">{placeDetails(place)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
