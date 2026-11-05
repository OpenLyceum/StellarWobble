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
 * spectrograph precision, which is also its error bar.
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
  SUN_MASS_KG,
} from "../../StellarWobbleConstants.js";
import { ObservatoryTarget } from "./ObservatoryTarget.js";
import { type PlanetSignal, randomMysterySignal, referenceSignal, signalVelocity } from "./PlanetSignal.js";

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

  /** Measurements so far, oldest first. */
  public readonly measurements: Measurement[] = [];

  /** Fires when {@link measurements} changes. */
  public readonly measurementsChangedEmitter = new Emitter();

  /** Number of measurements (for readouts and descriptions). */
  public readonly measurementCountProperty = new NumberProperty(0);

  /** Root-mean-square difference between the measurements and the user's model, m/s (null with no data). */
  public readonly residualProperty = new Property<number | null>(null);

  /** Minimum planet mass from the user's model, Jupiter masses. */
  public readonly inferredMassProperty: TReadOnlyProperty<number>;

  /** Time of the next observing night, days. */
  private nextNight = 0;

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
    for (let i = 0; i < nights; i++) {
      while (dotRandom.nextDouble() < CLOUD_PROBABILITY) {
        this.nextNight += 1;
      }
      const time = Math.max(0, this.nextNight + (dotRandom.nextDouble() * 2 - 1) * TIME_OF_NIGHT_JITTER);
      this.measurements.push({
        time: time,
        velocity: signalVelocity(signal, time) + dotRandom.nextGaussian() * precision,
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

  private updateResidual(): void {
    if (this.measurements.length === 0) {
      this.residualProperty.value = null;
      return;
    }
    let sum = 0;
    for (const measurement of this.measurements) {
      const difference = measurement.velocity - this.fitVelocity(measurement.time);
      sum += difference * difference;
    }
    this.residualProperty.value = Math.sqrt(sum / this.measurements.length);
  }

  public reset(): void {
    this.precisionProperty.reset();
    this.cadenceProperty.reset();
    this.fitPeriodProperty.reset();
    this.fitAmplitudeProperty.reset();
    this.fitPhaseProperty.reset();
    this.foldProperty.reset();
    this.showModelProperty.reset();
    this.targetProperty.reset();
    this.newMysteryStar();
  }

  public step(_dt: number): void {
    // Nothing animates: observations happen when the user asks for them.
  }
}
