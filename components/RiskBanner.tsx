import { TriangleAlert } from "lucide-react";
import { riskWhen } from "@/lib/risks";
import type { Risk } from "@/lib/risks";
import { t } from "@/lib/i18n";

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
    <section className="card risks" aria-label={t("risks.label")}>
      <h2 className="card-title">
        <TriangleAlert size={14} strokeWidth={2} aria-hidden />
        {afterSevere ? t("risks.otherTitle") : t("risks.title")}
      </h2>
      <ul>
        {risks.map((risk) => (
          <li key={risk.id} className={`risk risk-${risk.level === "alerta" ? "alert" : "warn"}`}>
            <div className="risk-head">
              <span className="risk-level">{t(`risks.level.${risk.level}`)}</span>
              <strong>{risk.title}</strong>
              <span className="risk-when">{riskWhen(risk, now, timezone)}</span>
            </div>
            <p>{risk.detail}</p>
          </li>
        ))}
      </ul>
      {!afterSevere && <p className="card-note">{t("risks.note")}</p>}
    </section>
  );
}
