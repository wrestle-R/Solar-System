import { galacticCanvas } from "./galactic-background";

/** A projected particle field and layered accretion flow, rendered without a second WebGL context. */
export function createIntroRenderer(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Canvas unavailable");
  const ctx = context;
  const galaxy = galacticCanvas();
  let width = 1,
    height = 1,
    pixelRatio = 1,
    pointerX = 0,
    pointerY = 0,
    targetX = 0,
    targetY = 0;
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const stars = Array.from({ length: 900 }, () => ({
    x: random() - 0.5,
    y: random() - 0.5,
    z: random(),
    size: 0.3 + random() * 0.85,
    warm: random() > 0.8,
  }));
  const dust = Array.from({ length: 1600 }, () => ({
    r: 1.05 + Math.pow(random(), 1.8) * 2.1,
    a: random() * Math.PI * 2,
    h: (random() - 0.5) * 0.014,
    alpha: 0.08 + random() * 0.65,
  }));
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const smooth = (a: number, b: number, v: number) => {
    const t = clamp((v - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const discCanvas = document.createElement("canvas");
  discCanvas.width = 1200;
  discCanvas.height = 600;
  const disc = discCanvas.getContext("2d")!;
  // Cache the broad disk, leaving only moving filaments and particles to draw each frame.
  disc.translate(600, 300);
  for (let i = 200; i > 0; i--) {
    const r = 132 + i * 1.85;
    const inner = 1 - i / 220;
    disc.beginPath();
    disc.ellipse(0, 0, r, r * 0.145, 0, 0, Math.PI * 2);
    disc.lineWidth = 1.5;
    disc.strokeStyle = `rgba(255,${135 + inner * 105},${40 + inner * 157},${0.025 + inner * 0.2})`;
    disc.stroke();
  }

  function drawStars(time: number, progress: number, cx: number, cy: number) {
    const warp = smooth(0.25, 0.7, progress);
    const travel = time * 0.004 + Math.pow(progress, 3) * 3.8;
    const vanish = 1 - smooth(0.88, 1, progress);
    for (const star of stars) {
      const z = 0.04 + ((((star.z - travel) % 1) + 1) % 1);
      const zoom = 0.6 / z;
      const x = cx + star.x * width * zoom,
        y = cy + star.y * height * zoom;
      if (x < 0 || x > width || y < 0 || y > height) continue;
      const strength = (0.12 + (1 - z) * 0.55) * vanish;
      ctx.strokeStyle = star.warm
        ? `rgba(255,222,183,${strength})`
        : `rgba(180,204,241,${strength})`;
      ctx.fillStyle = ctx.strokeStyle;
      if (warp > 0.02) {
        const trail = 1 + (warp * 0.12) / (z + 0.2);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(cx + (x - cx) * trail, cy + (y - cy) * trail);
        ctx.lineWidth = star.size;
        ctx.stroke();
      } else {
        const radius = star.size * Math.min(1.5, zoom);
        ctx.fillRect(x, y, radius, radius);
      }
    }
  }
  function drawHole(
    time: number,
    progress: number,
    cx: number,
    cy: number,
    radius: number,
  ) {
    const approach = smooth(0.02, 0.57, progress);
    const radiusScale = 1 + approach * 5;
    const r = radius * radiusScale;
    const visibility = 1 - smooth(0.51, 0.64, progress);
    if (visibility <= 0) return;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.16 + Math.sin(time * 0.07) * 0.035);
    ctx.globalAlpha = visibility;
    const aura = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 3);
    aura.addColorStop(0, "rgba(237,171,87,.09)");
    aura.addColorStop(0.4, "rgba(129,68,39,.035)");
    aura.addColorStop(1, "transparent");
    ctx.fillStyle = aura;
    ctx.fillRect(-r * 3, -r * 3, r * 6, r * 6);
    ctx.drawImage(discCanvas, -r * 4, -r * 2, r * 8, r * 4);
    // Moving points have depth in the orbital plane and are drawn on either side of the shadow.
    function particles(front: boolean) {
      ctx.globalCompositeOperation = "screen";
      for (const particle of dust) {
        const angle =
          particle.a +
          time * (0.12 + 1.1 / Math.pow(particle.r, 1.5)) +
          approach * 3;
        const depth = Math.sin(angle);
        if (depth < 0 !== front) continue;
        const perspective = 1 / (1 + depth * 0.045);
        const x = Math.cos(angle) * particle.r * r * perspective;
        const y = (depth * 0.16 * particle.r + particle.h) * r;
        const alpha = (particle.alpha / Math.pow(particle.r, 1.7)) * visibility;
        ctx.strokeStyle = `rgba(255,${210 - particle.r * 22},${141 - particle.r * 28},${alpha})`;
        ctx.beginPath();
        ctx.ellipse(
          0,
          particle.h * r,
          particle.r * r,
          particle.r * r * 0.16,
          0,
          angle,
          angle + 0.007 / particle.r,
        );
        ctx.lineWidth = Math.max(0.45, r * 0.003);
        ctx.stroke();
        if (front && particle.alpha > 0.5) {
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fillRect(x, y, 0.6 * radiusScale, 0.6 * radiusScale);
        }
      }
      ctx.globalCompositeOperation = "source-over";
    }
    particles(false);
    // Opaque horizon and a white-hot photon edge with a much softer outer bloom.
    ctx.fillStyle = "#010103";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "screen";
    for (let i = 18; i >= 0; i--) {
      ctx.beginPath();
      ctx.arc(0, 0, r + i * r * 0.002, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,${218 - i * 3},${162 - i * 5},${i === 0 ? 0.9 : 0.025 + (18 - i) * 0.002})`;
      ctx.lineWidth = i === 0 ? Math.max(1, r * 0.005) : r * 0.018;
      ctx.stroke();
    }
    // The far side's light wraps over the top of the central shadow.
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        r * (1.008 + i * 0.003),
        r * (1.008 + i * 0.003),
        0,
        Math.PI,
        Math.PI * 2,
      );
      ctx.strokeStyle = `rgba(255,${218 + i},${160 + i * 3},${0.08 * (1 - i / 15)})`;
      ctx.lineWidth = Math.max(0.5, r * 0.005);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    // Only the near half passes in front of the black sphere.
    ctx.save();
    ctx.beginPath();
    ctx.rect(-r * 5, 0, r * 10, -r * 5);
    ctx.clip();
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(discCanvas, -r * 4, -r * 2, r * 8, r * 4);
    ctx.restore();
    particles(true);
    ctx.restore();
  }
  return {
    resize(w: number, h: number) {
      width = w;
      height = h;
      pixelRatio = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = Math.round(w * pixelRatio);
      canvas.height = Math.round(h * pixelRatio);
    },
    pointer(x: number, y: number) {
      targetX = x;
      targetY = y;
    },
    render(time: number, progress: number) {
      pointerX += (targetX - pointerX) * 0.04;
      pointerY += (targetY - pointerY) * 0.04;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#010103";
      ctx.fillRect(0, 0, width, height);
      const portrait = width < 700;
      const shift = 1 - smooth(0, 0.3, progress);
      const cx = width * (0.5 + (portrait ? 0 : 0.18) * shift) + pointerX * 10;
      const cy = height * (0.5 - (portrait ? 0.2 : 0) * shift) - pointerY * 8;
      ctx.save();
      ctx.translate(width * 0.5, height * 0.5);
      ctx.rotate(-0.35);
      ctx.globalAlpha = 0.72 * (1 - smooth(0.25, 0.65, progress));
      const size = Math.max(width * 1.5, height * 2.5);
      ctx.drawImage(galaxy, -size * 0.5, -size * 0.25, size, size * 0.5);
      ctx.restore();
      drawStars(time, progress, cx, cy);
      drawHole(
        time,
        progress,
        cx,
        cy,
        Math.min(width * (portrait ? 0.22 : 0.145), height * 0.21),
      );
    },
    dispose() {
      discCanvas.width = 1;
      discCanvas.height = 1;
    },
  };
}
