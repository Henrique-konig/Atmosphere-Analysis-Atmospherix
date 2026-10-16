import type { Place } from "./types";

/** "Rio Grande do Sul, Brasil": the parts after the name, without blanks or repeats. */
export function placeDetails(place: Place): string {
  const parts = [place.region, place.country].filter(
    (part, i, all): part is string =>
      Boolean(part) && part !== place.name && all.indexOf(part) === i,
  );
  return parts.join(", ");
}
