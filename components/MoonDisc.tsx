/** Lit part of the moon disc for a phase (0 = new, 0.5 = full). */
function litPath(phase: number, r: number): string {
  const waxing = phase < 0.5;
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const rx = r * Math.abs(Math.cos(2 * Math.PI * phase));
  const outer = waxing ? 1 : 0;
  const inner = waxing ? (illumination < 0.5 ? 0 : 1) : illumination < 0.5 ? 1 : 0;
  return `M 0 ${-r} A ${r} ${r} 0 0 ${outer} 0 ${r} A ${rx} ${r} 0 0 ${inner} 0 ${-r} Z`;
}

/** The moon as seen from the location, for the main tile and the day details. */
export default function MoonDisc({
  phase,
  latitude,
  label,
}: {
  phase: number;
  latitude: number;
  label: string;
}) {
  return (
    <svg viewBox="-50 -50 100 100" className="moon-disc" role="img" aria-label={label}>
      <circle r="40" className="moon-dark" />
      {/* Seen from the southern hemisphere the moon is mirrored left to right. */}
      <path
        d={litPath(phase, 40)}
        className="moon-lit"
        transform={latitude < 0 ? "scale(-1 1)" : undefined}
      />
    </svg>
  );
}
