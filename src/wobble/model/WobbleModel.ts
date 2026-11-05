/**
 * WobbleModel.ts
 *
 * Model for the Wobble screen: one star–planet system seen exactly edge-on,
 * with Earth toward the bottom of the top view. The user changes the planet's
 * mass, its distance, and the star's mass, and watches the star's radial
 * velocity swing.
 */

import type { TModel } from "scenerystack/joist";
import { OrbitalSystem } from "../../common/model/OrbitalSystem.js";
import { WOBBLE_EARTH_AZIMUTH } from "../../StellarWobbleConstants.js";

export class WobbleModel implements TModel {
  public readonly system = new OrbitalSystem({ inclination: 90, earthAzimuth: WOBBLE_EARTH_AZIMUTH });

  public reset(): void {
    this.system.reset();
  }

  public step(dt: number): void {
    this.system.step(dt);
  }
}
