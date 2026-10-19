import { ChartNoAxesColumn } from "lucide-react";
import { formatTemp, MISSING } from "@/lib/format";
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
      <Card title="Média" icon={ChartNoAxesColumn} className="tile">
        <p className="tile-text">Médias históricas indisponíveis para este local.</p>
      </Card>
    );
  }
  const diff = todayMax == null ? null : Math.round(todayMax - averages.max);
  const headline =
    diff == null ? MISSING : diff === 0 ? "Na média" : `${diff > 0 ? "+" : ""}${diff}°`;
  return (
    <Card title="Média" icon={ChartNoAxesColumn} className="tile">
      <p className="tile-value">{headline}</p>
      <p className="tile-label">
        {diff == null || diff === 0
          ? "máxima de hoje"
          : diff > 0
            ? "acima da máxima média"
            : "abaixo da máxima média"}
      </p>
      <dl className="avg-rows">
        <div>
          <dt>Hoje</dt>
          <dd>Máx. {formatTemp(todayMax)}</dd>
        </div>
        <div>
          <dt>Média</dt>
          <dd>
            Máx. {formatTemp(averages.max)} · Mín. {formatTemp(averages.min)}
          </dd>
        </div>
      </dl>
      <p className="tile-text">Média dos últimos {averages.years} anos para esta data.</p>
    </Card>
  );
}
