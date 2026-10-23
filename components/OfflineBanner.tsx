"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { useState } from "react";
import { formatSavedAt } from "@/lib/forecastCache";
import { t } from "@/lib/i18n";

interface Props {
  savedAt: number;
  /** No network, as opposed to the forecast service failing. */
  offline: boolean;
  onRetry: () => void;
}

/** Says the forecast on screen is a saved copy, and from when. */
export default function OfflineBanner({ savedAt, offline, onRetry }: Props) {
  // Only decides "today" vs "ontem"; the banner never lives long enough for that to go stale.
  const [now] = useState(Date.now);
  return (
    <div className="offline-banner" role="status">
      <CloudOff size={16} aria-hidden />
      <span>
        <strong>{offline ? t("offline.noConnection") : t("offline.updateFailed")}</strong> ·{" "}
        {t("offline.dataFrom", { when: formatSavedAt(savedAt, now) })}
      </span>
      <button type="button" onClick={onRetry} aria-label={t("offline.retry")}>
        <RefreshCw size={14} aria-hidden />
      </button>
    </div>
  );
}
