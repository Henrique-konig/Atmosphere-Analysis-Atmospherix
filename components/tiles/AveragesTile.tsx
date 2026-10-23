import { ChartNoAxesColumn } from "lucide-react";
import { formatTemp, MISSING } from "@/lib/format";
import { t } from "@/lib/i18n";
import { convertTempDelta } from "@/lib/units";
import type { TemperatureAverages } from "@/lib/types";
import Card from "../Card";

export default function AveragesTile({
  todayMax,
  averages,
}: {
  todayMax: number | null;
  averages: TemperatureAverages | null;
}) {
  if (!averages) {
    return (
      <Card title={t("averages.title")} icon={ChartNoAxesColumn} className="tile">
        <p className="tile-text">{t("averages.unavailable")}</p>
      </Card>
    );
  }
  const diff = todayMax == null ? null : Math.round(convertTempDelta(todayMax - averages.max));
  const headline =
    diff == null
      ? MISSING
      : diff === 0
        ? t("averages.onAverage")
        : `${diff > 0 ? "+" : ""}${diff}°`;
  return (
    <Card title={t("averages.title")} icon={ChartNoAxesColumn} className="tile">
      <p className="tile-value">{headline}</p>
      <p className="tile-label">
        {diff == null || diff === 0
          ? t("averages.todayMax")
          : diff > 0
            ? t("averages.above")
            : t("averages.below")}
      </p>
      <dl className="avg-rows">
        <div>
          <dt>{t("common.today")}</dt>
          <dd>{t("averages.max", { temp: formatTemp(todayMax) })}</dd>
        </div>
        <div>
          <dt>{t("averages.title")}</dt>
          <dd>
            {t("averages.max", { temp: formatTemp(averages.max) })} ·{" "}
            {t("averages.min", { temp: formatTemp(averages.min) })}
          </dd>
        </div>
      </dl>
      <p className="tile-text">{t("averages.years", { years: averages.years })}</p>
    </Card>
  );
}
