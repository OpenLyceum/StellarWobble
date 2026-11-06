/**
 * periodogram.ts
 *
 * The Lomb–Scargle periodogram of unevenly spaced radial velocities: for each
 * trial period, how much of the data's scatter a sine of that period explains
 * (Lomb 1976, Scargle 1982). Each trial is a weighted least-squares fit of
 * a·cos ωt + b·sin ωt to the measurements minus their weighted mean, and the
 * power is the fraction of the weighted variance that fit removes, 0–1.
 *
 * The frequency grid is uniform, spaced 1 / (oversampling × baseline), so no
 * peak (width ≈ 1 / baseline) falls between two trials. The cos and sin of each
 * measurement's phase are advanced from one frequency to the next by a rotation
 * rather than recomputed, so a few hundred points against tens of thousands of
 * frequencies take milliseconds.
 *
 * Pure functions on plain arrays, so everything is easy to unit-test.
 */

/** One measurement as the periodogram sees it. */
export type PeriodogramPoint = {
  /** Time, days. */
  readonly time: number;
  /** Value (radial velocity), any unit. */
  readonly value: number;
  /** 1σ uncertainty, same unit as value (weights are 1/σ²). */
  readonly uncertainty: number;
};

export type PeriodogramOptions = {
  /** Shortest and longest trial periods, days. */
  readonly minPeriod: number;
  readonly maxPeriod: number;
  /** Trials per peak width (default 5). */
  readonly oversampling?: number;
  /** Most trial frequencies (default 40 000); a longer baseline gets a coarser grid. */
  readonly maxFrequencies?: number;
};

export type Periodogram = {
  /** Trial frequencies, cycles per day, increasing (so the periods decrease). */
  readonly frequencies: Float64Array;
  /** Power at each frequency, 0–1. */
  readonly power: Float64Array;
};

/** Weighted sums of one data set, ready for power evaluations at any frequency. */
type Prepared = {
  readonly times: Float64Array;
  /** Weighted residuals w·(y − ȳ). */
  readonly weightedResiduals: Float64Array;
  readonly weights: Float64Array;
  /** Σ w (y − ȳ)². */
  readonly totalSquares: number;
};

function prepare(points: readonly PeriodogramPoint[]): Prepared | null {
  const n = points.length;
  if (n < 3) {
    return null;
  }
  const times = new Float64Array(n);
  const weights = new Float64Array(n);
  let weightSum = 0;
  let weightedSum = 0;
  points.forEach((point, i) => {
    const sigma = point.uncertainty > 0 ? point.uncertainty : 1;
    const w = 1 / (sigma * sigma);
    times[i] = point.time;
    weights[i] = w;
    weightSum += w;
    weightedSum += w * point.value;
  });
  const mean = weightedSum / weightSum;
  const weightedResiduals = new Float64Array(n);
  let totalSquares = 0;
  points.forEach((point, i) => {
    const w = weights[i] ?? 0;
    const residual = point.value - mean;
    weightedResiduals[i] = w * residual;
    totalSquares += w * residual * residual;
  });
  return totalSquares > 0 ? { times, weightedResiduals, weights, totalSquares } : null;
}

/** Power from the weighted sums at one frequency: the fraction of Σw(y − ȳ)² a sine removes. */
function powerFromSums(yc: number, ys: number, cc: number, ss: number, cs: number, totalSquares: number): number {
  const det = cc * ss - cs * cs;
  let explained: number;
  if (det > 1e-12 * cc * ss) {
    // Normal equations [cc cs; cs ss][a b]ᵀ = [yc ys]ᵀ; the fit removes a·yc + b·ys.
    const a = (yc * ss - ys * cs) / det;
    const b = (ys * cc - yc * cs) / det;
    explained = a * yc + b * ys;
  } else {
    // The sine and cosine are degenerate here (every phase the same): fit whichever is non-zero.
    explained = cc > ss ? (cc > 0 ? (yc * yc) / cc : 0) : ss > 0 ? (ys * ys) / ss : 0;
  }
  return Math.min(1, Math.max(0, explained / totalSquares));
}

/** Power at a single frequency (cycles per day), computed directly. */
function powerAt(prepared: Prepared, frequency: number): number {
  let yc = 0;
  let ys = 0;
  let cc = 0;
  let ss = 0;
  let cs = 0;
  const omega = 2 * Math.PI * frequency;
  for (let i = 0; i < prepared.times.length; i++) {
    const phase = omega * (prepared.times[i] ?? 0);
    const c = Math.cos(phase);
    const s = Math.sin(phase);
    const w = prepared.weights[i] ?? 0;
    const wr = prepared.weightedResiduals[i] ?? 0;
    yc += wr * c;
    ys += wr * s;
    cc += w * c * c;
    ss += w * s * s;
    cs += w * c * s;
  }
  return powerFromSums(yc, ys, cc, ss, cs, prepared.totalSquares);
}

/** The Lomb–Scargle periodogram of the points, or null with fewer than three (or no scatter). */
export function lombScargle(points: readonly PeriodogramPoint[], options: PeriodogramOptions): Periodogram | null {
  const prepared = prepare(points);
  if (!prepared) {
    return null;
  }
  const { times, weights, weightedResiduals, totalSquares } = prepared;
  let first = Number.POSITIVE_INFINITY;
  let last = Number.NEGATIVE_INFINITY;
  for (const time of times) {
    first = Math.min(first, time);
    last = Math.max(last, time);
  }
  const baseline = Math.max(last - first, options.minPeriod);
  const minFrequency = 1 / options.maxPeriod;
  const maxFrequency = 1 / options.minPeriod;
  const maxCount = options.maxFrequencies ?? 40_000;
  const idealStep = 1 / ((options.oversampling ?? 5) * baseline);
  const count = Math.max(2, Math.min(maxCount, Math.floor((maxFrequency - minFrequency) / idealStep) + 1));
  const step = (maxFrequency - minFrequency) / (count - 1);

  // Each point's phase at the lowest frequency, and the rotation per frequency step.
  const n = times.length;
  const cosine = new Float64Array(n);
  const sine = new Float64Array(n);
  const cosStep = new Float64Array(n);
  const sinStep = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = times[i] ?? 0;
    cosine[i] = Math.cos(2 * Math.PI * minFrequency * t);
    sine[i] = Math.sin(2 * Math.PI * minFrequency * t);
    cosStep[i] = Math.cos(2 * Math.PI * step * t);
    sinStep[i] = Math.sin(2 * Math.PI * step * t);
  }

  const frequencies = new Float64Array(count);
  const power = new Float64Array(count);
  for (let k = 0; k < count; k++) {
    let yc = 0;
    let ys = 0;
    let cc = 0;
    let ss = 0;
    let cs = 0;
    for (let i = 0; i < n; i++) {
      const c = cosine[i] ?? 0;
      const s = sine[i] ?? 0;
      const w = weights[i] ?? 0;
      const wr = weightedResiduals[i] ?? 0;
      yc += wr * c;
      ys += wr * s;
      cc += w * c * c;
      ss += w * s * s;
      cs += w * c * s;
      // Advance to the next frequency: rotate (c, s) by 2π·step·t.
      const cd = cosStep[i] ?? 1;
      const sd = sinStep[i] ?? 0;
      cosine[i] = c * cd - s * sd;
      sine[i] = s * cd + c * sd;
    }
    frequencies[k] = minFrequency + k * step;
    power[k] = powerFromSums(yc, ys, cc, ss, cs, totalSquares);
  }
  return { frequencies, power };
}

/** Index of the highest power in [from, to] (inclusive), or −1 for an empty range. */
export function peakIndex(periodogram: Periodogram, from = 0, to = periodogram.power.length - 1): number {
  let best = -1;
  let bestPower = Number.NEGATIVE_INFINITY;
  for (let k = Math.max(0, from); k <= Math.min(to, periodogram.power.length - 1); k++) {
    const p = periodogram.power[k] ?? 0;
    if (p > bestPower) {
      bestPower = p;
      best = k;
    }
  }
  return best;
}

/**
 * The period, days, of the peak at grid index `index`, refined between its
 * neighbours by golden-section search on the exact power (the grid alone is
 * good to a fifth of a peak width, which is not enough to fold a long run).
 */
export function refinePeakPeriod(points: readonly PeriodogramPoint[], periodogram: Periodogram, index: number): number {
  const frequencies = periodogram.frequencies;
  const centre = frequencies[index] ?? 0;
  const prepared = prepare(points);
  if (!prepared || frequencies.length < 2) {
    return 1 / centre;
  }
  const step = (frequencies[1] ?? 0) - (frequencies[0] ?? 0);
  let low = Math.max(frequencies[0] ?? centre, centre - step);
  let high = Math.min(frequencies[frequencies.length - 1] ?? centre, centre + step);
  const ratio = (Math.sqrt(5) - 1) / 2;
  let x1 = high - ratio * (high - low);
  let x2 = low + ratio * (high - low);
  let p1 = powerAt(prepared, x1);
  let p2 = powerAt(prepared, x2);
  for (let i = 0; i < 40; i++) {
    if (p1 < p2) {
      low = x1;
      x1 = x2;
      p1 = p2;
      x2 = low + ratio * (high - low);
      p2 = powerAt(prepared, x2);
    } else {
      high = x2;
      x2 = x1;
      p2 = p1;
      x1 = high - ratio * (high - low);
      p1 = powerAt(prepared, x1);
    }
  }
  const best = (low + high) / 2;
  return powerAt(prepared, best) >= (periodogram.power[index] ?? 0) ? 1 / best : 1 / centre;
}
