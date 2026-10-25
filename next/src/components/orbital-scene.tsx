"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  sunMaterial,
  addEarthLayers,
  atmosphere,
  ATMOSPHERES,
  saturnRings,
  corona,
} from "@/lib/planet-materials";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  JupiterMoons,
  Rotation_EQJ_ECL,
  RotateVector,
  Vector,
} from "astronomy-engine";
import { BODIES, PLANETS, type ObjectId } from "@/lib/bodies";
import { DAY, scenePosition } from "@/lib/astronomy";

type Props = {
  date: number;
  selected: ObjectId;
  onSelect: (id: ObjectId) => void;
  topView: boolean;
  zoom: number;
  showOrbits: boolean;
  showLabels: boolean;
  resetKey: number;
  focusKey: number;
};
export default function OrbitalScene(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    latest.current = props;
  }, [props]);
  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D solar system. Drag to orbit and pinch or scroll to zoom. Select objects using the planet list.",
    );
    renderer.domElement.setAttribute("role", "img");
    host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.02, 500);
    camera.position.set(8, 25, 43);
    let portrait =
      host.clientWidth < 600 && host.clientHeight > host.clientWidth;
    camera.up.set(portrait ? 1 : 0, portrait ? 0 : 1, 0);
    function createControls() {
      const nextControls = new OrbitControls(camera, renderer.domElement);
      nextControls.enableDamping = true;
      nextControls.dampingFactor = 0.09;
      nextControls.enablePan = false;
      nextControls.minDistance = 2.3;
      nextControls.maxDistance = 210;
      nextControls.maxPolarAngle = Math.PI * 0.49;
      nextControls.minPolarAngle = 0.02;
      nextControls.rotateSpeed = 0.5;
      nextControls.zoomSpeed = 0.6;
      return nextControls;
    }
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let controls = createControls();
    controls.enableDamping = !reducedMotion;
    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 4,
    });
    const composer = new EffectComposer(renderer, renderTarget);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.19, 0.2, 1.6);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloom);
    const output = new OutputPass();
    composer.addPass(output);
    scene.add(new THREE.AmbientLight(0x7185a3, 0.07));
    scene.add(new THREE.HemisphereLight(0xa4c7f0, 0x080705, 0.13));
    const sunlight = new THREE.PointLight(0xfff6e9, 3.4, 0, 0);
    scene.add(sunlight);
    const geometry = new THREE.SphereGeometry(1, 64, 48);
    const loader = new THREE.TextureLoader();
    const meshes = new Map<ObjectId, THREE.Mesh>();
    const textures: THREE.Texture[] = [];
    const load = (file: string, color = true) => {
      const texture = loader.load("/textures/" + file);
      if (color) texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(
        8,
        renderer.capabilities.getMaxAnisotropy(),
      );
      textures.push(texture);
      return texture;
    };
    for (const body of BODIES) {
      const texture = load(body.texture);
      const material =
        body.id === "Sun"
          ? sunMaterial(texture)
          : new THREE.MeshStandardMaterial({
              map: texture,
              roughness: body.id === "Earth" ? 0.6 : 0.94,
              metalness: 0,
            });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.setScalar(body.radius);
      if (body.id === "Jupiter") mesh.scale.y *= 0.935;
      if (body.id === "Saturn") mesh.scale.y *= 0.902;
      mesh.rotation.z =
        body.id === "Earth" ? 0.409 : body.id === "Uranus" ? 1.71 : 0.04;
      if (body.id === "Earth") addEarthLayers(mesh, load);
      const air = ATMOSPHERES[body.id];
      if (air) mesh.add(atmosphere(...air));
      scene.add(mesh);
      meshes.set(body.id, mesh);
    }
    const saturnRing = saturnRings(load("2k_saturn_ring_alpha.png"));
    saturnRing.scale.setScalar(1.235);
    scene.add(saturnRing);
    const glow = corona();
    scene.add(glow.sprite);
    textures.push(glow.texture);
    const trails = new THREE.Group();
    scene.add(trails);
    const reference = new Date(latest.current.date);
    for (const body of PLANETS) {
      const points = Array.from(
        { length: 257 },
        (_, i) =>
          new THREE.Vector3(
            ...scenePosition(
              body.id,
              new Date(reference.getTime() + (body.period * DAY * i) / 256),
            ),
          ),
      );
      const trail = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: body.id === "Earth" ? 0x467c91 : 0x75828c,
          transparent: true,
          opacity: body.id === "Earth" ? 0.24 : 0.105,
        }),
      );
      trails.add(trail);
    }
    // An illustrative asteroid belt, not positions of individually tracked asteroids.
    let seed = 461;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const beltPoints = [];
    for (let i = 0; i < 1250; i++) {
      const a = rand() * Math.PI * 2,
        r = 10 + rand() * 0.85;
      beltPoints.push(Math.cos(a) * r, (rand() - 0.5) * 0.13, Math.sin(a) * r);
    }
    const belt = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(beltPoints, 3),
      ),
      new THREE.PointsMaterial({
        color: 0x9b8872,
        size: 0.025,
        transparent: true,
        opacity: 0.45,
      }),
    );
    scene.add(belt);
    const starPoints = [];
    for (let i = 0; i < 650; i++) {
      const a = rand() * Math.PI * 2,
        z = rand() * 2 - 1,
        r = 90;
      starPoints.push(
        Math.sqrt(1 - z * z) * Math.cos(a) * r,
        z * r,
        Math.sqrt(1 - z * z) * Math.sin(a) * r,
      );
    }
    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(starPoints, 3),
      ),
      new THREE.PointsMaterial({
        color: 0xa8b4c4,
        size: 0.035,
        transparent: true,
        opacity: 0.42,
      }),
    );
    scene.add(stars);
    const moonMeshes = Array.from({ length: 4 }, () => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xc6bfae }),
      );
      scene.add(m);
      return m;
    });
    let lastDate = -1,
      lastTop = false,
      lastZoom = 1,
      lastReset = 0,
      lastFocus = 0;
    let flight: { position: THREE.Vector3; target: THREE.Vector3 } | null =
      null;
    let following: ObjectId | null = null;
    const projected = new THREE.Vector3();
    const labels = Array.from(
      host.querySelectorAll<HTMLButtonElement>("[data-object]"),
    );
    const satelliteLabels = Array.from(
      host.querySelectorAll<HTMLElement>("[data-satellite]"),
    );
    let active = true,
      frame = 0,
      lastFrame = 0,
      inView = true,
      fitScale = 1;
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setSize(width, height);
      composer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      const nextPortrait = width < 600 && height > width;
      if (nextPortrait !== portrait && !following) {
        portrait = nextPortrait;
        camera.up.set(portrait ? 1 : 0, portrait ? 0 : 1, 0);
        controls.dispose();
        controls = createControls();
        controls.enableDamping = !reducedMotion;
        camera.position.set(8, 25, 43).multiplyScalar(fitScale);
        flight = null;
        following = null;
        lastZoom = 1;
      }
      const nextFit = Math.max(
        1.04,
        (nextPortrait ? 0.81 : 1.48) / camera.aspect,
      );
      portrait = nextPortrait;
      if (!following) camera.position.multiplyScalar(nextFit / fitScale);
      else
        camera.setViewOffset(
          width,
          height,
          portrait ? 0 : -width * 0.11,
          portrait ? height * 0.22 : 0,
          width,
          height,
        );
      fitScale = nextFit;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
    });
    visibility.observe(host);
    const animate = (time: number) => {
      if (!active) return;
      frame = requestAnimationFrame(animate);
      if (document.hidden || !inView || time - lastFrame < 33) return;
      lastFrame = time;
      const p = latest.current;
      if (p.topView !== lastTop || p.resetKey !== lastReset) {
        camera.clearViewOffset();
        camera.up.set(portrait ? 1 : 0, portrait ? 0 : 1, 0);
        controls.dispose();
        controls = createControls();
        controls.enableDamping = !reducedMotion;
        camera.position
          .set(p.topView ? 0 : 8, p.topView ? 52 : 25, p.topView ? 0.01 : 43)
          .multiplyScalar(fitScale * (portrait && p.topView ? 1.85 : 1));
        controls.target.set(0, 0, 0);
        lastTop = p.topView;
        lastReset = p.resetKey;
        lastZoom = 1;
        flight = null;
        following = null;
      }
      if (p.zoom !== lastZoom) {
        camera.position
          .sub(controls.target)
          .multiplyScalar(lastZoom / p.zoom)
          .add(controls.target);
        lastZoom = p.zoom;
      }
      if (p.date !== lastDate) {
        const date = new Date(p.date);
        for (const body of BODIES) {
          const mesh = meshes.get(body.id)!;
          mesh.position.set(...scenePosition(body.id, date));
          mesh.rotation.y = (p.date / DAY) * Math.PI * 0.12;
        }
        saturnRing.position.copy(meshes.get("Saturn")!.position);
        const jovian = JupiterMoons(date),
          jup = meshes.get("Jupiter")!.position;
        [jovian.io, jovian.europa, jovian.ganymede, jovian.callisto].forEach(
          (v, i) => {
            const e = RotateVector(
              Rotation_EQJ_ECL(),
              new Vector(v.x, v.y, v.z, v.t),
            );
            moonMeshes[i].position.set(
              jup.x + e.x * 650,
              jup.y + e.z * 650,
              jup.z - e.y * 650,
            );
          },
        );
        lastDate = p.date;
      }
      if (p.focusKey !== lastFocus) {
        const target = meshes.get(p.selected)!.position.clone(),
          body = BODIES.find((b) => b.id === p.selected)!;
        camera.up.set(0, 1, 0);
        controls.dispose();
        controls = createControls();
        controls.enableDamping = !reducedMotion;
        controls.minDistance = Math.max(0.25, body.radius * 1.8);
        const distance =
          p.selected === "Saturn"
            ? portrait
              ? 14
              : 8.2
            : p.selected === "Jupiter"
              ? portrait
                ? 15
                : 10.5
              : body.radius * (portrait ? 10 : 5.6);
        const w = host.clientWidth,
          h = host.clientHeight;
        camera.setViewOffset(
          w,
          h,
          portrait ? 0 : -w * 0.11,
          portrait ? h * 0.22 : 0,
          w,
          h,
        );
        const sunward = target.clone().negate().setY(0).normalize();
        if (p.selected === "Sun") sunward.set(0.5, 0, 1).normalize();
        const tangent = new THREE.Vector3().crossVectors(
          sunward,
          new THREE.Vector3(0, 1, 0),
        );
        const approach = sunward
          .multiplyScalar(0.8)
          .addScaledVector(tangent, 0.6)
          .setY(0.25)
          .normalize();
        flight = {
          target,
          position: target.clone().addScaledVector(approach, distance),
        };
        lastFocus = p.focusKey;
        following = p.selected;
      }
      if (flight) {
        camera.position.lerp(flight.position, reducedMotion ? 1 : 0.09);
        controls.target.lerp(flight.target, reducedMotion ? 1 : 0.09);
        if (camera.position.distanceTo(flight.position) < 0.015) flight = null;
      } else if (following) {
        const delta = meshes
          .get(following)!
          .position.clone()
          .sub(controls.target);
        camera.position.add(delta);
        controls.target.add(delta);
      }
      for (const [id, mesh] of meshes)
        mesh.visible =
          !following ||
          id === following ||
          (following === "Earth" && id === "Moon");
      saturnRing.visible = !following || following === "Saturn";
      glow.sprite.visible = !following || following === "Sun";
      trails.visible = p.showOrbits && !following;
      belt.visible = p.showOrbits && !following;
      moonMeshes.forEach((m) => {
        m.visible = p.selected === "Jupiter";
      });
      controls.update();
      composer.render();
      const { clientWidth: w, clientHeight: h } = host;
      for (const [index, label] of satelliteLabels.entries()) {
        projected.copy(moonMeshes[index].position).project(camera);
        const x = (projected.x * 0.5 + 0.5) * w;
        const y = (-projected.y * 0.5 + 0.5) * h;
        label.style.transform = `translate(${x + 7}px,${y + 7}px)`;
        label.style.visibility =
          following === "Jupiter" &&
          p.showLabels &&
          projected.z < 1 &&
          x > 0 &&
          x < w - 65 &&
          y > 0 &&
          y < h - 60
            ? "visible"
            : "hidden";
      }
      const occupied: { x: number; y: number }[] = [];
      for (const label of labels) {
        const id = label.dataset.object as ObjectId;
        projected.copy(meshes.get(id)!.position).project(camera);
        const x = (projected.x * 0.5 + 0.5) * w,
          y = (-projected.y * 0.5 + 0.5) * h;
        label.style.transform = `translate(${x}px,${y}px)`;
        const bodyPosition = meshes.get(id)!.position;
        const labelDirection = bodyPosition
          .clone()
          .sub(camera.position)
          .normalize();
        const bodyDistance = camera.position.distanceTo(bodyPosition);
        const occluded = BODIES.some((other) => {
          if (other.id === id || !meshes.get(other.id)!.visible) return false;
          const relative = meshes
            .get(other.id)!
            .position.clone()
            .sub(camera.position);
          const along = relative.dot(labelDirection);
          return (
            along > 0 &&
            along < bodyDistance &&
            relative.lengthSq() - along * along <
              other.radius * other.radius * 0.95
          );
        });
        const visible =
          !occluded &&
          p.showLabels &&
          (!following || (following === "Earth" && id === "Moon")) &&
          projected.z < 1 &&
          x > 0 &&
          x < w &&
          y > 0 &&
          y < h;
        label.style.visibility = visible ? "visible" : "hidden";
        if (visible) {
          const bodyRadius = BODIES.find((body) => body.id === id)!.radius;
          const screenRadius = Math.max(
            9,
            ((bodyRadius /
              camera.position.distanceTo(meshes.get(id)!.position)) *
              h) /
              (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))),
          );
          const gap = screenRadius + 8;
          const offsets =
            id === "Moon"
              ? [
                  [8, -23],
                  [-48, -24],
                  [10, 15],
                  [-48, 15],
                  [10, -38],
                ]
              : [
                  [gap, 3],
                  [gap, -19],
                  [-gap - 62, 3],
                  [-gap - 62, -19],
                  [6, gap + 3],
                  [-61, -gap - 17],
                  [8, -gap - 17],
                ];
          const offset =
            offsets.find(
              ([dx, dy]) =>
                x + dx > 5 &&
                x + dx + 52 < w - 5 &&
                y + dy > 8 &&
                y + dy + 15 < h - 15 &&
                !occupied.some(
                  (box) =>
                    Math.abs(box.x - (x + dx)) < 55 &&
                    Math.abs(box.y - (y + dy)) < 17,
                ),
            ) ?? offsets[offsets.length - 1];
          const name = label.querySelector<HTMLElement>(".object-name")!;
          name.style.left = offset[0] + "px";
          name.style.top = offset[1] + "px";
          name.style.paddingTop = "0";
          occupied.push({ x: x + offset[0], y: y + offset[1] });
        }
      }
    };
    const raycaster = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let pointerDown: { x: number; y: number } | null = null;
    const down = (event: PointerEvent) => {
      pointerDown = { x: event.clientX, y: event.clientY };
    };
    const up = (event: PointerEvent) => {
      if (
        !pointerDown ||
        Math.hypot(
          event.clientX - pointerDown.x,
          event.clientY - pointerDown.y,
        ) > 5
      ) {
        pointerDown = null;
        return;
      }
      pointerDown = null;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...meshes.values()])[0];
      if (hit) {
        for (const [id, mesh] of meshes)
          if (mesh === hit.object) {
            latest.current.onSelect(id);
            break;
          }
      }
    };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointerup", up);
    frame = requestAnimationFrame(animate);
    const lost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointerup", up);
      controls.dispose();
      scene.traverse((obj) => {
        if (
          obj instanceof THREE.Mesh ||
          obj instanceof THREE.Points ||
          obj instanceof THREE.Line ||
          obj instanceof THREE.Sprite
        ) {
          if ("geometry" in obj) obj.geometry.dispose();
          const materials = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          materials.forEach((m: THREE.Material) => m.dispose());
        }
      });
      textures.forEach((t) => t.dispose());
      bloom.dispose();
      output.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div className="orbital-canvas" ref={container}>
      {failed && (
        <div className="scene-fallback">
          <span className="eyebrow">YOUR BROWSER’S TAKING A BREATHER</span>
          <h3>The cosmos is still here.</h3>
          <p>
            3D rendering is unavailable. Every planet’s calculated data, the
            time controls, and your sky chart still work from the controls.
          </p>
        </div>
      )}
      {!failed &&
        ["Io", "Europa", "Ganymede", "Callisto"].map((name, index) => (
          <span key={name} data-satellite={index} className="satellite-label">
            {name}
          </span>
        ))}
      {!failed &&
        BODIES.map((b) => (
          <button
            key={b.id}
            className={`object-label ${props.selected === b.id ? "selected" : ""}`}
            data-object={b.id}
            onClick={() => props.onSelect(b.id)}
            tabIndex={-1}
            aria-label={`Explore ${b.id}`}
          >
            <span className="object-target" />
            <span className="object-name">
              {b.id}
              <span className="object-hint">{b.kind}</span>
            </span>
          </button>
        ))}
    </div>
  );
}
