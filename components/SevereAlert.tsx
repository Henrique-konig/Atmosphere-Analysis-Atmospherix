import { CloudLightning, Snowflake, ThermometerSun, TriangleAlert, Wind } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { riskWhen } from "@/lib/risks";
import type { Risk } from "@/lib/risks";
import { t } from "@/lib/i18n";

interface Props {
  risks: Risk[];
  timezone: string;
  now: number;
}

const ICONS: Record<string, LucideIcon> = {
  storm: CloudLightning,
  wind: Wind,
  heat: ThermometerSun,
  cold: Snowflake,
};

/** Highlighted warning for thunderstorms, strong gusts and extreme heat or cold. */
export default function SevereAlert({ risks, timezone, now }: Props) {
  if (risks.length === 0) return null;
  return (
    <section className="severe" aria-label={t("severe.label")}>
      <ul>
        {risks.map((risk) => {
          const Icon = ICONS[risk.id] ?? TriangleAlert;
          return (
            <li
              key={risk.id}
              className={`severe-item severe-${risk.level === "alerta" ? "alert" : "warn"}`}
            >
              <span className="severe-icon">
                <Icon size={26} strokeWidth={2} aria-hidden />
              </span>
              <div className="severe-body">
                <div className="severe-head">
                  <span className="severe-level">{t(`risks.level.${risk.level}`)}</span>
                  <span className="severe-when">{riskWhen(risk, now, timezone)}</span>
                </div>
                <strong className="severe-title">{risk.title}</strong>
                <p>{risk.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="severe-note">{t("severe.note")}</p>
    </section>
  );
}
