/**
 * DopplerModel.ts
 *
 * Model for the Doppler screen: a star with a velocity the user sets, split
 * into a radial part (along the line of sight to Earth) and a sideways part
 * (across the sky). Only the radial part shifts the star's spectral lines.
 *
 * Two speed scales share the screen: a fast-moving star (±300 km/s, the shift is
 * visible to scale in the zoom windows) and planet-sized speeds (±100 m/s, the
 * shift must be magnified to be seen). Each scale keeps its own slider values so
 * switching back and forth does not lose them.
 *
 * Sign convention: positive radial velocity = moving away from Earth = redshift.
 */

import { BooleanProperty, DerivedProperty, NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { dopplerShift, H_ALPHA, shiftMagnification } from "../../common/model/stellarSpectrum.js";
import { TimeModel } from "../../common/TimeModel.js";
import {
  STAR_SPEED_RANGE_KMS,
  WOBBLE_SPEED_RANGE_MS,
  ZOOM_HALF_WIDTH_NM,
  ZOOM_MAX_SHIFT_FRACTION,
} from "../../StellarWobbleConstants.js";

export class DopplerModel implements TModel {
  /** Animation clock for the wave picture (starts playing). */
  public readonly timer = new TimeModel(true);

  /** Use planet-sized speeds (m/s) instead of a fast-moving star (km/s). */
  public readonly planetSpeedsProperty = new BooleanProperty(false);

  /** Fast-star scale: radial and sideways velocity, km/s. */
  public readonly radialVelocityKmsProperty = new NumberProperty(100, { range: STAR_SPEED_RANGE_KMS });
  public readonly sidewaysVelocityKmsProperty = new NumberProperty(0, { range: STAR_SPEED_RANGE_KMS });

  /** Planet-sized scale: radial and sideways velocity, m/s. */
  public readonly radialVelocityMsProperty = new NumberProperty(30, { range: WOBBLE_SPEED_RANGE_MS });
  public readonly sidewaysVelocityMsProperty = new NumberProperty(0, { range: WOBBLE_SPEED_RANGE_MS });

  /** The active radial velocity, m/s (positive = away from Earth). */
  public readonly radialVelocityProperty: TReadOnlyProperty<number>;

  /** The active sideways velocity, m/s (positive = to the right). */
  public readonly sidewaysVelocityProperty: TReadOnlyProperty<number>;

  /**
   * The velocity as a fraction of the active slider maximum, (sideways, radial).
   * Drives the (not-to-scale) wave picture and the velocity arrows.
   */
  public readonly velocityFractionProperty: TReadOnlyProperty<Vector2>;

  /** Factor by which the zoom windows magnify the drawn shift (1 for the fast-star scale). */
  public readonly magnificationProperty: TReadOnlyProperty<number>;

  public constructor() {
    this.radialVelocityProperty = new DerivedProperty(
      [this.planetSpeedsProperty, this.radialVelocityKmsProperty, this.radialVelocityMsProperty],
      (planetSpeeds, kms, ms) => (planetSpeeds ? ms : kms * 1000),
    );
    this.sidewaysVelocityProperty = new DerivedProperty(
      [this.planetSpeedsProperty, this.sidewaysVelocityKmsProperty, this.sidewaysVelocityMsProperty],
      (planetSpeeds, kms, ms) => (planetSpeeds ? ms : kms * 1000),
    );
    this.velocityFractionProperty = new DerivedProperty(
      [this.planetSpeedsProperty, this.radialVelocityProperty, this.sidewaysVelocityProperty],
      (planetSpeeds, radial, sideways) => {
        const max = planetSpeeds ? WOBBLE_SPEED_RANGE_MS.max : STAR_SPEED_RANGE_KMS.max * 1000;
        return new Vector2(sideways / max, radial / max);
      },
    );
    this.magnificationProperty = new DerivedProperty([this.planetSpeedsProperty], (planetSpeeds) => {
      const maxSpeed = planetSpeeds ? WOBBLE_SPEED_RANGE_MS.max : STAR_SPEED_RANGE_KMS.max * 1000;
      return shiftMagnification(
        dopplerShift(H_ALPHA.restWavelength, maxSpeed),
        ZOOM_MAX_SHIFT_FRACTION * ZOOM_HALF_WIDTH_NM,
      );
    });
  }

  public reset(): void {
    this.timer.reset();
    this.planetSpeedsProperty.reset();
    this.radialVelocityKmsProperty.reset();
    this.sidewaysVelocityKmsProperty.reset();
    this.radialVelocityMsProperty.reset();
    this.sidewaysVelocityMsProperty.reset();
  }

  public step(dt: number): void {
    this.timer.step(dt);
  }
}
