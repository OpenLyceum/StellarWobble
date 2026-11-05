/**
 * PlanetSignal.ts
 *
 * The radial-velocity signal of one planet on a circular orbit, in the form an
 * observer fits: v_r(t) = K sin(2π (t / P − φ)), with t and P in days, K in m/s
 * and φ (phase) in 0–1. Also builds the signals of the Observatory targets.
 */

import { dotRandom } from "scenerystack/dot";
import { minimumPlanetMass, semiAmplitudeFromPeriod } from "../../common/model/orbitPhysics.js";
import { DAY_S, JUPITER_MASS_KG, SUN_MASS_KG } from "../../StellarWobbleConstants.js";
import { ObservatoryTarget } from "./ObservatoryTarget.js";

export type PlanetSignal = {
  /** Star mass, solar masses (known to the observer from the star's spectrum). */
  readonly starMass: number;
  /** Orbital period, days. */
  readonly period: number;
  /** Semi-amplitude K, m/s. */
  readonly amplitude: number;
  /** Phase φ, 0–1. */
  readonly phase: number;
};

/** Radial velocity of a signal at time t (days), m/s. */
export function signalVelocity(signal: Omit<PlanetSignal, "starMass">, time: number): number {
  return signal.amplitude * Math.sin(2 * Math.PI * (time / signal.period - signal.phase));
}

/** The minimum planet mass Mp sin i of a signal, Jupiter masses. */
export function signalMinimumMass(signal: PlanetSignal): number {
  return minimumPlanetMass(signal.amplitude, signal.period * DAY_S, signal.starMass * SUN_MASS_KG) / JUPITER_MASS_KG;
}

/** Mystery-star limits: the generated K stays in this range (m/s). */
const MYSTERY_AMPLITUDE_RANGE = { min: 8, max: 200 } as const;

/** A log-uniform random number in [min, max]. */
function logUniform(min: number, max: number): number {
  return min * (max / min) ** dotRandom.nextDouble();
}

/**
 * A random star (0.7–1.3 M☉) with a random planet (0.1–10 M_J, period 2–400 days)
 * seen at a random tilt (directions uniform on the sky, so cos i is uniform),
 * kept only if its K is comfortably measurable.
 */
export function randomMysterySignal(): PlanetSignal {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const starMass = 0.7 + 0.6 * dotRandom.nextDouble();
    const planetMass = logUniform(0.1, 10);
    const period = logUniform(2, 400);
    const inclination = Math.acos(dotRandom.nextDouble());
    const amplitude = semiAmplitudeFromPeriod(
      starMass * SUN_MASS_KG,
      planetMass * JUPITER_MASS_KG,
      period * DAY_S,
      inclination,
    );
    if (amplitude >= MYSTERY_AMPLITUDE_RANGE.min && amplitude <= MYSTERY_AMPLITUDE_RANGE.max) {
      return {
        starMass: Math.round(starMass * 100) / 100,
        period: period,
        amplitude: amplitude,
        phase: dotRandom.nextDouble(),
      };
    }
  }
  return { starMass: 1, period: 30, amplitude: 40, phase: 0.3 };
}

/** The signal of a reference target (not the mystery star). */
export function referenceSignal(target: ObservatoryTarget): PlanetSignal {
  if (target === ObservatoryTarget.FIFTY_ONE_PEG) {
    // Mayor & Queloz (1995), refined: P = 4.2308 d, K = 55.9 m/s, M★ = 1.11 M☉.
    return { starMass: 1.11, period: 4.2308, amplitude: 55.9, phase: 0.2 };
  }
  if (target === ObservatoryTarget.SUN_JUPITER) {
    return { starMass: 1, period: 4332.6, amplitude: 12.5, phase: 0.6 };
  }
  // Sun + Earth.
  return { starMass: 1, period: 365.25, amplitude: 0.0895, phase: 0.1 };
}
