import { colorAt, type ColorStop } from "./colors";

/** Bilinear sample of a row-major nx*ny field at fractional grid coords. */
export function sampleBilinear(
  field: number[],
  nx: number,
  ny: number,
  x: number,
  y: number,
): number {
  const x0 = Math.max(0, Math.min(nx - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(ny - 1, Math.floor(y)));
  const x1 = Math.min(nx - 1, x0 + 1);
  const y1 = Math.min(ny - 1, y0 + 1);
  const tx = Math.max(0, Math.min(1, x - x0));
  const ty = Math.max(0, Math.min(1, y - y0));
  const a = field[y0 * nx + x0];
  const b = field[y0 * nx + x1];
  const c = field[y1 * nx + x0];
  const d = field[y1 * nx + x1];
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
}

/**
 * Renders a scalar field into RGBA pixels, upsampled with bilinear
 * interpolation so the overlay looks smooth instead of blocky.
 */
export function renderField(
  field: number[],
  nx: number,
  ny: number,
  scale: ColorStop[],
  width: number,
  height: number,
): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let py = 0; py < height; py++) {
    const gy = (py / (height - 1)) * (ny - 1);
    for (let px = 0; px < width; px++) {
      const gx = (px / (width - 1)) * (nx - 1);
      const [r, g, b, a] = colorAt(scale, sampleBilinear(field, nx, ny, gx, gy));
      const i = (py * width + px) * 4;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = a;
    }
  }
  return pixels;
}
