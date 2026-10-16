"use client";

import { LAYERS } from "@/lib/layers";
import type { FieldLayer } from "@/lib/types";

interface Props {
  layer: FieldLayer;
  showWind: boolean;
  showRelief: boolean;
  loading: boolean;
  onLayerChange: (layer: FieldLayer) => void;
  onWindChange: (show: boolean) => void;
  onReliefChange: (show: boolean) => void;
}

const OPTIONS: { id: FieldLayer; label: string }[] = [
  ...LAYERS.map(({ id, label }) => ({ id, label })),
  { id: "none", label: "Nenhuma" },
];

export default function LayerControls(props: Props) {
  const { layer, showWind, showRelief, loading, onLayerChange, onWindChange, onReliefChange } =
    props;
  return (
    <div className="panel controls">
      <fieldset>
        <legend>Camada</legend>
        <div className="segmented layer-grid">
          {OPTIONS.map((l) => (
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
      <label className="toggle">
        <input
          type="checkbox"
          checked={showRelief}
          onChange={(e) => onReliefChange(e.target.checked)}
        />
        Relevo
      </label>
      <p className="muted small status" role="status">
        {loading ? "Atualizando previsão…" : "A previsão acompanha a área visível"}
      </p>
    </div>
  );
}
