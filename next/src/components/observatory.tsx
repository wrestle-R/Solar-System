"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowsClockwiseIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CircleIcon,
  CompassIcon,
  CubeIcon,
  ListBulletsIcon,
  MapPinIcon,
  MinusIcon,
  MoonIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  SunHorizonIcon,
  SunIcon,
  XIcon,
} from "@phosphor-icons/react";
import { BODIES, type ObjectId } from "@/lib/bodies";
import {
  clampDate,
  DAY,
  isLocation,
  lunarPhase,
  MAX_DATE,
  MIN_DATE,
  signs,
  skySummary,
  utcLabel,
  type ObserverLocation,
} from "@/lib/astronomy";
import TimeControls from "./time-controls";
import LaunchIntro from "./launch-intro";
import LocationDialog from "./location-dialog";
import ObjectDetails from "./object-details";
import SkyChart from "./sky-chart";

const OrbitalScene = dynamic(() => import("./orbital-scene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <span className="loading-orbit" />
      <span>Opening the solar system…</span>
    </div>
  ),
});
const STORAGE_KEY = "orrery.observer.v1";
type Panel = "objects" | "sky" | "settings" | "details" | null;

export default function Observatory({ initialTime }: { initialTime: number }) {
  const [date, setDate] = useState(initialTime);
  const [live, setLive] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selected, setSelected] = useState<ObjectId>("Earth");
  const [location, setLocation] = useState<ObserverLocation | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [topView, setTopView] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [focusKey, setFocusKey] = useState(0);
  const [focused, setFocused] = useState(false);
  const [storageNote, setStorageNote] = useState("");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setDate(Date.now());
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const value = JSON.parse(stored);
          if (isLocation(value)) setLocation(value);
        }
      } catch {
        /* Storage can be unavailable. The explorer still works. */
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!live && !playing) return;
    const interval = setInterval(
      () => {
        if (live) setDate(Date.now());
        else setDate((previous) => clampDate(previous + speed * DAY * 0.5));
      },
      live ? 1000 : 500,
    );
    return () => clearInterval(interval);
  }, [live, playing, speed]);

  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setPanel(null);
    }
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, []);

  function travel(time: number) {
    setDate(clampDate(time));
    setLive(false);
    setPlaying(false);
  }
  function now() {
    setDate(Date.now());
    setLive(true);
    setPlaying(false);
  }
  function saveLocation(value: ObserverLocation) {
    setLocation(value);
    setLocationOpen(false);
    setPanel("sky");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      setStorageNote("");
    } catch {
      setStorageNote(
        "This location will work for this visit. Your browser couldn’t save it.",
      );
    }
  }
  function select(id: ObjectId) {
    setSelected(id);
    setFocused(true);
    setPanel("details");
    setFocusKey((key) => key + 1);
    setZoom(1);
  }
  function reset() {
    setFocused(false);
    setResetKey((key) => key + 1);
    setZoom(1);
    setTopView(false);
    setPanel(null);
  }
  const minute = Math.floor(date / 60000) * 60000;
  const zodiac = useMemo(() => signs(new Date(minute)), [minute]);
  const moon = useMemo(() => lunarPhase(new Date(minute)), [minute]);
  const sky = useMemo(
    () => (location ? skySummary(new Date(minute), location) : null),
    [minute, location],
  );
  const travelling = playing && date > MIN_DATE && date < MAX_DATE;

  return (
    <main
      className={`universe ${focused ? "is-focused" : ""}`}
      aria-label="Interactive solar system"
    >
      <h1 className="sr-only">Explore the solar system in 3D</h1>
      <div className="universe-scene">
        <OrbitalScene
          date={date}
          selected={selected}
          onSelect={select}
          topView={topView}
          zoom={zoom}
          showOrbits={showOrbits}
          showLabels={showLabels}
          resetKey={resetKey}
          focusKey={focusKey}
        />
      </div>

      <header className="universe-header">
        <button
          className="brand"
          onClick={reset}
          aria-label="Orrery, reset solar system view"
        >
          <span className="brand-symbol">
            <i />
            <i />
            <b />
          </span>
          <span>
            orrery<span className="brand-period">.</span>
          </span>
        </button>
        <div className="celestial-mood" aria-label="Tropical zodiac signs">
          <div className="zodiac-item" title="Sun sign, tropical zodiac">
            <span className="zodiac-symbol">{zodiac.sun.symbol}</span>
            <span>
              <small>SUN</small>
              {zodiac.sun.name}
            </span>
          </div>
          <span className="mood-divider" />
          <div className="zodiac-item" title="Moon sign, tropical zodiac">
            <span className="zodiac-symbol">{zodiac.moon.symbol}</span>
            <span>
              <small>MOON</small>
              {zodiac.moon.name}
            </span>
          </div>
        </div>
      </header>

      {focused && (
        <button className="overview-return" onClick={reset}>
          <ArrowLeftIcon />
          Back to the solar system
        </button>
      )}
      <div className="view-caption" aria-hidden="true">
        <span>THE SOLAR SYSTEM</span>
        <span>8 planets · one home</span>
      </div>

      <div className="side-tools" aria-label="Explorer tools">
        <button
          className={`tool-button ${panel === "objects" ? "active" : ""}`}
          onClick={() => setPanel(panel === "objects" ? null : "objects")}
          aria-label="Browse celestial objects"
          aria-expanded={panel === "objects"}
          title="Celestial objects"
        >
          <ListBulletsIcon />
        </button>
        <button
          className={`tool-button ${panel === "sky" ? "active" : ""}`}
          onClick={() =>
            location
              ? setPanel(panel === "sky" ? null : "sky")
              : setLocationOpen(true)
          }
          aria-label="Your sky and location"
          title="Your sky"
        >
          <MapPinIcon />
        </button>
        <span className="tool-separator" />
        <button
          className={`tool-button ${topView ? "active" : ""}`}
          onClick={() => {
            setTopView(!topView);
            setFocused(false);
            setPanel(null);
          }}
          aria-label={
            topView ? "Switch to perspective view" : "Switch to top view"
          }
          title={topView ? "Perspective view" : "Top view"}
        >
          {topView ? <CubeIcon /> : <CircleIcon />}
        </button>
        <button
          className="tool-button"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          disabled={zoom >= 2.5}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <PlusIcon />
        </button>
        <button
          className="tool-button"
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
          disabled={zoom <= 0.6}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <MinusIcon />
        </button>
        <button
          className="tool-button"
          onClick={reset}
          aria-label="Reset camera"
          title="Reset view"
        >
          <CompassIcon />
        </button>
        <span className="tool-separator" />
        <button
          className={`tool-button ${panel === "settings" ? "active" : ""}`}
          onClick={() => setPanel(panel === "settings" ? null : "settings")}
          aria-label="Display settings"
          aria-expanded={panel === "settings"}
          title="Display settings"
        >
          <SlidersHorizontalIcon />
        </button>
      </div>

      {panel && (
        <section
          className={`floating-panel ${panel === "details" ? "detail-panel" : ""}`}
          aria-label={
            panel === "details" ? `${selected} information` : `${panel} panel`
          }
        >
          <button
            className="icon-button panel-close"
            onClick={() => setPanel(null)}
            aria-label="Close panel"
          >
            <XIcon />
          </button>
          {panel === "details" && (
            <>
              <ObjectDetails
                selected={selected}
                date={minute}
                location={location}
                onLocation={() => setLocationOpen(true)}
              />
              <div className="planet-navigation">
                <button
                  className="text-button"
                  onClick={() =>
                    select(
                      BODIES[
                        (BODIES.findIndex((body) => body.id === selected) +
                          BODIES.length -
                          1) %
                          BODIES.length
                      ].id,
                    )
                  }
                  aria-label="Previous planet"
                >
                  ←
                </button>
                <button className="focus-button" onClick={reset}>
                  <CompassIcon />
                  Solar system
                </button>
                <button
                  className="text-button"
                  onClick={() =>
                    select(
                      BODIES[
                        (BODIES.findIndex((body) => body.id === selected) + 1) %
                          BODIES.length
                      ].id,
                    )
                  }
                  aria-label="Next planet"
                >
                  →
                </button>
              </div>
              {selected === "Jupiter" && (
                <p className="panel-hint">
                  Io, Europa, Ganymede and Callisto are shown with enlarged
                  separation.
                </p>
              )}
            </>
          )}
          {panel === "objects" && (
            <>
              <span className="eyebrow">A FEW FAMILIAR WORLDS</span>
              <h2>The neighbourhood.</h2>
              <div className="object-list">
                {BODIES.map((body) => (
                  <button key={body.id} onClick={() => select(body.id)}>
                    <span
                      className="planet-dot"
                      style={{
                        backgroundImage: `url(/textures/${body.texture})`,
                      }}
                    />
                    <span>
                      {body.id}
                      <small>{body.kind}</small>
                    </span>
                    <ArrowUpRightIcon />
                  </button>
                ))}
              </div>
            </>
          )}
          {panel === "settings" && (
            <>
              <span className="eyebrow">MAKE A LITTLE SPACE</span>
              <h2>Your view.</h2>
              <label className="setting-row">
                Orbit paths
                <input
                  type="checkbox"
                  checked={showOrbits}
                  onChange={(event) => setShowOrbits(event.target.checked)}
                />
              </label>
              <label className="setting-row">
                Planet labels
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(event) => setShowLabels(event.target.checked)}
                />
              </label>
              <button className="setting-row" onClick={reset}>
                Reset camera
                <ArrowsClockwiseIcon />
              </button>
              <a
                className="setting-row"
                href="https://github.com/wrestle-R/Solar-System"
                target="_blank"
                rel="noreferrer"
              >
                Source code
                <ArrowUpRightIcon />
              </a>
            </>
          )}
          {panel === "sky" && location && sky && (
            <>
              <span className="eyebrow">A VIEW FROM YOUR CORNER OF EARTH</span>
              <h2>Your sky.</h2>
              <button
                className="text-button sky-location"
                onClick={() => setLocationOpen(true)}
              >
                <MapPinIcon />
                {location.name}
                <ArrowUpRightIcon />
              </button>
              <SkyChart
                date={minute}
                location={location}
                sky={sky}
                onSelect={select}
              />
              <div className="sky-panel-status">
                <span className="status-dot live" />
                {sky.dark
                  ? "Night sky"
                  : sky.sun.altitude > 0
                    ? "Daylight sky"
                    : "Twilight"}
                <span>{utcLabel(new Date(date))}</span>
              </div>
              <p className="panel-hint">
                North ↑ · East ← · Horizon at the rim
              </p>
              <div className="sky-moon">
                <MoonIcon />
                <span>{moon.name}</span>
                <strong>{(moon.fraction * 100).toFixed(1)}% lit</strong>
              </div>
              <div className="sun-times">
                <div>
                  <SunHorizonIcon />
                  Sunrise
                  <strong>
                    {sky.sunrise ? utcLabel(sky.sunrise) : "None this UTC day"}
                  </strong>
                </div>
                <div>
                  <SunIcon />
                  Sunset
                  <strong>
                    {sky.sunset ? utcLabel(sky.sunset) : "None this UTC day"}
                  </strong>
                </div>
              </div>
              {storageNote && (
                <p className="panel-hint" role="status">
                  {storageNote}
                </p>
              )}
            </>
          )}
        </section>
      )}

      <div className="bottom-interface">
        <div className="bottom-caption">
          <span>
            {travelling
              ? "TRAVELLING THROUGH TIME"
              : live
                ? "THE UNIVERSE, RIGHT NOW"
                : "A MOMENT IN TIME"}
          </span>
          <span>{utcLabel(new Date(date))}</span>
        </div>
        <TimeControls
          date={date}
          live={live}
          playing={travelling}
          speed={speed}
          setDate={travel}
          onLive={now}
          onPlay={() => {
            setLive(false);
            setPlaying(!playing);
          }}
          onSpeed={setSpeed}
        />
      </div>
      <div className="scene-footnote">
        <span>Drag to explore · scroll to zoom · click a world</span>
      </div>
      <a
        className="made-by"
        href="https://github.com/wrestle-R"
        target="_blank"
        rel="noreferrer"
      >
        by Russel
        <ArrowUpRightIcon />
      </a>
      <LaunchIntro />
      {locationOpen && (
        <LocationDialog
          current={location}
          onClose={() => setLocationOpen(false)}
          onSave={saveLocation}
        />
      )}
    </main>
  );
}
