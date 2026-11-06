/**
 * ObservatoryModel.ts
 *
 * Model for the Observatory screen: the user observes a target star night after
 * night, gets one noisy radial velocity per night, and adjusts a model curve
 * (period, amplitude, phase) until it fits. From the fitted period and
 * amplitude and the star's known mass comes the planet's minimum mass.
 *
 * Observations: each night is `cadence` days after the previous one, with the
 * time of night jittered by up to ±0.2 day and a 20 % chance that clouds push
 * it back by a further night. Each measurement has Gaussian noise of the chosen
 * spectrograph precision, which is also its error bar. With stellar jitter on,
 * the star's own surface motions add STELLAR_JITTER_MS more scatter that the
 * error bar does not include (as for real stars).
 *
 * Tools for the fit: the scatter about the model, also in units of the error
 * bars (about 1 = the model fits to within the noise), and a Lomb–Scargle
 * periodogram whose highest peak can be used as the model's period.
 */

import {
  BooleanProperty,
  DerivedProperty,
  Emitter,
  EnumerationProperty,
  NumberProperty,
  Property,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { dotRandom, Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { minimumPlanetMass } from "../../common/model/orbitPhysics.js";
import {
  CADENCE_RANGE_DAYS,
  DAY_S,
  FIT_AMPLITUDE_RANGE_MS,
  FIT_PERIOD_RANGE_DAYS,
  INSTRUMENT_PRECISIONS_MS,
  JUPITER_MASS_KG,
  MAX_MEASUREMENTS,
  PERIODOGRAM_MAX_FREQUENCIES,
  PERIODOGRAM_MIN_MEASUREMENTS,
  PERIODOGRAM_OVERSAMPLING,
  STELLAR_JITTER_MS,
  SUN_MASS_KG,
} from "../../StellarWobbleConstants.js";
import { ObservatoryTarget } from "./ObservatoryTarget.js";
import { type PlanetSignal, randomMysterySignal, referenceSignal, signalVelocity } from "./PlanetSignal.js";
import { lombScargle, type Periodogram, peakIndex, refinePeakPeriod } from "./periodogram.js";

/** One radial-velocity measurement. */
export type Measurement = {
  /** Time, days since the first night. */
  readonly time: number;
  /** Measured radial velocity, m/s. */
  readonly velocity: number;
  /** 1σ uncertainty (the error bar), m/s. */
  readonly uncertainty: number;
};

/** Largest random shift of the time of night, days. */
const TIME_OF_NIGHT_JITTER = 0.2;

/** Chance that clouds cost a night. */
const CLOUD_PROBABILITY = 0.2;

export class ObservatoryModel implements TModel {
  public readonly targetProperty = new EnumerationProperty(ObservatoryTarget.MYSTERY);

  /** The true signal of the current target (hidden from the user until revealed). */
  public readonly signalProperty: Property<PlanetSignal>;

  /** Spectrograph precision (1σ noise of one measurement), m/s. */
  public readonly precisionProperty = new NumberProperty(3, { validValues: [...INSTRUMENT_PRECISIONS_MS] });

  /** Days between observing nights. */
  public readonly cadenceProperty = new NumberProperty(1, { range: CADENCE_RANGE_DAYS });

  /** The user's model: period (days), amplitude (m/s), phase (0–1). */
  public readonly fitPeriodProperty = new NumberProperty(10, { range: FIT_PERIOD_RANGE_DAYS });
  public readonly fitAmplitudeProperty = new NumberProperty(20, { range: FIT_AMPLITUDE_RANGE_MS });
  public readonly fitPhaseProperty = new NumberProperty(0, { range: new Range(0, 1) });

  /** Plot the data folded on the fitted period (phase on the x axis). */
  public readonly foldProperty = new BooleanProperty(false);

  /** Draw the user's model curve. */
  public readonly showModelProperty = new BooleanProperty(true);

  /** Show the true signal. */
  public readonly revealProperty = new BooleanProperty(false);

  /** Add the star's own surface jitter to new measurements (not included in their error bars). */
  public readonly jitterProperty = new BooleanProperty(false);

  /** Show the periodogram in place of the measurements. */
  public readonly showPeriodogramProperty = new BooleanProperty(false);

  /** Measurements so far, oldest first. */
  public readonly measurements: Measurement[] = [];

  /** Fires when {@link measurements} changes. */
  public readonly measurementsChangedEmitter = new Emitter();

  /** Number of measurements (for readouts and descriptions). */
  public readonly measurementCountProperty = new NumberProperty(0);

  /** Root-mean-square difference between the measurements and the user's model, m/s (null with no data). */
  public readonly residualProperty = new Property<number | null>(null);

  /**
   * The same scatter in units of each measurement's error bar, √(mean (residual/σ)²):
   * about 1 when the model fits to within the noise (null with no data).
   */
  public readonly normalizedResidualProperty = new Property<number | null>(null);

  /** Minimum planet mass from the user's model, Jupiter masses. */
  public readonly inferredMassProperty: TReadOnlyProperty<number>;

  /** Time of the next observing night, days. */
  private nextNight = 0;

  /** The periodogram of the current measurements, computed on first use (undefined = not yet). */
  private cachedPeriodogram: Periodogram | null | undefined;

  public constructor() {
    this.signalProperty = new Property(randomMysterySignal());

    this.inferredMassProperty = new DerivedProperty(
      [this.fitAmplitudeProperty, this.fitPeriodProperty, this.signalProperty],
      (amplitude, period, signal) =>
        minimumPlanetMass(amplitude, period * DAY_S, signal.starMass * SUN_MASS_KG) / JUPITER_MASS_KG,
    );

    this.targetProperty.lazyLink((target) => {
      this.signalProperty.value =
        target === ObservatoryTarget.MYSTERY ? randomMysterySignal() : referenceSignal(target);
      this.clearData();
      this.revealProperty.value = false;
    });

    const updateResidual = (): void => this.updateResidual();
    this.fitPeriodProperty.lazyLink(updateResidual);
    this.fitAmplitudeProperty.lazyLink(updateResidual);
    this.fitPhaseProperty.lazyLink(updateResidual);
    this.measurementsChangedEmitter.addListener(updateResidual);
    this.measurementsChangedEmitter.addListener(() => {
      this.cachedPeriodogram = undefined;
    });
  }

  /** The user's model velocity at a time (days), m/s. */
  public fitVelocity(time: number): number {
    return signalVelocity(
      {
        period: this.fitPeriodProperty.value,
        amplitude: this.fitAmplitudeProperty.value,
        phase: this.fitPhaseProperty.value,
      },
      time,
    );
  }

  /** Observes `nights` nights, adding one measurement per night. */
  public observe(nights: number): void {
    const signal = this.signalProperty.value;
    const precision = this.precisionProperty.value;
    const jitter = this.jitterProperty.value ? STELLAR_JITTER_MS : 0;
    for (let i = 0; i < nights; i++) {
      while (dotRandom.nextDouble() < CLOUD_PROBABILITY) {
        this.nextNight += 1;
      }
      const time = Math.max(0, this.nextNight + (dotRandom.nextDouble() * 2 - 1) * TIME_OF_NIGHT_JITTER);
      this.measurements.push({
        time: time,
        velocity:
          signalVelocity(signal, time) + dotRandom.nextGaussian() * precision + dotRandom.nextGaussian() * jitter,
        uncertainty: precision,
      });
      this.nextNight += this.cadenceProperty.value;
    }
    if (this.measurements.length > MAX_MEASUREMENTS) {
      this.measurements.splice(0, this.measurements.length - MAX_MEASUREMENTS);
    }
    this.measurementCountProperty.value = this.measurements.length;
    this.measurementsChangedEmitter.emit();
  }

  /** Removes every measurement and starts again at day 0. */
  public clearData(): void {
    this.measurements.length = 0;
    this.nextNight = 0;
    this.measurementCountProperty.value = 0;
    this.measurementsChangedEmitter.emit();
  }

  /** Replaces the mystery star with a new random one. */
  public newMysteryStar(): void {
    this.targetProperty.value = ObservatoryTarget.MYSTERY;
    this.signalProperty.value = randomMysterySignal();
    this.clearData();
    this.revealProperty.value = false;
  }

  /**
   * The Lomb–Scargle periodogram of the measurements over the fit's period range,
   * or null with fewer than PERIODOGRAM_MIN_MEASUREMENTS. Cached until the data change.
   */
  public periodogram(): Periodogram | null {
    if (this.cachedPeriodogram === undefined) {
      this.cachedPeriodogram =
        this.measurements.length < PERIODOGRAM_MIN_MEASUREMENTS
          ? null
          : lombScargle(this.measurements.map(toPeriodogramPoint), {
              minPeriod: FIT_PERIOD_RANGE_DAYS.min,
              maxPeriod: FIT_PERIOD_RANGE_DAYS.max,
              oversampling: PERIODOGRAM_OVERSAMPLING,
              maxFrequencies: PERIODOGRAM_MAX_FREQUENCIES,
            });
    }
    return this.cachedPeriodogram;
  }

  /**
   * The refined period, days, of the highest periodogram peak whose period lies
   * in [minPeriod, maxPeriod] (the whole range by default), or null without a periodogram.
   */
  public peakPeriod(minPeriod = FIT_PERIOD_RANGE_DAYS.min, maxPeriod = FIT_PERIOD_RANGE_DAYS.max): number | null {
    const periodogram = this.periodogram();
    if (!periodogram) {
      return null;
    }
    // Frequencies increase along the grid, so the longest period comes first.
    const frequencies = periodogram.frequencies;
    let from = 0;
    while (from < frequencies.length && 1 / (frequencies[from] ?? 1) > maxPeriod) {
      from++;
    }
    let to = frequencies.length - 1;
    while (to >= 0 && 1 / (frequencies[to] ?? 1) < minPeriod) {
      to--;
    }
    const index = peakIndex(periodogram, from, to);
    if (index < 0) {
      return null;
    }
    return FIT_PERIOD_RANGE_DAYS.constrainValue(
      refinePeakPeriod(this.measurements.map(toPeriodogramPoint), periodogram, index),
    );
  }

  /** Sets the model's period to the highest periodogram peak (in a period range, if given). */
  public usePeakPeriod(minPeriod?: number, maxPeriod?: number): void {
    const period = this.peakPeriod(minPeriod, maxPeriod);
    if (period !== null) {
      this.fitPeriodProperty.value = period;
    }
  }

  private updateResidual(): void {
    if (this.measurements.length === 0) {
      this.residualProperty.value = null;
      this.normalizedResidualProperty.value = null;
      return;
    }
    let sum = 0;
    let normalizedSum = 0;
    for (const measurement of this.measurements) {
      const difference = measurement.velocity - this.fitVelocity(measurement.time);
      sum += difference * difference;
      normalizedSum += (difference / measurement.uncertainty) ** 2;
    }
    this.residualProperty.value = Math.sqrt(sum / this.measurements.length);
    this.normalizedResidualProperty.value = Math.sqrt(normalizedSum / this.measurements.length);
  }

  public reset(): void {
    this.precisionProperty.reset();
    this.cadenceProperty.reset();
    this.fitPeriodProperty.reset();
    this.fitAmplitudeProperty.reset();
    this.fitPhaseProperty.reset();
    this.foldProperty.reset();
    this.showModelProperty.reset();
    this.jitterProperty.reset();
    this.showPeriodogramProperty.reset();
    this.targetProperty.reset();
    this.newMysteryStar();
  }

  public step(_dt: number): void {
    // Nothing animates: observations happen when the user asks for them.
  }
}

/** A measurement as the periodogram takes it. */
function toPeriodogramPoint(measurement: Measurement): { time: number; value: number; uncertainty: number } {
  return { time: measurement.time, value: measurement.velocity, uncertainty: measurement.uncertainty };
}
