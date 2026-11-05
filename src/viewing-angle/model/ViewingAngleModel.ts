/**
 * ViewingAngleModel.ts
 *
 * Model for the Viewing Angle screen: the same star–planet system, but the
 * user chooses where Earth is: the orbit's inclination to our line of sight
 * (90° edge-on … 0° face-on) and Earth's direction within the orbital plane.
 * The signal shrinks as K = v★ sin i, and the mass we infer from it is the
 * minimum mass Mp sin i.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { OrbitalSystem } from "../../common/model/OrbitalSystem.js";
import { minimumPlanetMass } from "../../common/model/orbitPhysics.js";
import { JUPITER_MASS_KG, SUN_MASS_KG } from "../../StellarWobbleConstants.js";

/** Initial inclination, degrees. */
const INITIAL_INCLINATION = 60;

/** Initial Earth direction, degrees (toward model −y, as on the Wobble screen). */
const INITIAL_EARTH_AZIMUTH = 270;

export class ViewingAngleModel implements TModel {
  public readonly system = new OrbitalSystem({
    inclination: INITIAL_INCLINATION,
    earthAzimuth: INITIAL_EARTH_AZIMUTH,
  });

  /** The planet mass an observer infers from K and P, Jupiter masses (= true mass × sin i). */
  public readonly minimumMassProperty: TReadOnlyProperty<number>;

  public constructor() {
    const system = this.system;
    this.minimumMassProperty = new DerivedProperty(
      [system.semiAmplitudeProperty, system.periodProperty, system.starMassProperty],
      (amplitude, period, starMass) => minimumPlanetMass(amplitude, period, starMass * SUN_MASS_KG) / JUPITER_MASS_KG,
    );
  }

  public reset(): void {
    this.system.reset();
  }

  public step(dt: number): void {
    this.system.step(dt);
  }
}
