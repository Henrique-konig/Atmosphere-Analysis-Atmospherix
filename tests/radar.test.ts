import { describe, expect, it } from "vitest";
import { buildTimeline, parseRadarMaps } from "@/lib/radar";

const maps = {
  host: "https://tilecache.rainviewer.com",
  radar: {
    past: [600, 0, 1200, 1800, 2400].map((time) => ({ time, path: `/v2/radar/${time}` })),
  },
};

describe("parseRadarMaps", () => {
  it("keeps every other frame counting back from the latest, oldest first", () => {
    const frames = parseRadarMaps(maps);
    expect(frames.map((f) => f.time)).toEqual([0, 1200, 2400]);
    expect(frames[2].url).toBe(
      "https://tilecache.rainviewer.com/v2/radar/2400/512/{z}/{x}/{y}/2/1_1.png",
    );
  });

  it("returns no frames for unusable responses", () => {
    expect(parseRadarMaps(null)).toEqual([]);
    expect(parseRadarMaps({ host: "http://x", radar: maps.radar })).toEqual([]);
    expect(parseRadarMaps({ host: maps.host, radar: { past: [{ time: "1" }] } })).toEqual([]);
  });
});

describe("buildTimeline", () => {
  it("plays radar, then the forecast hours after the latest image", () => {
    const radar = parseRadarMaps(maps);
    const { frames, now } = buildTimeline(radar, [0, 3600, 7200]);
    expect(frames.map((f) => `${f.kind}:${f.time}`)).toEqual([
      "radar:0",
      "radar:1200",
      "radar:2400",
      "forecast:3600",
      "forecast:7200",
    ]);
    expect(frames[3]).toEqual({ kind: "forecast", time: 3600, forecast: 1 });
    expect(now).toBe(2);
  });

  it("falls back to the forecast alone without radar", () => {
    const { frames, now } = buildTimeline([], [0, 3600]);
    expect(frames).toHaveLength(2);
    expect(now).toBe(0);
  });
});
