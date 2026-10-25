"use client";
import { useEffect, useRef } from "react";
import { XIcon, ArrowRightIcon } from "@phosphor-icons/react";
export default function FieldNotes({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog notes-dialog"
      onClose={onClose}
      onCancel={onClose}
    >
      <div className="dialog-content">
        <button
          className="icon-button dialog-close"
          onClick={onClose}
          aria-label="Close field notes"
        >
          <XIcon />
        </button>
        <span className="eyebrow copper">A FEW THINGS WORTH KNOWING</span>
        <h2>
          A little wonder.
          <br />
          <em>Grounded in science.</em>
        </h2>
        <h3>Positions, with perspective</h3>
        <p>
          We calculate positions with{" "}
          <a
            href="https://github.com/cosinekitty/astronomy"
            target="_blank"
            rel="noreferrer"
          >
            Astronomy Engine
          </a>
          , whose planetary calculations target accuracy within about one
          arcminute. These are model predictions, rather than exact measurements
          or spacecraft navigation data. The date range here is 1900–2100.
        </p>
        <p>
          The orbital map uses heliocentric coordinates in the J2000 ecliptic
          frame. Each orbit’s distance is scaled separately so all eight planets
          fit; planet sizes, the Moon’s separation and Jupiter’s moon
          separations are enlarged. Orbit paths are sampled model trajectories,
          the asteroid belt and background stars are decorative. Surface
          textures and rotations are illustrative.
        </p>
        <h3>Your actual sky</h3>
        <p>
          The horizon chart uses your coordinates and the selected UTC time.
          Planets use topocentric positions, light-time correction and standard
          atmospheric refraction. The 18 bright stars use J2000 catalogue
          coordinates with precession; stellar proper motion, parallax and
          aberration are omitted. This is an educational sky finder.
        </p>
        <p>
          Above the horizon doesn’t promise visibility. Weather, light
          pollution, daylight and local terrain matter. Rise and set times
          belong to the selected UTC calendar day, including locations with
          polar day or night. The lunar disc shows calculated illumination, with
          a schematic north-up orientation.
        </p>
        <h3>The moons</h3>
        <p>
          Earth’s Moon is calculated separately. Select Jupiter to see Io,
          Europa, Ganymede and Callisto at their modelled positions with
          exaggerated separation. Other planetary moons aren’t simulated.
        </p>
        <h3>And the celestial mood?</h3>
        <p>
          Sun and Moon signs use the tropical zodiac: twelve equal 30° sectors
          of geocentric ecliptic longitude. They’re cultural astrology labels,
          not IAU constellations or scientific predictions. The object detail
          panel shows the astronomical constellation separately.
        </p>
        <h3>Credits & privacy</h3>
        <p>
          Planet textures by{" "}
          <a
            href="https://www.solarsystemscope.com/textures/"
            target="_blank"
            rel="noreferrer"
          >
            Solar System Scope
          </a>
          , based on NASA imagery, under{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          . Calculations run on your device. Observer coordinates are saved only
          in your browser’s local storage and aren’t sent to our server.
        </p>
        <button className="primary-button" onClick={onClose}>
          Back to the universe
          <ArrowRightIcon />
        </button>
      </div>
    </dialog>
  );
}
