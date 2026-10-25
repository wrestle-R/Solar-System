"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowCounterClockwiseIcon,
  CalendarBlankIcon,
  CaretLeftIcon,
  CaretRightIcon,
  PauseIcon,
  PlayIcon,
  XIcon,
} from "@phosphor-icons/react";
import { DAY, MAX_DATE, MIN_DATE, localDateInput } from "@/lib/astronomy";
type Props = {
  date: number;
  live: boolean;
  playing: boolean;
  speed: number;
  setDate: (time: number) => void;
  onLive: () => void;
  onPlay: () => void;
  onSpeed: (speed: number) => void;
};
export default function TimeControls({
  date,
  live,
  playing,
  speed,
  setDate,
  onLive,
  onPlay,
  onSpeed,
}: Props) {
  const [open, setOpen] = useState(false),
    d = new Date(date);
  return (
    <>
      <div className="time-controls" aria-label="Time travel controls">
        <button
          className="icon-button step-button"
          onClick={() => setDate(date - DAY)}
          disabled={date - DAY < MIN_DATE}
          aria-label="Previous day"
          title="Previous day"
        >
          <CaretLeftIcon />
        </button>
        <button
          className="icon-button play-button"
          aria-label={playing ? "Pause time" : "Play time forward"}
          title={playing ? "Pause" : "Play time"}
          onClick={onPlay}
        >
          {playing ? <PauseIcon weight="fill" /> : <PlayIcon weight="fill" />}
        </button>
        <button
          className="icon-button step-button"
          onClick={() => setDate(date + DAY)}
          disabled={date + DAY > MAX_DATE}
          aria-label="Next day"
          title="Next day"
        >
          <CaretRightIcon />
        </button>
        <span className="control-divider" />
        <button
          className="date-display"
          onClick={() => setOpen(true)}
          title="Rewind to a date"
        >
          <CalendarBlankIcon />
          <span>
            {d.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            })}
          </span>
        </button>
        <select
          className="speed-select"
          value={speed}
          onChange={(e) => onSpeed(Number(e.target.value))}
          aria-label="Time travel speed"
        >
          <option value={-7}>−7d/s</option>
          <option value={-1}>−1d/s</option>
          <option value={1}>1d/s</option>
          <option value={7}>7d/s</option>
          <option value={30}>30d/s</option>
        </select>
        <span className="control-divider" />
        <button
          className={`today-button ${live ? "is-live" : ""}`}
          onClick={onLive}
          title="Return to the present"
        >
          {live ? (
            <span className="status-dot live" />
          ) : (
            <ArrowCounterClockwiseIcon />
          )}
          <span>{live ? "Live" : "Now"}</span>
        </button>
      </div>
      {open && (
        <DateDialog
          date={date}
          onClose={() => setOpen(false)}
          onSet={(time) => {
            setDate(time);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
function DateDialog({
  date,
  onClose,
  onSet,
}: {
  date: number;
  onClose: () => void;
  onSet: (time: number) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className="dialog" onCancel={onClose} onClose={onClose}>
      <form
        className="dialog-content"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget),
            time = Date.parse(String(data.get("moment")) + "Z");
          if (!Number.isFinite(time) || time < MIN_DATE || time > MAX_DATE) {
            setError("Choose a date between 1900 and 2100.");
            return;
          }
          onSet(time);
        }}
      >
        <button
          type="button"
          className="icon-button dialog-close"
          aria-label="Close time travel"
          onClick={onClose}
        >
          <XIcon />
        </button>
        <span className="eyebrow copper">THE UNIVERSE HAS A HISTORY</span>
        <h2>
          Pick a moment.
          <br />
          <em>Go there.</em>
        </h2>
        <p>
          Your birthday, a memory, a day that hasn’t happened yet. See where
          everything was, or will be.
        </p>
        <label className="date-input-label">
          Date and time (UTC)
          <input
            type="datetime-local"
            name="moment"
            required
            defaultValue={localDateInput(new Date(date))}
            min="1900-01-01T00:00"
            max="2100-12-31T23:59"
          />
        </label>
        <p className="small muted">
          1900–2100 · All times are UTC. Location affects the sky view.
        </p>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button className="primary-button" type="submit">
          <ArrowCounterClockwiseIcon />
          Travel to this moment
        </button>
      </form>
    </dialog>
  );
}
