"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { useGridForecast } from "@/hooks/useGridForecast";
import { closestStep } from "@/lib/format";
import type { BBox, FieldLayer } from "@/lib/types";
import LayerControls from "./LayerControls";
import Legend from "./Legend";
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

  return (
    <main className={selected ? "app has-point" : "app"}>
      <WeatherMap
        forecast={data}
        step={step}
        layer={layer}
        showWind={showWind}
        selected={selected}
        onSelect={setSelected}
        onBoundsChange={handleBounds}
      />

      <div className="top-left">
        <div className="panel brand">
          <h1>Atmospherix</h1>
          <p className="muted">Previsão do tempo interativa</p>
        </div>
        <LayerControls
          layer={layer}
          showWind={showWind}
          loading={loading}
          onLayerChange={setLayer}
          onWindChange={setShowWind}
          onReloadArea={reloadArea}
        />
        {error && (
          <div className="panel error" role="alert">
            {error}
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
