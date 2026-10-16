"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { useGridForecast } from "@/hooks/useGridForecast";
import { closestStep } from "@/lib/format";
import { bboxAround, bboxContains } from "@/lib/grid";
import type { BBox, FieldLayer, MapFocus, Place } from "@/lib/types";
import LayerControls from "./LayerControls";
import Legend from "./Legend";
import PlaceSearch from "./PlaceSearch";
import PointPanel from "./PointPanel";
import Timeline from "./Timeline";

// Leaflet touches `window` on import, so the map only renders on the client.
const WeatherMap = dynamic(() => import("./WeatherMap"), {
  ssr: false,
  loading: () => <div className="map map-loading">Carregando mapa…</div>,
});

export default function WeatherApp() {
  const { data, error, loading, load } = useGridForecast();
  // null = follow the forecast hour closest to now.
  const [pickedStep, setPickedStep] = useState<number | null>(null);
  const [layer, setLayer] = useState<FieldLayer>("temperature");
  const [showWind, setShowWind] = useState(true);
  const [selected, setSelected] = useState<{ lat: number; lon: number } | null>(null);
  const [focus, setFocus] = useState<MapFocus | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const boundsRef = useRef<BBox | null>(null);

  const step = pickedStep ?? (data ? closestStep(data.times) : 0);

  const handleBounds = useCallback((bbox: BBox) => {
    boundsRef.current = bbox;
  }, []);
  const reloadArea = useCallback(() => {
    if (!boundsRef.current) return;
    setPickedStep(null);
    load(boundsRef.current);
  }, [load]);

  /** Centres the map on a point, opens its forecast and loads data around it if needed. */
  const goTo = useCallback(
    (latitude: number, longitude: number) => {
      setFocus((f) => ({ id: (f?.id ?? 0) + 1, latitude, longitude, zoom: 8 }));
      setSelected({ lat: latitude, lon: longitude });
      setGeoError(null);
      if (!data || !bboxContains(data.grid.bbox, latitude, longitude)) {
        setPickedStep(null);
        load(bboxAround(latitude, longitude));
      }
    },
    [data, load],
  );

  const selectPlace = useCallback((place: Place) => goTo(place.latitude, place.longitude), [goTo]);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("Seu navegador não permite obter a localização");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        goTo(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Permissão de localização negada"
            : "Não foi possível obter sua localização",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, [goTo]);

  return (
    <main className={selected ? "app has-point" : "app"}>
      <WeatherMap
        forecast={data}
        step={step}
        layer={layer}
        showWind={showWind}
        selected={selected}
        focus={focus}
        onSelect={setSelected}
        onBoundsChange={handleBounds}
      />

      <div className="top-left">
        <div className="panel brand">
          <h1>Atmospherix</h1>
          <p className="muted">Previsão do tempo interativa</p>
          <PlaceSearch onSelect={selectPlace} onLocate={locate} locating={locating} />
        </div>
        <LayerControls
          layer={layer}
          showWind={showWind}
          loading={loading}
          onLayerChange={setLayer}
          onWindChange={setShowWind}
          onReloadArea={reloadArea}
        />
        {(error || geoError) && (
          <div className="panel error" role="alert">
            {geoError ?? error}
          </div>
        )}
      </div>

      {selected && <PointPanel point={selected} onClose={() => setSelected(null)} />}

      <div className="bottom">
        <Legend layer={layer} />
        {data && <Timeline times={data.times} step={step} onChange={setPickedStep} />}
      </div>
    </main>
  );
}
