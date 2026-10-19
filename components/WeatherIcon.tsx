import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { IconKind } from "@/lib/conditions";

const ICONS: Record<IconKind, { Icon: LucideIcon; className: string }> = {
  sun: { Icon: Sun, className: "icon-sun" },
  moon: { Icon: Moon, className: "icon-moon" },
  "cloud-sun": { Icon: CloudSun, className: "icon-cloud-sun" },
  "cloud-moon": { Icon: CloudMoon, className: "icon-cloud" },
  cloud: { Icon: Cloud, className: "icon-cloud" },
  fog: { Icon: CloudFog, className: "icon-cloud" },
  drizzle: { Icon: CloudDrizzle, className: "icon-rain" },
  rain: { Icon: CloudRain, className: "icon-rain" },
  "heavy-rain": { Icon: CloudRainWind, className: "icon-rain" },
  snow: { Icon: CloudSnow, className: "icon-cloud" },
  storm: { Icon: CloudLightning, className: "icon-storm" },
};

export default function WeatherIcon({
  kind,
  size = 24,
  label,
}: {
  kind: IconKind;
  size?: number;
  label?: string;
}) {
  const { Icon, className } = ICONS[kind];
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      className={`weather-icon ${className}`}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
    />
  );
}
