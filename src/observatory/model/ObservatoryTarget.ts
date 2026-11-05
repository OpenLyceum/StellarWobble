/**
 * ObservatoryTarget.ts
 *
 * The stars the Observatory screen can point at: a randomly generated mystery
 * star, and three reference systems with known planets.
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

export class ObservatoryTarget extends EnumerationValue {
  /** A random star with one planet, regenerated with "New mystery star". */
  public static readonly MYSTERY = new ObservatoryTarget();

  /** 51 Pegasi b, the first planet found around a Sun-like star (1995). */
  public static readonly FIFTY_ONE_PEG = new ObservatoryTarget();

  /** The Sun as Jupiter makes it wobble, seen edge-on from afar. */
  public static readonly SUN_JUPITER = new ObservatoryTarget();

  /** The Sun as Earth makes it wobble, seen edge-on from afar (9 cm/s). */
  public static readonly SUN_EARTH = new ObservatoryTarget();

  public static readonly enumeration = new Enumeration(ObservatoryTarget);
}
