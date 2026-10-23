"use client";

import { Settings2, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { LOCALES, t, type Locale } from "@/lib/i18n";
import type { ThemePreference } from "@/lib/theme";
import type { Units } from "@/lib/units";
import { useLocale } from "./LocaleProvider";

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
  /** Language of the label, when it differs from the page (language names). */
  lang?: string;
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
            <span lang={o.lang}>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function SettingsSheet(props: Props) {
  const { open, units, theme, onClose, onUnitsChange, onThemeChange } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { locale, change } = useLocale();

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
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
    >
      <div className="sheet-body">
        <header className="sheet-header">
          <h2 id={titleId}>
            <Settings2 size={22} aria-hidden /> {t("settings.title")}
          </h2>
          <button
            type="button"
            className="round-button"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <Segmented<Locale>
          name="language"
          legend={t("app.language")}
          value={locale}
          onChange={change}
          options={LOCALES.map((l) => ({ value: l.code, label: l.name, lang: l.tag }))}
        />
        <Segmented
          name="theme"
          legend={t("settings.theme")}
          value={theme}
          onChange={onThemeChange}
          options={[
            { value: "auto", label: t("settings.auto") },
            { value: "light", label: t("settings.light") },
            { value: "dark", label: t("settings.dark") },
          ]}
        />
        <Segmented
          name="temperature"
          legend={t("settings.temperature")}
          value={units.temperature}
          onChange={(temperature) => onUnitsChange({ ...units, temperature })}
          options={[
            { value: "c", label: "Celsius (°C)" },
            { value: "f", label: "Fahrenheit (°F)" },
          ]}
        />
        <Segmented
          name="speed"
          legend={t("common.wind")}
          value={units.speed}
          onChange={(speed) => onUnitsChange({ ...units, speed })}
          options={[
            { value: "kmh", label: "km/h" },
            { value: "mph", label: "mph" },
          ]}
        />
        <Segmented
          name="precipitation"
          legend={t("day.rain")}
          value={units.precipitation}
          onChange={(precipitation) => onUnitsChange({ ...units, precipitation })}
          options={[
            { value: "mm", label: t("settings.mm") },
            { value: "in", label: t("settings.in") },
          ]}
        />
        <p className="sheet-hint">{t("settings.hint")}</p>
      </div>
    </dialog>
  );
}
