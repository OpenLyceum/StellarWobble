/**
 * Tests for the Observatory screen's model and its planet signals.
 */

import { dotRandom } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import { ObservatoryModel } from "../src/observatory/model/ObservatoryModel.js";
import { ObservatoryTarget } from "../src/observatory/model/ObservatoryTarget.js";
import {
  randomMysterySignal,
  referenceSignal,
  signalMinimumMass,
  signalVelocity,
} from "../src/observatory/model/PlanetSignal.js";
import { FIT_PERIOD_STEP_DECADES } from "../src/StellarWobbleConstants.js";

describe("PlanetSignal", () => {
  it("gives 51 Peg b its published minimum mass (≈ 0.47 M_J)", () => {
    expect(signalMinimumMass(referenceSignal(ObservatoryTarget.FIFTY_ONE_PEG))).toBeCloseTo(0.47, 1);
  });

  it.each([
    // NASA Exoplanet Archive (pscomppars) minimum masses, Jupiter masses.
    [ObservatoryTarget.HD_189733, 1.16],
    [ObservatoryTarget.HD_179949, 0.916],
    [ObservatoryTarget.HD_209458, 0.699],
    [ObservatoryTarget.HD_46375, 0.226],
    [ObservatoryTarget.GLIESE_436, 0.0672],
    [ObservatoryTarget.PROXIMA_CENTAURI, 0.00332],
  ])("gives %s its published minimum mass (%f M_J) within 5 %%", (target, published) => {
    expect(signalMinimumMass(referenceSignal(target)) / published).toBeCloseTo(1, 1);
  });

  it("gives every real target a period short enough to cover several orbits in a few weeks", () => {
    for (const target of ObservatoryTarget.enumeration.values) {
      if (
        target !== ObservatoryTarget.MYSTERY &&
        target !== ObservatoryTarget.SUN_JUPITER &&
        target !== ObservatoryTarget.SUN_EARTH
      ) {
        expect(referenceSignal(target).period).toBeLessThan(12);
      }
    }
  });

  it("gives the Sun's wobble from Jupiter one Jupiter mass, and from Earth one Earth mass", () => {
    expect(signalMinimumMass(referenceSignal(ObservatoryTarget.SUN_JUPITER))).toBeCloseTo(1, 1);
    expect(signalMinimumMass(referenceSignal(ObservatoryTarget.SUN_EARTH)) * 317.8).toBeCloseTo(1, 1);
  });

  it("keeps mystery signals measurable", () => {
    dotRandom.setSeed(7);
    for (let i = 0; i < 50; i++) {
      const signal = randomMysterySignal();
      expect(signal.amplitude).toBeGreaterThanOrEqual(8);
      expect(signal.amplitude).toBeLessThanOrEqual(200);
      expect(signal.period).toBeGreaterThanOrEqual(2);
      expect(signal.period).toBeLessThanOrEqual(400);
    }
  });

  it("is a sine of amplitude K and period P", () => {
    const signal = { period: 10, amplitude: 30, phase: 0 };
    expect(signalVelocity(signal, 2.5)).toBeCloseTo(30, 9);
    expect(signalVelocity(signal, 7.5)).toBeCloseTo(-30, 9);
    expect(signalVelocity(signal, 12.5)).toBeCloseTo(30, 9);
  });
});

describe("ObservatoryModel", () => {
  it("adds one measurement per night with the chosen error bar", () => {
    const model = new ObservatoryModel();
    model.precisionProperty.value = 10;
    model.cadenceProperty.value = 5;
    model.observe(10);
    expect(model.measurements.length).toBe(10);
    expect(model.measurementCountProperty.value).toBe(10);
    expect(model.measurements.every((measurement) => measurement.uncertainty === 10)).toBe(true);
    const times = model.measurements.map((measurement) => measurement.time);
    expect(times.every((time, i) => i === 0 || time > (times[i - 1] ?? 0))).toBe(true);
    // Five days apart, plus cloudy nights and up to ±0.2 day of jitter.
    expect((times[9] ?? 0) - (times[0] ?? 0)).toBeGreaterThanOrEqual(45 - 0.4);
  });

  it("finds the scatter about the true curve close to the noise", () => {
    dotRandom.setSeed(3);
    const model = new ObservatoryModel();
    model.targetProperty.value = ObservatoryTarget.FIFTY_ONE_PEG;
    model.precisionProperty.value = 3;
    model.observe(200);
    const signal = model.signalProperty.value;
    model.fitPeriodProperty.value = signal.period;
    model.fitAmplitudeProperty.value = signal.amplitude;
    model.fitPhaseProperty.value = signal.phase;
    expect(model.residualProperty.value).not.toBeNull();
    expect(model.residualProperty.value ?? 0).toBeGreaterThan(2.4);
    expect(model.residualProperty.value ?? 0).toBeLessThan(3.6);
    // About one error bar.
    expect(model.normalizedResidualProperty.value ?? 0).toBeGreaterThan(0.8);
    expect(model.normalizedResidualProperty.value ?? 0).toBeLessThan(1.2);
    // A wrong model is much worse.
    model.fitAmplitudeProperty.value = 0.05;
    expect(model.residualProperty.value ?? 0).toBeGreaterThan(30);
    expect(model.normalizedResidualProperty.value ?? 0).toBeGreaterThan(10);
  });

  it("adds stellar jitter that the error bars do not include", () => {
    dotRandom.setSeed(5);
    const model = new ObservatoryModel();
    model.targetProperty.value = ObservatoryTarget.FIFTY_ONE_PEG;
    model.precisionProperty.value = 1;
    model.jitterProperty.value = true;
    model.observe(200);
    const signal = model.signalProperty.value;
    model.fitPeriodProperty.value = signal.period;
    model.fitAmplitudeProperty.value = signal.amplitude;
    model.fitPhaseProperty.value = signal.phase;
    expect(model.measurements.every((measurement) => measurement.uncertainty === 1)).toBe(true);
    // √(1² + 2²) ≈ 2.24 error bars even for the true curve.
    expect(model.normalizedResidualProperty.value ?? 0).toBeGreaterThan(1.8);
    expect(model.normalizedResidualProperty.value ?? 0).toBeLessThan(2.7);
  });

  it("finds 51 Peg b's period from the periodogram's highest peak", () => {
    dotRandom.setSeed(6);
    const model = new ObservatoryModel();
    model.targetProperty.value = ObservatoryTarget.FIFTY_ONE_PEG;
    expect(model.peakPeriod()).toBeNull();
    model.observe(4);
    expect(model.periodogram()).toBeNull();
    model.observe(60);
    model.usePeakPeriod();
    expect(model.fitPeriodProperty.value).toBeCloseTo(4.2308, 2);
    // A period range limits the search (here to an alias-free stretch without the planet).
    const other = model.peakPeriod(100, 5000);
    expect(other).not.toBeNull();
    expect(other ?? 0).toBeGreaterThanOrEqual(100);
  });

  it("recomputes the periodogram when the data change", () => {
    const model = new ObservatoryModel();
    model.observe(10);
    const first = model.periodogram();
    expect(model.periodogram()).toBe(first);
    model.observe(1);
    expect(model.periodogram()).not.toBe(first);
  });

  it("steps the period finely enough to fold 300 nights of 51 Peg data", () => {
    // One arrow click at P = 4.23 d shifts the fit by T·ΔP/P² orbits over a T-day run.
    const period = 4.2308;
    const step = period * (10 ** FIT_PERIOD_STEP_DECADES - 1);
    expect((300 * step) / period ** 2).toBeLessThan(0.01);
  });

  it("infers the minimum mass from the fitted period and amplitude", () => {
    const model = new ObservatoryModel();
    model.targetProperty.value = ObservatoryTarget.FIFTY_ONE_PEG;
    model.fitPeriodProperty.value = 4.2308;
    model.fitAmplitudeProperty.value = 55.9;
    expect(model.inferredMassProperty.value).toBeCloseTo(0.47, 1);
  });

  it("clears the data and hides the answer when the target changes", () => {
    const model = new ObservatoryModel();
    model.observe(5);
    model.revealProperty.value = true;
    model.targetProperty.value = ObservatoryTarget.SUN_EARTH;
    expect(model.measurements.length).toBe(0);
    expect(model.revealProperty.value).toBe(false);
    expect(model.residualProperty.value).toBeNull();
  });

  it("resets to a fresh mystery star with no data", () => {
    const model = new ObservatoryModel();
    model.targetProperty.value = ObservatoryTarget.SUN_JUPITER;
    model.observe(3);
    model.reset();
    expect(model.targetProperty.value).toBe(ObservatoryTarget.MYSTERY);
    expect(model.measurements.length).toBe(0);
  });
});
