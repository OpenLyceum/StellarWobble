/**
 * StellarWobblePreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in stellarWobbleQueryParameters.
 *
 * main.ts shares one instance with the dialog and screens.
 */

import { BooleanProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import StellarWobbleNamespace from "../StellarWobbleNamespace.js";
import stellarWobbleQueryParameters from "./stellarWobbleQueryParameters.js";

export class StellarWobblePreferencesModel {
  /** Show the equations beside the readouts (Δλ/λ = v_r/c, K, M sin i). */
  public readonly showEquationsProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.showEquationsProperty = new BooleanProperty(
      stellarWobbleQueryParameters.showEquations,
      tandem ? { tandem: tandem.createTandem("showEquationsProperty") } : undefined,
    );
  }

  public reset(): void {
    this.showEquationsProperty.reset();
  }
}

StellarWobbleNamespace.register("StellarWobblePreferencesModel", StellarWobblePreferencesModel);
