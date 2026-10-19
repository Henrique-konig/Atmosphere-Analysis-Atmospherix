import { ArrowDown, ArrowRight, ArrowUp, Gauge } from "lucide-react";
import { pressureTrend } from "@/lib/conditions";
import Card from "../Card";

const MIN = 970;
const MAX = 1050;
/** The gauge is a 270° arc, open at the bottom. */
const SWEEP = 270;

function point(fraction: number, r: number) {
  const deg = 135 + fraction * SWEEP; // 0 → bottom-left, 1 → bottom-right
  const rad = (deg * Math.PI) / 180;
  return { x: 60 + r * Math.cos(rad), y: 60 + r * Math.sin(rad) };
}

export default function PressureTile({ now, later }: { now: number; later: number }) {
  const trend = pressureTrend(now, later);
  const fraction = Math.min(1, Math.max(0, (now - MIN) / (MAX - MIN)));
  const start = point(0, 44);
  const end = point(1, 44);
  const needle = point(fraction, 44);
  const TrendIcon = trend === "subindo" ? ArrowUp : trend === "caindo" ? ArrowDown : ArrowRight;

  return (
    <Card title="Pressão" icon={Gauge} className="tile">
      <svg
        viewBox="0 0 120 108"
        className="gauge"
        role="img"
        aria-label={`Pressão ${Math.round(now)} hPa, ${trend}`}
      >
        <path
          d={`M ${start.x} ${start.y} A 44 44 0 1 1 ${end.x} ${end.y}`}
          className="gauge-track"
        />
        <circle cx={needle.x} cy={needle.y} r="5" className="gauge-needle" />
        <TrendIcon x={52} y={34} width={16} height={16} className="gauge-trend" aria-hidden />
        <text x="60" y="68" className="gauge-value">
          {Math.round(now)}
        </text>
        <text x="60" y="82" className="gauge-unit">
          hPa
        </text>
      </svg>
      <p className="tile-text">Pressão {trend} nas próximas horas.</p>
    </Card>
  );
}
