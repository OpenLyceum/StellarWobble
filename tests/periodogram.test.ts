/**
 * Tests for the Lomb–Scargle periodogram of the Observatory screen.
 */

import { dotRandom } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import {
  lombScargle,
  type PeriodogramPoint,
  peakIndex,
  refinePeakPeriod,
} from "../src/observatory/model/periodogram.js";

/** Noisy samples of K sin(2π t / P) at uneven times. */
function sineData(period: number, amplitude: number, sigma: number, count: number): PeriodogramPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const time = i * 1.3 + 0.4 * dotRandom.nextDouble();
    return {
      time: time,
      value: amplitude * Math.sin((2 * Math.PI * time) / period) + sigma * dotRandom.nextGaussian(),
      uncertainty: sigma,
    };
  });
}

const OPTIONS = { minPeriod: 1, maxPeriod: 5000 };

describe("lombScargle", () => {
  it("needs at least three points with some scatter", () => {
    expect(lombScargle([], OPTIONS)).toBeNull();
    expect(
      lombScargle(
        [
          { time: 0, value: 1, uncertainty: 1 },
          { time: 1, value: 1, uncertainty: 1 },
          { time: 2, value: 1, uncertainty: 1 },
        ],
        OPTIONS,
      ),
    ).toBeNull();
  });

  it("gives power 1 at the period of a noiseless sine, and between 0 and 1 everywhere", () => {
    dotRandom.setSeed(1);
    const points = sineData(4.2308, 50, 0, 60);
    const periodogram = lombScargle(points, OPTIONS);
    expect(periodogram).not.toBeNull();
    if (!periodogram) {
      return;
    }
    const index = peakIndex(periodogram);
    expect(1 / (periodogram.frequencies[index] ?? 1)).toBeCloseTo(4.2308, 1);
    expect(periodogram.power[index] ?? 0).toBeGreaterThan(0.98);
    expect(periodogram.power.every((p) => p >= 0 && p <= 1)).toBe(true);
  });

  it("matches a direct evaluation (the rotation recurrence does not drift)", () => {
    dotRandom.setSeed(2);
    const points = sineData(17, 10, 3, 120);
    const periodogram = lombScargle(points, OPTIONS);
    if (!periodogram) {
      throw new Error("expected a periodogram");
    }
    const last = periodogram.frequencies.length - 1;
    // A fresh run whose lowest frequency is the last one of the grid evaluates it directly.
    const direct = lombScargle(points, { minPeriod: 1, maxPeriod: 1 / (periodogram.frequencies[last] ?? 1) });
    expect(direct?.power[0] ?? -1).toBeCloseTo(periodogram.power[last] ?? 0, 8);
  });

  it("refines the peak to far better than the grid spacing", () => {
    dotRandom.setSeed(3);
    const points = sineData(4.2308, 55.9, 3, 200);
    const periodogram = lombScargle(points, OPTIONS);
    if (!periodogram) {
      throw new Error("expected a periodogram");
    }
    const period = refinePeakPeriod(points, periodogram, peakIndex(periodogram));
    // 200 points over ~260 days: the period is known to ~P²/(T·K/σ·√N) ≈ 10⁻⁴ day.
    expect(Math.abs(period - 4.2308)).toBeLessThan(0.001);
  });

  it("finds a weak signal buried in noise when there are enough points", () => {
    dotRandom.setSeed(4);
    const points = sineData(11.18, 1.2, 1, 250);
    const periodogram = lombScargle(points, OPTIONS);
    if (!periodogram) {
      throw new Error("expected a periodogram");
    }
    const period = 1 / (periodogram.frequencies[peakIndex(periodogram)] ?? 1);
    expect(period).toBeCloseTo(11.18, 0);
  });
});
