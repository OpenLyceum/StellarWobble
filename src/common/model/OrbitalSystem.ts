/**
 * OrbitalSystem.ts
 *
 * A star and one planet on circular orbits about their barycentre, seen from
 * Earth along a chosen direction. Shared by the Wobble and Viewing Angle
 * screens (each screen owns its own instance).
 *
 * Parameters are in display units (M☉, M_J, AU, degrees); derived physical
 * quantities are SI. The animation clock runs in orbits rather than seconds,
 * so every orbit takes SECONDS_PER_ORBIT of wall-clock time at normal speed,
 * whether its period is a day or a decade. The radial-velocity trace converts
 * orbits to days with the period.
 */

import {
  DerivedProperty,
  Emitter,
  EnumerationProperty,
  Multilink,
  NumberProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { TimeSpeed } from "scenerystack/scenery-phet";
import {
  AU_M,
  DISTANCE_DEFAULT,
  DISTANCE_RANGE,
  EARTH_AZIMUTH_RANGE,
  FAST_SPEED_FACTOR,
  INCLINATION_RANGE,
  JUPITER_MASS_KG,
  PLANET_MASS_DEFAULT,
  PLANET_MASS_RANGE,
  SECONDS_PER_ORBIT,
  SLOW_SPEED_FACTOR,
  STAR_MASS_DEFAULT,
  STAR_MASS_RANGE,
  SUN_MASS_KG,
  TRACE_ORBITS,
  TRACE_SAMPLES_PER_ORBIT,
} from "../../StellarWobbleConstants.js";
import { TimeModel } from "../TimeModel.js";
import {
  orbitalPeriod,
  planetOrbitRadius,
  radialVelocityAtPhase,
  semiAmplitude,
  starOrbitalSpeed,
  starOrbitRadius,
} from "./orbitPhysics.js";

const DEG = Math.PI / 180;

export type OrbitalSystemOptions = {
  /** Initial inclination, degrees (90 = edge-on). */
  inclination?: number;
  /** Initial Earth azimuth in the orbital plane, degrees. */
  earthAzimuth?: number;
};

export class OrbitalSystem {
  /** Star mass, solar masses. */
  public readonly starMassProperty = new NumberProperty(STAR_MASS_DEFAULT, { range: STAR_MASS_RANGE });

  /** Planet mass, Jupiter masses. */
  public readonly planetMassProperty = new NumberProperty(PLANET_MASS_DEFAULT, { range: PLANET_MASS_RANGE });

  /** Star–planet distance, AU. */
  public readonly distanceProperty = new NumberProperty(DISTANCE_DEFAULT, { range: DISTANCE_RANGE });

  /** Inclination, degrees: 0 = face-on, 90 = edge-on. */
  public readonly inclinationProperty: NumberProperty;

  /** Earth's direction within the orbital plane, degrees. */
  public readonly earthAzimuthProperty: NumberProperty;

  /** Play/pause clock (starts playing). */
  public readonly timer = new TimeModel(true);

  public readonly timeSpeedProperty = new EnumerationProperty(TimeSpeed.NORMAL);

  /** Orbits completed since the start (continuous, not wrapped). */
  public readonly orbitsProperty = new NumberProperty(0);

  /** Orbital phase 0–1: the planet's angle from +x divided by 2π. */
  public readonly phaseProperty: TReadOnlyProperty<number>;

  /** Orbital period, s. */
  public readonly periodProperty: TReadOnlyProperty<number>;

  /** Radii of the star's and the planet's orbits about the barycentre, m. */
  public readonly starOrbitRadiusProperty: TReadOnlyProperty<number>;
  public readonly planetOrbitRadiusProperty: TReadOnlyProperty<number>;

  /** The star's and the planet's orbital speeds about the barycentre, m/s. */
  public readonly starSpeedProperty: TReadOnlyProperty<number>;
  public readonly planetSpeedProperty: TReadOnlyProperty<number>;

  /** Radial-velocity semi-amplitude K seen from Earth, m/s. */
  public readonly semiAmplitudeProperty: TReadOnlyProperty<number>;

  /** K an edge-on observer would see (the star's full speed), m/s. */
  public readonly edgeOnAmplitudeProperty: TReadOnlyProperty<number>;

  /** The star's current radial velocity, m/s (positive = away from Earth). */
  public readonly radialVelocityProperty: TReadOnlyProperty<number>;

  /**
   * Radial-velocity history since the last parameter change: x = orbits since
   * the trace started, y = radial velocity (m/s). Cleared after TRACE_ORBITS.
   */
  public readonly trace: Vector2[] = [];

  /** Fires when {@link trace} changes. */
  public readonly traceChangedEmitter = new Emitter();

  /** Orbits value at which the current trace started. */
  private traceStart = 0;

  private readonly parameterMultilink;

  public constructor(options?: OrbitalSystemOptions) {
    this.inclinationProperty = new NumberProperty(options?.inclination ?? 90, { range: INCLINATION_RANGE });
    this.earthAzimuthProperty = new NumberProperty(options?.earthAzimuth ?? 270, { range: EARTH_AZIMUTH_RANGE });

    const starKg = (mass: number): number => mass * SUN_MASS_KG;
    const planetKg = (mass: number): number => mass * JUPITER_MASS_KG;

    this.phaseProperty = new DerivedProperty([this.orbitsProperty], (orbits) => ((orbits % 1) + 1) % 1);
    const massesAndDistance = [this.starMassProperty, this.planetMassProperty, this.distanceProperty] as const;
    this.periodProperty = new DerivedProperty(massesAndDistance, (star, planet, distance) =>
      orbitalPeriod(starKg(star), planetKg(planet), distance * AU_M),
    );
    this.starOrbitRadiusProperty = new DerivedProperty(massesAndDistance, (star, planet, distance) =>
      starOrbitRadius(starKg(star), planetKg(planet), distance * AU_M),
    );
    this.planetOrbitRadiusProperty = new DerivedProperty(massesAndDistance, (star, planet, distance) =>
      planetOrbitRadius(starKg(star), planetKg(planet), distance * AU_M),
    );
    this.starSpeedProperty = new DerivedProperty(massesAndDistance, (star, planet, distance) =>
      starOrbitalSpeed(starKg(star), planetKg(planet), distance * AU_M),
    );
    this.planetSpeedProperty = new DerivedProperty(
      [this.planetOrbitRadiusProperty, this.periodProperty],
      (radius, period) => (2 * Math.PI * radius) / period,
    );
    this.edgeOnAmplitudeProperty = this.starSpeedProperty;
    this.semiAmplitudeProperty = new DerivedProperty(
      [...massesAndDistance, this.inclinationProperty],
      (star, planet, distance, inclination) =>
        semiAmplitude(starKg(star), planetKg(planet), distance * AU_M, inclination * DEG),
    );
    this.radialVelocityProperty = new DerivedProperty(
      [this.phaseProperty, this.semiAmplitudeProperty, this.earthAzimuthProperty],
      (phase, amplitude, azimuth) => radialVelocityAtPhase(phase, amplitude, azimuth * DEG),
    );

    // A new system (or a new viewpoint) starts a new trace.
    this.parameterMultilink = Multilink.lazyMultilink(
      [...massesAndDistance, this.inclinationProperty, this.earthAzimuthProperty],
      () => this.restartTrace(),
    );
    this.restartTrace();
  }

  /** Speed factor of the selected time speed. */
  private get speedFactor(): number {
    const speed = this.timeSpeedProperty.value;
    return speed === TimeSpeed.SLOW ? SLOW_SPEED_FACTOR : speed === TimeSpeed.FAST ? FAST_SPEED_FACTOR : 1;
  }

  /** Clears the radial-velocity trace and starts a new one at the current time. */
  public restartTrace(): void {
    this.trace.length = 0;
    this.traceStart = this.orbitsProperty.value;
    this.trace.push(new Vector2(0, this.radialVelocityProperty.value));
    this.traceChangedEmitter.emit();
  }

  /** Advances the clock by dt seconds of wall-clock time (scaled by the time speed). */
  public advance(dt: number): void {
    const sampleStep = 1 / TRACE_SAMPLES_PER_ORBIT;
    let remaining = (dt * this.speedFactor) / SECONDS_PER_ORBIT;
    // Sub-steps no longer than one sample, so a fast frame still draws a smooth curve.
    while (remaining > 0) {
      const delta = Math.min(sampleStep, remaining);
      remaining -= delta;
      this.orbitsProperty.value += delta;
      if (this.orbitsProperty.value - this.traceStart > TRACE_ORBITS) {
        // Sweep display: once the chart is full, start again from its left edge.
        this.trace.length = 0;
        this.traceStart += TRACE_ORBITS;
      }
      const elapsed = this.orbitsProperty.value - this.traceStart;
      const last = this.trace[this.trace.length - 1];
      if (!last || elapsed - last.x >= sampleStep / 4) {
        this.trace.push(new Vector2(elapsed, this.radialVelocityProperty.value));
      }
    }
    this.traceChangedEmitter.emit();
  }

  public step(dt: number): void {
    if (this.timer.isPlayingProperty.value) {
      this.advance(dt);
    }
  }

  /** Orbits elapsed since the current trace started. */
  public get traceElapsedOrbits(): number {
    return this.orbitsProperty.value - this.traceStart;
  }

  public reset(): void {
    this.starMassProperty.reset();
    this.planetMassProperty.reset();
    this.distanceProperty.reset();
    this.inclinationProperty.reset();
    this.earthAzimuthProperty.reset();
    this.timer.reset();
    this.timeSpeedProperty.reset();
    this.orbitsProperty.reset();
    this.restartTrace();
  }

  public dispose(): void {
    this.parameterMultilink.dispose();
    this.timer.dispose();
  }
}
