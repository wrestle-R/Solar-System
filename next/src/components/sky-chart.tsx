"use client";
import { useMemo } from "react";
import {
  starPositions,
  type ObserverLocation,
  type skySummary,
} from "@/lib/astronomy";
import type { ObjectId } from "@/lib/bodies";
type Props = {
  date: number;
  location: ObserverLocation;
  sky: ReturnType<typeof skySummary>;
  onSelect: (id: ObjectId) => void;
};
function project(altitude: number, azimuth: number) {
  const r = ((90 - altitude) / 90) * 150,
    a = (azimuth * Math.PI) / 180;
  return { x: 200 - Math.sin(a) * r, y: 183 - Math.cos(a) * r };
}
export default function SkyChart({ date, location, sky, onSelect }: Props) {
  const stars = useMemo(
    () => starPositions(new Date(date), location).filter((s) => s.altitude > 0),
    [date, location],
  );
  return (
    <svg
      viewBox="0 0 400 370"
      className="sky-chart"
      role="img"
      aria-label={`Sky above ${location.name}, north up, east left. Objects below the horizon are excluded.`}
    >
      <defs>
        <radialGradient id="sky-fill">
          <stop offset="0" stopColor="#172124" />
          <stop offset="1" stopColor="#0b1116" />
        </radialGradient>
      </defs>
      <circle
        cx="200"
        cy="183"
        r="150"
        fill="url(#sky-fill)"
        stroke="#44504c"
      />
      {[50, 100].map((r) => (
        <circle
          key={r}
          cx="200"
          cy="183"
          r={r}
          fill="none"
          stroke="#27302e"
          strokeDasharray="3 6"
        />
      ))}
      <path d="M200 33V333M50 183H350" stroke="#27302e" />
      <text x="200" y="20" textAnchor="middle" className="compass">
        N
      </text>
      <text x="200" y="355" textAnchor="middle" className="compass">
        S
      </text>
      <text x="30" y="187" textAnchor="middle" className="compass">
        E
      </text>
      <text x="369" y="187" textAnchor="middle" className="compass">
        W
      </text>
      <text x="205" y="88" className="chart-degree">
        30°
      </text>
      <text x="205" y="139" className="chart-degree">
        60°
      </text>
      {stars.map((s) => {
        const p = project(s.altitude, s.azimuth);
        return (
          <g key={s.name}>
            <circle
              cx={p.x}
              cy={p.y}
              r={Math.max(1, 2.7 - s.mag * 0.5)}
              fill="#cad8d9"
            />
            <text x={p.x + 6} y={p.y - 5} className="star-name">
              {s.name}
            </text>
            <title>
              {s.name}: {s.altitude.toFixed(1)}° above horizon
            </title>
          </g>
        );
      })}
      {sky.objects
        .filter((b) => b.altitude > 0)
        .map((b) => {
          const p = project(b.altitude, b.azimuth);
          return (
            <g
              key={b.id}
              className="sky-object"
              onClick={() => onSelect(b.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(b.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${b.id}, altitude ${b.altitude.toFixed(1)} degrees`}
            >
              <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
              <circle
                cx={p.x}
                cy={p.y}
                r={b.id === "Sun" ? 6 : b.id === "Moon" ? 5 : 3.5}
                fill={b.color}
              />
              <text
                x={p.x + 8}
                y={p.y + 13}
                fill={b.color}
                className="planet-sky-name"
              >
                {b.id}
              </text>
              <title>
                {b.id}: altitude {b.altitude.toFixed(1)}°, azimuth{" "}
                {b.azimuth.toFixed(1)}°
              </title>
            </g>
          );
        })}
    </svg>
  );
}
