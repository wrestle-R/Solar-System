# Model notes

Positions use [Astronomy Engine](https://github.com/cosinekitty/astronomy), whose planetary calculations target approximately one arcminute accuracy. These are model predictions for educational exploration, not spacecraft navigation measurements. The UI accepts dates from 1900 to 2100.

The orrery uses heliocentric J2000 ecliptic coordinates. Each orbit has its own visual distance scale. Body sizes and lunar separations are enlarged. Orbit paths are sampled trajectories; asteroid-belt and background-star points are decorative. Textures, spin orientation, lighting exposure, atmospheres and glow are illustrative.

The observer sky chart uses the selected UTC time, observer coordinates, topocentric planetary positions, light-time correction and standard atmospheric refraction. Its 18 bright stars use J2000 coordinates with precession; stellar proper motion, parallax and aberration are omitted. Weather, terrain, light pollution and daylight can prevent actual visibility. Rise/set times belong to the selected UTC calendar day; polar locations can have no rise or set.

Earth’s Moon and Jupiter’s four Galilean moons are modelled. Other planetary moons are not simulated. Tropical zodiac signs divide geocentric ecliptic longitude into twelve equal sectors; these cultural astrology labels are distinct from the IAU constellations shown in object details.

Calculations run in the browser. Observer coordinates stay in localStorage and are not sent to the application server.

Planet, night, cloud and ring textures are by [Solar System Scope](https://www.solarsystemscope.com/textures/), based on NASA imagery, used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

The decorative background is a procedurally generated Milky Way band and illustrative stars. It is not a catalogue, an observer sky or a dated star map; use the location sky chart for the calculated view.
