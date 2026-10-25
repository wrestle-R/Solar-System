import { Body } from "astronomy-engine";

export type ObjectId =
  | "Sun"
  | "Mercury"
  | "Venus"
  | "Earth"
  | "Moon"
  | "Mars"
  | "Jupiter"
  | "Saturn"
  | "Uranus"
  | "Neptune";
export interface CelestialBody {
  id: ObjectId;
  body: Body;
  kind: string;
  color: string;
  texture: string;
  radius: number;
  orbit: number;
  au: number;
  period: number;
  diameter: string;
  day: string;
  description: string;
  fact: string;
}
export const BODIES: CelestialBody[] = [
  {
    id: "Sun",
    body: Body.Sun,
    kind: "Our star",
    color: "#f8bb69",
    texture: "2k_sun.jpg",
    radius: 2.2,
    orbit: 0,
    au: 0,
    period: 0,
    diameter: "1,392,700 km",
    day: "~27 Earth days",
    description:
      "The star that makes everything here possible. A sphere of plasma holding eight planets and countless smaller worlds in its gravitational embrace.",
    fact: "Sunlight takes about 8 minutes and 20 seconds to reach Earth.",
  },
  {
    id: "Mercury",
    body: Body.Mercury,
    kind: "Terrestrial planet",
    color: "#b6b1a7",
    texture: "2k_mercury.jpg",
    radius: 0.25,
    orbit: 3.6,
    au: 0.387,
    period: 87.969,
    diameter: "4,879 km",
    day: "58.6 Earth days",
    description:
      "A small, cratered world racing around the Sun. Its almost airless surface swings between blistering days and freezing nights.",
    fact: "A solar day on Mercury lasts longer than its entire year.",
  },
  {
    id: "Venus",
    body: Body.Venus,
    kind: "Terrestrial planet",
    color: "#dec18e",
    texture: "2k_venus_atmosphere.jpg",
    radius: 0.39,
    orbit: 5.2,
    au: 0.723,
    period: 224.701,
    diameter: "12,104 km",
    day: "243 Earth days",
    description:
      "Beautiful from a distance, rather less welcoming up close. Thick clouds hide a volcanic world with a crushing carbon dioxide atmosphere.",
    fact: "Venus rotates in the opposite direction to most planets.",
  },
  {
    id: "Earth",
    body: Body.Earth,
    kind: "Terrestrial planet",
    color: "#80b7cb",
    texture: "2k_earth_daymap.jpg",
    radius: 0.55,
    orbit: 7,
    au: 1,
    period: 365.256,
    diameter: "12,742 km",
    day: "23 h 56 min",
    description:
      "Our pale blue dot. An ocean world wrapped in a thin atmosphere, and the only place in the universe we know has life. Quite a good place to be, honestly.",
    fact: "Every person you have ever known has lived on this little world.",
  },
  {
    id: "Moon",
    body: Body.Moon,
    kind: "Earth’s natural satellite",
    color: "#d3d0c6",
    texture: "2k_moon.jpg",
    radius: 0.13,
    orbit: 0,
    au: 1,
    period: 27.322,
    diameter: "3,475 km",
    day: "27.3 Earth days",
    description:
      "Our constant companion. Its changing light has kept time for humans for thousands of years, while its gravity quietly moves our oceans.",
    fact: "We always see nearly the same face of the Moon from Earth.",
  },
  {
    id: "Mars",
    body: Body.Mars,
    kind: "Terrestrial planet",
    color: "#cc8064",
    texture: "2k_mars.jpg",
    radius: 0.37,
    orbit: 8.9,
    au: 1.524,
    period: 686.98,
    diameter: "6,779 km",
    day: "24 h 37 min",
    description:
      "A rusty desert world with polar ice, enormous volcanoes and the traces of ancient rivers. A familiar-looking neighbour with a very different story.",
    fact: "Olympus Mons is nearly three times as tall as Mount Everest.",
  },
  {
    id: "Jupiter",
    body: Body.Jupiter,
    kind: "Gas giant",
    color: "#cbb49a",
    texture: "2k_jupiter.jpg",
    radius: 1.35,
    orbit: 12,
    au: 5.203,
    period: 4332.59,
    diameter: "139,820 km",
    day: "9 h 56 min",
    description:
      "The giant of our planetary family. Bands of cloud flow around a world of immense storms, with four remarkable Galilean moons dancing around it.",
    fact: "Its Great Red Spot is a storm that has raged for centuries.",
  },
  {
    id: "Saturn",
    body: Body.Saturn,
    kind: "Gas giant",
    color: "#d6c79f",
    texture: "2k_saturn.jpg",
    radius: 1.05,
    orbit: 15.6,
    au: 9.537,
    period: 10759.22,
    diameter: "116,460 km",
    day: "~10.7 hours",
    description:
      "An entire world wearing rings of ice and rock. Saturn is wonderfully strange, a gas giant light enough to be less dense than water.",
    fact: "Its rings are enormous across, but astonishingly thin.",
  },
  {
    id: "Uranus",
    body: Body.Uranus,
    kind: "Ice giant",
    color: "#98c7c7",
    texture: "2k_uranus.jpg",
    radius: 0.65,
    orbit: 19,
    au: 19.191,
    period: 30688.5,
    diameter: "50,724 km",
    day: "17 h 14 min",
    description:
      "A quiet blue-green world tipped onto its side. Methane in its atmosphere absorbs red light, leaving that lovely pale cyan colour.",
    fact: "Uranus rolls around the Sun with an axial tilt of about 98°.",
  },
  {
    id: "Neptune",
    body: Body.Neptune,
    kind: "Ice giant",
    color: "#688ccf",
    texture: "2k_neptune.jpg",
    radius: 0.64,
    orbit: 22.5,
    au: 30.069,
    period: 60182,
    diameter: "49,244 km",
    day: "~16 hours",
    description:
      "Cold, distant, and swept by extraordinary winds. The outermost planet in our solar system takes nearly 165 Earth years to circle the Sun.",
    fact: "Neptune was predicted mathematically before it was observed.",
  },
];
export const PLANETS = BODIES.filter((b) => b.orbit > 0);
export const getBody = (id: ObjectId) => BODIES.find((b) => b.id === id)!;
