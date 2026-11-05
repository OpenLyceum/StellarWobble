/**
 * starAppearance.ts
 *
 * Approximate main-sequence properties used only for drawing the star: its
 * effective temperature (hence colour) and its relative size, from its mass.
 * Over 0.5–1.5 M☉ the scalings L ∝ M⁴ and R ∝ M^0.8 give
 * T = T☉ · M^0.6 (≈ 3800 K at 0.5 M☉, ≈ 7000 K at 1.5 M☉).
 */

import { Color } from "scenerystack/scenery";
import { SUN_TEMPERATURE_K } from "../../StellarWobbleConstants.js";

/** Effective temperature of a main-sequence star of this mass (solar masses), K. */
export function starTemperature(massSolar: number): number {
  return SUN_TEMPERATURE_K * massSolar ** 0.6;
}

/** Radius relative to the Sun's. */
export function starRadiusSolar(massSolar: number): number {
  return massSolar ** 0.8;
}

function clamp255(value: number): number {
  return Math.min(255, Math.max(0, value));
}

/**
 * Approximate visible colour of a blackbody at this temperature (K). Copied from
 * HabitableZones (Tanner Helland's polynomial fit, valid over 1000–40 000 K).
 */
export function blackbodyColor(temperatureK: number): Color {
  const clampedTemp = Math.min(40000, Math.max(1000, temperatureK));
  const logT = Math.log10(clampedTemp);
  const logT2 = logT * logT;
  const logT3 = logT * logT2;

  const red = clamp255(22686.34111 - logT * 15082.52755 + logT2 * 3375.333832 - logT3 * 252.4073853);
  const green =
    clampedTemp <= 6500
      ? -811.6499145 + logT * 36.97365953 + logT2 * 160.7861677 - logT3 * 25.57573664
      : 13836.23586 - logT * 9069.078214 + logT2 * 2015.254756 - logT3 * 149.7766966;
  const blue = clamp255(-11545.34298 + logT * 8529.658165 - logT2 * 2150.198586 + logT3 * 190.0306573);

  return new Color(Math.round(red), Math.round(clamp255(green)), Math.round(blue));
}
