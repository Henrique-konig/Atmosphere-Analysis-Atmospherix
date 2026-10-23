import { MoonStar } from "lucide-react";
import { t } from "@/lib/i18n";
import { daysUntil, moonInfo } from "@/lib/moon";
import Card from "../Card";
import MoonDisc from "../MoonDisc";

export default function MoonTile({ now, latitude }: { now: number; latitude: number }) {
  const moon = moonInfo(now);
  return (
    <Card title={t("moon.title")} icon={MoonStar} className="tile tile-wide moon">
      <div className="moon-body">
        <MoonDisc phase={moon.phase} latitude={latitude} label={moon.name} />
        <dl className="wind-rows">
          <div>
            <dt>{t("moon.phase")}</dt>
            <dd>{moon.name}</dd>
          </div>
          <div>
            <dt>{t("moon.illumination")}</dt>
            <dd>{Math.round(moon.illumination * 100)}%</dd>
          </div>
          <div>
            <dt>{t("moon.nextFull")}</dt>
            <dd>{daysUntil(moon.daysToFull)}</dd>
          </div>
          <div>
            <dt>{t("moon.nextNew")}</dt>
            <dd>{daysUntil(moon.daysToNew)}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
