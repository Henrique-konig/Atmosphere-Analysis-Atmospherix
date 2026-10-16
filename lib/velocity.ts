import { gridStep } from "./grid";
import type { GridForecast } from "./types";

/** Builds the GRIB-like JSON records that leaflet-velocity expects. */
export function toVelocityData(forecast: GridForecast, step: number) {
  const { grid } = forecast;
  const { dx, dy } = gridStep(grid);
  const header = {
    parameterCategory: 2,
    lo1: grid.bbox.west,
    la1: grid.bbox.north,
    lo2: grid.bbox.east,
    la2: grid.bbox.south,
    dx,
    dy,
    nx: grid.nx,
    ny: grid.ny,
    refTime: new Date(forecast.times[step] * 1000).toISOString(),
  };
  return [
    {
      header: { ...header, parameterNumber: 2, parameterNumberName: "eastward_wind" },
      data: forecast.windU[step],
    },
    {
      header: { ...header, parameterNumber: 3, parameterNumberName: "northward_wind" },
      data: forecast.windV[step],
    },
  ];
}
