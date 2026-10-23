"use client";

import { BellRing, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { NotifyPermission } from "@/hooks/useWeatherNotifications";
import { formatSpeed } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { NotifySettings } from "@/lib/notifications";

interface Props {
  open: boolean;
  placeName: string | null;
  settings: NotifySettings;
  permission: NotifyPermission;
  onChange: (settings: NotifySettings) => void;
  onTest: () => void;
  onClose: () => void;
}

const LEADS: NotifySettings["leadHours"][] = [1, 2, 3];

function permissionNote(permission: NotifyPermission): string | null {
  if (permission === "unsupported") return t("notify.unsupported");
  if (permission === "denied") return t("notify.denied");
  return null;
}

export default function NotificationSheet(props: Props) {
  const { open, placeName, settings, permission, onChange, onTest, onClose } = props;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const blocked = permission === "unsupported" || permission === "denied";
  const note = permissionNote(permission);

  return (
    <dialog
      ref={dialogRef}
      className="sheet notify-sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && onClose()}
    >
      <div className="sheet-body">
        <header className="sheet-header">
          <h2 id={titleId}>{t("notify.title")}</h2>
          <button
            type="button"
            className="round-button"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <p className="notify-intro">
          {t("notify.intro", { place: placeName ?? t("notify.openCity") })}
        </p>

        {note && <p className="notify-note error">{note}</p>}

        <div className="notify-options">
          <label className="notify-row">
            <span>
              <strong>{t("notify.rain")}</strong>
              <small>{t("notify.rainHint")}</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="switch"
              checked={settings.rain}
              disabled={blocked}
              onChange={(e) => onChange({ ...settings, rain: e.target.checked })}
            />
          </label>
          {settings.rain && (
            <div className="notify-lead" role="radiogroup" aria-label={t("notify.lead")}>
              <span>{t("notify.lead")}</span>
              {LEADS.map((lead) => (
                <button
                  key={lead}
                  type="button"
                  role="radio"
                  aria-checked={settings.leadHours === lead}
                  className={settings.leadHours === lead ? "active" : undefined}
                  onClick={() => onChange({ ...settings, leadHours: lead })}
                >
                  {lead}h
                </button>
              ))}
            </div>
          )}
          <label className="notify-row">
            <span>
              <strong>{t("notify.severe")}</strong>
              <small>{t("notify.severeHint", { speed: formatSpeed(80) })}</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="switch"
              checked={settings.severe}
              disabled={blocked}
              onChange={(e) => onChange({ ...settings, severe: e.target.checked })}
            />
          </label>
        </div>

        {permission === "granted" && (settings.rain || settings.severe) && (
          <button type="button" className="locate-button" onClick={onTest}>
            <BellRing size={16} aria-hidden /> {t("notify.test")}
          </button>
        )}

        <p className="sheet-hint">{t("notify.hint")}</p>
      </div>
    </dialog>
  );
}
