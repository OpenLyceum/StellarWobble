/**
 * starAppearance.ts
 *
 * Approximate main-sequence properties used only for drawing the star: its
 * effective temperature (hence colour) and its relative size, from its mass.
 * Over 0.5–1.5 M☉ the scalings L ∝ M⁴ and R ∝ M^0.8 give
 * T = T☉ · M^0.6 (≈ 3800 K at 0.5 M☉, ≈ 7000 K at 1.5 M☉).
 */

import { SUN_TEMPERATURE_K } from "../../StellarWobbleConstants.js";

/** Effective temperature of a main-sequence star of this mass (solar masses), K. */
export function starTemperature(massSolar: number): number {
  return SUN_TEMPERATURE_K * massSolar ** 0.6;
}

/** Radius relative to the Sun's. */
export function starRadiusSolar(massSolar: number): number {
  return massSolar ** 0.8;
}
