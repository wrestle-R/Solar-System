import test from "node:test";
import assert from "node:assert/strict";
import {
  CITIES,
  MAX_DATE,
  MIN_DATE,
  clampDate,
  eclipticPosition,
  horizontal,
  isLocation,
  lunarPhase,
  scenePosition,
  signs,
  skySummary,
  starPositions,
  zodiac,
} from "../src/lib/astronomy";
import { PLANETS } from "../src/lib/bodies";

test("2024 total eclipse gives a new Moon and 2024 equinox crosses tropical Aries", () => {
  const eclipse = lunarPhase(new Date("2024-04-08T18:21:00Z"));
  assert.ok(
    eclipse.fraction < 0.001,
    "eclipse Moon should be almost unilluminated",
  );
  assert.equal(eclipse.name, "New moon");
  assert.equal(signs(new Date("2024-03-20T04:00:00Z")).sun.name, "Aries");
  assert.equal(signs(new Date("2024-03-19T00:00:00Z")).sun.name, "Pisces");
});
test("planet distances stay in physical ranges and the dated map preserves directions", () => {
  for (const year of [1900, 2000, 2026, 2100])
    for (const body of PLANETS) {
      const date = new Date(`${year}-06-21T12:00:00Z`),
        v = eclipticPosition(body.id, date),
        p = scenePosition(body.id, date);
      assert.ok(
        v.distance > body.au * 0.75 && v.distance < body.au * 1.25,
        `${body.id} distance`,
      );
      assert.ok(Math.abs(p[0] / (body.orbit / body.au) - v.x) < 1e-10);
      assert.ok(Math.abs(p[2] / (body.orbit / body.au) + v.y) < 1e-10);
    }
});
test("a day changes the Earth and Moon independently", () => {
  const a = new Date("2026-10-25T12:00:00Z"),
    b = new Date("2026-10-26T12:00:00Z");
  assert.notDeepEqual(scenePosition("Earth", a), scenePosition("Earth", b));
  const ma = scenePosition("Moon", a),
    ea = scenePosition("Earth", a);
  assert.ok(
    Math.abs(Math.hypot(...ma.map((v, i) => v - ea[i])) - 0.73) < 1e-10,
  );
});
test("observer sky responds to latitude, longitude and time, with sane horizon ranges", () => {
  const date = new Date("2026-10-25T18:00:00Z");
  const mumbai = horizontal("Sun", date, CITIES[0]),
    newYork = horizontal("Sun", date, CITIES[6]);
  assert.ok(mumbai.altitude < newYork.altitude);
  for (const city of CITIES) {
    const summary = skySummary(date, city);
    for (const body of summary.objects) {
      assert.ok(body.altitude >= -90 && body.altitude <= 90);
      assert.ok(body.azimuth >= 0 && body.azimuth < 360);
    }
    for (const star of starPositions(date, city)) {
      assert.ok(Number.isFinite(star.altitude));
      assert.ok(star.altitude >= -90 && star.altitude <= 90);
    }
  }
});
test("polar night and polar day do not invent rise or set times", () => {
  const north = { name: "North Pole", latitude: 90, longitude: 0 };
  const winter = skySummary(new Date("2026-12-21T12:00:00Z"), north);
  assert.equal(winter.sunrise, null);
  assert.equal(winter.sunset, null);
  assert.ok(winter.sun.altitude < 0);
  const summer = skySummary(new Date("2026-06-21T12:00:00Z"), north);
  assert.equal(summer.sunset, null);
  assert.ok(summer.sun.altitude > 0);
});
test("untrusted stored coordinates and date boundaries are validated", () => {
  assert.equal(isLocation(null), false);
  assert.equal(isLocation({ name: "bad", latitude: 91, longitude: 0 }), false);
  assert.equal(
    isLocation({ name: "bad", latitude: "19", longitude: 0 }),
    false,
  );
  assert.equal(isLocation(CITIES[0]), true);
  assert.equal(clampDate(MIN_DATE - 1000), MIN_DATE);
  assert.equal(clampDate(MAX_DATE + 1000), MAX_DATE);
  assert.equal(zodiac(-1).name, "Pisces");
  assert.equal(zodiac(360).name, "Aries");
});
