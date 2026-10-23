"use client";

import "leaflet/dist/leaflet.css";

import { CloudRain, Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { useRadarFrames } from "@/hooks/useRadarFrames";
import { useRainGrid } from "@/hooks/useRainGrid";
import { BASEMAP } from "@/lib/basemap";
import { cssGradient, PRECIPITATION_SCALE } from "@/lib/colors";
import { formatHour, formatTime } from "@/lib/format";
import { gridStep } from "@/lib/grid";
import {
  buildTimeline,
  RADAR_ATTRIBUTION,
  RADAR_LEGEND_GRADIENT,
  RADAR_MAX_ZOOM,
  type TimelineFrame,
} from "@/lib/radar";
import { renderField } from "@/lib/raster";
import Card from "./Card";

/** Overlay pixels per grid cell; higher is smoother but slower. */
const UPSAMPLE = 10;
const PLAY_INTERVAL_MS = 700;
const RADAR_OPACITY = 0.8;

interface Props {
  latitude: number;
  longitude: number;
  timezone: string;
}

interface Handles {
  L: typeof Leaflet;
  map: Leaflet.Map;
  overlay: Leaflet.ImageOverlay | null;
  radar: Leaflet.TileLayer[];
}

function frameLabel(frame: TimelineFrame, isNow: boolean, timezone: string): string {
  if (isNow) return "Agora";
  return frame.kind === "radar"
    ? formatTime(frame.time, timezone)
    : formatHour(frame.time, timezone);
}

export default function RainMap({ latitude, longitude, timezone }: Props) {
  const rain = useRainGrid({ lat: latitude, lon: longitude });
  const radar = useRadarFrames();
  /** null follows "now" as data arrives; a number is a frame the user picked. */
  const [step, setStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const handles = useRef<Handles | null>(null);
  const timeline = useMemo(() => buildTimeline(radar ?? [], rain?.times ?? []), [radar, rain]);
  const steps = timeline.frames.length;
  const current = Math.min(step ?? timeline.now, Math.max(0, steps - 1));
  const frame = timeline.frames[current] as TimelineFrame | undefined;

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
      handles.current = { L, map, overlay: null, radar: [] };
      setReady(true);
    })();
    return () => {
      cancelled = true;
      map?.remove();
      handles.current = null;
      setReady(false);
    };
  }, [latitude, longitude]);

  // One tile layer per radar frame, all added up front so their tiles preload; only the
  // current one is visible.
  useEffect(() => {
    const h = handles.current;
    if (!ready || !h || !radar?.length) return;
    const layers = radar.map((f) =>
      h.L.tileLayer(f.url, {
        tileSize: 512,
        zoomOffset: -1,
        maxNativeZoom: RADAR_MAX_ZOOM + 1,
        maxZoom: BASEMAP.maxZoom,
        opacity: 0,
        zIndex: 10,
        attribution: RADAR_ATTRIBUTION,
      }).addTo(h.map),
    );
    h.radar = layers;
    return () => {
      layers.forEach((layer) => layer.remove());
      h.radar = [];
    };
  }, [ready, radar]);

  useEffect(() => {
    const h = handles.current;
    if (!ready || !h) return;
    h.radar.forEach((layer, i) =>
      layer.setOpacity(frame?.kind === "radar" && frame.radar === i ? RADAR_OPACITY : 0),
    );
    h.overlay?.setOpacity(frame?.kind === "forecast" ? 0.9 : 0);
  }, [ready, radar, frame]);

  useEffect(() => {
    const h = handles.current;
    if (!ready || !h || !rain || frame?.kind !== "forecast") return;
    const field = rain.precipitation[frame.forecast];
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
      h.overlay.setOpacity(0.9);
    } else {
      h.overlay = h.L.imageOverlay(url, bounds, { opacity: 0.9, interactive: false }).addTo(h.map);
    }
  }, [ready, rain, frame]);

  useEffect(() => {
    if (!playing || steps === 0) return;
    const id = window.setInterval(
      () => setStep((s) => ((s ?? timeline.now) + 1) % steps),
      PLAY_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [playing, steps, timeline.now]);

  const noRainForecast =
    frame?.kind === "forecast" &&
    rain != null &&
    Math.max(...rain.precipitation[frame.forecast]) < 0.1;
  const hasRadar = (radar?.length ?? 0) > 0;
  const label = frame ? frameLabel(frame, current === timeline.now, timezone) : "";

  return (
    <Card
      title={hasRadar ? "Radar de chuva" : "Previsão de chuva"}
      icon={CloudRain}
      className="rain-map"
    >
      <p className="card-summary">
        {hasRadar
          ? "Radar das últimas 2 horas e, em seguida, a previsão do modelo para as próximas horas."
          : "Previsão do modelo para a região, não é radar. Pancadas isoladas podem não aparecer."}
      </p>
      <div className="rain-map-frame">
        <div
          ref={containerRef}
          className="rain-map-canvas"
          aria-label="Mapa de radar e previsão de chuva da região"
        />
        {steps === 0 && <div className="rain-map-status">Carregando…</div>}
        {frame && (
          <div className={`rain-map-kind ${frame.kind}`}>
            {frame.kind === "radar" ? "Radar" : "Previsão"}
          </div>
        )}
        {noRainForecast && <div className="rain-map-badge">Sem chuva prevista na região</div>}
      </div>
      {frame && (
        <div className="rain-map-controls">
          <button
            type="button"
            className="round-button"
            onClick={() => {
              // Start from the oldest radar image so the animation tells the whole story.
              if (!playing && current === timeline.now && hasRadar) setStep(0);
              setPlaying((p) => !p);
            }}
            aria-label={playing ? "Pausar" : "Animar radar e próximas horas"}
          >
            {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
          </button>
          <div className="rain-map-track">
            <input
              type="range"
              min={0}
              max={steps - 1}
              value={current}
              onChange={(e) => {
                setPlaying(false);
                setStep(Number(e.target.value));
              }}
              aria-label="Momento do radar ou da previsão de chuva"
              aria-valuetext={`${frame.kind === "radar" ? "Radar" : "Previsão"} ${label}`}
            />
            {hasRadar && steps > 1 && (
              <div
                className="rain-map-now"
                style={{ left: `${(timeline.now / (steps - 1)) * 100}%` }}
                aria-hidden
              />
            )}
          </div>
          <span className="rain-map-time">{label}</span>
        </div>
      )}
      <div className="rain-legend">
        <span>Fraca</span>
        <span
          className="rain-legend-bar"
          style={{
            background:
              frame?.kind === "radar" ? RADAR_LEGEND_GRADIENT : cssGradient(PRECIPITATION_SCALE),
          }}
        />
        <span>Forte</span>
      </div>
    </Card>
  );
}
