import * as THREE from "three";
import { galacticCanvas } from "./galactic-background";

/** Illustrative sky, not a catalogue or a date-dependent view from Earth. */
export function createStarfield(pixelRatio: number) {
  const group = new THREE.Group();
  group.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(-0.6, 0.7, -0.3).normalize(),
  );
  group.rotateY(0.7);
  const texture = new THREE.CanvasTexture(galacticCanvas());
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  const haze = new THREE.Mesh(
    new THREE.SphereGeometry(240, 48, 24),
    new THREE.MeshBasicMaterial({
      map: texture,
      color: new THREE.Color(1.6, 1.6, 1.6),
      side: THREE.BackSide,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  haze.renderOrder = -20;
  group.add(haze);
  let seed = 48271;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const count = 10500;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const palette = [
    new THREE.Color("#d5e0f6"),
    new THREE.Color("#f4e5ca"),
    new THREE.Color("#a8c4ed"),
  ];
  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    // Extra faint stars trace the galactic plane, with scattered stars across the whole sky.
    const latitude =
      i < 6500
        ? Math.asin(random() * 2 - 1)
        : Math.max(
            -0.6,
            Math.min(
              0.6,
              Math.sqrt(-2 * Math.log(Math.max(0.0001, random()))) *
                Math.cos(random() * Math.PI * 2) *
                0.12,
            ),
          );
    const cos = Math.cos(latitude);
    positions.set(
      [
        Math.cos(angle) * cos * 238,
        Math.sin(latitude) * 238,
        Math.sin(angle) * cos * 238,
      ],
      i * 3,
    );
    const brightness = random();
    const color = palette[Math.floor(random() * palette.length)].clone();
    color.multiplyScalar(
      i < 6500
        ? 0.12 + Math.pow(brightness, 3) * 0.88
        : 0.06 + brightness * 0.16,
    );
    colors.set(color.toArray(), i * 3);
    sizes[i] =
      i < 6500 ? 0.7 + Math.pow(brightness, 6) * 2.2 : 0.65 + brightness * 0.45;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("starSize", new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { pixelRatio: { value: pixelRatio } },
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    vertexShader: /* glsl */ `
      attribute float starSize;
      uniform float pixelRatio;
      varying vec3 starColor;
      void main() {
        starColor = color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = starSize * pixelRatio;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 starColor;
      void main() {
        float distanceToCenter = length(gl_PointCoord - .5) * 2.0;
        if (distanceToCenter > 1.0) discard;
        float alpha = 1.0 - smoothstep(.1, 1.0, distanceToCenter);
        gl_FragColor = vec4(starColor, alpha);
      }
    `,
  });
  const stars = new THREE.Points(geometry, material);
  stars.frustumCulled = false;
  stars.renderOrder = -10;
  group.add(stars);
  return { group, texture };
}
