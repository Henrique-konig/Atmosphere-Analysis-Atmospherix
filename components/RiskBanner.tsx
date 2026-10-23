import { TriangleAlert } from "lucide-react";
import { riskWhen } from "@/lib/risks";
import type { Risk } from "@/lib/risks";

interface Props {
  risks: Risk[];
  /** Shown below the severe-weather warning, which already carries the official-alerts note. */
  afterSevere?: boolean;
  timezone: string;
  now: number;
}

export default function RiskBanner({ risks, timezone, now, afterSevere = false }: Props) {
  if (risks.length === 0) return null;
  return (
    <section className="card risks" aria-label="Riscos">
      <h2 className="card-title">
        <TriangleAlert size={14} strokeWidth={2} aria-hidden />
        {afterSevere ? "Outros riscos nas próximas 48 horas" : "Riscos nas próximas 48 horas"}
      </h2>
      <ul>
        {risks.map((risk) => (
          <li key={risk.id} className={`risk risk-${risk.level === "alerta" ? "alert" : "warn"}`}>
            <div className="risk-head">
              <span className="risk-level">{risk.level}</span>
              <strong>{risk.title}</strong>
              <span className="risk-when">{riskWhen(risk, now, timezone)}</span>
            </div>
            <p>{risk.detail}</p>
          </li>
        ))}
      </ul>
      {!afterSevere && (
        <p className="card-note">
          Estimado a partir da previsão. Para alertas oficiais, consulte a Defesa Civil e o INMET.
        </p>
      )}
    </section>
  );
}
