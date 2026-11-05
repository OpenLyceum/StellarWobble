/**
 * Physics checks for orbitPhysics.ts against known systems.
 */

import { describe, expect, it } from "vitest";
import {
  directionToEarth,
  minimumPlanetMass,
  orbitalPeriod,
  planetOrbitRadius,
  radialVelocityAtPhase,
  radialVelocityOf,
  semiAmplitude,
  semiAmplitudeFromPeriod,
  starOrbitRadius,
  starVelocity,
} from "../src/common/model/orbitPhysics.js";
import { AU_M, DAY_S, EARTH_MASS_KG, JUPITER_MASS_KG, SUN_MASS_KG } from "../src/StellarWobbleConstants.js";

const EDGE_ON = Math.PI / 2;
const YEAR_S = 365.25 * DAY_S;

describe("orbitPhysics", () => {
  it("gives Earth a one-year period", () => {
    expect(orbitalPeriod(SUN_MASS_KG, EARTH_MASS_KG, AU_M) / YEAR_S).toBeCloseTo(1, 2);
  });

  it("puts the barycentre between the bodies (a★ + ap = a)", () => {
    const a = 5.2 * AU_M;
    const sum = starOrbitRadius(SUN_MASS_KG, JUPITER_MASS_KG, a) + planetOrbitRadius(SUN_MASS_KG, JUPITER_MASS_KG, a);
    expect(sum / a).toBeCloseTo(1, 12);
    // Jupiter pulls the Sun's centre to just outside its surface (≈ 1.07 solar radii).
    expect(starOrbitRadius(SUN_MASS_KG, JUPITER_MASS_KG, a) / 6.957e8).toBeCloseTo(1.07, 1);
  });

  it("matches the known wobble of the Sun due to Jupiter (≈ 12.5 m/s)", () => {
    expect(semiAmplitude(SUN_MASS_KG, JUPITER_MASS_KG, 5.2 * AU_M, EDGE_ON)).toBeCloseTo(12.5, 0);
  });

  it("matches the known wobble of the Sun due to Earth (≈ 9 cm/s)", () => {
    expect(semiAmplitude(SUN_MASS_KG, EARTH_MASS_KG, AU_M, EDGE_ON)).toBeCloseTo(0.0895, 3);
  });

  it("matches 51 Pegasi b (K ≈ 56 m/s at P = 4.23 d)", () => {
    // 51 Peg: 1.11 M☉; minimum mass 0.47 M_J; P = 4.2308 d (published K = 55.9 ± 0.8 m/s).
    const k = semiAmplitudeFromPeriod(1.11 * SUN_MASS_KG, 0.47 * JUPITER_MASS_KG, 4.2308 * DAY_S, EDGE_ON);
    expect(k).toBeGreaterThan(53);
    expect(k).toBeLessThan(58);
  });

  it("agrees between the distance and period forms of K", () => {
    const a = 0.3 * AU_M;
    const period = orbitalPeriod(0.8 * SUN_MASS_KG, 3 * JUPITER_MASS_KG, a);
    const i = 0.7;
    expect(semiAmplitudeFromPeriod(0.8 * SUN_MASS_KG, 3 * JUPITER_MASS_KG, period, i)).toBeCloseTo(
      semiAmplitude(0.8 * SUN_MASS_KG, 3 * JUPITER_MASS_KG, a, i),
      8,
    );
  });

  it("gives no signal face-on", () => {
    expect(semiAmplitude(SUN_MASS_KG, JUPITER_MASS_KG, AU_M, 0)).toBe(0);
  });

  it("inverts K and P back to the planet's minimum mass", () => {
    const period = orbitalPeriod(SUN_MASS_KG, 2 * JUPITER_MASS_KG, 0.5 * AU_M);
    const k = semiAmplitudeFromPeriod(SUN_MASS_KG, 2 * JUPITER_MASS_KG, period, EDGE_ON);
    expect(minimumPlanetMass(k, period, SUN_MASS_KG) / JUPITER_MASS_KG).toBeCloseTo(2, 6);
    // Seen at 30°, only half the mass is inferred.
    const kTilted = semiAmplitudeFromPeriod(SUN_MASS_KG, 2 * JUPITER_MASS_KG, period, Math.PI / 6);
    expect(minimumPlanetMass(kTilted, period, SUN_MASS_KG) / JUPITER_MASS_KG).toBeCloseTo(1, 1);
  });

  it("has the closed-form RV equal the projected star velocity, for any geometry", () => {
    const k = 40;
    for (const [incl, azimuth, phase] of [
      [EDGE_ON, -Math.PI / 2, 0],
      [0.4, 1.1, 0.37],
      [1.2, 3.0, 0.81],
    ] as const) {
      const vStar = k / Math.sin(incl);
      const projected = radialVelocityOf(starVelocity(phase, vStar), directionToEarth(incl, azimuth));
      expect(radialVelocityAtPhase(phase, k, azimuth)).toBeCloseTo(projected, 9);
    }
  });

  it("uses the sign convention: star moving toward Earth has negative RV", () => {
    // Earth toward −y (bottom of the top view). At phase 0 the planet is at +x, the star at −x
    // moving toward −y, i.e. toward Earth.
    expect(radialVelocityAtPhase(0, 10, -Math.PI / 2)).toBeCloseTo(-10, 9);
    expect(radialVelocityAtPhase(0.5, 10, -Math.PI / 2)).toBeCloseTo(10, 9);
  });
});
