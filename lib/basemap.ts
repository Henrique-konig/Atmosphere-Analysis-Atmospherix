/**
 * Base map tiles. Esri's Dark Gray Canvas needs no API key; swap the URLs here to change
 * provider (CARTO basemaps, used before, started requiring a key).
 */
export const BASEMAP = {
  base: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  labels:
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
  /**
   * Shaded relief blended over the weather colours (multiply), which gives the
   * Windy-style 3D look of mountains and valleys.
   */
  relief:
    "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
  maxZoom: 16,
  attribution:
    'Mapa &copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | Dados: <a href="https://open-meteo.com/">Open-Meteo</a>',
};
