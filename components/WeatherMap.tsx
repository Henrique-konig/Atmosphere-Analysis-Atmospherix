"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-velocity/dist/leaflet-velocity.css";

import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import { gridStep } from "@/lib/grid";
import { PRECIPITATION_SCALE, TEMPERATURE_SCALE } from "@/lib/colors";
import { renderField } from "@/lib/raster";
import { toVelocityData } from "@/lib/velocity";
import type { BBox, FieldLayer, GridForecast, MapFocus } from "@/lib/types";

/** Overlay pixels per grid cell; higher is smoother but slower. */
const UPSAMPLE = 12;

interface Props {
  forecast: GridForecast | null;
  step: number;
  layer: FieldLayer;
  showWind: boolean;
  selected: { lat: number; lon: number } | null;
  focus: MapFocus | null;
  onSelect: (point: { lat: number; lon: number }) => void;
  onBoundsChange: (bbox: BBox) => void;
}

interface MapHandles {
  L: typeof Leaflet;
  map: Leaflet.Map;
  overlay: Leaflet.ImageOverlay | null;
  wind: (Leaflet.Layer & { setData: (data: unknown) => void }) | null;
  marker: Leaflet.CircleMarker | null;
}

export default function WeatherMap(props: Props) {
  const { forecast, step, layer, showWind, selected, focus } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const handlesRef = useRef<MapHandles | null>(null);
  const callbacksRef = useRef(props);
  useEffect(() => {
    callbacksRef.current = props;
  });

  // Map setup. leaflet-velocity is a classic plugin that expects a global `L`.
  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      (window as unknown as { L: typeof Leaflet }).L = L;
      await import("leaflet-velocity");
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        center: [-28, -52.5],
        zoom: 6,
        minZoom: 3,
        worldCopyJump: true,
        zoomControl: false,
      });
      L.control.zoom({ position: "topright" }).addTo(map);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a> | Dados: <a href="https://open-meteo.com/">Open-Meteo</a>',
        subdomains: "abcd",
        maxZoom: 12,
      }).addTo(map);
      map.createPane("labels");
      map.getPane("labels")!.style.zIndex = "450";
      map.getPane("labels")!.style.pointerEvents = "none";
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        pane: "labels",
        maxZoom: 12,
      }).addTo(map);

      const emitBounds = () => {
        const b = map!.getBounds();
        callbacksRef.current.onBoundsChange({
          north: Math.min(85, b.getNorth()),
          south: Math.max(-85, b.getSouth()),
          west: Math.max(-180, b.getWest()),
          east: Math.min(180, b.getEast()),
        });
      };
      map.on("moveend", emitBounds);
      map.on("click", (e: Leaflet.LeafletMouseEvent) =>
        callbacksRef.current.onSelect({ lat: e.latlng.lat, lon: e.latlng.lng }),
      );
      emitBounds();

      handlesRef.current = { L, map, overlay: null, wind: null, marker: null };
      // Trigger the data effects now that the map exists.
      window.dispatchEvent(new Event("atmospherix:map-ready"));
    })();

    return () => {
      cancelled = true;
      map?.remove();
      handlesRef.current = null;
    };
  }, []);

  // Colored scalar field (temperature / precipitation).
  useEffect(() => {
    const draw = () => {
      const h = handlesRef.current;
      if (!h) return;
      h.overlay?.remove();
      h.overlay = null;
      if (!forecast || layer === "none") return;

      const { nx, ny, bbox } = forecast.grid;
      const field =
        layer === "temperature" ? forecast.temperature[step] : forecast.precipitation[step];
      const scale = layer === "temperature" ? TEMPERATURE_SCALE : PRECIPITATION_SCALE;
      if (!field) return;

      const width = (nx - 1) * UPSAMPLE + 1;
      const height = (ny - 1) * UPSAMPLE + 1;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      const image = ctx.createImageData(width, height);
      image.data.set(renderField(field, nx, ny, scale, width, height));
      ctx.putImageData(image, 0, 0);

      // Pixel centres sit on grid points, so pad the bounds by half a pixel.
      const { dx, dy } = gridStep(forecast.grid);
      const padX = dx / UPSAMPLE / 2;
      const padY = dy / UPSAMPLE / 2;
      h.overlay = h.L.imageOverlay(
        canvas.toDataURL(),
        [
          [bbox.south - padY, bbox.west - padX],
          [bbox.north + padY, bbox.east + padX],
        ],
        { opacity: 0.65, className: "field-overlay", interactive: false },
      ).addTo(h.map);
    };
    draw();
    window.addEventListener("atmospherix:map-ready", draw);
    return () => window.removeEventListener("atmospherix:map-ready", draw);
  }, [forecast, step, layer]);

  // Animated wind particles.
  useEffect(() => {
    const draw = () => {
      const h = handlesRef.current;
      if (!h) return;
      if (!forecast || !showWind) {
        h.wind?.remove();
        h.wind = null;
        return;
      }
      const data = toVelocityData(forecast, step);
      if (h.wind) {
        h.wind.setData(data);
        return;
      }
      const L = h.L as typeof Leaflet & { velocityLayer: (opts: object) => MapHandles["wind"] };
      h.wind = L.velocityLayer({
        data,
        displayValues: true,
        displayOptions: {
          velocityType: "Vento",
          position: "bottomleft",
          emptyString: "Sem dados de vento",
          angleConvention: "meteoCW",
          speedUnit: "k/h",
          directionString: "Direção",
          speedString: "Velocidade",
        },
        maxVelocity: 20,
        velocityScale: 0.008,
        particleAge: 80,
        lineWidth: 1.6,
        particleMultiplier: 1 / 250,
        frameRate: 20,
        colorScale: ["rgba(255,255,255,0.55)", "rgba(255,255,255,0.75)", "rgba(255,255,255,0.95)"],
      });
      h.wind!.addTo(h.map);
    };
    draw();
    window.addEventListener("atmospherix:map-ready", draw);
    return () => window.removeEventListener("atmospherix:map-ready", draw);
  }, [forecast, step, showWind]);

  // Selected point marker.
  useEffect(() => {
    const draw = () => {
      const h = handlesRef.current;
      if (!h) return;
      h.marker?.remove();
      h.marker = selected
        ? h.L.circleMarker([selected.lat, selected.lon], {
            radius: 7,
            color: "#fff",
            weight: 2,
            fillColor: "#ff4d6d",
            fillOpacity: 1,
          }).addTo(h.map)
        : null;
    };
    draw();
    window.addEventListener("atmospherix:map-ready", draw);
    return () => window.removeEventListener("atmospherix:map-ready", draw);
  }, [selected]);

  // Fly to a searched place or the user's location.
  useEffect(() => {
    const fly = () => {
      const h = handlesRef.current;
      if (!h || !focus) return;
      h.map.flyTo([focus.latitude, focus.longitude], focus.zoom, { duration: 1.2 });
    };
    fly();
    window.addEventListener("atmospherix:map-ready", fly);
    return () => window.removeEventListener("atmospherix:map-ready", fly);
  }, [focus]);

  return (
    <div ref={containerRef} className="map" role="application" aria-label="Mapa meteorológico" />
  );
}
