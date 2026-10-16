import {
  CLOUDS_SCALE,
  type ColorStop,
  GUSTS_SCALE,
  HUMIDITY_SCALE,
  PRECIPITATION_SCALE,
  PRESSURE_SCALE,
  TEMPERATURE_SCALE,
} from "./colors";
import type { FieldId } from "./types";

export interface LayerDefinition {
  id: FieldId;
  /** Short name for the layer picker. */
  label: string;
  /** Legend title, including the unit. */
  title: string;
  /** Open-Meteo hourly variable (wind speeds requested in m/s). */
  variable: string;
  /** Converts the API value to the displayed unit. */
  convert?: (value: number) => number;
  /** Value used when the API has no data for a point. */
  fallback: number;
  scale: ColorStop[];
  ticks: number[];
}

export const LAYERS: LayerDefinition[] = [
  {
    id: "temperature",
    label: "Temperatura",
    title: "Temperatura (°C)",
    variable: "temperature_2m",
    fallback: NaN,
    scale: TEMPERATURE_SCALE,
    ticks: [-20, 0, 20, 42],
  },
  {
    id: "precipitation",
    label: "Chuva",
    title: "Chuva (mm/h)",
    variable: "precipitation",
    fallback: 0,
    scale: PRECIPITATION_SCALE,
    ticks: [0, 3, 15, 30],
  },
  {
    id: "clouds",
    label: "Nuvens",
    title: "Cobertura de nuvens (%)",
    variable: "cloud_cover",
    fallback: 0,
    scale: CLOUDS_SCALE,
    ticks: [0, 50, 100],
  },
  {
    id: "gusts",
    label: "Rajadas",
    title: "Rajadas de vento (km/h)",
    variable: "wind_gusts_10m",
    convert: (ms) => ms * 3.6,
    fallback: NaN,
    scale: GUSTS_SCALE,
    ticks: [0, 40, 80, 130],
  },
  {
    id: "pressure",
    label: "Pressão",
    title: "Pressão ao nível do mar (hPa)",
    variable: "pressure_msl",
    fallback: NaN,
    scale: PRESSURE_SCALE,
    ticks: [970, 1013, 1045],
  },
  {
    id: "humidity",
    label: "Umidade",
    title: "Umidade relativa (%)",
    variable: "relative_humidity_2m",
    fallback: NaN,
    scale: HUMIDITY_SCALE,
    ticks: [0, 50, 100],
  },
];

const BY_ID = new Map(LAYERS.map((l) => [l.id, l]));

export function getLayer(id: FieldId): LayerDefinition {
  return BY_ID.get(id)!;
}
