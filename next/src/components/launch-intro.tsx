"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  ArrowCounterClockwiseIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
} from "@phosphor-icons/react";
import { SpaceAudio } from "@/lib/space-audio";

export default function LaunchIntro() {
  const [open, setOpen] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [sound, setSound] = useState(false);
  const [error, setError] = useState("");
  const soundRef = useRef<SpaceAudio | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replay = useRef<HTMLButtonElement>(null);

  useEffect(
    () => () => {
      soundRef.current?.dispose();
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  useEffect(() => {
    const element = canvas.current;
    if (!open || !element) return;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0,
      height = 0,
      frame = 0,
      last = 0;
    const stars = Array.from({ length: 180 }, (_, i) => ({
      x: Math.sin(i * 127.1) * 0.5 + 0.5,
      y: Math.sin(i * 311.7) * 0.5 + 0.5,
      size: 0.4 + (i % 4) * 0.25,
    }));
    const resize = () => {
      width = element.clientWidth;
      height = element.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      element.width = width * dpr;
      element.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const start = performance.now();
    function draw(time: number) {
      frame = requestAnimationFrame(draw);
      if (document.hidden || time - last < 33) return;
      last = time;
      const t = reduced.matches ? 0 : (time - start) / 1000;
      ctx!.clearRect(0, 0, width, height);
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        ctx!.fillStyle = `rgba(211,222,240,${0.2 + 0.45 * (0.5 + 0.5 * Math.sin(t * 0.3 + i))})`;
        ctx!.fillRect(star.x * width, star.y * height, star.size, star.size);
      }
      const mobile = width < 700;
      const x = width * (mobile ? 0.5 : 0.67),
        y = height * (mobile ? 0.32 : 0.47);
      const radius = Math.min(width * (mobile ? 0.23 : 0.145), height * 0.23);
      ctx!.save();
      ctx!.translate(x, y);
      ctx!.rotate(-0.22);
      const haze = ctx!.createRadialGradient(
        0,
        0,
        radius * 0.65,
        0,
        0,
        radius * 2.7,
      );
      haze.addColorStop(0, "rgba(222,144,72,.16)");
      haze.addColorStop(0.35, "rgba(159,89,43,.08)");
      haze.addColorStop(1, "transparent");
      ctx!.fillStyle = haze;
      ctx!.fillRect(-radius * 3, -radius * 3, radius * 6, radius * 6);
      // Light bending above and below the silhouette.
      for (let i = 24; i > 0; i--) {
        ctx!.beginPath();
        ctx!.ellipse(
          0,
          0,
          radius + i * 0.45,
          radius + i * 0.45,
          0,
          0,
          Math.PI * 2,
        );
        ctx!.strokeStyle = `rgba(255,${170 + i * 2},${91 + i * 4},${0.015 + (25 - i) * 0.0015})`;
        ctx!.lineWidth = 2 + i * 0.3;
        ctx!.stroke();
      }
      ctx!.fillStyle = "#010102";
      ctx!.beginPath();
      ctx!.arc(0, 0, radius * 0.98, 0, Math.PI * 2);
      ctx!.fill();
      // Thin accretion ribbons, stretched across the event horizon.
      ctx!.globalCompositeOperation = "screen";
      for (let i = 0; i < 100; i++) {
        const r = radius * (1.08 + i * 0.014);
        ctx!.beginPath();
        ctx!.ellipse(0, 0, r, r * 0.18, 0, 0, Math.PI * 2);
        const pulse = 0.55 + 0.45 * Math.sin(i * 1.7 + t * 0.18);
        ctx!.strokeStyle = `rgba(255,${155 + i * 0.65},${72 + i * 0.7},${(0.05 + pulse * 0.18) * (1 - i / 115)})`;
        ctx!.lineWidth = 0.5 + pulse;
        ctx!.stroke();
      }
      ctx!.restore();
    }
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [open]);

  function finish() {
    if (timer.current) clearTimeout(timer.current);
    dialog.current?.close();
    setOpen(false);
    setLaunching(false);
    requestAnimationFrame(() => replay.current?.focus());
  }
  async function toggleSound(enabled: boolean) {
    try {
      soundRef.current ??= new SpaceAudio();
      await soundRef.current.setEnabled(enabled);
      setSound(enabled);
      setError("");
    } catch {
      setSound(false);
      setError("Audio couldn’t start. You can still explore.");
    }
  }
  function launch() {
    if (launching) return;
    let muted = false;
    try {
      muted = localStorage.getItem("orrery.muted") === "true";
    } catch {}
    if (!muted) void toggleSound(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    setLaunching(true);
    timer.current = setTimeout(finish, 2400);
  }
  function muteToggle() {
    const enabled = !sound;
    void toggleSound(enabled);
    try {
      localStorage.setItem("orrery.muted", String(!enabled));
    } catch {}
  }
  return (
    <>
      <div className="experience-controls" aria-label="Experience controls">
        <button
          ref={replay}
          onClick={() => setOpen(true)}
          aria-label="Replay intro"
          title="Replay intro"
        >
          <ArrowCounterClockwiseIcon />
        </button>
        <button
          onClick={muteToggle}
          aria-label={sound ? "Mute space music" : "Play space music"}
          aria-pressed={sound}
          title={sound ? "Mute space music" : "Play space music"}
        >
          {sound ? <SpeakerHighIcon /> : <SpeakerSlashIcon />}
          <span
            className={`sound-bars ${sound ? "is-playing" : ""}`}
            aria-hidden="true"
          >
            <i />
            <i />
            <i />
          </span>
        </button>
      </div>
      {error && (
        <p className="audio-error" role="status">
          {error}
        </p>
      )}
      {open && (
        <dialog
          ref={dialog}
          className={`launch-intro ${launching ? "is-launching" : ""}`}
          aria-labelledby="intro-title"
          onCancel={(event) => {
            event.preventDefault();
            finish();
          }}
        >
          <canvas ref={canvas} className="intro-cosmos" aria-hidden="true" />
          <div className="intro-topline">
            <span>
              orrery<span className="brand-period">.</span>
            </span>
            <span>A LITTLE CLOSER TO THE COSMOS</span>
          </div>
          <div className="intro-copy">
            <span className="intro-eyebrow">
              A SMALL PLACE IN SOMETHING INFINITE
            </span>
            <h2 id="intro-title">
              There’s a whole
              <br />
              universe <em>out there.</em>
            </h2>
            <p>
              And this little corner is ours.
              <br />
              Take a breath. Go have a look around.
            </p>
            <button
              className="intro-enter"
              onClick={launch}
              disabled={launching}
            >
              Enter the solar system <ArrowRightIcon />
            </button>
            <span className="intro-audio-note">
              Ambient sound on entry · headphones feel nice
            </span>
          </div>
          <div className="intro-bottom">
            <span>
              {launching ? "ON OUR WAY HOME" : "SOL / OUR COSMIC NEIGHBOURHOOD"}
            </span>
            <button onClick={finish}>
              Skip intro <ArrowRightIcon />
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
