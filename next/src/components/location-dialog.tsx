"use client";
import { useEffect, useRef, useState } from "react";
import {
  CrosshairIcon,
  MapPinIcon,
  XIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import { CITIES, isLocation, type ObserverLocation } from "@/lib/astronomy";
export default function LocationDialog({
  onClose,
  onSave,
  current,
}: {
  onClose: () => void;
  onSave: (location: ObserverLocation) => void;
  current: ObserverLocation | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState(""),
    [custom, setCustom] = useState(false),
    [error, setError] = useState(""),
    [locating, setLocating] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  function locate() {
    if (!navigator.geolocation) {
      setError(
        "Location isn’t supported here. Choose a city or enter coordinates.",
      );
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        onSave({
          name: "Your location",
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        });
      },
      () => {
        setLocating(false);
        setError(
          "Couldn’t get your location. You can choose a city or enter coordinates instead.",
        );
      },
      { timeout: 12000, maximumAge: 300000 },
    );
  }
  const matches = CITIES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <dialog
      ref={dialog}
      className="dialog location-dialog"
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-content">
        <button
          className="icon-button dialog-close"
          onClick={onClose}
          aria-label="Close location settings"
        >
          <XIcon />
        </button>
        <span className="eyebrow copper">A VIEW FROM YOUR CORNER OF EARTH</span>
        <h2>
          Where are you
          <br />
          <em>looking up from?</em>
        </h2>
        <p>
          Your sky changes with your location. This stays in your browser, just
          between you and the stars.
        </p>
        <button
          className="primary-button locate-button"
          onClick={locate}
          disabled={locating}
        >
          <CrosshairIcon />
          {locating ? "Finding your location…" : "Use my location"}
          <ArrowRightIcon />
        </button>
        <div className="divider-label">
          <span>or choose a city</span>
        </div>
        <label className="search-label">
          <MapPinIcon />
          <input
            autoComplete="off"
            placeholder="Search a city or country"
            aria-label="Search a city or country"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="city-list">
          {matches.map((city) => (
            <button key={city.name} onClick={() => onSave(city)}>
              <span>{city.name}</span>
              <ArrowRightIcon />
            </button>
          ))}
          {matches.length === 0 && (
            <p>No city here yet. Enter its coordinates below.</p>
          )}
        </div>
        <button className="text-button" onClick={() => setCustom(!custom)}>
          {custom ? "Hide coordinates" : "Somewhere else? Enter coordinates"}{" "}
          <ArrowRightIcon />
        </button>
        {custom && (
          <form
            className="coordinate-form"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const location = {
                name: String(data.get("name") || "Custom location"),
                latitude: Number(data.get("latitude")),
                longitude: Number(data.get("longitude")),
              };
              if (isLocation(location)) onSave(location);
              else
                setError(
                  "Enter latitude from −90 to 90 and longitude from −180 to 180.",
                );
            }}
          >
            <label>
              Place name
              <input
                name="name"
                placeholder="My corner of Earth"
                maxLength={100}
              />
            </label>
            <div>
              <label>
                Latitude
                <input
                  name="latitude"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  required
                  defaultValue={current?.latitude}
                />
              </label>
              <label>
                Longitude
                <input
                  name="longitude"
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  required
                  defaultValue={current?.longitude}
                />
              </label>
            </div>
            <button className="primary-button" type="submit">
              Set my location
              <ArrowRightIcon />
            </button>
          </form>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="text-button muted skip-location" onClick={onClose}>
          Keep exploring for now
        </button>
      </div>
    </dialog>
  );
}
