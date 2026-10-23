import { MoonStar } from "lucide-react";
import { daysUntil, moonInfo } from "@/lib/moon";
import Card from "../Card";
import MoonDisc from "../MoonDisc";

export default function MoonTile({ now, latitude }: { now: number; latitude: number }) {
  const moon = moonInfo(now);
  return (
    <Card title="Lua" icon={MoonStar} className="tile tile-wide moon">
      <div className="moon-body">
        <MoonDisc phase={moon.phase} latitude={latitude} label={moon.name} />
        <dl className="wind-rows">
          <div>
            <dt>Fase</dt>
            <dd>{moon.name}</dd>
          </div>
          <div>
            <dt>Iluminação</dt>
            <dd>{Math.round(moon.illumination * 100)}%</dd>
          </div>
          <div>
            <dt>Próxima cheia</dt>
            <dd>{daysUntil(moon.daysToFull)}</dd>
          </div>
          <div>
            <dt>Próxima nova</dt>
            <dd>{daysUntil(moon.daysToNew)}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
