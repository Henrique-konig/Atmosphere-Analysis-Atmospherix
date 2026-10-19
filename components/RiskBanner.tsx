import { TriangleAlert } from "lucide-react";
import { formatHour, formatWeekday } from "@/lib/format";
import type { Risk } from "@/lib/risks";

interface Props {
  risks: Risk[];
  timezone: string;
  now: number;
}

function when(risk: Risk, now: number, timezone: string): string {
  const { time } = risk;
  if (risk.allDay) {
    if (formatWeekday(time, timezone) === formatWeekday(now, timezone)) return "hoje";
    if (formatWeekday(time, timezone) === formatWeekday(now + 86_400, timezone)) return "amanhã";
    return formatWeekday(time, timezone);
  }
  if (time <= now + 1800) return "agora";
  const sameDay = formatWeekday(time, timezone) === formatWeekday(now, timezone);
  return sameDay
    ? `a partir das ${formatHour(time, timezone)}`
    : `${formatWeekday(time, timezone)}, ${formatHour(time, timezone)}`;
}

export default function RiskBanner({ risks, timezone, now }: Props) {
  if (risks.length === 0) return null;
  return (
    <section className="card risks" aria-label="Riscos">
      <h2 className="card-title">
        <TriangleAlert size={14} strokeWidth={2} aria-hidden />
        Riscos nas próximas 48 horas
      </h2>
      <ul>
        {risks.map((risk) => (
          <li key={risk.id} className={`risk risk-${risk.level === "alerta" ? "alert" : "warn"}`}>
            <div className="risk-head">
              <span className="risk-level">{risk.level}</span>
              <strong>{risk.title}</strong>
              <span className="risk-when">{when(risk, now, timezone)}</span>
            </div>
            <p>{risk.detail}</p>
          </li>
        ))}
      </ul>
      <p className="card-note">
        Estimado a partir da previsão. Para alertas oficiais, consulte a Defesa Civil e o INMET.
      </p>
    </section>
  );
}
