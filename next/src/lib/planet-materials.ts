import * as THREE from "three";
import type { ObjectId } from "./bodies";

const sphereVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export function sunMaterial(texture: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: { surface: { value: texture } },
    vertexShader: sphereVertex,
    fragmentShader: /* glsl */ `
      uniform sampler2D surface;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 sampleColor = texture2D(surface, vUv).rgb;
        float granulation = dot(sampleColor, vec3(.65, .25, .1));
        vec3 color = mix(vec3(1.0,.29,.045), vec3(1.0,.9,.62), pow(granulation, .52));
        float limb = pow(max(dot(normalize(cameraPosition-vWorldPosition), vWorldNormal), 0.0), .16);
        gl_FragColor = vec4(color * (1.3 + .8 * limb), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

export function atmosphere(color: number, strength: number, radius = 1.025) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tint: { value: new THREE.Color(color) },
      strength: { value: strength },
    },
    vertexShader: sphereVertex,
    fragmentShader: /* glsl */ `
      uniform vec3 tint;
      uniform float strength;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 normal = normalize(vWorldNormal);
        vec3 view = normalize(cameraPosition-vWorldPosition);
        float rim = pow(1.0-max(dot(normal,view),0.0), 4.0);
        float sun = smoothstep(-.3,.9,dot(normal,normalize(-vWorldPosition)));
        gl_FragColor = vec4(tint * 1.3, rim * strength * (.22 + sun * .78));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 40), material);
}

export function addEarthLayers(
  earth: THREE.Mesh,
  load: (file: string, color?: boolean) => THREE.Texture,
) {
  const night = new THREE.ShaderMaterial({
    uniforms: { cities: { value: load("2k_earth_nightmap.jpg") } },
    vertexShader: sphereVertex,
    fragmentShader: /* glsl */ `
      uniform sampler2D cities;
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        float sun = dot(normalize(vWorldNormal),normalize(-vWorldPosition));
        float darkness = 1.0-smoothstep(-.18,.12,sun);
        vec3 city = texture2D(cities,vUv).rgb;
        gl_FragColor = vec4(city * darkness * 1.5, darkness);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(1.002, 64, 40), night));
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(1.009, 64, 40),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      alphaMap: load("2k_earth_clouds.jpg", false),
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      roughness: 1,
    }),
  );
  clouds.rotation.y = 0.1;
  earth.add(clouds);
  earth.add(atmosphere(0x4d9be6, 0.5, 1.018));
}

export function saturnRings(texture: THREE.Texture) {
  const inner = 1.08,
    outer = 1.96;
  const geometry = new THREE.RingGeometry(inner, outer, 160, 1);
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) {
    const r = Math.hypot(positions.getX(i), positions.getY(i));
    uv.setXY(i, (r - inner) / (outer - inner), 0.5);
  }
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xd6c9af,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.02,
      roughness: 1,
      depthWrite: false,
    }),
  );
  mesh.rotation.set(-Math.PI / 2 + 0.47, -0.2, 0.12);
  return mesh;
}

export function corona() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255,220,140,.6)");
  gradient.addColorStop(0.17, "rgba(255,180,90,.3)");
  gradient.addColorStop(0.36, "rgba(240,126,50,.08)");
  gradient.addColorStop(0.7, "rgba(220,90,20,.012)");
  gradient.addColorStop(1, "rgba(220,90,20,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffcd91,
    }),
  );
  sprite.scale.setScalar(10);
  sprite.material.opacity = 0.38;
  return { sprite, texture };
}

export const ATMOSPHERES: Partial<Record<ObjectId, [number, number]>> = {
  Venus: [0xffd6a0, 0.28],
  Uranus: [0x7cd4e0, 0.4],
  Neptune: [0x4374e4, 0.45],
};
