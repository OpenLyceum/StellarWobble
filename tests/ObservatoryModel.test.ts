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

describe("PlanetSignal", () => {
  it("gives 51 Peg b its published minimum mass (≈ 0.47 M_J)", () => {
    expect(signalMinimumMass(referenceSignal(ObservatoryTarget.FIFTY_ONE_PEG))).toBeCloseTo(0.47, 1);
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
    // A wrong model is much worse.
    model.fitAmplitudeProperty.value = 0;
    expect(model.residualProperty.value ?? 0).toBeGreaterThan(30);
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
