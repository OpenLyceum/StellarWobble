/**
 * Doppler-shift and spectrum checks for stellarSpectrum.ts.
 */

import { describe, expect, it } from "vitest";
import {
  dopplerShift,
  H_ALPHA,
  radialVelocityFromShift,
  shiftedWavelength,
  shiftMagnification,
  spectrumIntensity,
} from "../src/common/model/stellarSpectrum.js";

describe("stellarSpectrum", () => {
  it("shifts Hα by +0.066 nm for a star receding at 30 km/s", () => {
    expect(dopplerShift(656.28, 30_000)).toBeCloseTo(0.0657, 4);
    expect(shiftedWavelength(656.28, 30_000)).toBeGreaterThan(656.28);
  });

  it("blueshifts an approaching star", () => {
    expect(shiftedWavelength(486.13, -50_000)).toBeLessThan(486.13);
  });

  it("round-trips a shift back to the radial velocity", () => {
    expect(radialVelocityFromShift(656.28, dopplerShift(656.28, 12.5))).toBeCloseTo(12.5, 9);
  });

  it("puts the line minimum at the shifted wavelength", () => {
    const vr = 200_000;
    const center = shiftedWavelength(H_ALPHA.restWavelength, vr);
    const atCenter = spectrumIntensity(center, vr, [H_ALPHA]);
    expect(atCenter).toBeCloseTo(1 - H_ALPHA.depth, 6);
    expect(spectrumIntensity(center + 0.05, vr, [H_ALPHA])).toBeGreaterThan(atCenter);
    expect(spectrumIntensity(center - 0.05, vr, [H_ALPHA])).toBeGreaterThan(atCenter);
    expect(spectrumIntensity(center + 3, vr, [H_ALPHA])).toBeCloseTo(1, 6);
  });

  it("picks a 1-2-5 magnification that keeps the drawn shift in the window", () => {
    expect(shiftMagnification(0.66, 0.7)).toBe(1);
    // A 10 m/s wobble on Hα is 2.2e-5 nm: magnified ×20 000 it is 0.44 nm.
    const tiny = dopplerShift(656.28, 10);
    const magnification = shiftMagnification(tiny, 0.7);
    expect(magnification).toBe(20_000);
    expect(tiny * magnification).toBeLessThanOrEqual(0.7);
    expect(shiftMagnification(0, 0.7)).toBe(1);
  });
});
