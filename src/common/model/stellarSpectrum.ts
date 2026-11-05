/**
 * stellarSpectrum.ts
 *
 * The star's visible absorption spectrum and its Doppler shift.
 *
 * The continuum is normalised to 1 (astronomers divide it out before measuring
 * line positions), and each absorption line is a Gaussian dip. A star moving
 * along the line of sight with radial velocity v_r shifts every line by the same
 * fraction (non-relativistic Doppler, valid for v ≪ c):
 *
 *   λ_observed = λ_rest · (1 + v_r / c),   Δλ / λ_rest = v_r / c.
 *
 * Positive v_r (receding) gives a longer wavelength, a redshift.
 * Wavelengths are in nm (air), velocities in m/s.
 */

import { SPEED_OF_LIGHT } from "../../StellarWobbleConstants.js";

/** One stellar absorption line. */
export type AbsorptionLine = {
  /** Label drawn next to the line (element symbols are not translated). */
  readonly label: string;
  /** Laboratory (rest) wavelength in air, nm. */
  readonly restWavelength: number;
  /** Fractional depth at line centre, 0–1. */
  readonly depth: number;
  /** Intrinsic Gaussian σ, nm. */
  readonly sigma: number;
};

/** Hydrogen-alpha, the line shown in the zoom windows. */
export const H_ALPHA: AbsorptionLine = { label: "Hα", restWavelength: 656.28, depth: 0.75, sigma: 0.12 };

/** Hydrogen-beta, the second zoomed line. */
export const H_BETA: AbsorptionLine = { label: "Hβ", restWavelength: 486.13, depth: 0.7, sigma: 0.1 };

/** Prominent absorption lines of a Sun-like star in the 380–700 nm window. */
export const STELLAR_LINES: readonly AbsorptionLine[] = [
  { label: "Ca II K", restWavelength: 393.37, depth: 0.85, sigma: 0.12 },
  { label: "Ca II H", restWavelength: 396.85, depth: 0.8, sigma: 0.12 },
  { label: "Hδ", restWavelength: 410.17, depth: 0.6, sigma: 0.1 },
  { label: "Hγ", restWavelength: 434.05, depth: 0.65, sigma: 0.1 },
  { label: "Fe", restWavelength: 438.35, depth: 0.45, sigma: 0.05 },
  H_BETA,
  { label: "Mg", restWavelength: 516.73, depth: 0.5, sigma: 0.06 },
  { label: "Mg", restWavelength: 517.27, depth: 0.55, sigma: 0.06 },
  { label: "Mg", restWavelength: 518.36, depth: 0.6, sigma: 0.06 },
  { label: "Fe", restWavelength: 527.04, depth: 0.4, sigma: 0.05 },
  { label: "Na D", restWavelength: 589.0, depth: 0.7, sigma: 0.06 },
  { label: "Na D", restWavelength: 589.59, depth: 0.65, sigma: 0.06 },
  H_ALPHA,
];

/** Observed wavelength of a line emitted at restWavelength by a source with radial velocity vr, nm. */
export function shiftedWavelength(restWavelength: number, radialVelocity: number): number {
  return restWavelength * (1 + radialVelocity / SPEED_OF_LIGHT);
}

/** Doppler shift Δλ = λ_rest · v_r / c, nm. */
export function dopplerShift(restWavelength: number, radialVelocity: number): number {
  return (restWavelength * radialVelocity) / SPEED_OF_LIGHT;
}

/** The radial velocity that would produce a shift Δλ on a line at restWavelength, m/s. */
export function radialVelocityFromShift(restWavelength: number, shift: number): number {
  return (shift / restWavelength) * SPEED_OF_LIGHT;
}

/**
 * Normalised intensity (continuum = 1) at wavelength nm of a star with radial
 * velocity vr. `minSigma` broadens each line to at least that σ, nm, so a
 * coarse display (one pixel ≈ 0.5 nm) still shows the lines.
 */
export function spectrumIntensity(
  wavelength: number,
  radialVelocity: number,
  lines: readonly AbsorptionLine[] = STELLAR_LINES,
  minSigma = 0,
): number {
  let intensity = 1;
  for (const line of lines) {
    const sigma = Math.max(line.sigma, minSigma);
    const t = (wavelength - shiftedWavelength(line.restWavelength, radialVelocity)) / sigma;
    if (Math.abs(t) < 6) {
      intensity *= 1 - line.depth * Math.exp(-0.5 * t * t);
    }
  }
  return intensity;
}

/**
 * The magnification that makes the largest expected shift of a line visible in
 * a zoom window: the biggest "nice" factor (1, 2 or 5 × 10ⁿ, at least 1) that
 * keeps maxShift × factor within `limit` nm.
 */
export function shiftMagnification(maxShift: number, limit: number): number {
  if (!(maxShift > 0 && Number.isFinite(maxShift))) {
    return 1;
  }
  const ideal = limit / maxShift;
  if (ideal < 1) {
    return 1;
  }
  const decade = 10 ** Math.floor(Math.log10(ideal));
  const mantissa = ideal / decade;
  return decade * (mantissa >= 5 ? 5 : mantissa >= 2 ? 2 : 1);
}
