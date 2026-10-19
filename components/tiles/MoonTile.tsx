import { MoonStar } from "lucide-react";
import { moonInfo } from "@/lib/moon";
import Card from "../Card";

/** Lit part of the moon disc for a phase (0 = new, 0.5 = full). */
function litPath(phase: number, r: number): string {
  const waxing = phase < 0.5;
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const rx = r * Math.abs(Math.cos(2 * Math.PI * phase));
  const outer = waxing ? 1 : 0;
  const inner = waxing ? (illumination < 0.5 ? 0 : 1) : illumination < 0.5 ? 1 : 0;
  return `M 0 ${-r} A ${r} ${r} 0 0 ${outer} 0 ${r} A ${rx} ${r} 0 0 ${inner} 0 ${-r} Z`;
}

export default function MoonTile({ now, latitude }: { now: number; latitude: number }) {
  const moon = moonInfo(now);
  const days = Math.round(moon.daysToFull);
  return (
    <Card title="Lua" icon={MoonStar} className="tile tile-wide moon">
      <div className="moon-body">
        <svg viewBox="-50 -50 100 100" className="moon-disc" role="img" aria-label={moon.name}>
          <circle r="40" className="moon-dark" />
          {/* Seen from the southern hemisphere the moon is mirrored left to right. */}
          <path
            d={litPath(moon.phase, 40)}
            className="moon-lit"
            transform={latitude < 0 ? "scale(-1 1)" : undefined}
          />
        </svg>
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
            <dd>{days === 0 ? "Hoje" : days === 1 ? "Amanhã" : `Em ${days} dias`}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
