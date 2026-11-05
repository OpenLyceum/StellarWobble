/**
 * Tests for the shared OrbitalSystem model (Wobble and Viewing Angle screens).
 */

import { describe, expect, it } from "vitest";
import { OrbitalSystem } from "../src/common/model/OrbitalSystem.js";
import { DAY_S, SECONDS_PER_ORBIT, TRACE_ORBITS } from "../src/StellarWobbleConstants.js";

describe("OrbitalSystem", () => {
  it("defaults to Jupiter's mass at 1 AU from a Sun: a one-year orbit and a 28 m/s wobble", () => {
    const system = new OrbitalSystem();
    expect(system.periodProperty.value / DAY_S).toBeCloseTo(365, -1);
    expect(system.semiAmplitudeProperty.value).toBeCloseTo(28.4, 0);
    system.dispose();
  });

  it("balances momentum: M★ v★ = Mp vp", () => {
    const system = new OrbitalSystem();
    system.planetMassProperty.value = 5;
    system.starMassProperty.value = 0.8;
    const ratio = system.starSpeedProperty.value / system.planetSpeedProperty.value;
    expect(ratio).toBeCloseTo((5 * 1.898e27) / (0.8 * 1.989e30), 10);
    system.dispose();
  });

  it("scales the signal with sin i and loses it face-on", () => {
    const system = new OrbitalSystem();
    const edgeOn = system.semiAmplitudeProperty.value;
    system.inclinationProperty.value = 30;
    expect(system.semiAmplitudeProperty.value).toBeCloseTo(edgeOn / 2, 6);
    expect(system.edgeOnAmplitudeProperty.value).toBeCloseTo(edgeOn, 6);
    system.inclinationProperty.value = 0;
    expect(system.semiAmplitudeProperty.value).toBeCloseTo(0, 12);
    for (const phase of [0.1, 0.4, 0.75]) {
      system.orbitsProperty.value = phase;
      expect(system.radialVelocityProperty.value).toBeCloseTo(0, 12);
    }
    system.dispose();
  });

  it("advances one orbit in SECONDS_PER_ORBIT of wall-clock time and records a trace", () => {
    const system = new OrbitalSystem();
    for (let i = 0; i < SECONDS_PER_ORBIT * 60; i++) {
      system.step(1 / 60);
    }
    expect(system.orbitsProperty.value).toBeCloseTo(1, 6);
    expect(system.trace.length).toBeGreaterThan(100);
    // The trace swings between ±K.
    const velocities = system.trace.map((point) => point.y);
    expect(Math.max(...velocities)).toBeCloseTo(system.semiAmplitudeProperty.value, 0);
    expect(Math.min(...velocities)).toBeCloseTo(-system.semiAmplitudeProperty.value, 0);
    system.dispose();
  });

  it("starts the trace again when the chart is full or a parameter changes", () => {
    const system = new OrbitalSystem();
    system.advance(SECONDS_PER_ORBIT * (TRACE_ORBITS + 0.5));
    expect(system.traceElapsedOrbits).toBeCloseTo(0.5, 6);
    expect(Math.max(...system.trace.map((point) => point.x))).toBeLessThanOrEqual(0.5 + 1e-9);
    system.planetMassProperty.value = 2;
    expect(system.trace.length).toBe(1);
    system.dispose();
  });

  it("does not advance while paused", () => {
    const system = new OrbitalSystem();
    system.timer.isPlayingProperty.value = false;
    system.step(1);
    expect(system.orbitsProperty.value).toBe(0);
    system.dispose();
  });
});
