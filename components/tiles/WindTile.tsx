import { Wind } from "lucide-react";
import { compassPoint } from "@/lib/format";
import Card from "../Card";

interface Props {
  speed: number;
  gusts: number;
  direction: number;
}

export default function WindTile({ speed, gusts, direction }: Props) {
  const ticks = Array.from({ length: 36 }, (_, i) => i * 10);
  return (
    <Card title="Vento" icon={Wind} className="tile tile-wide wind">
      <dl className="wind-rows">
        <div>
          <dt>Vento</dt>
          <dd>{Math.round(speed)} km/h</dd>
        </div>
        <div>
          <dt>Rajadas</dt>
          <dd>{Math.round(gusts)} km/h</dd>
        </div>
        <div>
          <dt>Direção</dt>
          <dd>
            {Math.round(direction)}° {compassPoint(direction)}
          </dd>
        </div>
      </dl>
      <svg
        viewBox="0 0 120 120"
        className="compass"
        role="img"
        aria-label={`Vento de ${compassPoint(direction)}`}
      >
        {ticks.map((deg) => (
          <line
            key={deg}
            x1="60"
            y1="8"
            x2="60"
            y2={deg % 90 === 0 ? 16 : 12}
            transform={`rotate(${deg} 60 60)`}
            className={deg % 90 === 0 ? "compass-tick major" : "compass-tick"}
          />
        ))}
        <text x="60" y="27" className="compass-label">
          N
        </text>
        <text x="95" y="63" className="compass-label">
          L
        </text>
        <text x="60" y="99" className="compass-label">
          S
        </text>
        <text x="25" y="63" className="compass-label">
          O
        </text>
        {/* The arrow points where the wind blows to (opposite of where it comes from). */}
        <g transform={`rotate(${direction + 180} 60 60)`}>
          <line x1="60" y1="96" x2="60" y2="30" className="compass-arrow" />
          <path d="M 60 22 L 66 34 L 54 34 Z" className="compass-head" />
          <circle cx="60" cy="96" r="3" className="compass-tail" />
        </g>
        <circle cx="60" cy="60" r="17" className="compass-center" />
        <text x="60" y="60" className="compass-speed">
          {Math.round(speed)}
        </text>
        <text x="60" y="71" className="compass-unit">
          km/h
        </text>
      </svg>
    </Card>
  );
}
