/**
 * orbitPhysics.ts
 *
 * Pure two-body physics of a star and one planet on circular orbits about their
 * common centre of mass (the barycentre), and the star's radial velocity as
 * seen from Earth. No SceneryStack types beyond Vector3, so everything is easy
 * to unit-test.
 *
 * Geometry. The orbit lies in the model x–y plane with the planet going
 * counter-clockwise seen from +z. The planet's angle is θ = 2π·phase, measured
 * from +x. Earth's direction is the unit vector
 *
 *   ê = (sin i · cos λ, sin i · sin λ, cos i)
 *
 * where i is the inclination (0 = face-on, 90° = edge-on) and λ is Earth's
 * azimuth within the orbital plane. A positive radial velocity means the star is
 * moving away from Earth (a redshift): v_r = −v★ · ê.
 *
 * All functions take SI units (kg, m, s, rad) and return SI.
 */

import { Vector3 } from "scenerystack/dot";
import { G_SI } from "../../StellarWobbleConstants.js";

/** Orbital period from Kepler's third law, s: P = 2π √(a³ / G(M★ + Mp)). */
export function orbitalPeriod(starMassKg: number, planetMassKg: number, distanceM: number): number {
  return 2 * Math.PI * Math.sqrt(distanceM ** 3 / (G_SI * (starMassKg + planetMassKg)));
}

/** Radius of the star's own orbit about the barycentre, m: a★ = a · Mp / (M★ + Mp). */
export function starOrbitRadius(starMassKg: number, planetMassKg: number, distanceM: number): number {
  return (distanceM * planetMassKg) / (starMassKg + planetMassKg);
}

/** Radius of the planet's orbit about the barycentre, m: ap = a · M★ / (M★ + Mp). */
export function planetOrbitRadius(starMassKg: number, planetMassKg: number, distanceM: number): number {
  return (distanceM * starMassKg) / (starMassKg + planetMassKg);
}

/** The star's orbital speed about the barycentre, m/s (circular orbit). */
export function starOrbitalSpeed(starMassKg: number, planetMassKg: number, distanceM: number): number {
  return (
    (2 * Math.PI * starOrbitRadius(starMassKg, planetMassKg, distanceM)) /
    orbitalPeriod(starMassKg, planetMassKg, distanceM)
  );
}

/**
 * Radial-velocity semi-amplitude K, m/s: the largest speed toward or away from
 * Earth, K = v★ · sin i. Equivalent to the textbook form
 * K = (2πG/P)^{1/3} · Mp sin i / (M★ + Mp)^{2/3}.
 */
export function semiAmplitude(
  starMassKg: number,
  planetMassKg: number,
  distanceM: number,
  inclinationRad: number,
): number {
  return starOrbitalSpeed(starMassKg, planetMassKg, distanceM) * Math.sin(inclinationRad);
}

/** K from the period instead of the distance (the form an observer uses), m/s. */
export function semiAmplitudeFromPeriod(
  starMassKg: number,
  planetMassKg: number,
  periodS: number,
  inclinationRad: number,
): number {
  return (
    (((2 * Math.PI * G_SI) / periodS) ** (1 / 3) * planetMassKg * Math.sin(inclinationRad)) /
    (starMassKg + planetMassKg) ** (2 / 3)
  );
}

/**
 * The minimum planet mass Mp·sin i, kg, an observer infers from a measured
 * period and semi-amplitude and a known star mass. Solves
 * m = K (P / 2πG)^{1/3} (M★ + m)^{2/3} by fixed-point iteration (it converges
 * in a few steps because m ≪ M★).
 */
export function minimumPlanetMass(semiAmplitudeMS: number, periodS: number, starMassKg: number): number {
  if (semiAmplitudeMS <= 0 || periodS <= 0) {
    return 0;
  }
  const factor = semiAmplitudeMS * (periodS / (2 * Math.PI * G_SI)) ** (1 / 3);
  let mass = factor * starMassKg ** (2 / 3);
  for (let i = 0; i < 30; i++) {
    const next = factor * (starMassKg + mass) ** (2 / 3);
    if (Math.abs(next - mass) <= 1e-12 * next) {
      return next;
    }
    mass = next;
  }
  return mass;
}

/** Unit vector from the system toward Earth. */
export function directionToEarth(inclinationRad: number, earthAzimuthRad: number): Vector3 {
  const s = Math.sin(inclinationRad);
  return new Vector3(s * Math.cos(earthAzimuthRad), s * Math.sin(earthAzimuthRad), Math.cos(inclinationRad));
}

/** Planet position relative to the barycentre, at orbital angle θ = 2π·phase. */
export function planetPosition(phase: number, planetRadius: number): Vector3 {
  const theta = 2 * Math.PI * phase;
  return new Vector3(planetRadius * Math.cos(theta), planetRadius * Math.sin(theta), 0);
}

/** Star position relative to the barycentre: always opposite the planet. */
export function starPosition(phase: number, starRadius: number): Vector3 {
  const theta = 2 * Math.PI * phase;
  return new Vector3(-starRadius * Math.cos(theta), -starRadius * Math.sin(theta), 0);
}

/** Star velocity about the barycentre (counter-clockwise, speed v★). */
export function starVelocity(phase: number, starSpeed: number): Vector3 {
  const theta = 2 * Math.PI * phase;
  return new Vector3(starSpeed * Math.sin(theta), -starSpeed * Math.cos(theta), 0);
}

/** Radial velocity of a body with this velocity, m/s; positive = moving away from Earth. */
export function radialVelocityOf(velocity: Vector3, toEarth: Vector3): number {
  return -velocity.dot(toEarth);
}

/**
 * The star's radial velocity at a phase, closed form: v_r = K sin(λ − θ), with
 * K = v★ sin i. Equals {@link radialVelocityOf}(starVelocity, directionToEarth).
 */
export function radialVelocityAtPhase(phase: number, semiAmplitudeMS: number, earthAzimuthRad: number): number {
  return semiAmplitudeMS * Math.sin(earthAzimuthRad - 2 * Math.PI * phase);
}
