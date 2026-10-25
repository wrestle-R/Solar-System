"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  ArrowCounterClockwiseIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
} from "@phosphor-icons/react";
import { SpaceAudio } from "@/lib/space-audio";
import { createIntroRenderer } from "@/lib/intro-renderer";

const FLIGHT_DURATION = 4200;

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
  const launchStarted = useRef<number | null>(null);

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
    let renderer: ReturnType<typeof createIntroRenderer>;
    try {
      renderer = createIntroRenderer(element);
    } catch {
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0,
      last = 0;
    const start = performance.now();
    const resize = () => {
      renderer.resize(element.clientWidth, element.clientHeight);
      if (reduced.matches) renderer.render(0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    const move = (event: PointerEvent) => {
      if (reduced.matches || event.pointerType === "touch") return;
      renderer.pointer(
        event.clientX / window.innerWidth - 0.5,
        0.5 - event.clientY / window.innerHeight,
      );
    };
    window.addEventListener("pointermove", move);
    function draw(now: number) {
      frame = requestAnimationFrame(draw);
      if (document.hidden || now - last < 33 || reduced.matches) return;
      last = now;
      const progress =
        launchStarted.current === null
          ? 0
          : Math.min(1, (now - launchStarted.current) / FLIGHT_DURATION);
      renderer.render((now - start) / 1000, progress);
    }
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      renderer.dispose();
    };
  }, [open]);

  function finish() {
    if (timer.current) clearTimeout(timer.current);
    dialog.current?.close();
    setOpen(false);
    setLaunching(false);
    launchStarted.current = null;
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
      muted =
        (localStorage.getItem("solace.muted") ??
          localStorage.getItem("orrery.muted")) === "true";
    } catch {}
    if (!muted) void toggleSound(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    launchStarted.current = performance.now();
    setLaunching(true);
    timer.current = setTimeout(finish, FLIGHT_DURATION);
  }
  function muteToggle() {
    const enabled = !sound;
    void toggleSound(enabled);
    try {
      localStorage.setItem("solace.muted", String(!enabled));
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
              solace<span className="brand-period">.</span>
            </span>
            <span>A LITTLE FURTHER FROM EVERYTHING</span>
          </div>
          <div className="intro-copy">
            <span className="intro-eyebrow">
              A QUIET PLACE IN AN INFINITE UNIVERSE
            </span>
            <h2 id="intro-title">
              A little further.
              <br />A little <em>quieter.</em>
            </h2>
            <p>
              Eight worlds. One star.
              <br />
              All the room you need to wander.
            </p>
            <button
              className="intro-enter"
              onClick={launch}
              disabled={launching}
            >
              Enter the solar system <ArrowRightIcon />
            </button>
            <span className="intro-audio-note">
              Sound on entry · best with headphones
            </span>
          </div>
          <div className="intro-bottom">
            <span>
              {launching
                ? "LEAVING THE NOISE BEHIND"
                : "SOL / OUR COSMIC NEIGHBOURHOOD"}
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
