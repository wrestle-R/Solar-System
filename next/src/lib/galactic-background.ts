/** Decorative galactic dust, shared by the intro and the 3D sky. */
let cached: HTMLCanvasElement | null = null;

function hash(x: number, y: number) {
  let value = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}
function noise(x: number, y: number) {
  const ix = Math.floor(x),
    iy = Math.floor(y);
  let fx = x - ix,
    fy = y - iy;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  return (
    (hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx) * (1 - fy) +
    (hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx) * fy
  );
}
function clouds(x: number, y: number) {
  return (
    noise(x, y) * 0.52 +
    noise(x * 2.03, y * 2.03) * 0.28 +
    noise(x * 4.07, y * 4.07) * 0.14 +
    noise(x * 8.11, y * 8.11) * 0.06
  );
}

export function galacticPixels(width: number, height: number) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const latitude = (y / (height - 1) - 0.5) * Math.PI;
    for (let x = 0; x < width; x++) {
      const longitude = (x / (width - 1)) * Math.PI * 2;
      // Noise lives on a cylinder so the left/right edges meet on the sky sphere.
      const nx = Math.cos(longitude) * 3.2 + 9,
        ny = Math.sin(longitude) * 3.2 + 8;
      const cloud = clouds(nx + latitude * 1.3, ny + latitude * 4.7);
      const warp = (noise(nx * 1.2, ny * 1.2) - 0.5) * 0.1;
      const band = Math.exp(-Math.pow((latitude + warp) / 0.21, 2));
      const lane = Math.exp(
        -Math.pow((latitude + (cloud - 0.5) * 0.15) / 0.045, 2),
      );
      const detail = clouds(nx * 3.1 + latitude * 8, ny * 3.1 - latitude * 11);
      const core = Math.pow(Math.max(0, Math.cos(longitude - 0.6)), 8);
      const dust =
        band * (0.35 + cloud * 0.85) * (1 - lane * (0.35 + detail * 0.35));
      const intensity = dust * (34 + core * 32) * (0.6 + detail * 0.65);
      const i = (y * width + x) * 4;
      pixels[i] = 1 + intensity * (1.05 + core * 0.12);
      pixels[i + 1] = 2 + intensity * 1.06;
      pixels[i + 2] = 4 + intensity * (1.24 - core * 0.12);
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

export function galacticCanvas() {
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  const image = ctx.createImageData(canvas.width, canvas.height);
  image.data.set(galacticPixels(canvas.width, canvas.height));
  ctx.putImageData(image, 0, 0);
  cached = canvas;
  return canvas;
}
