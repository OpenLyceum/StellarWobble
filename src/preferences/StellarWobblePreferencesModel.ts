/**
 * StellarWobblePreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in stellarWobbleQueryParameters.
 *
 * A single instance is shared by every screen (see {@link stellarWobblePreferences}).
 */

import { BooleanProperty } from "scenerystack/axon";
import { Tandem } from "scenerystack/tandem";
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

/** The sim-wide preferences, shared by main.ts (the Preferences dialog) and the screen views. */
export const stellarWobblePreferences = new StellarWobblePreferencesModel(Tandem.ROOT.createTandem("preferences"));

StellarWobbleNamespace.register("StellarWobblePreferencesModel", StellarWobblePreferencesModel);
