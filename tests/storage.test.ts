import { describe, expect, it } from "vitest";
import { samePlace, toggleFavorite, type SavedPlace } from "@/lib/storage";

const poa: SavedPlace = { name: "Porto Alegre", latitude: -30.03, longitude: -51.22 };
const rio: SavedPlace = { name: "Rio de Janeiro", latitude: -22.91, longitude: -43.17 };

describe("toggleFavorite", () => {
  it("adds a city at the end of the list", () => {
    expect(toggleFavorite([poa], rio)).toEqual([poa, rio]);
  });

  it("removes a city that is already a favorite, even with slightly different coordinates", () => {
    expect(toggleFavorite([poa, rio], { ...rio, latitude: -22.912 })).toEqual([poa]);
  });

  it("does not keep the device-location flag on a saved city", () => {
    const [saved] = toggleFavorite([], { ...poa, current: true });
    expect(saved.current).toBeUndefined();
    expect(samePlace(saved, poa)).toBe(true);
  });
});
