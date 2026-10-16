"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";

interface Props {
  times: number[];
  step: number;
  onChange: (step: number) => void;
}

const PLAY_INTERVAL_MS = 700;

export default function Timeline({ times, step, onChange }: Props) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || times.length === 0) return;
    const id = window.setInterval(() => onChange((step + 1) % times.length), PLAY_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [playing, step, times.length, onChange]);

  if (times.length === 0) return null;

  return (
    <div className="panel timeline">
      <button
        type="button"
        className="icon-button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pausar animação" : "Reproduzir animação"}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <input
        type="range"
        min={0}
        max={times.length - 1}
        value={step}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Hora da previsão"
        aria-valuetext={formatDateTime(times[step])}
      />
      <output className="timeline-label">{formatDateTime(times[step])}</output>
    </div>
  );
}
