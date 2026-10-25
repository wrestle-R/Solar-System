"use client";
import {
  GlobeHemisphereWestIcon,
  ArrowUpRightIcon,
} from "@phosphor-icons/react";
import { getBody, type ObjectId } from "@/lib/bodies";
import {
  objectDetails,
  direction,
  type ObserverLocation,
} from "@/lib/astronomy";

export default function ObjectDetails({
  selected,
  date,
  location,
  onLocation,
}: {
  selected: ObjectId;
  date: number;
  location: ObserverLocation | null;
  onLocation: () => void;
}) {
  const body = getBody(selected);
  const details = objectDetails(selected, new Date(date), location);
  return (
    <article aria-label={`${selected} details`}>
      <div className="object-title">
        <span className="eyebrow" style={{ color: body.color }}>
          {body.kind}
        </span>
        <h2>{selected}</h2>
      </div>
      <p className="object-description">{body.description}</p>
      <dl className="object-stats">
        <div>
          <dt>{selected === "Moon" ? "From Earth" : "From the Sun"}</dt>
          <dd>
            {selected === "Sun"
              ? "Our star"
              : selected === "Moon"
                ? `${Math.round(details.distance).toLocaleString("en-GB")} km`
                : `${details.distance.toFixed(3)} AU`}
          </dd>
        </div>
        <div>
          <dt>Diameter</dt>
          <dd>{body.diameter}</dd>
        </div>
        <div>
          <dt>{selected === "Moon" ? "Orbital period" : "One year"}</dt>
          <dd>
            {body.period
              ? body.period < 1000
                ? `${body.period.toFixed(1)} days`
                : `${(body.period / 365.256).toFixed(1)} Earth years`
              : "Our reference star"}
          </dd>
        </div>
        <div>
          <dt>Constellation</dt>
          <dd>{details.constellation}</dd>
        </div>
      </dl>
      {details.horizon ? (
        <div className="horizon-summary">
          <span
            className={`status-dot ${details.horizon.altitude > 0 ? "live" : ""}`}
          />
          <div>
            <strong>
              {details.horizon.altitude > 0
                ? "Above your horizon"
                : "Below your horizon"}
            </strong>
            <span>
              {Math.abs(details.horizon.altitude).toFixed(1)}°{" "}
              {details.horizon.altitude > 0 ? "up" : "down"} ·{" "}
              {direction(details.horizon.azimuth)}{" "}
              {details.horizon.azimuth.toFixed(0)}°
            </span>
          </div>
        </div>
      ) : (
        <button className="location-inline" onClick={onLocation}>
          <GlobeHemisphereWestIcon />
          {location
            ? "Change your viewpoint"
            : "Add your location for sky details"}
          <ArrowUpRightIcon />
        </button>
      )}
    </article>
  );
}
