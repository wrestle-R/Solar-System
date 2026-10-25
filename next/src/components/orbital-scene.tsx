"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
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
        powerPreference: "low-power",
      });
    } catch {
      queueMicrotask(() => setFailed(true));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setClearColor(0x080b0e, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D solar system. Drag to orbit and pinch or scroll to zoom. Select objects using the planet list.",
    );
    renderer.domElement.setAttribute("role", "img");
    host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 250);
    camera.position.set(5, 30, 38);
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
    scene.add(new THREE.AmbientLight(0xa7bfd8, 1.25));
    const sunlight = new THREE.PointLight(0xffdfae, 50, 0, 1);
    scene.add(sunlight);
    const geometry = new THREE.SphereGeometry(1, 40, 28);
    const loader = new THREE.TextureLoader();
    const meshes = new Map<ObjectId, THREE.Mesh>();
    const textures: THREE.Texture[] = [];
    for (const body of BODIES) {
      const texture = loader.load("/textures/" + body.texture);
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.push(texture);
      const material =
        body.id === "Sun"
          ? new THREE.MeshBasicMaterial({ map: texture, color: 0xffca89 })
          : new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 1,
              metalness: 0,
            });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.setScalar(body.radius);
      mesh.rotation.z = body.id === "Earth" ? 0.409 : 0.06;
      scene.add(mesh);
      meshes.set(body.id, mesh);
    }
    const ringGeo = new THREE.RingGeometry(0.84, 1.34, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xbaa681,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      roughness: 1,
    });
    const saturnRing = new THREE.Mesh(ringGeo, ringMat);
    saturnRing.rotation.x = -Math.PI / 2 + 0.46;
    scene.add(saturnRing);
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const ctx = glowCanvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
    gradient.addColorStop(0, "rgba(255,216,158,1)");
    gradient.addColorStop(0.18, "rgba(255,159,69,.4)");
    gradient.addColorStop(0.48, "rgba(231,121,45,.09)");
    gradient.addColorStop(1, "rgba(220,120,45,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    textures.push(glowTex);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.scale.set(10, 10, 1);
    scene.add(glow);
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
          color: body.id === "Earth" ? 0x4b716e : 0x606369,
          transparent: true,
          opacity: body.id === "Earth" ? 0.55 : 0.22,
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
        size: 0.055,
        transparent: true,
        opacity: 0.6,
      }),
    );
    scene.add(stars);
    const selection = new THREE.Mesh(
      new THREE.RingGeometry(0.48, 0.5, 64),
      new THREE.MeshBasicMaterial({
        color: 0xdba579,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthTest: false,
      }),
    );
    scene.add(selection);
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
    let active = true,
      frame = 0,
      lastFrame = 0,
      inView = true,
      fitScale = 1;
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      const nextPortrait = width < 600 && height > width;
      if (nextPortrait !== portrait) {
        portrait = nextPortrait;
        camera.up.set(portrait ? 1 : 0, portrait ? 0 : 1, 0);
        controls.dispose();
        controls = createControls();
        controls.enableDamping = !reducedMotion;
        camera.position.set(5, 30, 38).multiplyScalar(fitScale);
        flight = null;
        following = null;
        lastZoom = 1;
      }
      const nextFit = Math.max(1.12, (portrait ? 0.79 : 1.52) / camera.aspect);
      camera.position.multiplyScalar(nextFit / fitScale);
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
        camera.position
          .set(p.topView ? 0 : 5, p.topView ? 49 : 30, p.topView ? 0.01 : 38)
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
              jup.x + e.x * 500,
              jup.y + e.z * 500,
              jup.z - e.y * 500,
            );
          },
        );
        lastDate = p.date;
      }
      if (p.focusKey !== lastFocus) {
        const target = meshes.get(p.selected)!.position.clone(),
          body = BODIES.find((b) => b.id === p.selected)!;
        const distance =
          p.selected === "Sun"
            ? 10
            : p.selected === "Saturn"
              ? 7
              : Math.max(3.5, body.radius * 8);
        flight = {
          target,
          position: target
            .clone()
            .add(new THREE.Vector3(0, distance * 0.3, distance)),
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
      trails.visible = p.showOrbits;
      belt.visible = p.showOrbits;
      const target = meshes.get(p.selected)!;
      selection.position.copy(target.position);
      selection.quaternion.copy(camera.quaternion);
      selection.scale.setScalar(
        p.selected === "Sun"
          ? 3
          : p.selected === "Jupiter"
            ? 1.9
            : p.selected === "Saturn"
              ? 2
              : 1,
      );
      moonMeshes.forEach((m) => {
        m.visible = p.selected === "Jupiter";
      });
      controls.update();
      renderer.render(scene, camera);
      const { clientWidth: w, clientHeight: h } = host;
      const occupied: { x: number; y: number }[] = [];
      for (const label of labels) {
        const id = label.dataset.object as ObjectId;
        projected.copy(meshes.get(id)!.position).project(camera);
        const x = (projected.x * 0.5 + 0.5) * w,
          y = (-projected.y * 0.5 + 0.5) * h;
        label.style.transform = `translate(${x}px,${y}px)`;
        const visible =
          p.showLabels && projected.z < 1 && x > 0 && x < w && y > 0 && y < h;
        label.style.visibility = visible ? "visible" : "hidden";
        if (visible) {
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
                  [8, 13],
                  [8, -22],
                  [-55, 13],
                  [-55, -22],
                  [10, 28],
                  [-55, -37],
                  [10, -37],
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
          obj instanceof THREE.Line
        ) {
          obj.geometry.dispose();
          const materials = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          materials.forEach((m: THREE.Material) => m.dispose());
        }
      });
      textures.forEach((t) => t.dispose());
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
