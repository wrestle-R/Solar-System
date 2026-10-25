import * as A from "astronomy-engine";
import { BODIES, getBody, type ObjectId } from "./bodies";

export const MIN_DATE = new Date("1900-01-01T00:00:00Z").getTime();
export const MAX_DATE = new Date("2100-12-31T23:59:59Z").getTime();
export const DAY = 86400000;
export type ObserverLocation = {
  name: string;
  latitude: number;
  longitude: number;
};
export const CITIES: ObserverLocation[] = [
  { name: "Mumbai, India", latitude: 19.076, longitude: 72.8777 },
  { name: "Delhi, India", latitude: 28.6139, longitude: 77.209 },
  { name: "Bengaluru, India", latitude: 12.9716, longitude: 77.5946 },
  { name: "Chennai, India", latitude: 13.0827, longitude: 80.2707 },
  { name: "Kolkata, India", latitude: 22.5726, longitude: 88.3639 },
  { name: "London, United Kingdom", latitude: 51.5074, longitude: -0.1278 },
  { name: "New York, United States", latitude: 40.7128, longitude: -74.006 },
  {
    name: "Los Angeles, United States",
    latitude: 34.0522,
    longitude: -118.2437,
  },
  { name: "Sydney, Australia", latitude: -33.8688, longitude: 151.2093 },
  { name: "Tokyo, Japan", latitude: 35.6762, longitude: 139.6503 },
  { name: "Singapore", latitude: 1.3521, longitude: 103.8198 },
  { name: "Cape Town, South Africa", latitude: -33.9249, longitude: 18.4241 },
];
export function isLocation(value: unknown): value is ObserverLocation {
  if (!value || typeof value !== "object") return false;
  const v = value as ObserverLocation;
  return (
    typeof v.name === "string" &&
    v.name.length > 0 &&
    v.name.length < 150 &&
    Number.isFinite(v.latitude) &&
    Math.abs(v.latitude) <= 90 &&
    Number.isFinite(v.longitude) &&
    Math.abs(v.longitude) <= 180
  );
}
export function clampDate(value: number) {
  return Math.max(MIN_DATE, Math.min(MAX_DATE, value));
}
export function eclipticPosition(id: ObjectId, date: Date) {
  // EQJ -> ECL J2000: fixed frame keeps orbit trails and bodies in the same system.
  const v = A.RotateVector(
    A.Rotation_EQJ_ECL(),
    A.HelioVector(getBody(id).body, date),
  );
  return { x: v.x, y: v.y, z: v.z, distance: Math.hypot(v.x, v.y, v.z) };
}
export function scenePosition(
  id: ObjectId,
  date: Date,
): [number, number, number] {
  if (id === "Sun") return [0, 0, 0];
  if (id === "Moon") {
    const earth = scenePosition("Earth", date);
    const v = A.RotateVector(A.Rotation_EQJ_ECL(), A.GeoMoon(date));
    const length = Math.hypot(v.x, v.y, v.z);
    return [
      earth[0] + (v.x / length) * 0.73,
      earth[1] + (v.z / length) * 0.73,
      earth[2] - (v.y / length) * 0.73,
    ];
  }
  const b = getBody(id),
    v = eclipticPosition(id, date),
    scale = b.orbit / b.au;
  return [v.x * scale, v.z * scale, -v.y * scale];
}
export const SIGNS = [
  ["Aries", "♈"],
  ["Taurus", "♉"],
  ["Gemini", "♊"],
  ["Cancer", "♋"],
  ["Leo", "♌"],
  ["Virgo", "♍"],
  ["Libra", "♎"],
  ["Scorpio", "♏"],
  ["Sagittarius", "♐"],
  ["Capricorn", "♑"],
  ["Aquarius", "♒"],
  ["Pisces", "♓"],
];
export function zodiac(longitude: number) {
  const angle = ((longitude % 360) + 360) % 360,
    index = Math.floor(angle / 30);
  return {
    name: SIGNS[index][0],
    symbol: SIGNS[index][1] + "\uFE0E",
    degree: angle % 30,
  };
}
export function signs(date: Date) {
  return {
    sun: zodiac(A.SunPosition(date).elon),
    moon: zodiac(A.Ecliptic(A.GeoMoon(date)).elon),
  };
}
export function lunarPhase(date: Date) {
  const angle = A.MoonPhase(date);
  const names = [
    "New moon",
    "Waxing crescent",
    "First quarter",
    "Waxing gibbous",
    "Full moon",
    "Waning gibbous",
    "Last quarter",
    "Waning crescent",
  ];
  const name = names[Math.floor((angle + 22.5) / 45) % 8];
  const fraction = A.Illumination(A.Body.Moon, date).phase_fraction;
  return {
    angle,
    name,
    fraction,
    next: A.SearchMoonPhase(180, date, 35)?.date ?? null,
  };
}
export function horizontal(
  id: ObjectId,
  date: Date,
  location: ObserverLocation,
) {
  const observer = new A.Observer(location.latitude, location.longitude, 0);
  const eq = A.Equator(getBody(id).body, date, observer, true, true);
  const hor = A.Horizon(date, observer, eq.ra, eq.dec, "normal");
  return {
    altitude: hor.altitude,
    azimuth: hor.azimuth,
    ra: eq.ra,
    dec: eq.dec,
    distance: eq.dist,
  };
}
export function skySummary(date: Date, location: ObserverLocation) {
  const observer = new A.Observer(location.latitude, location.longitude, 0);
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const sunrise =
    A.SearchRiseSet(A.Body.Sun, observer, 1, start, 1)?.date ?? null;
  const sunset =
    A.SearchRiseSet(A.Body.Sun, observer, -1, start, 1)?.date ?? null;
  const sun = horizontal("Sun", date, location);
  const objects = BODIES.filter((b) => b.id !== "Earth").map((b) => ({
    ...b,
    ...horizontal(b.id, date, location),
  }));
  return { sunrise, sunset, sun, objects, dark: sun.altitude < -6 };
}
export function objectDetails(
  id: ObjectId,
  date: Date,
  location: ObserverLocation | null,
) {
  const b = getBody(id);
  const distance =
    id === "Moon"
      ? A.GeoMoon(date).Length() * A.KM_PER_AU
      : A.HelioDistance(b.body, date);
  const geo = id === "Earth" ? null : A.GeoVector(b.body, date, true);
  const constellation = geo
    ? A.Constellation(A.EquatorFromVector(geo).ra, A.EquatorFromVector(geo).dec)
        .name
    : "Our home";
  return {
    distance,
    constellation,
    horizon: location && id !== "Earth" ? horizontal(id, date, location) : null,
  };
}
export function utcLabel(date: Date) {
  return (
    date.toLocaleTimeString("en-GB", {
      timeZone: "UTC",
      hour: "2-digit",
      minute: "2-digit",
    }) + " UTC"
  );
}
export function localDateInput(date: Date) {
  return date.toISOString().slice(0, 16);
}
export function direction(azimuth: number) {
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
    Math.round(azimuth / 45) % 8
  ];
}
// J2000 bright-star catalogue. Precession is applied by Rotation_EQJ_EQD.
export const STARS = [
  { name: "Sirius", ra: 6.7525, dec: -16.7161, mag: -1.46 },
  { name: "Canopus", ra: 6.3992, dec: -52.6956, mag: -0.74 },
  { name: "Arcturus", ra: 14.261, dec: 19.1824, mag: -0.05 },
  { name: "Vega", ra: 18.6156, dec: 38.7837, mag: 0.03 },
  { name: "Capella", ra: 5.2782, dec: 45.998, mag: 0.08 },
  { name: "Rigel", ra: 5.2423, dec: -8.2016, mag: 0.13 },
  { name: "Procyon", ra: 7.655, dec: 5.225, mag: 0.34 },
  { name: "Betelgeuse", ra: 5.9195, dec: 7.4071, mag: 0.42 },
  { name: "Achernar", ra: 1.6286, dec: -57.2368, mag: 0.46 },
  { name: "Altair", ra: 19.8464, dec: 8.8683, mag: 0.76 },
  { name: "Aldebaran", ra: 4.5987, dec: 16.5093, mag: 0.85 },
  { name: "Antares", ra: 16.4901, dec: -26.432, mag: 0.96 },
  { name: "Spica", ra: 13.4199, dec: -11.1613, mag: 0.97 },
  { name: "Pollux", ra: 7.7553, dec: 28.0262, mag: 1.14 },
  { name: "Fomalhaut", ra: 22.9608, dec: -29.6222, mag: 1.16 },
  { name: "Deneb", ra: 20.6905, dec: 45.2803, mag: 1.25 },
  { name: "Regulus", ra: 10.1395, dec: 11.9672, mag: 1.35 },
  { name: "Polaris", ra: 2.5303, dec: 89.2641, mag: 1.98 },
];
export function starPositions(date: Date, location: ObserverLocation) {
  const observer = new A.Observer(location.latitude, location.longitude, 0),
    rotation = A.Rotation_EQJ_EQD(date);
  return STARS.map((star) => {
    const vector = A.VectorFromSphere(
      new A.Spherical(star.dec, star.ra * 15, 1),
      date,
    );
    const eq = A.EquatorFromVector(A.RotateVector(rotation, vector));
    const h = A.Horizon(date, observer, eq.ra, eq.dec, "normal");
    return { ...star, altitude: h.altitude, azimuth: h.azimuth };
  });
}
