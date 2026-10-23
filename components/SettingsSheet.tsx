"use client";

import { Settings2, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ThemePreference } from "@/lib/theme";
import type { Units } from "@/lib/units";

interface Props {
  open: boolean;
  units: Units;
  theme: ThemePreference;
  onClose: () => void;
  onUnitsChange: (units: Units) => void;
  onThemeChange: (theme: ThemePreference) => void;
}

interface Option<T extends string> {
  value: T;
  label: string;
}

/** A row of radio buttons styled as an iOS segmented control. */
function Segmented<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="setting">
      <legend>{legend}</legend>
      <div className="choice">
        {options.map((o) => (
          <label key={o.value}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function SettingsSheet(props: Props) {
  const { open, units, theme, onClose, onUnitsChange, onThemeChange } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="sheet settings-sheet"
      aria-label="Ajustes"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
    >
      <div className="sheet-body">
        <header className="sheet-header">
          <h2>
            <Settings2 size={22} aria-hidden /> Ajustes
          </h2>
          <button type="button" className="round-button" onClick={onClose} aria-label="Fechar">
            <X size={18} aria-hidden />
          </button>
        </header>

        <Segmented
          name="theme"
          legend="Tema"
          value={theme}
          onChange={onThemeChange}
          options={[
            { value: "auto", label: "Automático" },
            { value: "light", label: "Claro" },
            { value: "dark", label: "Escuro" },
          ]}
        />
        <Segmented
          name="temperature"
          legend="Temperatura"
          value={units.temperature}
          onChange={(temperature) => onUnitsChange({ ...units, temperature })}
          options={[
            { value: "c", label: "Celsius (°C)" },
            { value: "f", label: "Fahrenheit (°F)" },
          ]}
        />
        <Segmented
          name="speed"
          legend="Vento"
          value={units.speed}
          onChange={(speed) => onUnitsChange({ ...units, speed })}
          options={[
            { value: "kmh", label: "km/h" },
            { value: "mph", label: "mph" },
          ]}
        />
        <Segmented
          name="precipitation"
          legend="Chuva"
          value={units.precipitation}
          onChange={(precipitation) => onUnitsChange({ ...units, precipitation })}
          options={[
            { value: "mm", label: "Milímetros (mm)" },
            { value: "in", label: "Polegadas (in)" },
          ]}
        />
        <p className="sheet-hint">
          Os ajustes ficam salvos neste aparelho. Com mph, a visibilidade aparece em milhas.
        </p>
      </div>
    </dialog>
  );
}
