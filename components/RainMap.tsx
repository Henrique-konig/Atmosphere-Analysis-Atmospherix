"use client";

import "leaflet/dist/leaflet.css";

import { CloudRain, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { useRainGrid } from "@/hooks/useRainGrid";
import { BASEMAP } from "@/lib/basemap";
import { cssGradient, PRECIPITATION_SCALE } from "@/lib/colors";
import { formatHour } from "@/lib/format";
import { gridStep } from "@/lib/grid";
import { renderField } from "@/lib/raster";
import Card from "./Card";

/** Overlay pixels per grid cell; higher is smoother but slower. */
const UPSAMPLE = 10;
const PLAY_INTERVAL_MS = 800;

interface Props {
  latitude: number;
  longitude: number;
  timezone: string;
}

interface Handles {
  L: typeof Leaflet;
  map: Leaflet.Map;
  overlay: Leaflet.ImageOverlay | null;
}

export default function RainMap({ latitude, longitude, timezone }: Props) {
  const rain = useRainGrid({ lat: latitude, lon: longitude });
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const handles = useRef<Handles | null>(null);
  const steps = rain?.times.length ?? 0;
  const current = Math.min(step, Math.max(0, steps - 1));

  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;
      map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 7,
        minZoom: 5,
        maxZoom: 10,
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      L.tileLayer(BASEMAP.base, {
        attribution: BASEMAP.attribution,
        maxZoom: BASEMAP.maxZoom,
      }).addTo(map);
      const labels = map.createPane("labels");
      labels.style.zIndex = "450";
      labels.style.pointerEvents = "none";
      L.tileLayer(BASEMAP.labels, { pane: "labels", maxZoom: BASEMAP.maxZoom }).addTo(map);
      L.circleMarker([latitude, longitude], {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: "#0a84ff",
        fillOpacity: 1,
        pane: "labels",
      }).addTo(map);
      handles.current = { L, map, overlay: null };
      setReady(true);
    })();
    return () => {
      cancelled = true;
      map?.remove();
      handles.current = null;
      setReady(false);
    };
  }, [latitude, longitude]);

  useEffect(() => {
    const h = handles.current;
    if (!ready || !h || !rain) return;
    const field = rain.precipitation[current];
    if (!field) return;
    const { nx, ny, bbox } = rain.grid;
    const width = (nx - 1) * UPSAMPLE + 1;
    const height = (ny - 1) * UPSAMPLE + 1;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    const image = ctx.createImageData(width, height);
    image.data.set(renderField(field, nx, ny, PRECIPITATION_SCALE, width, height));
    ctx.putImageData(image, 0, 0);
    const { dx, dy } = gridStep(rain.grid);
    const bounds = h.L.latLngBounds(
      [bbox.south - dy / UPSAMPLE / 2, bbox.west - dx / UPSAMPLE / 2],
      [bbox.north + dy / UPSAMPLE / 2, bbox.east + dx / UPSAMPLE / 2],
    );
    const url = canvas.toDataURL();
    if (h.overlay) {
      h.overlay.setUrl(url);
      h.overlay.setBounds(bounds);
    } else {
      h.overlay = h.L.imageOverlay(url, bounds, { opacity: 0.9, interactive: false }).addTo(h.map);
    }
  }, [ready, rain, current]);

  useEffect(() => {
    if (!playing || steps === 0) return;
    const id = window.setInterval(() => setStep((s) => (s + 1) % steps), PLAY_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [playing, steps]);

  const totalNow = rain ? Math.max(...rain.precipitation[current]) : 0;

  return (
    <Card title="Previsão de chuva" icon={CloudRain} className="rain-map">
      <p className="card-summary">
        Previsão do modelo para a região, não é radar. Pancadas isoladas podem não aparecer.
      </p>
      <div className="rain-map-frame">
        <div
          ref={containerRef}
          className="rain-map-canvas"
          aria-label="Mapa da previsão de chuva da região"
        />
        {!rain && <div className="rain-map-status">Carregando…</div>}
        {rain && totalNow < 0.1 && (
          <div className="rain-map-badge">Sem chuva prevista na região</div>
        )}
      </div>
      {rain && steps > 0 && (
        <div className="rain-map-controls">
          <button
            type="button"
            className="round-button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pausar" : "Animar próximas horas"}
          >
            {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
          </button>
          <input
            type="range"
            min={0}
            max={steps - 1}
            value={current}
            onChange={(e) => {
              setPlaying(false);
              setStep(Number(e.target.value));
            }}
            aria-label="Hora da previsão de chuva"
            aria-valuetext={current === 0 ? "Agora" : formatHour(rain.times[current], timezone)}
          />
          <span className="rain-map-time">
            {current === 0 ? "Agora" : formatHour(rain.times[current], timezone)}
          </span>
        </div>
      )}
      <div className="rain-legend">
        <span>Fraca</span>
        <span
          className="rain-legend-bar"
          style={{ background: cssGradient(PRECIPITATION_SCALE) }}
        />
        <span>Forte</span>
      </div>
    </Card>
  );
}
