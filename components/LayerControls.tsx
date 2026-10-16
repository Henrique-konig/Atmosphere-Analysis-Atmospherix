"use client";

import type { FieldLayer } from "@/lib/types";

interface Props {
  layer: FieldLayer;
  showWind: boolean;
  loading: boolean;
  onLayerChange: (layer: FieldLayer) => void;
  onWindChange: (show: boolean) => void;
  onReloadArea: () => void;
}

const LAYERS: { id: FieldLayer; label: string }[] = [
  { id: "temperature", label: "Temperatura" },
  { id: "precipitation", label: "Chuva" },
  { id: "none", label: "Nenhuma" },
];

export default function LayerControls(props: Props) {
  const { layer, showWind, loading, onLayerChange, onWindChange, onReloadArea } = props;
  return (
    <div className="panel controls">
      <fieldset>
        <legend>Camada</legend>
        <div className="segmented">
          {LAYERS.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={layer === l.id}
              onClick={() => onLayerChange(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="toggle">
        <input
          type="checkbox"
          checked={showWind}
          onChange={(e) => onWindChange(e.target.checked)}
        />
        Partículas de vento
      </label>
      <button type="button" className="primary" onClick={onReloadArea} disabled={loading}>
        {loading ? "Carregando…" : "Carregar esta área"}
      </button>
    </div>
  );
}
